# Attachment System Setup Guide

## Overview

The attachment system allows users to attach images and documents to posts and replies in threaded discussions.

## Components

- **Database**: `attachments` table with RLS policies
- **Storage**: Supabase Storage bucket for file storage
- **Services**: `attachmentService.ts` for file operations
- **Hooks**: `useAttachments.ts` for React integration
- **UI**: `AttachmentPicker.tsx` component

## Setup Steps

### 1. Database Setup ✅

The attachments table has been created via migration `20250828000002_add_attachments.sql`:

- Table: `attachments`
- RLS policies for security
- Indexes for performance
- Triggers for timestamps

### 2. Storage Bucket Setup ⚠️

**Manual Step Required**: Create the storage bucket in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Name: `attachments`
5. Set as **Public** (files will be publicly accessible via URLs)
6. Click **Create bucket**

### 3. Code Integration ✅

The attachment system is integrated into:

- Thread detail screen (`app/thread/[threadId].tsx`)
- Attachment picker component
- File upload and display functionality

## Usage

### Adding Attachments

1. Navigate to a thread detail screen
2. Tap the attachment button (➕) in the message input
3. Choose from:
   - **Take Photo**: Use camera
   - **Choose Photo**: Select from gallery
   - **Choose Document**: Select any file type

### Viewing Attachments

- Images are displayed inline
- Documents show as file cards with icons
- File sizes are formatted for display

## File Types Supported

- **Images**: JPEG, PNG, GIF, etc.
- **Documents**: PDF, DOC, TXT, etc.
- **Videos**: MP4, MOV, etc.
- **Audio**: MP3, WAV, etc.

## Storage Structure

```
attachments/
├── posts/
│   └── {post_id}/
│       ├── images/
│       └── files/
└── replies/
    └── {reply_id}/
        ├── images/
        └── files/
```

## Security

- RLS policies ensure users can only access attachments for content they have permission to view
- Users can only create attachments for their own posts/replies
- Users can only delete their own attachments

## Testing

Run the test script to verify setup:

```bash
node scripts/test-attachments.js
```

## Next Steps

1. Create the storage bucket in Supabase dashboard
2. Test attachment functionality in the app
3. Add attachments to session discussions (future enhancement)
