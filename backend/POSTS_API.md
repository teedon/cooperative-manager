# Message Wall / Posts API Documentation

## Overview
The Message Wall feature provides a communication platform for cooperative members to share posts, announcements, and engage through comments and reactions.

## Base URL
```
/posts
```

## Authentication
All endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <token>
```

## Endpoints

### Posts

#### Create Post
```http
POST /posts
```

**Request Body:**
```json
{
  "cooperativeId": "string",
  "title": "string (optional)",
  "content": "string (required)",
  "imageUrl": "string (optional)",
  "postType": "announcement | member_post | system (optional)",
  "requiresApproval": "boolean (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": "string",
    "cooperativeId": "string",
    "authorId": "string",
    "authorType": "admin | member | system",
    "authorUserId": "string",
    "title": "string",
    "content": "string",
    "imageUrl": "string",
    "isPinned": false,
    "isApproved": true,
    "postType": "member_post",
    "createdAt": "ISO 8601 date",
    "updatedAt": "ISO 8601 date"
  }
}
```

**Authorization:**
- User must be an active member of the cooperative
- Posts by non-admins may require approval if `requiresApproval` is true

#### Get Posts for Cooperative
```http
GET /posts/cooperative/:cooperativeId?page=1&limit=20&search=query&includeUnpinned=true
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search term for title and content
- `includeUnpinned` (optional): Include unpinned posts (default: true)

**Response:**
```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "posts": [
    {
      "id": "string",
      "authorName": "string",
      "authorAvatar": "string",
      "title": "string",
      "content": "string",
      "imageUrl": "string",
      "isPinned": false,
      "postType": "member_post",
      "userReaction": "like | null",
      "reactionCounts": {
        "like": 5,
        "love": 2
      },
      "_count": {
        "reactions": 7,
        "comments": 3
      },
      "createdAt": "ISO 8601 date"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Notes:**
- Pinned posts appear first
- Non-admins only see approved posts
- Results are ordered by creation date (newest first)

#### Get Single Post
```http
GET /posts/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Post retrieved successfully",
  "data": {
    "id": "string",
    "authorName": "string",
    "authorAvatar": "string",
    "content": "string",
    "comments": [
      {
        "id": "string",
        "authorName": "string",
        "content": "string",
        "createdAt": "ISO 8601 date",
        "replies": []
      }
    ],
    "reactions": [],
    "userReaction": "like | null",
    "reactionCounts": {}
  }
}
```

#### Update Post
```http
PUT /posts/:id
```

**Request Body:**
```json
{
  "title": "string (optional)",
  "content": "string (optional)",
  "imageUrl": "string (optional)"
}
```

**Authorization:**
- User must be the post author or an admin

#### Delete Post
```http
DELETE /posts/:id
```

**Authorization:**
- User must be the post author or an admin

**Note:** Posts are soft-deleted, not permanently removed

#### Pin Post
```http
POST /posts/:id/pin
```

**Authorization:**
- Admin only

#### Unpin Post
```http
POST /posts/:id/unpin
```

**Authorization:**
- Admin only

#### Approve Post
```http
POST /posts/:id/approve
```

**Authorization:**
- Admin only

### Reactions

#### Add Reaction to Post
```http
POST /posts/:id/reactions
```

**Request Body:**
```json
{
  "reactionType": "like | love | celebrate | support | insightful | thinking"
}
```

**Notes:**
- Adding a new reaction removes any existing reaction from the user on that post
- Only one reaction type per user per post

#### Remove Reaction from Post
```http
DELETE /posts/:id/reactions
```

### Comments

#### Add Comment to Post
```http
POST /posts/:id/comments
```

**Request Body:**
```json
{
  "content": "string (required)",
  "parentCommentId": "string (optional for replies)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "id": "string",
    "postId": "string",
    "authorUserId": "string",
    "authorName": "string",
    "content": "string",
    "parentCommentId": "string | null",
    "createdAt": "ISO 8601 date"
  }
}
```

#### Get Comments for Post
```http
GET /posts/:id/comments
```

**Response:**
```json
{
  "success": true,
  "message": "Comments retrieved successfully",
  "data": [
    {
      "id": "string",
      "authorName": "string",
      "content": "string",
      "createdAt": "ISO 8601 date",
      "replies": [
        {
          "id": "string",
          "authorName": "string",
          "content": "string",
          "createdAt": "ISO 8601 date"
        }
      ]
    }
  ]
}
```

**Notes:**
- Only top-level comments are returned with nested replies
- Deleted comments are filtered out

#### Delete Comment
```http
DELETE /posts/comments/:commentId
```

**Authorization:**
- User must be the comment author or an admin

#### Add Reaction to Comment
```http
POST /posts/comments/:commentId/reactions
```

**Request Body:**
```json
{
  "reactionType": "like | love | celebrate | support | insightful | thinking"
}
```

#### Remove Reaction from Comment
```http
DELETE /posts/comments/:commentId/reactions
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized",
  "data": null
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You are not a member of this cooperative",
  "data": null
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Post not found",
  "data": null
}
```

## Security Features

### XSS Prevention
- All post content and comments are sanitized on the server
- Dangerous HTML tags and scripts are removed
- JavaScript protocols and event handlers are stripped

### Authorization
- Role-based access control (admin vs. member)
- Ownership checks for edit/delete operations
- Cooperative membership verification

### Content Moderation
- Admin approval workflow for member posts
- Post pinning/unpinning (admin only)
- Soft deletion for audit trail

## Data Model

### Post
```typescript
{
  id: string;
  cooperativeId: string;
  authorId: string;
  authorType: 'admin' | 'member' | 'system';
  authorUserId?: string;
  title?: string;
  content: string;
  imageUrl?: string;
  isPinned: boolean;
  pinnedAt?: Date;
  pinnedBy?: string;
  requiresApproval: boolean;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  postType: 'announcement' | 'member_post' | 'system';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Comment
```typescript
{
  id: string;
  postId: string;
  authorUserId: string;
  authorName?: string;
  content: string;
  parentCommentId?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Reaction
```typescript
{
  id: string;
  postId?: string;
  commentId?: string;
  userId: string;
  reactionType: 'like' | 'love' | 'celebrate' | 'support' | 'insightful' | 'thinking';
  createdAt: Date;
}
```

## Rate Limiting

While basic authorization is in place, consider implementing rate limiting for production:
- POST endpoints: 10 requests per minute per user
- GET endpoints: 100 requests per minute per user

## Future Enhancements

Potential improvements for the Message Wall feature:
- Notifications for new posts and comments
- Mentions (@username) support
- Hashtag support
- Image upload functionality
- Post editing
- Advanced moderation dashboard
- Content reporting system
- Analytics and engagement metrics
