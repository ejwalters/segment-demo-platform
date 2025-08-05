#!/usr/bin/env node

// Simple script to test Vercel API connection
// Run with: node test-vercel-api.js

const fetch = require('node-fetch');

async function testVercelAPI() {
    const vercelToken = process.env.VERCEL_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID;

    console.log('🧪 Testing Vercel API Connection...');
    console.log('🔑 Token available:', vercelToken ? 'YES' : 'NO');
    console.log('🔑 Team ID:', teamId || 'none (personal account)');

    if (!vercelToken) {
        console.log('❌ VERCEL_TOKEN not set in environment');
        return;
    }

    // Test personal account endpoint
    console.log('\n🔍 Testing personal account endpoint...');
    try {
        const personalResponse = await fetch('https://api.vercel.com/v9/projects', {
            headers: {
                'Authorization': `Bearer ${vercelToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📊 Personal endpoint status:', personalResponse.status, personalResponse.statusText);

        if (personalResponse.ok) {
            const data = await personalResponse.json();
            console.log('✅ Personal endpoint successful');
            console.log('📋 Projects found:', data.projects?.length || 0);

            if (data.projects && data.projects.length > 0) {
                console.log('📋 Project names:');
                data.projects.forEach((project, index) => {
                    console.log(`  ${index + 1}. ${project.name} (${project.framework || 'unknown'})`);
                });
            }
        } else {
            const errorText = await personalResponse.text();
            console.log('❌ Personal endpoint failed');
            console.log('📋 Error response:', errorText);
        }
    } catch (error) {
        console.log('❌ Personal endpoint error:', error.message);
    }

    // Test team endpoint if team ID is available
    if (teamId) {
        console.log('\n🔍 Testing team endpoint...');
        try {
            const teamResponse = await fetch(`https://api.vercel.com/v9/teams/${teamId}/projects`, {
                headers: {
                    'Authorization': `Bearer ${vercelToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📊 Team endpoint status:', teamResponse.status, teamResponse.statusText);

            if (teamResponse.ok) {
                const data = await teamResponse.json();
                console.log('✅ Team endpoint successful');
                console.log('📋 Projects found:', data.projects?.length || 0);

                if (data.projects && data.projects.length > 0) {
                    console.log('📋 Project names:');
                    data.projects.forEach((project, index) => {
                        console.log(`  ${index + 1}. ${project.name} (${project.framework || 'unknown'})`);
                    });
                }
            } else {
                const errorText = await teamResponse.text();
                console.log('❌ Team endpoint failed');
                console.log('📋 Error response:', errorText);
            }
        } catch (error) {
            console.log('❌ Team endpoint error:', error.message);
        }
    }

    // Test user info
    console.log('\n🔍 Testing user info...');
    try {
        const userResponse = await fetch('https://api.vercel.com/v2/user', {
            headers: {
                'Authorization': `Bearer ${vercelToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📊 User endpoint status:', userResponse.status, userResponse.statusText);

        if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('✅ User endpoint successful');
            console.log('👤 User:', userData.user?.name || userData.user?.email || 'unknown');
            console.log('🏢 Account type:', userData.user?.type || 'unknown');
        } else {
            const errorText = await userResponse.text();
            console.log('❌ User endpoint failed');
            console.log('📋 Error response:', errorText);
        }
    } catch (error) {
        console.log('❌ User endpoint error:', error.message);
    }
}

// Run the test
testVercelAPI().catch(console.error); 