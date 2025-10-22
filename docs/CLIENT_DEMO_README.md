# Client Demo Instructions - User Activity Tracking

This folder contains everything you need to showcase the new user activity tracking and analytics feature to clients.

## Quick Start Guide

### Step 1: Prepare the Environment

1. Ensure you have deployed the latest version of the DUPR API edge function:
   ```
   supabase functions deploy dupr-api --no-verify-jwt
   ```

2. Create the `user_activities` table in your Supabase database:
   ```
   node scripts/setup-user-activity-tracking.js
   ```

3. Generate demo data to make the analytics dashboard look populated:
   ```
   ./demo-activity.ps1
   ```

### Step 2: Launch the Demo

1. Open the application in development mode:
   ```
   npm start
   ```

2. Navigate to the Analytics tab to see the populated dashboard

3. Open the HTML presentation for visual aids:
   ```
   start docs/client-presentation.html
   ```

### Step 3: Interactive Demo Script

Follow this sequence for an engaging demo:

1. Start by opening the client-presentation.html in a browser to guide your presentation
2. Walk through the slides explaining the problem and solution
3. When you reach the "Live Demo" slide, switch to the actual app
4. Show the analytics dashboard with the pre-populated data
5. Perform some live actions in the app to demonstrate real-time tracking
6. Refresh the analytics page to show the new data appearing
7. Demonstrate the filtering capabilities (by date range, action type, etc.)
8. Return to the presentation for the closing slides

## Demo Materials

- **docs/ACTIVITY_TRACKING_DEMO_GUIDE.md**: Comprehensive script for the client presentation
- **docs/USER_ACTIVITY_TRACKING.md**: Technical documentation to share with clients
- **docs/client-presentation.html**: Visual slides for the presentation
- **scripts/demo-activity.ps1**: Script to generate sample activity data
- **scripts/client-demo.sh**: Interactive demo simulation script

## Common Client Questions & Answers

### Q: How will this impact app performance?
**A**: The tracking system is designed to be lightweight with minimal impact on performance. Activities are batched and sent to the server in the background, and the tracking code is optimized for efficiency.

### Q: How is user privacy protected?
**A**: We've designed the system with privacy in mind. No personally identifiable information is tracked beyond a user ID, and Row Level Security ensures users can only see their own data. All tracking is transparent and within your own Supabase database.

### Q: Can we customize what we track?
**A**: Absolutely! The system is designed to be flexible. We can add custom events for specific features you want to track, and the analytics dashboard can be customized to show the metrics most important to your business.

### Q: How does this compare to other analytics solutions?
**A**: Unlike general-purpose analytics tools, this is specifically designed for your app and integrated directly into your infrastructure. This means more relevant insights, better privacy control, and no dependency on third-party services.

### Q: Can we export the data?
**A**: Yes, the data can be exported in various formats from the Supabase dashboard, or we can build custom export functionality into the app if needed.

## Post-Demo Follow-up

After the demo, offer to:

1. Provide access to a test environment where they can explore the analytics themselves
2. Schedule a follow-up session to discuss customization options
3. Share the technical documentation for their technical team to review
4. Set up a trial implementation in their production environment

## Demo Tips

- Be sure to interact with the app naturally during the demo to generate real activity data
- Have some prepared insights to point out in the analytics dashboard
- Emphasize the business value and decision-making capabilities, not just the technical implementation
- Allow time for questions throughout, not just at the end