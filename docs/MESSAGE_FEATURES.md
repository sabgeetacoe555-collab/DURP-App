# Message Features: Archive & Search

## Overview

Two new powerful features have been added to the messaging system:

1. **Archive Threads** - Archive and unarchive discussion threads
2. **Search Messages** - Full-text search through posts and replies

## Archive Functionality

### Features

- ✅ **Archive Posts**: Users can archive their own posts or admins can archive any post
- ✅ **Archive Replies**: When a post is archived, all its replies are automatically archived
- ✅ **View Archived**: Toggle between active and archived posts
- ✅ **Unarchive**: Restore archived posts and their replies
- ✅ **Permission Control**: Only post authors and discussion admins can archive/unarchive

### Database Schema

- Added `is_archived`, `archived_at`, `archived_by` columns to `posts` and `replies` tables
- Created database functions for bulk archive/unarchive operations
- Added RLS policies for archive permissions

### UI Implementation

- **Archive Button**: Available on each post card (for post authors and admins)
- **Archive Toggle**: Header button to switch between active and archived posts
- **Visual Indicators**: Different icons and text for archive vs unarchive actions

### Usage

1. **Archive a Post**: Tap the "Archive" button on any post you authored or manage
2. **View Archived**: Tap the "Archived" button in the header to see archived posts
3. **Unarchive**: Tap the "Unarchive" button on any archived post to restore it

## Search Functionality

### Features

- ✅ **Full-Text Search**: Search through post titles and content
- ✅ **Reply Search**: Search through reply content
- ✅ **Search Categories**: Filter by "All", "Posts", or "Replies"
- ✅ **Debounced Search**: Real-time search with 300ms debounce
- ✅ **Search Results**: Navigate directly to posts/replies from search results

### Database Schema

- Added `search_vector` columns with full-text search indexes
- Weighted search: Post titles (A) and content (B) have different weights
- GIN indexes for fast search performance

### UI Implementation

- **Search Modal**: Full-screen search interface
- **Search Input**: Auto-focusing search field with clear button
- **Category Tabs**: Filter search results by type
- **Result Cards**: Rich result display with post/reply info
- **Navigation**: Tap results to navigate to the content

### Usage

1. **Open Search**: Tap the "Search" button in the messages header
2. **Enter Query**: Type your search terms
3. **Filter Results**: Use category tabs to narrow results
4. **Navigate**: Tap any result to go to that post or reply

## Technical Implementation

### Database Functions

```sql
-- Archive a post and all its replies
archive_post_and_replies(post_id_to_archive UUID)

-- Unarchive a post and all its replies
unarchive_post_and_replies(post_id_to_unarchive UUID)
```

### Service Methods

```typescript
// Archive management
discussionService.archivePost(postId: string)
discussionService.unarchivePost(postId: string)
discussionService.getArchivedPosts(discussionId: string)

// Search functionality
discussionService.searchPosts(discussionId: string, query: string)
discussionService.searchReplies(discussionId: string, query: string)
```

### Components

- `MessageSearch.tsx` - Full-screen search interface
- Updated `MessagesTab.tsx` - Added archive and search UI
- Enhanced post cards with archive buttons

## Security & Permissions

### Archive Permissions

- Users can archive their own posts
- Discussion admins can archive any post
- Archived posts are only visible to discussion participants
- Archive actions are logged with timestamps

### Search Permissions

- Search only returns results from discussions the user has access to
- RLS policies ensure data privacy
- Search results respect discussion membership

## Performance Considerations

### Search Performance

- GIN indexes on search vectors for fast full-text search
- Debounced search to reduce API calls
- Pagination support for large result sets

### Archive Performance

- Bulk operations for archiving posts and replies
- Efficient queries with proper indexing
- Minimal UI updates for smooth user experience

## Future Enhancements

### Potential Improvements

1. **Advanced Search**: Add filters for date ranges, authors, post types
2. **Search History**: Remember recent searches
3. **Bulk Archive**: Archive multiple posts at once
4. **Archive Categories**: Organize archived posts by reason/date
5. **Search Analytics**: Track popular search terms
6. **Export Archived**: Download archived content

### Integration Opportunities

1. **Session Messages**: Apply same features to session discussions
2. **Global Search**: Search across all discussions
3. **Search Notifications**: Alert when new content matches saved searches
