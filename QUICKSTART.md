# 🚀 Quick Start Guide

Get the Segment SE Demo Builder running in 5 minutes!

## 1. Prerequisites

- Node.js 18+ installed
- GitHub account
- Supabase account (free tier works)

## 2. One-Command Setup

```bash
./setup.sh
```

This will:
- ✅ Check Node.js version
- 📦 Install all dependencies
- 📝 Create environment files
- 🎯 Guide you through next steps

## 3. Configure Environment Variables

### Server Configuration (`server/.env`)
```env
PORT=3001
OPENAI_API_KEY=sk-your-openai-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VERCEL_TOKEN=your-vercel-token
VERCEL_TEAM_ID=your-team-id
```

### Client Configuration (`client/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SERVER_URL=http://localhost:3001
```

## 4. Supabase Setup (5 minutes)

1. **Create Project**: Go to [supabase.com](https://supabase.com) and create a new project
2. **Run Schema**: Copy and paste the contents of `supabase-schema.sql` into the SQL editor
3. **Configure Auth**: 
   - Go to Authentication > Providers
   - Enable GitHub provider
   - Add your GitHub OAuth app credentials
4. **Get Keys**: Copy your project URL and anon key to your environment files

## 5. GitHub OAuth App (2 minutes)

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Create new OAuth app
3. Set Authorization callback URL to: `https://your-project.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase

## 6. Start Development

```bash
npm run dev
```

This starts both:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 7. Test the Flow

1. Open http://localhost:3000
2. Click "Sign in with GitHub"
3. Fill out the demo form
4. Watch the magic happen! ✨

## 🆘 Common Issues

### "GitHub token not found"
- Make sure you're signed in with GitHub OAuth
- Check that your GitHub OAuth app is configured correctly

### "OpenAI API error"
- Verify your OpenAI API key is correct
- Check your OpenAI account has credits

### "Supabase connection error"
- Verify your Supabase URL and keys
- Make sure the database schema is installed

## 📞 Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Review the [supabase-schema.sql](supabase-schema.sql) for database setup
- Look at the environment examples in `client/env.example` and `server/env.example`

## 🎯 What's Next?

Once you have the basic flow working:

1. **Customize Templates**: Modify the OpenAI prompts in `server/src/services/demoGenerator.ts`
2. **Add Features**: Extend the dashboard with new capabilities
3. **Deploy**: Use Vercel to deploy both client and server
4. **Scale**: Add team features and analytics

Happy demo building! 🚀 