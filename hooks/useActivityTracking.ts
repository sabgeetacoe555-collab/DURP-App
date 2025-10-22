// hooks/useActivityTracking.ts
import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

interface TrackActivityOptions {
  screen: string;
  details?: Record<string, any>;
  sessionId?: string;
}

interface ActivityEvent {
  action_type: string;
  screen: string;
  timestamp: string;
  details?: Record<string, any>;
  session_id?: string;
  duration_ms?: number;
}

export function useActivityTracking() {
  const { user } = useAuth();
  const sessionId = useRef<string>(generateSessionId());
  const screenEntryTime = useRef<Record<string, number>>({});
  
  // Generate a unique session ID if needed
  function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  // Track when the user opens a screen
  async function trackScreenView(screen: string, details?: Record<string, any>) {
    if (!user) return;
    
    // Record entry time for duration calculation
    screenEntryTime.current[screen] = Date.now();
    
    await trackActivity('screen_view', {
      screen,
      details,
      sessionId: sessionId.current
    });
  }
  
  // Track when the user leaves a screen
  async function trackScreenExit(screen: string) {
    if (!user || !screenEntryTime.current[screen]) return;
    
    const duration = Date.now() - screenEntryTime.current[screen];
    
    await trackActivity('screen_exit', {
      screen,
      details: { duration_ms: duration },
      sessionId: sessionId.current
    });
    
    // Clean up
    delete screenEntryTime.current[screen];
  }
  
  // Track user interaction with UI element
  async function trackInteraction(actionType: string, options: TrackActivityOptions) {
    await trackActivity(actionType, options);
  }
  
  // Generic activity tracking function
  async function trackActivity(
    actionType: string, 
    options: TrackActivityOptions
  ) {
    if (!user) return;
    
    try {
      const timestamp = new Date().toISOString();
      
      const activityEvent: ActivityEvent = {
        action_type: actionType,
        screen: options.screen,
        timestamp,
        details: options.details || {},
        session_id: options.sessionId || sessionId.current
      };
      
      // If we're tracking exit with duration
      if (options.details?.duration_ms) {
        activityEvent.duration_ms = options.details.duration_ms;
      }
      
      // Send to our edge function
      const { data, error } = await supabase.functions.invoke('dupr-api', {
        body: {
          action: 'trackActivity',
          activity: {
            user_id: user.id,
            ...activityEvent
          }
        }
      });
      
      if (error) {
        console.warn('Failed to track activity:', error);
      }
      
      // Also store locally for batch uploads if needed
      storeActivityLocally(activityEvent);
      
    } catch (error) {
      console.warn('Error tracking activity:', error);
    }
  }
  
  // Store activity in local storage for backup/offline
  function storeActivityLocally(event: ActivityEvent) {
    try {
      const stored = localStorage.getItem('user_activities');
      const activities = stored ? JSON.parse(stored) : [];
      
      activities.push({
        ...event,
        user_id: user?.id,
        pending: true
      });
      
      // Keep only the last 100 events to prevent storage issues
      const trimmed = activities.slice(-100);
      localStorage.setItem('user_activities', JSON.stringify(trimmed));
    } catch (e) {
      // Silently fail - activity tracking shouldn't break the app
    }
  }
  
  // Upload any pending activities from local storage
  async function syncPendingActivities() {
    if (!user) return;
    
    try {
      const stored = localStorage.getItem('user_activities');
      if (!stored) return;
      
      const activities = JSON.parse(stored);
      const pendingActivities = activities.filter((a: any) => a.pending);
      
      if (pendingActivities.length === 0) return;
      
      // Process in batches of 10
      for (let i = 0; i < pendingActivities.length; i += 10) {
        const batch = pendingActivities.slice(i, i + 10);
        
        await supabase.functions.invoke('dupr-api', {
          body: {
            action: 'bulkTrackActivity',
            activities: batch.map((a: any) => ({
              ...a,
              user_id: user.id,
              pending: undefined
            }))
          }
        });
      }
      
      // Mark all as synced
      const updated = activities.map((a: any) => ({ ...a, pending: false }));
      localStorage.setItem('user_activities', JSON.stringify(updated));
      
    } catch (e) {
      console.warn('Failed to sync pending activities:', e);
    }
  }
  
  // Sync pending activities when the hook is initialized
  useEffect(() => {
    if (user) {
      syncPendingActivities();
    }
  }, [user]);
  
  return {
    trackScreenView,
    trackScreenExit,
    trackInteraction,
    trackActivity,
    sessionId: sessionId.current
  };
}