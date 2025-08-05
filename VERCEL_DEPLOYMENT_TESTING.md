# Vercel Deployment Testing Guide

## Overview

This guide explains how to test the new unique dynamic naming system for Vercel deployments and troubleshoot any issues.

## What's Changed

### Before
- Deployments used generic names: `backend`, `frontend`
- No unique identifiers
- Potential conflicts when creating multiple demos

### After
- Deployments use customer-specific names with unique IDs
- Format: `segment-demo-{customer-name}-{frontend|backend}-{timestamp}-{randomId}`
- Example: `segment-demo-acme-corp-frontend-1754399725595-lwmbog`

## Testing the Implementation

### 1. Create a New Demo

1. Start your server:
   ```bash
   cd server
   npm run dev
   ```

2. Create a demo through your application interface

3. Check the server logs for deployment information:
   ```
   🚀 Deploying frontend with project name: segment-demo-acme-corp-frontend-1754399725595-lwmbog
   🚀 Deploying backend with project name: segment-demo-acme-corp-backend-1754399725595-lwmbog
   🔧 Creating Vercel project via API: segment-demo-acme-corp-frontend-1754399725595-lwmbog
   ✅ Project created successfully: segment-demo-acme-corp-frontend-1754399725595-lwmbog
   📦 Vercel deployment command: npx vercel --token *** --yes --prod
   ```

### 2. Verify in Vercel Dashboard

1. Go to your Vercel dashboard
2. Look for projects with the new naming pattern
3. You should see projects like:
   - `segment-demo-acme-corp-frontend-1754399725595-lwmbog`
   - `segment-demo-acme-corp-backend-1754399725595-lwmbog`

### 3. Test Multiple Demos

1. Create multiple demos for the same customer
2. Verify that each gets a unique name
3. Check that no conflicts occur

## Troubleshooting

### Issue: Still seeing generic "backend" and "frontend" names

**Possible Causes:**
1. Vercel API project creation is failing
2. Vercel CLI is not using the created project
3. Environment variables not set correctly

**Debugging Steps:**
1. Check server logs for API creation messages
2. Verify `VERCEL_TOKEN` is set correctly
3. Check if `VERCEL_TEAM_ID` is needed for your account

**Logs to Look For:**
```
🔧 Creating Vercel project via API: segment-demo-acme-corp-frontend-1754399725595-lwmbog
✅ Project created successfully: segment-demo-acme-corp-frontend-1754399725595-lwmbog
```

### Issue: Vercel API creation fails

**Check:**
1. Vercel token permissions
2. Team ID if using team account
3. Project name format (must be valid)

**Common Error Codes:**
- `409`: Project already exists (this is OK)
- `401`: Invalid token
- `403`: Insufficient permissions

### Issue: Deployment fails after project creation

**Check:**
1. Vercel CLI version
2. Project directory structure
3. `vercel.json` configuration

## Environment Variables Required

Make sure these are set in your `.env` file:

```bash
VERCEL_TOKEN=your_vercel_token_here
VERCEL_TEAM_ID=your_team_id_here  # Optional, only if using team account
```

## Expected Behavior

### Successful Deployment
1. Project created via API (or found existing)
2. Vercel CLI deployment succeeds
3. Unique URLs returned
4. Customer-specific project names in dashboard

### Log Output Example
```
🚀 Deploying frontend with project name: segment-demo-acme-corp-frontend-1754399725595-lwmbog
🚀 Deploying backend with project name: segment-demo-acme-corp-backend-1754399725595-lwmbog
🔧 Creating Vercel project via API: segment-demo-acme-corp-frontend-1754399725595-lwmbog
✅ Project created successfully: segment-demo-acme-corp-frontend-1754399725595-lwmbog
📦 Vercel deployment command: npx vercel --token *** --yes --prod
📁 Working directory: /tmp/demo-123/frontend
🏷️  Project name: segment-demo-acme-corp-frontend-1754399725595-lwmbog
✅ Vercel deployment successful
🔗 Extracted URL: https://segment-demo-acme-corp-frontend-1754399725595-lwmbog.vercel.app
```

## Rollback Plan

If issues occur, you can temporarily revert to the old naming by:

1. Commenting out the unique ID generation
2. Using the original project name format
3. Removing the Vercel API project creation

The changes are backward compatible, so existing deletion functions will continue to work. 