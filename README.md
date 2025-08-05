# Segment SE Demo Builder

A platform for creating custom demos for Segment customers with AI-powered code generation.

## Features

- **AI-Powered Demo Generation**: Uses OpenAI GPT-4 to generate custom frontend and backend code
- **GitHub Integration**: Authenticate with GitHub to access your repositories
- **Repository Inspiration**: Select an existing repository to use as inspiration for demo structure and patterns
- **Segment Integration**: Built-in support for Segment Analytics and Profile API
- **Automatic Deployment**: Deploy demos to Vercel with a single click
- **Demo Management**: View and manage all your created demos

## Repository Inspiration Feature

The platform now includes a powerful repository inspiration feature that allows you to:

1. **Select from Your Repositories**: Choose from a dropdown of your existing GitHub repositories
2. **AI Analysis**: The system analyzes the selected repository's structure, patterns, and code style
3. **Smart Adaptation**: The AI uses the repository as inspiration while adapting it for the Segment demo use case
4. **Pattern Matching**: Maintains similar architectural approaches, naming conventions, and coding patterns

### How It Works

When you select a repository for inspiration, the system:

- Fetches the repository's file structure
- Analyzes the README content
- Examines the package.json for dependencies and scripts
- Uses this context to inform the AI code generation
- Adapts the patterns to create a Segment-focused demo

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd segment-demo-platform-v2
   ```

2. **Set up environment variables**
   ```bash
   # Copy environment files
   cp server/env.example server/.env
   cp client/.env.example client/.env.local
   
   # Edit the files with your API keys
   ```

3. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

4. **Start the development servers**
   ```bash
   # Start the backend server
   cd server && npm run dev
   
   # Start the frontend (in a new terminal)
   cd client && npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Environment Variables

### Server (.env)
```
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
VERCEL_TOKEN=your_vercel_token_here
VERCEL_TEAM_ID=your_vercel_team_id_here
```

### Client (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SERVER_URL=http://localhost:3001
```

## Usage

1. **Sign in with GitHub**: Authenticate using your GitHub account
2. **Fill out the demo form**:
   - Customer information (name, logo)
   - Segment configuration (write key, profile token, unify space ID)
   - **Repository inspiration** (select from your repositories)
3. **Generate the demo**: The AI will create custom code based on your specifications
4. **Deploy automatically**: The demo will be deployed to Vercel
5. **Access your demo**: Get the frontend and backend URLs

## Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express and TypeScript
- **Database**: Supabase for user management and demo storage
- **AI**: OpenAI GPT-4 for code generation
- **Deployment**: Vercel for hosting
- **Authentication**: GitHub OAuth via Supabase

## API Endpoints

### Backend Server
- `POST /generate-demo` - Generate a new demo
- `GET /github/repos` - Fetch user's GitHub repositories
- `GET /demos/:userId` - Get user's demos
- `GET /health` - Health check

### Frontend API Routes
- `POST /api/generate-demo` - Proxy to backend demo generation
- `GET /api/github/repos` - Proxy to backend GitHub repos

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC 