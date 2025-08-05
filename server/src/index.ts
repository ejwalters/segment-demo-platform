import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateDemo } from './services/demoGenerator';
import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';

dotenv.config();

// Debug: Check if environment variables are loaded
console.log('Environment check:');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('PORT:', process.env.PORT);

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:3004'],
    credentials: true
}));
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate demo endpoint
app.post('/generate-demo', async (req, res) => {
    console.log('🚀 Backend /generate-demo endpoint called');
    console.log('🚀 Request body:', req.body);
    console.log('🚀 Request headers:', req.headers);

    try {
        const {
            customerName,
            logoUrl,
            writeKey,
            profileToken,
            unifySpaceId,
            githubToken,
            supabaseUserId,
            inspirationRepo
        } = req.body;

        // Validate required fields
        if (!customerName || !writeKey || !profileToken || !unifySpaceId || !githubToken || !supabaseUserId) {
            return res.status(400).json({
                error: 'Missing required fields: customerName, writeKey, profileToken, unifySpaceId, githubToken, supabaseUserId'
            });
        }

        console.log(`Generating demo for customer: ${customerName}`);

        // Generate the demo
        const result = await generateDemo({
            customerName,
            logoUrl,
            writeKey,
            profileToken,
            unifySpaceId,
            githubToken,
            supabaseUserId,
            inspirationRepo
        });

        // Store demo metadata in Supabase
        const { error: dbError } = await supabase
            .from('demos')
            .insert({
                user_id: supabaseUserId,
                customer_name: customerName,
                logo_url: logoUrl,
                segment_write_key: writeKey,
                segment_profile_token: profileToken,
                segment_unify_space_id: unifySpaceId,
                frontend_url: result.frontendUrl,
                backend_url: result.backendUrl,
                github_repo_url: result.githubRepoUrl
            });

        if (dbError) {
            console.error('Error storing demo in database:', dbError);
            // Don't fail the request, just log the error
        }

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error generating demo:', error);
        res.status(500).json({
            error: 'Failed to generate demo',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get user's demos
app.get('/demos/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const { data: demos, error } = await supabase
            .from('demos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({ demos });
    } catch (error) {
        console.error('Error fetching demos:', error);
        res.status(500).json({
            error: 'Failed to fetch demos',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Delete Vercel deployments only
app.delete('/delete-vercel-deployments', async (req, res) => {
    try {
        const { demoId } = req.query;

        if (!demoId) {
            return res.status(400).json({
                error: 'Demo ID is required'
            });
        }

        console.log(`🗑️ Deleting Vercel deployments for demo: ${demoId}`);

        // Get demo details from database
        const { data: demo, error: fetchError } = await supabase
            .from('demos')
            .select('*')
            .eq('id', demoId)
            .single();

        if (fetchError || !demo) {
            return res.status(404).json({
                error: 'Demo not found'
            });
        }

        // Delete from Vercel (if URLs exist)
        if (demo.frontend_url || demo.backend_url) {
            console.log('🗑️ Attempting to delete Vercel deployments...');
            console.log('🔗 Frontend URL:', demo.frontend_url);
            console.log('🔗 Backend URL:', demo.backend_url);
            try {
                await deleteVercelDeployments(demo);
                console.log('✅ Vercel deployments deleted successfully');
                res.json({ success: true, message: 'Vercel deployments deleted successfully' });
            } catch (vercelError) {
                console.error('❌ Error deleting Vercel deployments:', vercelError);
                res.status(500).json({
                    error: 'Failed to delete Vercel deployments',
                    details: vercelError instanceof Error ? vercelError.message : 'Unknown error'
                });
            }
        } else {
            console.log('ℹ️ No Vercel URLs found, skipping Vercel deletion');
            res.json({ success: true, message: 'No Vercel deployments found' });
        }

    } catch (error) {
        console.error('Error deleting Vercel deployments:', error);
        res.status(500).json({
            error: 'Failed to delete Vercel deployments',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Delete GitHub repository and demo from database
app.delete('/delete-demo-data', async (req, res) => {
    try {
        const { demoId, githubToken } = req.query;

        if (!demoId) {
            return res.status(400).json({
                error: 'Demo ID is required'
            });
        }

        console.log(`🗑️ Deleting demo data: ${demoId}`);

        // Get demo details from database
        const { data: demo, error: fetchError } = await supabase
            .from('demos')
            .select('*')
            .eq('id', demoId)
            .single();

        if (fetchError || !demo) {
            return res.status(404).json({
                error: 'Demo not found'
            });
        }

        // Delete from GitHub (if repo URL exists and token provided)
        if (demo.github_repo_url && githubToken) {
            console.log('🗑️ Attempting to delete GitHub repository...');
            console.log('🔗 GitHub repo URL:', demo.github_repo_url);
            try {
                await deleteGitHubRepo(demo.github_repo_url, githubToken as string);
                console.log('✅ GitHub repository deleted successfully');
            } catch (githubError) {
                console.error('❌ Error deleting GitHub repository:', githubError);
                // Continue with deletion even if GitHub fails
            }
        } else {
            console.log('ℹ️ No GitHub repo URL or token found, skipping GitHub deletion');
        }

        // Delete from database
        const { error: deleteError } = await supabase
            .from('demos')
            .delete()
            .eq('id', demoId);

        if (deleteError) {
            throw deleteError;
        }

        res.json({ success: true, message: 'Demo data deleted successfully' });

    } catch (error) {
        console.error('Error deleting demo data:', error);
        res.status(500).json({
            error: 'Failed to delete demo data',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Legacy endpoint - delete everything (for backward compatibility)
app.delete('/delete-demo', async (req, res) => {
    try {
        const { demoId, githubToken } = req.query;

        if (!demoId || !githubToken) {
            return res.status(400).json({
                error: 'Demo ID and GitHub token are required'
            });
        }

        console.log(`🗑️ Deleting demo (legacy): ${demoId}`);

        // Get demo details from database
        const { data: demo, error: fetchError } = await supabase
            .from('demos')
            .select('*')
            .eq('id', demoId)
            .single();

        if (fetchError || !demo) {
            return res.status(404).json({
                error: 'Demo not found'
            });
        }

        // Delete from Vercel (if URLs exist)
        if (demo.frontend_url || demo.backend_url) {
            console.log('🗑️ Attempting to delete Vercel deployments...');
            console.log('🔗 Frontend URL:', demo.frontend_url);
            console.log('🔗 Backend URL:', demo.backend_url);
            try {
                await deleteVercelDeployments(demo);
                console.log('✅ Vercel deployments deleted successfully');
            } catch (vercelError) {
                console.error('❌ Error deleting Vercel deployments:', vercelError);
                // Continue with deletion even if Vercel fails
            }
        } else {
            console.log('ℹ️ No Vercel URLs found, skipping Vercel deletion');
        }

        // Delete from GitHub (if repo URL exists)
        if (demo.github_repo_url && githubToken) {
            console.log('🗑️ Attempting to delete GitHub repository...');
            console.log('🔗 GitHub repo URL:', demo.github_repo_url);
            try {
                await deleteGitHubRepo(demo.github_repo_url, githubToken as string);
                console.log('✅ GitHub repository deleted successfully');
            } catch (githubError) {
                console.error('❌ Error deleting GitHub repository:', githubError);
                // Continue with deletion even if GitHub fails
            }
        } else {
            console.log('ℹ️ No GitHub repo URL or token found, skipping GitHub deletion');
        }

        // Delete from database
        const { error: deleteError } = await supabase
            .from('demos')
            .delete()
            .eq('id', demoId);

        if (deleteError) {
            throw deleteError;
        }

        res.json({ success: true, message: 'Demo deleted successfully' });

    } catch (error) {
        console.error('Error deleting demo:', error);
        res.status(500).json({
            error: 'Failed to delete demo',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Test Vercel API connection
app.get('/test-vercel', async (req, res) => {
    try {
        const vercelToken = process.env.VERCEL_TOKEN;
        const teamId = process.env.VERCEL_TEAM_ID;

        if (!vercelToken) {
            return res.status(400).json({
                error: 'VERCEL_TOKEN not set'
            });
        }

        console.log('🧪 Testing Vercel API connection...');
        console.log('🔑 Team ID:', teamId || 'none (personal account)');

        let projects: any[] = [];
        let endpointUsed = '';

        // Try team endpoint first
        if (teamId) {
            try {
                const teamResponse = await fetch(`https://api.vercel.com/v9/teams/${teamId}/projects`, {
                    headers: {
                        'Authorization': `Bearer ${vercelToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (teamResponse.ok) {
                    const data = await teamResponse.json() as any;
                    projects = data.projects || [];
                    endpointUsed = 'team';
                    console.log('✅ Team endpoint successful');
                } else {
                    console.log('⚠️ Team endpoint failed:', teamResponse.status, teamResponse.statusText);
                }
            } catch (error) {
                console.log('⚠️ Team endpoint error:', error);
            }
        }

        // Try personal account endpoint
        if (projects.length === 0) {
            try {
                const personalResponse = await fetch('https://api.vercel.com/v9/projects', {
                    headers: {
                        'Authorization': `Bearer ${vercelToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (personalResponse.ok) {
                    const data = await personalResponse.json() as any;
                    projects = data.projects || [];
                    endpointUsed = 'personal';
                    console.log('✅ Personal endpoint successful');
                } else {
                    console.log('⚠️ Personal endpoint failed:', personalResponse.status, personalResponse.statusText);
                }
            } catch (error) {
                console.log('⚠️ Personal endpoint error:', error);
            }
        }

        res.json({
            success: projects.length > 0,
            endpointUsed,
            projectCount: projects.length,
            projects: projects.map((p: any) => ({
                name: p.name,
                id: p.id,
                framework: p.framework
            }))
        });

    } catch (error) {
        console.error('Error testing Vercel API:', error);
        res.status(500).json({
            error: 'Failed to test Vercel API',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get user's GitHub repositories
app.get('/github/repos', async (req, res) => {
    try {
        const { githubToken } = req.query;

        if (!githubToken) {
            return res.status(400).json({
                error: 'GitHub token is required'
            });
        }

        const octokit = new Octokit({ auth: githubToken as string });

        // Fetch user's repositories
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({
            sort: 'updated',
            per_page: 100,
            type: 'owner'
        });

        // Filter out archived and disabled repos, and format the response
        const activeRepos = repos
            .filter(repo => !repo.archived && !repo.disabled)
            .map(repo => ({
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description,
                html_url: repo.html_url,
                language: repo.language,
                updated_at: repo.updated_at,
                stargazers_count: repo.stargazers_count,
                forks_count: repo.forks_count
            }));

        res.json({ repositories: activeRepos });
    } catch (error) {
        console.error('Error fetching GitHub repositories:', error);
        res.status(500).json({
            error: 'Failed to fetch GitHub repositories',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Helper function to delete Vercel deployments
async function deleteVercelDeployments(demo: any) {
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) {
        console.log('⚠️ VERCEL_TOKEN not set, skipping Vercel deletion');
        return;
    }

    console.log('🔑 Vercel token found, proceeding with deletion...');

    try {
        // Extract project names from URLs
        const frontendProject = demo.frontend_url ? extractProjectNameFromUrl(demo.frontend_url) : null;
        const backendProject = demo.backend_url ? extractProjectNameFromUrl(demo.backend_url) : null;

        console.log('🔍 Extracted project names:', { frontendProject, backendProject });

        if (frontendProject) {
            console.log(`🗑️ Deleting Vercel frontend project: ${frontendProject}`);
            await deleteVercelProject(frontendProject, vercelToken);
            console.log(`✅ Frontend project deleted: ${frontendProject}`);
        }

        if (backendProject) {
            console.log(`🗑️ Deleting Vercel backend project: ${backendProject}`);
            await deleteVercelProject(backendProject, vercelToken);
            console.log(`✅ Backend project deleted: ${backendProject}`);
        }

        if (!frontendProject && !backendProject) {
            console.log('⚠️ No valid Vercel project names found in URLs');
        }
    } catch (error) {
        console.error('❌ Error deleting Vercel deployments:', error);
        throw error;
    }
}

// Helper function to extract project name from Vercel URL
function extractProjectNameFromUrl(url: string): string | null {
    try {
        const match = url.match(/https:\/\/([^.]+)\.vercel\.app/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

// Helper function to delete a Vercel project
async function deleteVercelProject(projectName: string, token: string) {
    try {
        const teamId = process.env.VERCEL_TEAM_ID;

        console.log(`🔍 Attempting to fetch Vercel projects...`);
        console.log(`🔑 Using team ID: ${teamId || 'none (personal account)'}`);

        // Try multiple API endpoints to find the right one
        let projects: any[] = [];
        let projectsResponse: Response;
        let endpointType: 'team' | 'personal' = 'personal'; // Track which endpoint worked

        // First, try with team ID if available
        if (teamId) {
            try {
                console.log(`🔍 Trying team endpoint: https://api.vercel.com/v9/teams/${teamId}/projects`);
                projectsResponse = await fetch(`https://api.vercel.com/v9/teams/${teamId}/projects`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (projectsResponse.ok) {
                    const projectsData = await projectsResponse.json() as any;
                    projects = projectsData.projects || [];
                    endpointType = 'team';
                    console.log(`✅ Team endpoint successful, found ${projects.length} projects`);
                } else {
                    console.log(`⚠️ Team endpoint failed: ${projectsResponse.status} ${projectsResponse.statusText}`);
                }
            } catch (error) {
                console.log(`⚠️ Team endpoint error: ${error}`);
            }
        }

        // If team endpoint failed or no team ID, try personal account
        if (projects.length === 0) {
            try {
                console.log(`🔍 Trying personal account endpoint: https://api.vercel.com/v9/projects`);
                projectsResponse = await fetch(`https://api.vercel.com/v9/projects`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (projectsResponse.ok) {
                    const projectsData = await projectsResponse.json() as any;
                    projects = projectsData.projects || [];
                    endpointType = 'personal';
                    console.log(`✅ Personal account endpoint successful, found ${projects.length} projects`);
                } else {
                    console.log(`⚠️ Personal account endpoint failed: ${projectsResponse.status} ${projectsResponse.statusText}`);
                    console.log(`📋 Response body:`, await projectsResponse.text());
                    throw new Error(`Failed to fetch Vercel projects: ${projectsResponse.status} ${projectsResponse.statusText}`);
                }
            } catch (error) {
                console.log(`⚠️ Personal account endpoint error: ${error}`);
                throw new Error(`Failed to fetch Vercel projects: ${error}`);
            }
        }

        console.log(`🔍 Using ${endpointType} endpoint for operations`);

        console.log(`🔍 Searching for project: ${projectName}`);
        console.log(`📋 Available projects:`, projects.map((p: any) => p.name));

        // Try exact match first
        let project = projects.find((p: any) => p.name === projectName);

        // If not found, try partial match
        if (!project) {
            console.log(`🔍 Exact match not found, trying partial match...`);
            project = projects.find((p: any) => p.name.includes(projectName) || projectName.includes(p.name));
        }

        // If still not found, try matching by customer name
        if (!project) {
            console.log(`🔍 Partial match not found, trying customer name match...`);
            const customerName = projectName.split('-').slice(2, -2).join('-'); // Extract customer name
            if (customerName) {
                project = projects.find((p: any) => p.name.includes(customerName));
            }
        }

        if (!project) {
            console.log(`❌ Project ${projectName} not found in Vercel`);
            console.log(`📋 Available projects:`, projects.map((p: any) => p.name));

            // Try to delete by name directly as a fallback
            console.log(`🔄 Trying direct deletion by name as fallback...`);
            try {
                const directDeleteUrl = endpointType === 'team' && teamId
                    ? `https://api.vercel.com/v9/teams/${teamId}/projects/${projectName}`
                    : `https://api.vercel.com/v9/projects/${projectName}`;

                console.log(`🔗 Direct delete URL: ${directDeleteUrl} (using ${endpointType} endpoint)`);

                const directDeleteResponse = await fetch(directDeleteUrl, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (directDeleteResponse.ok) {
                    console.log(`✅ Successfully deleted Vercel project by name: ${projectName}`);
                    return;
                } else {
                    console.log(`⚠️ Direct deletion failed: ${directDeleteResponse.status} ${directDeleteResponse.statusText}`);
                    const errorText = await directDeleteResponse.text();
                    console.log(`📋 Error response: ${errorText}`);
                }
            } catch (directError) {
                console.log(`⚠️ Direct deletion error: ${directError}`);
            }

            return;
        }

        console.log(`✅ Found project: ${project.name} (ID: ${project.id})`);

        // Delete the project using the same endpoint type that worked for fetching
        const deleteUrl = endpointType === 'team' && teamId
            ? `https://api.vercel.com/v9/teams/${teamId}/projects/${project.id}`
            : `https://api.vercel.com/v9/projects/${project.id}`;

        console.log(`🔗 Delete URL: ${deleteUrl} (using ${endpointType} endpoint)`);

        const deleteResponse = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            console.log(`📋 Delete response error: ${errorText}`);
            throw new Error(`Failed to delete Vercel project: ${deleteResponse.status} ${deleteResponse.statusText}`);
        }

        console.log(`✅ Successfully deleted Vercel project: ${projectName}`);
    } catch (error) {
        console.error(`Error deleting Vercel project ${projectName}:`, error);
        throw error;
    }
}

// Helper function to delete GitHub repository
async function deleteGitHubRepo(repoUrl: string, githubToken: string) {
    try {
        console.log('🔍 Parsing GitHub repository URL:', repoUrl);

        // Extract owner and repo name from URL
        const match = repoUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            throw new Error('Invalid GitHub repository URL');
        }

        const [, owner, repo] = match;
        console.log(`🗑️ Deleting GitHub repository: ${owner}/${repo}`);

        const octokit = new Octokit({ auth: githubToken });

        console.log('🔑 GitHub token validated, making delete request...');
        await octokit.repos.delete({
            owner,
            repo
        });

        console.log(`✅ Successfully deleted GitHub repository: ${owner}/${repo}`);
    } catch (error) {
        console.error('❌ Error deleting GitHub repository:', error);
        if (error instanceof Error) {
            console.error('❌ Error details:', error.message);
        }
        throw error;
    }
}

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
}); 