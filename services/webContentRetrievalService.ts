/**
 * Web Content Retrieval Service
 * Retrieves and summarizes external web content with live links
 */

export interface WebContent {
  url: string;
  title: string;
  description: string;
  content: string;
  summary: string;
  imageUrl?: string;
  publishDate?: string;
  author?: string;
  liveLinks: WebLink[];
  retrievedAt: string;
  isAccessible: boolean;
}

export interface WebLink {
  text: string;
  url: string;
  type: 'internal' | 'external' | 'resource';
}

export interface ContentSummary {
  originalLength: number;
  summaryLength: number;
  keyPoints: string[];
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

class WebContentRetrievalService {
  private urlCache: Map<string, { content: WebContent; timestamp: number }> = new Map();
  private cacheExpiration = 24 * 60 * 60 * 1000; // 24 hours
  private requestTimeout = 10000; // 10 seconds

  /**
   * Retrieve and process web content from URL
   */
  async retrieveContent(url: string): Promise<WebContent> {
    // Check cache first
    const cached = this.urlCache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiration) {
      return cached.content;
    }

    try {
      // In a real implementation, use a library like jsdom or puppeteer
      // For now, simulate the retrieval
      const content = await this.fetchAndParseContent(url);

      // Cache the result
      this.urlCache.set(url, {
        content,
        timestamp: Date.now()
      });

      return content;
    } catch (error) {
      console.error(`Error retrieving content from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fetch and parse web content
   */
  private async fetchAndParseContent(url: string): Promise<WebContent> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NetGains/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Extract metadata and content
      const title = this.extractTitle(html);
      const description = this.extractDescription(html);
      const imageUrl = this.extractImageUrl(html);
      const author = this.extractAuthor(html);
      const publishDate = this.extractPublishDate(html);
      const content = this.extractMainContent(html);
      const liveLinks = this.extractLinks(html);

      // Generate summary
      const summary = this.generateSummary(content);

      return {
        url,
        title,
        description,
        content,
        summary,
        imageUrl,
        author,
        publishDate,
        liveLinks,
        retrievedAt: new Date().toISOString(),
        isAccessible: true
      };
    } catch (error) {
      console.error(`Failed to retrieve content from ${url}:`, error);
      return {
        url,
        title: 'Unable to retrieve',
        description: String(error),
        content: '',
        summary: '',
        liveLinks: [],
        retrievedAt: new Date().toISOString(),
        isAccessible: false
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Summarize content using extractive summarization
   */
  private generateSummary(content: string): string {
    if (!content || content.length === 0) return '';

    // Split into sentences
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);

    if (sentences.length === 0) return content.substring(0, 200);

    // Score sentences by keyword frequency
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();

    words.forEach(word => {
      // Filter out common words
      if (word.length > 3 && !this.isCommonWord(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    // Score sentences
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      sentenceWords.forEach(word => {
        score += wordFreq.get(word) || 0;
      });

      return { sentence, score, index };
    });

    // Select top 30% of sentences
    const summaryLength = Math.ceil(sentences.length * 0.3);
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, summaryLength)
      .sort((a, b) => a.index - b.index)
      .map(s => s.sentence);

    return topSentences.join('. ').substring(0, 500) + '...';
  }

  /**
   * Extract main content from HTML
   */
  private extractMainContent(html: string): string {
    // Simple extraction - remove scripts, styles, and common boilerplate
    let content = html;

    // Remove script tags
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove style tags
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove HTML tags
    content = content.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    content = this.decodeHtmlEntities(content);

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();

    return content.substring(0, 5000); // Limit to 5000 chars
  }

  /**
   * Extract title from HTML
   */
  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title\b[^<]*(?:(?!<\/title>)<[^<]*)*<\/title>/i);
    if (titleMatch) {
      return this.decodeHtmlEntities(
        titleMatch[0].replace(/<[^>]+>/g, '')
      );
    }

    // Fallback to og:title or h1
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitleMatch) return ogTitleMatch[1];

    const h1Match = html.match(/<h1\b[^<]*(?:(?!<\/h1>)<[^<]*)*<\/h1>/i);
    if (h1Match) {
      return this.decodeHtmlEntities(
        h1Match[0].replace(/<[^>]+>/g, '')
      );
    }

    return 'Untitled';
  }

  /**
   * Extract description from HTML
   */
  private extractDescription(html: string): string {
    // Try og:description first
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (ogDescMatch) return ogDescMatch[1];

    // Try meta description
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descMatch) return descMatch[1];

    return '';
  }

  /**
   * Extract main image URL
   */
  private extractImageUrl(html: string): string | undefined {
    // Try og:image first
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImageMatch) return ogImageMatch[1];

    // Try first img tag
    const imgMatch = html.match(/<img\s+[^>]*src=["']([^"']+)["']/i);
    if (imgMatch) return imgMatch[1];

    return undefined;
  }

  /**
   * Extract author information
   */
  private extractAuthor(html: string): string | undefined {
    // Try author meta tag
    const authorMatch = html.match(/<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i);
    if (authorMatch) return authorMatch[1];

    return undefined;
  }

  /**
   * Extract publish date
   */
  private extractPublishDate(html: string): string | undefined {
    // Try og:article:published_time
    const ogDateMatch = html.match(/<meta\s+property=["']og:article:published_time["']\s+content=["']([^"']+)["']/i);
    if (ogDateMatch) return ogDateMatch[1];

    // Try datePublished schema
    const schemaMatch = html.match(/"datePublished":\s*"([^"]+)"/);
    if (schemaMatch) return schemaMatch[1];

    return undefined;
  }

  /**
   * Extract all links from HTML
   */
  private extractLinks(html: string): WebLink[] {
    const links: WebLink[] = [];
    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      const text = this.decodeHtmlEntities(match[2]).trim();

      if (text.length > 0 && url.length > 0) {
        links.push({
          text,
          url,
          type: this.determineLinkType(url)
        });
      }
    }

    // Remove duplicates and limit to 20 links
    return Array.from(new Set(links.map(l => JSON.stringify(l))))
      .map(l => JSON.parse(l))
      .slice(0, 20);
  }

  /**
   * Determine link type (internal/external)
   */
  private determineLinkType(url: string): 'internal' | 'external' | 'resource' {
    if (!url.startsWith('http')) {
      return 'internal';
    }

    const resourceExtensions = ['.pdf', '.doc', '.xls', '.zip', '.mp4', '.jpg', '.png'];
    const hasResourceExt = resourceExtensions.some(ext => url.toLowerCase().includes(ext));

    return hasResourceExt ? 'resource' : 'external';
  }

  /**
   * Validate if URL is accessible
   */
  async validateUrl(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Batch validate multiple URLs
   */
  async validateUrls(urls: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    const validationPromises = urls.map(async (url) => {
      const isValid = await this.validateUrl(url);
      results.set(url, isValid);
    });

    await Promise.allSettled(validationPromises);
    return results;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.urlCache.clear();
  }

  /**
   * Decode HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' '
    };

    return Object.entries(entities).reduce((decoded, [entity, char]) => {
      return decoded.replace(new RegExp(entity, 'g'), char);
    }, text);
  }

  /**
   * Common words to filter from summarization
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'be', 'been', 'have', 'has',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'must', 'can', 'that', 'this', 'as', 'if', 'because', 'while', 'when'
    ];

    return commonWords.includes(word);
  }

  /**
   * Extract content summary with metadata
   */
  async getContentSummary(url: string): Promise<ContentSummary> {
    const content = await this.retrieveContent(url);

    const keyPoints = this.extractKeyPoints(content.content);
    const topics = this.extractTopics(content.content);
    const sentiment = this.analyzeSentiment(content.content);

    return {
      originalLength: content.content.length,
      summaryLength: content.summary.length,
      keyPoints,
      topics,
      sentiment
    };
  }

  /**
   * Extract key points from content
   */
  private extractKeyPoints(content: string): string[] {
    // Simple extraction based on sentences with high word frequency
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
    return sentences.slice(0, 5);
  }

  /**
   * Extract topics from content
   */
  private extractTopics(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();

    words.forEach(word => {
      if (word.length > 5 && !this.isCommonWord(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Analyze sentiment of content
   */
  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'hate', 'worst', 'poor', 'awful', 'horrible', 'disappointing'];

    const lowerContent = content.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      const matches = lowerContent.match(new RegExp(word, 'g'));
      positiveCount += matches ? matches.length : 0;
    });

    negativeWords.forEach(word => {
      const matches = lowerContent.match(new RegExp(word, 'g'));
      negativeCount += matches ? matches.length : 0;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}

export const webContentRetrievalService = new WebContentRetrievalService();
