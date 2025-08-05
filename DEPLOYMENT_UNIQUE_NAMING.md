# Unique Dynamic Naming for Vercel Deployments

## Overview

This document describes the implementation of unique dynamic naming for Vercel deployments to prevent conflicts and overwrites when creating multiple demos.

## Problem

Previously, deployment names were only based on the customer name:
- `segment-demo-{customer-name}-frontend`
- `segment-demo-{customer-name}-backend`

This could cause conflicts when:
1. Multiple demos are created for the same customer
2. Different customers have similar names that slugify to the same value
3. Concurrent deployments with the same customer name

## Solution

### Unique ID Generation

A utility function `generateUniqueId()` creates unique identifiers with the format:
```
{timestamp}-{randomId}
```

Example: `1754399725595-lwmbog`

- **Timestamp**: Current time in milliseconds (13 digits)
- **Random ID**: 6-character alphanumeric string
- **Total length**: ~20 characters

### Updated Deployment Names

Deployment names now include the unique suffix:

**Frontend:**
```
segment-demo-{customer-name}-frontend-{uniqueId}
```

**Backend:**
```
segment-demo-{customer-name}-backend-{uniqueId}
```

**GitHub Repository:**
```
segment-demo-{customer-name}-{uniqueId}
```

### Examples

For customer "Acme Corp":
- Frontend: `segment-demo-acme-corp-frontend-1754399725595-lwmbog`
- Backend: `segment-demo-acme-corp-backend-1754399725595-lwmbog`
- GitHub: `segment-demo-acme-corp-1754399725595-lwmbog`

## Implementation Details

### Files Modified

1. **`server/src/services/demoGenerator.ts`**
   - Added `generateUniqueId()` utility function
   - Updated `generateDemo()` to use unique IDs for deployments
   - Updated `createGitHubRepo()` to accept optional unique suffix
   - Increased Vercel project name limit from 50 to 63 characters
   - Added Vercel API project creation before deployment
   - Enhanced logging for debugging deployment process

### Key Changes

1. **Unique ID Generation:**
   ```typescript
   function generateUniqueId(): string {
     const timestamp = Date.now();
     const randomId = Math.random().toString(36).substring(2, 8);
     return `${timestamp}-${randomId}`;
   }
   ```

2. **Deployment Calls:**
   ```typescript
   const uniqueSuffix = generateUniqueId();
   frontendUrl = await deployToVercel(frontendDir, 
     `segment-demo-${slugify(customerName).toLowerCase()}-frontend-${uniqueSuffix}`, 
     'nextjs');
   ```

3. **Vercel Project Creation:**
   ```typescript
   // Creates project via Vercel API before deployment
   const createResponse = await fetch(createProjectUrl, {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${vercelToken}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       name: cleanProjectName,
       framework: framework === 'nextjs' ? 'nextjs' : 'node'
     })
   });
   ```

4. **GitHub Repository:**
   ```typescript
   const uniqueSuffix = generateUniqueId();
   githubRepoUrl = await createGitHubRepo(customerName, githubToken, uniqueSuffix);
   ```

## Benefits

1. **No Conflicts**: Each deployment has a guaranteed unique name
2. **Traceability**: Timestamp allows chronological tracking
3. **Readability**: Customer name is still included for identification
4. **Compatibility**: Existing deletion functions work with new naming pattern
5. **Scalability**: Supports unlimited concurrent deployments

## Backward Compatibility

- Existing deletion functions continue to work
- URL extraction regex patterns are compatible
- No changes required to client-side code

## Future Considerations

1. **Cleanup**: Consider implementing automatic cleanup of old deployments
2. **Naming Convention**: Could add environment prefixes (dev/staging/prod)
3. **Monitoring**: Add logging to track deployment name generation
4. **Validation**: Add checks to ensure unique IDs are actually unique (extremely unlikely collision) 