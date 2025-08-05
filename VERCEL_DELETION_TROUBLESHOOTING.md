# Vercel Deletion Troubleshooting Guide

## Current Issue
The Vercel deployment deletion is failing with "Failed to fetch Vercel projects: Not Found" error.

## Enhanced Debugging

### 1. Test Vercel API Connection

First, test if the Vercel API is working at all:

```bash
# From the server directory
curl http://localhost:3001/test-vercel
```

Or use the test script:
```bash
# From the server directory
node test-vercel-api.js
```

### 2. Check Environment Variables

Make sure these are set in your `.env` file:

```bash
VERCEL_TOKEN=your_vercel_token_here
VERCEL_TEAM_ID=your_team_id_here  # Optional, only if using team account
```

### 3. Get Your Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your profile → Settings
3. Go to "Tokens" tab
4. Create a new token with these scopes:
   - `read:projects`
   - `delete:projects`
   - `read:user`

### 4. Get Your Team ID (if using team account)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. If you're in a team, the team ID is in the URL: `https://vercel.com/teams/[TEAM_ID]/projects`
3. Or check the API response from the test endpoint

## Enhanced Error Handling

The updated code now includes:

### Multiple API Endpoint Testing
- Tries team endpoint first (if team ID is set)
- Falls back to personal account endpoint
- Detailed logging for each attempt

### Fallback Deletion Methods
- Searches for projects by exact name
- Searches for projects by partial name
- Searches for projects by customer name
- Direct deletion by project name as last resort

### Detailed Logging
- Shows which endpoint is being used
- Lists all available projects
- Shows exact error responses from Vercel API

## Common Issues and Solutions

### Issue 1: "Not Found" Error
**Cause**: Wrong API endpoint or invalid token
**Solution**: 
1. Check if you're using personal account or team account
2. Verify the Vercel token is valid
3. Try the test endpoint to see which API works

### Issue 2: "Unauthorized" Error
**Cause**: Token doesn't have required permissions
**Solution**:
1. Create a new token with proper scopes
2. Make sure the token has `delete:projects` permission

### Issue 3: "Team Not Found" Error
**Cause**: Invalid team ID
**Solution**:
1. Remove `VERCEL_TEAM_ID` from `.env` to use personal account
2. Or get the correct team ID from Vercel dashboard

### Issue 4: Project Names Don't Match
**Cause**: The extracted project name doesn't match what's in Vercel
**Solution**:
The enhanced search will now:
1. Try exact match
2. Try partial match
3. Try customer name match
4. Show all available projects for debugging

## Debugging Steps

### Step 1: Test API Connection
```bash
curl http://localhost:3001/test-vercel
```

### Step 2: Check Server Logs
Look for these log messages:
```
🔍 Attempting to fetch Vercel projects...
🔑 Using team ID: [team_id] or none (personal account)
🔍 Trying team endpoint: https://api.vercel.com/v9/teams/[team_id]/projects
🔍 Trying personal account endpoint: https://api.vercel.com/v9/projects
📋 Available projects: [list of project names]
```

### Step 3: Try Manual Deletion
If the API test works but deletion still fails, try manually deleting a project from the Vercel dashboard to see if there are any permission issues.

### Step 4: Check Project Names
The logs will show all available projects. Compare these with the project names being extracted from URLs.

## Expected Behavior

### Successful Deletion Logs
```
🔍 Attempting to fetch Vercel projects...
✅ Personal account endpoint successful, found 5 projects
🔍 Searching for project: segment-demo-verizon-frontend-1754401729578-d3huwb-j6zru4t86
📋 Available projects: ['project1', 'project2', 'segment-demo-verizon-frontend-1754401729578-d3huwb-j6zru4t86']
✅ Found project: segment-demo-verizon-frontend-1754401729578-d3huwb-j6zru4t86 (ID: proj_abc123)
🔗 Delete URL: https://api.vercel.com/v9/projects/proj_abc123
✅ Successfully deleted Vercel project: segment-demo-verizon-frontend-1754401729578-d3huwb-j6zru4t86
```

### Fallback Deletion Logs
```
❌ Project segment-demo-verizon-frontend-1754401729578-d3huwb-j6zru4t86 not found in Vercel
🔄 Trying direct deletion by name as fallback...
🔗 Direct delete URL: https://api.vercel.com/v9/projects/segment-demo-verizon-frontend-1754401729578-d3huwb-j6zru4t86
✅ Successfully deleted Vercel project by name: segment-demo-verizon-frontend-1754401729578-d3huwb-j6zru4t86
```

## Next Steps

1. **Run the test endpoint** to verify API connection
2. **Check the logs** for detailed error information
3. **Verify environment variables** are set correctly
4. **Try the enhanced deletion** with the new fallback methods

The enhanced error handling should provide much more detailed information about what's going wrong and provide multiple fallback methods to ensure deletion works. 