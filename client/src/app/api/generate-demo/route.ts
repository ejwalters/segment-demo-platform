import { NextRequest, NextResponse } from 'next/server';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
    try {
        console.log('🔍 Client API route called');
        console.log('🔍 SERVER_URL:', SERVER_URL);

        const body = await request.json();
        console.log('🔍 Request body:', body);
        console.log('🔍 Inspiration repo:', body.inspirationRepo);

        const url = `${SERVER_URL}/generate-demo`;
        console.log('🔍 Making request to:', url);

        // Forward the request to the backend server
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

        const result = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: result.error || 'Failed to generate demo' },
                { status: response.status }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in generate-demo API route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 