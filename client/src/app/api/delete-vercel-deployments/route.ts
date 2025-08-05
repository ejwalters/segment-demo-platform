import { NextRequest, NextResponse } from 'next/server';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

export async function DELETE(request: NextRequest) {
    try {
        console.log('🗑️ Client delete-vercel-deployments API route called');

        const { searchParams } = new URL(request.url);
        const demoId = searchParams.get('demoId');

        if (!demoId) {
            return NextResponse.json(
                { error: 'Demo ID is required' },
                { status: 400 }
            );
        }

        const url = `${SERVER_URL}/delete-vercel-deployments?demoId=${encodeURIComponent(demoId)}`;
        console.log('🗑️ Making Vercel deletion request to:', url);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('🗑️ Vercel deletion response status:', response.status);

        const result = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: result.error || 'Failed to delete Vercel deployments' },
                { status: response.status }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in delete-vercel-deployments API route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 