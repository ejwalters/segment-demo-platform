# Demo Deletion Process

## Overview

When a user clicks "Delete Demo", the system performs a comprehensive cleanup that removes all resources associated with the demo:

1. **Vercel Deployments** - Deletes both frontend and backend projects
2. **GitHub Repository** - Deletes the associated GitHub repository
3. **Database Record** - Removes the demo from the Supabase database

## Process Flow

### 1. User Initiates Deletion

**Frontend (Dashboard)**
```typescript
const handleDeleteDemo = async (demoId: string) => {
    // Get GitHub token from session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Make delete request to API
    const response = await fetch(`/api/delete-demo?demoId=${demoId}&githubToken=${session.provider_token}`, {
        method: 'DELETE'
    });
}
```

**Client API Route (`/api/delete-demo`)**
```typescript
// Forwards request to server
const response = await fetch(`${SERVER_URL}/delete-demo?demoId=${demoId}&githubToken=${githubToken}`, {
    method: 'DELETE'
});
```

### 2. Server Processing

**Main Delete Endpoint (`/delete-demo`)**

1. **Validate Input**
   - Check that `demoId` and `githubToken` are provided
   - Fetch demo details from database

2. **Delete Vercel Deployments**
   ```typescript
   if (demo.frontend_url || demo.backend_url) {
       await deleteVercelDeployments(demo);
   }
   ```

3. **Delete GitHub Repository**
   ```typescript
   if (demo.github_repo_url && githubToken) {
       await deleteGitHubRepo(demo.github_repo_url, githubToken);
   }
   ```

4. **Delete Database Record**
   ```typescript
   await supabase.from('demos').delete().eq('id', demoId);
   ```

## Vercel Deletion Process

### URL Extraction
The system extracts project names from Vercel URLs using regex:
```typescript
function extractProjectNameFromUrl(url: string): string | null {
    const match = url.match(/https:\/\/([^.]+)\.vercel\.app/);
    return match ? match[1] : null;
}
```

**Example:**
- URL: `https://segment-demo-acme-corp-frontend-1754399725595-lwmbog.vercel.app`
- Extracted: `segment-demo-acme-corp-frontend-1754399725595-lwmbog`

### Project Deletion
1. **Search for Project**
   ```typescript
   const projectUrl = teamId 
       ? `https://api.vercel.com/v9/teams/${teamId}/projects?search=${projectName}`
       : `https://api.vercel.com/v9/projects?search=${projectName}`;
   ```

2. **Delete Project**
   ```typescript
   const deleteUrl = teamId 
       ? `https://api.vercel.com/v9/teams/${teamId}/projects/${project.id}`
       : `https://api.vercel.com/v9/projects/${project.id}`;
   ```

## GitHub Deletion Process

### URL Parsing
Extracts owner and repository name from GitHub URL:
```typescript
const match = repoUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
const [, owner, repo] = match;
```

**Example:**
- URL: `https://github.com/username/segment-demo-acme-corp-1754399725595-lwmbog`
- Owner: `username`
- Repo: `segment-demo-acme-corp-1754399725595-lwmbog`

### Repository Deletion
Uses GitHub API via Octokit:
```typescript
await octokit.repos.delete({
    owner,
    repo
});
```

## Error Handling

### Graceful Degradation
The deletion process continues even if individual steps fail:

1. **Vercel Deletion Fails**
   - Logs error but continues with GitHub and database deletion
   - User can manually delete Vercel projects later

2. **GitHub Deletion Fails**
   - Logs error but continues with database deletion
   - User can manually delete GitHub repository later

3. **Database Deletion Fails**
   - Returns error to user
   - No cleanup is performed

### Logging
Comprehensive logging for debugging:
```
🗑️ Deleting demo: 123
🔗 Frontend URL: https://segment-demo-acme-frontend-123.vercel.app
🔗 Backend URL: https://segment-demo-acme-backend-123.vercel.app
🗑️ Attempting to delete Vercel deployments...
🔍 Extracted project names: { frontendProject: "segment-demo-acme-frontend-123", backendProject: "segment-demo-acme-backend-123" }
🗑️ Deleting Vercel frontend project: segment-demo-acme-frontend-123
✅ Frontend project deleted: segment-demo-acme-frontend-123
🗑️ Deleting Vercel backend project: segment-demo-acme-backend-123
✅ Backend project deleted: segment-demo-acme-backend-123
✅ Vercel deployments deleted successfully
🔗 GitHub repo URL: https://github.com/username/segment-demo-acme-123
🗑️ Attempting to delete GitHub repository...
✅ GitHub repository deleted successfully
```

## Security Considerations

### Authentication
- GitHub token required for repository deletion
- Vercel token required for project deletion
- User must own the demo to delete it

### Validation
- Demo ID must exist in database
- User must have permission to delete the demo
- URLs are validated before processing

## Environment Variables

Required for deletion to work:
```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_TEAM_ID=your_team_id  # Optional, for team accounts
```

## Testing

### Manual Testing
1. Create a demo
2. Verify resources exist (Vercel projects, GitHub repo)
3. Delete the demo
4. Verify all resources are removed

### Expected Results
- Vercel projects no longer appear in dashboard
- GitHub repository is deleted
- Demo record removed from database
- Success message displayed to user

## Troubleshooting

### Common Issues

1. **Vercel Token Missing**
   - Error: "VERCEL_TOKEN not set, skipping Vercel deletion"
   - Solution: Set VERCEL_TOKEN environment variable

2. **GitHub Token Missing**
   - Error: "GitHub access token not found"
   - Solution: Re-authenticate with GitHub

3. **Project Not Found**
   - Error: "Project {name} not found in Vercel"
   - Solution: Project may have been manually deleted

4. **Repository Not Found**
   - Error: "Repository not found"
   - Solution: Repository may have been manually deleted

### Debugging
Check server logs for detailed information about each step of the deletion process. 