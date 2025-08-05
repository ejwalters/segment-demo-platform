'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DemoForm, { DemoFormData } from '@/components/DemoForm';
import DemoList from '@/components/DemoList';
import { Database } from '@/lib/supabase';

type Demo = Database['public']['Tables']['demos']['Row'];

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [session, setSession] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [demos, setDemos] = useState<Demo[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('🔍 Dashboard useEffect triggered');
        console.log('🔍 Current loading state:', loading);
        console.log('🔍 Current user state:', user);
        console.log('🔍 Current session state:', session);

        const checkAuth = async () => {
            console.log('🚀 Starting checkAuth function');

            // Add a timeout to prevent infinite hanging
            const timeoutId = setTimeout(() => {
                console.log('⏰ Authentication timeout - forcing loading to false');
                setLoading(false);
            }, 3000); // 3 second timeout

            try {
                // Bypass hanging Supabase calls and manually create session from URL tokens
                let session = null;
                let user = null;

                if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
                    console.log('🔍 Found OAuth tokens in URL hash, creating manual session...');

                    try {
                        const hashParams = new URLSearchParams(window.location.hash.substring(1));
                        const accessToken = hashParams.get('access_token');
                        const providerToken = hashParams.get('provider_token');

                        if (accessToken) {
                            // Decode the JWT token to get user info
                            try {
                                const tokenParts = accessToken.split('.');
                                if (tokenParts.length === 3) {
                                    // Fix base64 padding issues
                                    const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
                                    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
                                    const tokenPayload = JSON.parse(atob(padded));
                                    console.log('🔍 Token payload:', tokenPayload);

                                    // Create a manual session object
                                    session = {
                                        access_token: accessToken,
                                        refresh_token: hashParams.get('refresh_token'),
                                        provider_token: providerToken,
                                        user: {
                                            id: tokenPayload.sub,
                                            email: tokenPayload.email,
                                            user_metadata: tokenPayload.user_metadata || {},
                                            app_metadata: tokenPayload.app_metadata || {}
                                        }
                                    };

                                    user = session.user;

                                    console.log('✅ Manual session created');
                                    console.log('👤 User:', user.email);
                                    console.log('🔑 Provider token:', providerToken ? 'AVAILABLE' : 'NOT AVAILABLE');

                                    // Clear the hash from URL
                                    window.history.replaceState(null, '', window.location.pathname);
                                } else {
                                    console.log('❌ Invalid JWT token format');
                                }
                            } catch (decodeError) {
                                console.error('💥 Error decoding JWT token:', decodeError);
                                console.log('🔍 Access token preview:', accessToken.substring(0, 50) + '...');
                            }
                        }
                    } catch (manualSessionError) {
                        console.error('💥 Error creating manual session:', manualSessionError);
                    }
                }

                // If manual session creation failed, try normal Supabase calls
                if (!session) {
                    console.log('📞 Trying normal Supabase auth calls...');
                    const { data: { session: normalSession } } = await supabase.auth.getSession();
                    session = normalSession;
                    user = session?.user;
                    console.log('✅ Normal getSession completed');
                    console.log('📋 Session data:', session ? 'EXISTS' : 'NULL');
                }

                if (session) {
                    console.log('👤 User found:', session.user.email);
                    console.log('🔑 Provider token:', session.provider_token ? 'AVAILABLE' : 'NOT AVAILABLE');

                    setUser(session.user);
                    setSession(session);
                    console.log('💾 User and session state updated');

                    console.log('📥 Fetching demos...');
                    await fetchDemos(session.user.id);
                    console.log('✅ Demos fetched');
                } else {
                    console.log('❌ No session found, redirecting to home');
                    router.push('/');
                    return;
                }
            } catch (error) {
                console.error('💥 Error in checkAuth:', error);
                setError('Authentication error. Please try signing in again.');
            } finally {
                clearTimeout(timeoutId);
                console.log('🏁 Setting loading to false');
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const fetchDemos = async (userId: string) => {
        try {
            console.log('Fetching demos for user:', userId);
            const { data, error } = await supabase
                .from('demos')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching demos:', error);
                setError('Failed to load demos');
            } else {
                console.log('Demos fetched successfully:', data?.length || 0, 'demos');
                setDemos(data || []);
            }
        } catch (err) {
            console.error('Error fetching demos:', err);
            setError('Failed to load demos');
        }
    };

    const handleGenerateDemo = async (formData: DemoFormData) => {
        try {
            setGenerating(true);
            setError(null);

            // Get the user's GitHub token from the session
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Session for demo generation:', session);
            console.log('Provider token available:', !!session?.provider_token);

            if (!session?.provider_token) {
                setError('GitHub access token not found. Please sign in with GitHub again.');
                return;
            }

            const response = await fetch('/api/generate-demo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    githubToken: session.provider_token,
                    supabaseUserId: user.id,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to generate demo');
            }

            // Refresh the demos list
            await fetchDemos(user.id);

            // Show success message (you could add a toast notification here)
            console.log('Demo generated successfully:', result.data);

        } catch (err) {
            console.error('Error generating demo:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate demo');
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteVercelDeployments = async (demoId: string) => {
        try {
            console.log('🗑️ Starting Vercel deployment deletion for demo:', demoId);
            setError(null);

            console.log('🗑️ Making Vercel deletion API call...');
            const response = await fetch(`/api/delete-vercel-deployments?demoId=${encodeURIComponent(demoId)}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('🗑️ Vercel deletion response status:', response.status);

            const result = await response.json();
            console.log('🗑️ Vercel deletion response result:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete Vercel deployments');
            }

            console.log('🗑️ Vercel deployments deleted successfully');
            alert('Vercel deployments deleted successfully!');

        } catch (err) {
            console.error('🗑️ Error deleting Vercel deployments:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete Vercel deployments');
            alert(`Failed to delete Vercel deployments: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDeleteDemoData = async (demoId: string) => {
        try {
            console.log('🗑️ Starting demo data deletion for demo:', demoId);
            setError(null);

            // Get the user's GitHub token from the session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.provider_token) {
                setError('GitHub access token not found. Please sign in with GitHub again.');
                return;
            }

            console.log('🗑️ Making demo data deletion API call...');
            const response = await fetch(`/api/delete-demo-data?demoId=${encodeURIComponent(demoId)}&githubToken=${encodeURIComponent(session.provider_token)}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('🗑️ Demo data deletion response status:', response.status);

            const result = await response.json();
            console.log('🗑️ Demo data deletion response result:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete demo data');
            }

            console.log('🗑️ Refreshing demos list...');
            // Refresh the demos list
            await fetchDemos(user.id);

            console.log('🗑️ Demo data deleted successfully');
            alert('Demo data deleted successfully!');

        } catch (err) {
            console.error('🗑️ Error deleting demo data:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete demo data');
            alert(`Failed to delete demo data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    // Legacy function for backward compatibility
    const handleDeleteDemo = async (demoId: string) => {
        try {
            console.log('🗑️ Starting legacy delete process for demo:', demoId);
            setError(null);

            // Get the user's GitHub token from the session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.provider_token) {
                setError('GitHub access token not found. Please sign in with GitHub again.');
                return;
            }

            console.log('🗑️ Making legacy delete API call...');
            const response = await fetch(`/api/delete-demo?demoId=${encodeURIComponent(demoId)}&githubToken=${encodeURIComponent(session.provider_token)}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('🗑️ Legacy delete response status:', response.status);

            const result = await response.json();
            console.log('🗑️ Legacy delete response result:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete demo');
            }

            console.log('🗑️ Refreshing demos list...');
            // Refresh the demos list
            await fetchDemos(user.id);

            console.log('🗑️ Demo deleted successfully');

        } catch (err) {
            console.error('🗑️ Error deleting demo:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete demo');
            throw err; // Re-throw to ensure the loading state is cleared
        }
    };

    const handleSignOut = async () => {
        try {
            setSigningOut(true);
            setError(null);
            console.log('Starting sign out process...');

            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Error signing out:', error);
                setError('Failed to sign out. Please try again.');
            } else {
                console.log('Sign out successful, waiting for redirect...');
                // Clear user state immediately
                setUser(null);
                setDemos([]);
                // The auth state change listener should handle the redirect
                // But let's also force it after a short delay
                setTimeout(() => {
                    console.log('Forcing redirect to home page...');
                    router.push('/');
                }, 100);
            }
        } catch (err) {
            console.error('Error signing out:', err);
            setError('Failed to sign out. Please try again.');
        } finally {
            setSigningOut(false);
        }
    };

    console.log('🎨 Rendering dashboard component');
    console.log('🎨 Loading state:', loading);
    console.log('🎨 User state:', user ? 'EXISTS' : 'NULL');
    console.log('🎨 Session state:', session ? 'EXISTS' : 'NULL');
    console.log('🎨 Demos count:', demos.length);

    if (loading) {
        console.log('⏳ Showing loading screen');
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    console.log('✅ Showing main dashboard content');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Segment SE Demo Builder</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            {user && (
                                <div className="flex items-center space-x-2">
                                    <img
                                        className="h-8 w-8 rounded-full"
                                        src={user.user_metadata?.avatar_url || 'https://via.placeholder.com/32'}
                                        alt={user.user_metadata?.full_name || user.email}
                                    />
                                    <span className="text-sm text-gray-700">
                                        {user.user_metadata?.full_name || user.email}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={handleSignOut}
                                disabled={signingOut}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {signingOut ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing Out...
                                    </>
                                ) : (
                                    'Sign Out'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Demo Form */}
                    <div>
                        <DemoForm
                            onSubmit={handleGenerateDemo}
                            loading={generating}
                            githubToken={session?.provider_token}
                        />
                        {/* Debug info */}
                        <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
                            <p>Debug Info:</p>
                            <p>User ID: {user?.id || 'NULL'}</p>
                            <p>Session exists: {session ? 'YES' : 'NO'}</p>
                            <p>Provider token: {session?.provider_token ? 'AVAILABLE' : 'NOT AVAILABLE'}</p>
                            <p>Token Preview: {session?.provider_token ? session.provider_token.substring(0, 20) + '...' : 'None'}</p>
                            <p>Full session keys: {session ? Object.keys(session).join(', ') : 'No session'}</p>
                        </div>
                    </div>

                    {/* Demo List */}
                    <div>
                        <DemoList
                            demos={demos}
                            onRefresh={() => fetchDemos(user.id)}
                            onDelete={handleDeleteDemo}
                            onDeleteVercelDeployments={handleDeleteVercelDeployments}
                            onDeleteDemoData={handleDeleteDemoData}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
} 