import { NextRequest, NextResponse } from 'next/server';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

export async function DELETE(request: NextRequest) {
    try {
        console.log('🗑️ Client delete-demo-data API route called');

        const { searchParams } = new URL(request.url);
        const demoId = searchParams.get('demoId');
        const githubToken = searchParams.get('githubToken');

        if (!demoId) {
            return NextResponse.json(
                { error: 'Demo ID is required' },
                { status: 400 }
            );
        }

        if (!githubToken) {
            return NextResponse.json(
                { error: 'GitHub token is required' },
                { status: 400 }
            );
        }

        const url = `${SERVER_URL}/delete-demo-data?demoId=${encodeURIComponent(demoId)}&githubToken=${encodeURIComponent(githubToken)}`;
        console.log('🗑️ Making demo data deletion request to:', url);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('🗑️ Demo data deletion response status:', response.status);

        const result = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: result.error || 'Failed to delete demo data' },
                { status: response.status }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in delete-demo-data API route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 