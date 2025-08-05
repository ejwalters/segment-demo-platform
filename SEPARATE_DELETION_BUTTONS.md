# Separate Deletion Buttons Implementation

## Overview

The demo deletion system has been enhanced to provide more granular control over what gets deleted. Instead of a single "Delete Demo" button, users now have separate buttons for different deletion operations.

## New Deletion Buttons

### 1. **Delete Deployments** (Orange Button)
- **Purpose**: Deletes only the Vercel deployments (frontend and backend)
- **What it does**:
  - Removes frontend project from Vercel
  - Removes backend project from Vercel
  - Keeps GitHub repository and database record intact
- **Use case**: When you want to clean up Vercel projects but keep the code and demo record

### 2. **Delete Data** (Red Button)
- **Purpose**: Deletes GitHub repository and removes demo from database
- **What it does**:
  - Deletes GitHub repository
  - Removes demo record from Supabase database
  - Keeps Vercel deployments intact (if they exist)
- **Use case**: When you want to remove the demo data but keep the deployments running

### 3. **Delete All** (Purple Button - Legacy)
- **Purpose**: Deletes everything (Vercel deployments, GitHub repo, and database record)
- **What it does**:
  - Removes frontend and backend projects from Vercel
  - Deletes GitHub repository
  - Removes demo record from database
- **Use case**: Complete cleanup when you're done with the demo

## Implementation Details

### Server-Side Changes

#### New API Endpoints

1. **`/delete-vercel-deployments`**
   ```typescript
   // Deletes only Vercel deployments
   app.delete('/delete-vercel-deployments', async (req, res) => {
       // Extracts demo details
       // Deletes frontend and backend projects from Vercel
       // Returns success/error response
   });
   ```

2. **`/delete-demo-data`**
   ```typescript
   // Deletes GitHub repository and database record
   app.delete('/delete-demo-data', async (req, res) => {
       // Deletes GitHub repository
       // Removes demo from Supabase database
       // Returns success/error response
   });
   ```

3. **`/delete-demo`** (Legacy)
   ```typescript
   // Deletes everything (for backward compatibility)
   app.delete('/delete-demo', async (req, res) => {
       // Deletes Vercel deployments
       // Deletes GitHub repository
       // Removes demo from database
   });
   ```

#### Enhanced Vercel Project Search

The Vercel deletion now uses a more robust search algorithm:

```typescript
// 1. Try exact match first
let project = projects.find((p: any) => p.name === projectName);

// 2. If not found, try partial match
if (!project) {
    project = projects.find((p: any) => p.name.includes(projectName) || projectName.includes(p.name));
}

// 3. If still not found, try matching by customer name
if (!project) {
    const customerName = projectName.split('-').slice(2, -2).join('-');
    if (customerName) {
        project = projects.find((p: any) => p.name.includes(customerName));
    }
}
```

### Client-Side Changes

#### New API Routes

1. **`/api/delete-vercel-deployments`**
   - Forwards requests to server endpoint
   - Handles Vercel deployment deletion only

2. **`/api/delete-demo-data`**
   - Forwards requests to server endpoint
   - Handles GitHub repo and database deletion

#### Updated Dashboard Functions

```typescript
// New deletion functions
const handleDeleteVercelDeployments = async (demoId: string) => {
    // Calls /api/delete-vercel-deployments
    // Shows success/error alerts
};

const handleDeleteDemoData = async (demoId: string) => {
    // Calls /api/delete-demo-data
    // Refreshes demo list on success
};
```

#### Updated DemoList Component

```typescript
interface DemoListProps {
    demos: Demo[];
    onRefresh: () => void;
    onDelete?: (demoId: string) => Promise<void>;
    onDeleteVercelDeployments?: (demoId: string) => Promise<void>;
    onDeleteDemoData?: (demoId: string) => Promise<void>;
}
```

## User Interface

### Button Layout
```
[Delete Deployments] [Delete Data] [Delete All]
```

### Button Colors
- **Delete Deployments**: Orange (`border-orange-300`, `text-orange-700`)
- **Delete Data**: Red (`border-red-300`, `text-red-700`)
- **Delete All**: Purple (`border-purple-300`, `text-purple-700`)

### Confirmation Dialogs
Each button shows a specific confirmation message:
- **Delete Deployments**: "Are you sure you want to delete the Vercel deployments?"
- **Delete Data**: "Are you sure you want to delete the demo data?"
- **Delete All**: "Are you sure you want to delete this demo?"

## Error Handling

### Graceful Degradation
- If Vercel deletion fails → shows error but continues
- If GitHub deletion fails → shows error but continues
- If database deletion fails → returns error to user

### User Feedback
- Success alerts for each operation
- Error alerts with specific error messages
- Loading states for each button independently

## Benefits

1. **Granular Control**: Users can choose exactly what to delete
2. **Better Error Handling**: Issues with one service don't affect others
3. **Improved UX**: Clear visual distinction between different operations
4. **Backward Compatibility**: Legacy delete all functionality still works
5. **Debugging**: Easier to identify which service is causing issues

## Troubleshooting

### Common Issues

1. **Vercel Project Not Found**
   - Enhanced search algorithm should find projects even with naming mismatches
   - Logs show available projects for debugging

2. **GitHub Permission Errors**
   - Separate "Delete Data" button allows deletion even if GitHub fails
   - Clear error messages indicate permission issues

3. **Partial Deletions**
   - Each operation is independent
   - Users can retry failed operations individually

## Migration from Old System

- Existing "Delete Demo" button still works (legacy mode)
- New buttons provide additional options
- No breaking changes to existing functionality 