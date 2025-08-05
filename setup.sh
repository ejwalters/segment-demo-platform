#!/bin/bash

echo "🚀 Setting up Segment SE Demo Builder..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Create environment files if they don't exist
if [ ! -f "server/.env" ]; then
    echo "📝 Creating server environment file..."
    cp server/env.example server/.env
    echo "⚠️  Please edit server/.env with your API keys"
fi

if [ ! -f "client/.env.local" ]; then
    echo "📝 Creating client environment file..."
    cp client/env.example client/.env.local
    echo "⚠️  Please edit client/.env.local with your Supabase credentials"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your environment variables:"
echo "   - Edit server/.env with your API keys"
echo "   - Edit client/.env.local with your Supabase credentials"
echo ""
echo "2. Set up Supabase:"
echo "   - Create a new Supabase project"
echo "   - Run the SQL schema from supabase-schema.sql"
echo "   - Configure GitHub OAuth in Authentication > Providers"
echo ""
echo "3. Start the development servers:"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For detailed setup instructions, see README.md" 