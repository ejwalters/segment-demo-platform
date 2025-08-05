'use client';

import { useState, useEffect } from 'react';

interface DemoFormProps {
    onSubmit: (data: DemoFormData) => void;
    loading: boolean;
    githubToken?: string;
}

export interface DemoFormData {
    customerName: string;
    logoUrl: string;
    writeKey: string;
    profileToken: string;
    unifySpaceId: string;
    inspirationRepo?: string;
}

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string;
    html_url: string;
    language: string;
    updated_at: string;
    stargazers_count: number;
    forks_count: number;
}

export default function DemoForm({ onSubmit, loading, githubToken }: DemoFormProps) {
    const [formData, setFormData] = useState<DemoFormData>({
        customerName: '',
        logoUrl: '',
        writeKey: '',
        profileToken: '',
        unifySpaceId: '',
        inspirationRepo: ''
    });

    const [errors, setErrors] = useState<Partial<DemoFormData>>({});
    const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [reposError, setReposError] = useState<string | null>(null);

    // Fetch repositories when component mounts or githubToken changes
    useEffect(() => {
        console.log('DemoForm useEffect - githubToken:', githubToken ? 'available' : 'not available');
        if (githubToken) {
            console.log('DemoForm - starting repository fetch...');
            fetchRepositories();
        } else {
            console.log('DemoForm - no github token, skipping repository fetch');
        }
    }, [githubToken]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchRepositories = async () => {
        if (!githubToken) {
            console.log('No GitHub token available');
            return;
        }

        try {
            console.log('Fetching repositories with token:', githubToken.substring(0, 10) + '...');
            setLoadingRepos(true);
            setReposError(null);

            const response = await fetch(`/api/github/repos?githubToken=${encodeURIComponent(githubToken)}`);
            console.log('Repository API response status:', response.status);

            const result = await response.json();
            console.log('Repository API result:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch repositories');
            }

            console.log('Setting repositories:', result.repositories?.length || 0);
            setRepositories(result.repositories || []);
        } catch (error) {
            console.error('Error fetching repositories:', error);
            setReposError(error instanceof Error ? error.message : 'Failed to fetch repositories');
        } finally {
            setLoadingRepos(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<DemoFormData> = {};

        if (!formData.customerName.trim()) {
            newErrors.customerName = 'Customer name is required';
        }

        if (!formData.writeKey.trim()) {
            newErrors.writeKey = 'Segment Write Key is required';
        }

        if (!formData.profileToken.trim()) {
            newErrors.profileToken = 'Segment Profile API Token is required';
        }

        if (!formData.unifySpaceId.trim()) {
            newErrors.unifySpaceId = 'Segment Unify Space ID is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleChange = (field: keyof DemoFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Demo</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                                Customer Name *
                            </label>
                            <input
                                type="text"
                                id="customerName"
                                value={formData.customerName}
                                onChange={(e) => handleChange('customerName', e.target.value)}
                                className={`mt-1 block w-full rounded-lg border-2 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:text-sm ${errors.customerName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                placeholder="Acme Corporation"
                            />
                            {errors.customerName && (
                                <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                                Logo URL
                            </label>
                            <input
                                type="url"
                                id="logoUrl"
                                value={formData.logoUrl}
                                onChange={(e) => handleChange('logoUrl', e.target.value)}
                                className="mt-1 block w-full rounded-lg border-2 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none hover:border-gray-300 sm:text-sm"
                                placeholder="https://example.com/logo.png"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Optional: URL to the customer&apos;s logo
                            </p>
                        </div>
                    </div>
                </div>

                {/* Repository Inspiration */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Repository Inspiration</h3>

                    <div>
                        <label htmlFor="inspirationRepo" className="block text-sm font-medium text-gray-700">
                            Select Repository for Inspiration
                        </label>
                        <select
                            id="inspirationRepo"
                            value={formData.inspirationRepo}
                            onChange={(e) => handleChange('inspirationRepo', e.target.value)}
                            className="mt-1 block w-full rounded-lg border-2 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none hover:border-gray-300 sm:text-sm"
                        >
                            <option value="">Select a repository (optional)</option>
                            {loadingRepos ? (
                                <option value="" disabled>Loading repositories...</option>
                            ) : (
                                repositories.map((repo) => (
                                    <option key={repo.id} value={repo.full_name}>
                                        {repo.full_name} {repo.language && `(${repo.language})`}
                                    </option>
                                ))
                            )}
                        </select>
                        <p className="mt-1 text-sm text-gray-500">
                            Optional: Select an existing repository to use as inspiration for the demo structure and patterns
                        </p>
                        {reposError && (
                            <p className="mt-1 text-sm text-red-600">{reposError}</p>
                        )}
                        {repositories.length === 0 && !loadingRepos && !reposError && (
                            <p className="mt-1 text-sm text-gray-500">No repositories found</p>
                        )}
                    </div>
                </div>

                {/* Segment Configuration */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Segment Configuration</h3>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label htmlFor="writeKey" className="block text-sm font-medium text-gray-700">
                                Segment Write Key *
                            </label>
                            <input
                                type="text"
                                id="writeKey"
                                value={formData.writeKey}
                                onChange={(e) => handleChange('writeKey', e.target.value)}
                                className={`mt-1 block w-full rounded-lg border-2 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:text-sm ${errors.writeKey ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                placeholder="abc123def456ghi789"
                            />
                            {errors.writeKey && (
                                <p className="mt-1 text-sm text-red-600">{errors.writeKey}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="profileToken" className="block text-sm font-medium text-gray-700">
                                Segment Profile API Token *
                            </label>
                            <input
                                type="password"
                                id="profileToken"
                                value={formData.profileToken}
                                onChange={(e) => handleChange('profileToken', e.target.value)}
                                className={`mt-1 block w-full rounded-lg border-2 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:text-sm ${errors.profileToken ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                placeholder="profile_xyz789"
                            />
                            {errors.profileToken && (
                                <p className="mt-1 text-sm text-red-600">{errors.profileToken}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="unifySpaceId" className="block text-sm font-medium text-gray-700">
                                Segment Unify Space ID *
                            </label>
                            <input
                                type="text"
                                id="unifySpaceId"
                                value={formData.unifySpaceId}
                                onChange={(e) => handleChange('unifySpaceId', e.target.value)}
                                className={`mt-1 block w-full rounded-lg border-2 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:text-sm ${errors.unifySpaceId ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                placeholder="space_456"
                            />
                            {errors.unifySpaceId && (
                                <p className="mt-1 text-sm text-red-600">{errors.unifySpaceId}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating Demo...
                            </>
                        ) : (
                            'Generate Demo'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
} 