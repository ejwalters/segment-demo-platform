'use client';

import { useState } from 'react';
import { Database } from '@/lib/supabase';

type Demo = Database['public']['Tables']['demos']['Row'];

interface DemoListProps {
    demos: Demo[];
    onRefresh: () => void;
    onDelete?: (demoId: string) => Promise<void>;
    onDeleteVercelDeployments?: (demoId: string) => Promise<void>;
    onDeleteDemoData?: (demoId: string) => Promise<void>;
}

export default function DemoList({ demos, onRefresh, onDelete, onDeleteVercelDeployments, onDeleteDemoData }: DemoListProps) {
    const [expandedDemo, setExpandedDemo] = useState<string | null>(null);
    const [deletingDemo, setDeletingDemo] = useState<string | null>(null);
    const [deletingVercel, setDeletingVercel] = useState<string | null>(null);
    const [deletingData, setDeletingData] = useState<string | null>(null);

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

    // Utility function to truncate URLs for display
    const truncateUrl = (url: string, maxLength: number = 50) => {
        if (url.length <= maxLength) return url;
        const domain = new URL(url).hostname;
        const path = new URL(url).pathname;
        if (domain.length + path.length <= maxLength) return url;
        return `${domain}${path.substring(0, maxLength - domain.length - 3)}...`;
    };

    // Utility function to copy text to clipboard
    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // You could add a toast notification here
            console.log(`${label} copied to clipboard`);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
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

    const handleDeleteVercelDeployments = async (demoId: string) => {
        if (!onDeleteVercelDeployments) return;

        if (!confirm('Are you sure you want to delete the Vercel deployments? This will remove the frontend and backend projects from Vercel.')) {
            return;
        }

        try {
            console.log('🗑️ DemoList: Starting Vercel deletion for demo:', demoId);
            setDeletingVercel(demoId);

            // Add a timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Delete request timed out after 30 seconds')), 30000);
            });

            await Promise.race([onDeleteVercelDeployments(demoId), timeoutPromise]);
            console.log('🗑️ DemoList: Vercel deletion completed successfully');
        } catch (error) {
            console.error('🗑️ DemoList: Error deleting Vercel deployments:', error);
            alert(`Failed to delete Vercel deployments: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            console.log('🗑️ DemoList: Clearing Vercel loading state');
            setDeletingVercel(null);
        }
    };

    const handleDeleteDemoData = async (demoId: string) => {
        if (!onDeleteDemoData) return;

        if (!confirm('Are you sure you want to delete the demo data? This will permanently delete the GitHub repository and remove the demo from the database.')) {
            return;
        }

        try {
            console.log('🗑️ DemoList: Starting demo data deletion for demo:', demoId);
            setDeletingData(demoId);

            // Add a timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Delete request timed out after 30 seconds')), 30000);
            });

            await Promise.race([onDeleteDemoData(demoId), timeoutPromise]);
            console.log('🗑️ DemoList: Demo data deletion completed successfully');
        } catch (error) {
            console.error('🗑️ DemoList: Error deleting demo data:', error);
            alert(`Failed to delete demo data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            console.log('🗑️ DemoList: Clearing data loading state');
            setDeletingData(null);
        }
    };

    if (demos.length === 0) {
        return (
            <div className="bg-white shadow-lg rounded-xl border border-gray-100">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Your Demos</h2>
                            <p className="text-sm text-gray-600 mt-1">Manage your Segment demo applications</p>
                        </div>
                        <button
                            onClick={onRefresh}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Empty State */}
                <div className="p-12 text-center">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No demos yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Create your first demo to get started with Segment integration and see your data in action.
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Use the form above to create your first demo
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-lg rounded-xl border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Your Demos</h2>
                        <p className="text-sm text-gray-600 mt-1">Manage your Segment demo applications</p>
                    </div>
                    <button
                        onClick={onRefresh}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Demo Cards Container */}
            <div className="p-6 space-y-4">
                {demos.map((demo) => (
                    <div key={demo.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                        {/* Card Header */}
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">
                                                {demo.customer_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">{demo.customer_name}</h3>
                                            <p className="text-sm text-gray-600">Created {formatDate(demo.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleExpanded(demo.id)}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    {expandedDemo === demo.id ? 'Hide Details' : 'Show Details'}
                                    <svg className={`ml-2 h-4 w-4 transform transition-transform duration-200 ${expandedDemo === demo.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {expandedDemo === demo.id && (
                            <div className="px-6 py-6 space-y-6">
                                {/* URLs Section */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                        Application URLs
                                    </h4>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        {demo.frontend_url && (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-medium text-gray-700 flex items-center">
                                                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Frontend
                                                    </label>
                                                    <button
                                                        onClick={() => demo.frontend_url && copyToClipboard(demo.frontend_url, 'Frontend URL')}
                                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="Copy URL"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <a
                                                    href={demo.frontend_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-mono break-all"
                                                >
                                                    {truncateUrl(demo.frontend_url)}
                                                </a>
                                            </div>
                                        )}

                                        {demo.backend_url && (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-medium text-gray-700 flex items-center">
                                                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                                        </svg>
                                                        Backend
                                                    </label>
                                                    <button
                                                        onClick={() => demo.backend_url && copyToClipboard(demo.backend_url, 'Backend URL')}
                                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="Copy URL"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <a
                                                    href={demo.backend_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-mono break-all"
                                                >
                                                    {truncateUrl(demo.backend_url)}
                                                </a>
                                            </div>
                                        )}

                                        {demo.github_repo_url && (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-medium text-gray-700 flex items-center">
                                                        <svg className="w-4 h-4 mr-2 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                                                        </svg>
                                                        GitHub
                                                    </label>
                                                    <button
                                                        onClick={() => demo.github_repo_url && copyToClipboard(demo.github_repo_url, 'GitHub URL')}
                                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="Copy URL"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <a
                                                    href={demo.github_repo_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-mono break-all"
                                                >
                                                    {truncateUrl(demo.github_repo_url)}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Configuration Section */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Configuration
                                    </h4>
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-sm font-semibold text-gray-700 flex items-center">
                                                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Write Key
                                                        </label>
                                                        <button
                                                            onClick={() => copyToClipboard(demo.segment_write_key, 'Write Key')}
                                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                                            title="Copy Write Key"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <code className="text-sm text-gray-800 font-mono break-all bg-gray-50 px-2 py-1 rounded">
                                                        {demo.segment_write_key}
                                                    </code>
                                                </div>

                                                <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-sm font-semibold text-gray-700 flex items-center">
                                                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            Profile Token
                                                        </label>
                                                        <button
                                                            onClick={() => copyToClipboard(demo.segment_profile_token, 'Profile Token')}
                                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                                            title="Copy Profile Token"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <code className="text-sm text-gray-800 font-mono break-all bg-gray-50 px-2 py-1 rounded">
                                                        {demo.segment_profile_token}
                                                    </code>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-sm font-semibold text-gray-700 flex items-center">
                                                            <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                            Unify Space ID
                                                        </label>
                                                        <button
                                                            onClick={() => copyToClipboard(demo.segment_unify_space_id, 'Unify Space ID')}
                                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                                            title="Copy Unify Space ID"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <code className="text-sm text-gray-800 font-mono break-all bg-gray-50 px-2 py-1 rounded">
                                                        {demo.segment_unify_space_id}
                                                    </code>
                                                </div>

                                                {demo.logo_url && (
                                                    <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="text-sm font-semibold text-gray-700 flex items-center">
                                                                <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                Logo URL
                                                            </label>
                                                            <button
                                                                onClick={() => demo.logo_url && copyToClipboard(demo.logo_url, 'Logo URL')}
                                                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                                                title="Copy Logo URL"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <a
                                                            href={demo.logo_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:text-blue-800 font-mono break-all"
                                                        >
                                                            {truncateUrl(demo.logo_url)}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons Section */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Actions
                                    </h4>

                                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {/* View Frontend Button */}
                                            {demo.frontend_url && (
                                                <a
                                                    href={demo.frontend_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
                                                >
                                                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    View Frontend
                                                </a>
                                            )}

                                            {/* View Code Button */}
                                            {demo.github_repo_url && (
                                                <a
                                                    href={demo.github_repo_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
                                                >
                                                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                                                    </svg>
                                                    View Code
                                                </a>
                                            )}

                                            {/* Edit with Chat Button */}
                                            <button className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm">
                                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                Edit with Chat
                                            </button>
                                        </div>

                                        {/* Delete Actions Section */}
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <h5 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                Delete Actions
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {/* Delete Vercel Deployments Button */}
                                                {(demo.frontend_url || demo.backend_url) && (
                                                    <button
                                                        onClick={() => handleDeleteVercelDeployments(demo.id)}
                                                        disabled={deletingVercel === demo.id}
                                                        className="inline-flex items-center justify-center px-4 py-3 border border-orange-300 text-sm font-medium rounded-lg text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                                                    >
                                                        {deletingVercel === demo.id ? (
                                                            <>
                                                                <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Deleting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                                                </svg>
                                                                Delete Deployments
                                                            </>
                                                        )}
                                                    </button>
                                                )}

                                                {/* Delete Demo Data Button */}
                                                <button
                                                    onClick={() => handleDeleteDemoData(demo.id)}
                                                    disabled={deletingData === demo.id}
                                                    className="inline-flex items-center justify-center px-4 py-3 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                                                >
                                                    {deletingData === demo.id ? (
                                                        <>
                                                            <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Deleting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Delete Data
                                                        </>
                                                    )}
                                                </button>

                                                {/* Legacy Delete All Button */}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => handleDelete(demo.id)}
                                                        disabled={deletingDemo === demo.id}
                                                        className="inline-flex items-center justify-center px-4 py-3 border border-purple-300 text-sm font-medium rounded-lg text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                                                    >
                                                        {deletingDemo === demo.id ? (
                                                            <>
                                                                <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Deleting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Delete All
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
} 