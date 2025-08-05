'use client';

import { useState } from 'react';
import { Database } from '@/lib/supabase';

type Demo = Database['public']['Tables']['demos']['Row'];

interface DemoListProps {
    demos: Demo[];
    onRefresh: () => void;
    onDelete?: (demoId: string) => Promise<void>;
}

export default function DemoList({ demos, onRefresh, onDelete }: DemoListProps) {
    const [expandedDemo, setExpandedDemo] = useState<string | null>(null);
    const [deletingDemo, setDeletingDemo] = useState<string | null>(null);

    const toggleExpanded = (demoId: string) => {
        setExpandedDemo(expandedDemo === demoId ? null : demoId);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = async (demoId: string) => {
        if (!onDelete) return;

        if (!confirm('Are you sure you want to delete this demo? This will permanently delete the Vercel deployment and GitHub repository.')) {
            return;
        }

        try {
            console.log('🗑️ DemoList: Starting delete for demo:', demoId);
            setDeletingDemo(demoId);

            // Add a timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Delete request timed out after 30 seconds')), 30000);
            });

            await Promise.race([onDelete(demoId), timeoutPromise]);
            console.log('🗑️ DemoList: Delete completed successfully');
        } catch (error) {
            console.error('🗑️ DemoList: Error deleting demo:', error);
            alert(`Failed to delete demo: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            console.log('🗑️ DemoList: Clearing loading state');
            setDeletingDemo(null);
        }
    };

    if (demos.length === 0) {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Demos</h2>
                <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No demos yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Create your first demo to get started.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Demos</h2>
                <button
                    onClick={onRefresh}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            <div className="space-y-4">
                {demos.map((demo) => (
                    <div key={demo.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900">{demo.customer_name}</h3>
                                <p className="text-sm text-gray-500">Created {formatDate(demo.created_at)}</p>
                            </div>
                            <button
                                onClick={() => toggleExpanded(demo.id)}
                                className="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {expandedDemo === demo.id ? 'Hide' : 'Show'} Details
                                <svg className={`ml-2 h-4 w-4 transform ${expandedDemo === demo.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        {expandedDemo === demo.id && (
                            <div className="mt-4 space-y-4">
                                {/* URLs */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {demo.frontend_url && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Frontend URL</label>
                                            <a
                                                href={demo.frontend_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-1 block text-sm text-blue-600 hover:text-blue-500 truncate"
                                            >
                                                {demo.frontend_url}
                                            </a>
                                        </div>
                                    )}

                                    {demo.backend_url && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Backend URL</label>
                                            <a
                                                href={demo.backend_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-1 block text-sm text-blue-600 hover:text-blue-500 truncate"
                                            >
                                                {demo.backend_url}
                                            </a>
                                        </div>
                                    )}

                                    {demo.github_repo_url && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">GitHub Repository</label>
                                            <a
                                                href={demo.github_repo_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-1 block text-sm text-blue-600 hover:text-blue-500 truncate"
                                            >
                                                {demo.github_repo_url}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Configuration Details */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Configuration</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-700">Write Key:</span>
                                            <span className="ml-2 font-mono text-gray-600">{demo.segment_write_key}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">Profile Token:</span>
                                            <span className="ml-2 font-mono text-gray-600">{demo.segment_profile_token}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">Unify Space ID:</span>
                                            <span className="ml-2 font-mono text-gray-600">{demo.segment_unify_space_id}</span>
                                        </div>
                                        {demo.logo_url && (
                                            <div>
                                                <span className="font-medium text-gray-700">Logo URL:</span>
                                                <span className="ml-2 text-gray-600">{demo.logo_url}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-3">
                                    {demo.frontend_url && (
                                        <a
                                            href={demo.frontend_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            View Frontend
                                        </a>
                                    )}

                                    {demo.github_repo_url && (
                                        <a
                                            href={demo.github_repo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                                            </svg>
                                            View Code
                                        </a>
                                    )}

                                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Edit with Chat
                                    </button>

                                    <button
                                        onClick={() => handleDelete(demo.id)}
                                        disabled={deletingDemo === demo.id}
                                        className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {deletingDemo === demo.id ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete Demo
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
} 