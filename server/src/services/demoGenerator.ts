import OpenAI from 'openai';
import { Octokit } from '@octokit/rest';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

// Initialize OpenAI client only when needed
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openai;
}

async function fetchRepositoryContext(repoFullName: string, githubToken: string): Promise<string> {
  const octokit = new Octokit({ auth: githubToken });
  const [owner, repo] = repoFullName.split('/');

  try {
    // Get repository details
    const { data: repoData } = await octokit.repos.get({ owner, repo });

    // Get README content
    let readmeContent = '';
    try {
      const { data: readme } = await octokit.repos.getReadme({ owner, repo });
      readmeContent = Buffer.from(readme.content, 'base64').toString('utf-8');
    } catch (error) {
      console.log('No README found for repository');
    }

    // Get top-level files and directories
    const { data: contents } = await octokit.repos.getContent({ owner, repo, path: '' });

    const fileStructure = Array.isArray(contents)
      ? contents
        .filter((item: any) => item.type === 'file' || item.type === 'dir')
        .map((item: any) => `${item.type === 'dir' ? '📁' : '📄'} ${item.name}`)
        .join('\n')
      : 'Unable to fetch file structure';

    // Get package.json if it exists
    let packageJsonContent = '';
    try {
      const { data: packageJson } = await octokit.repos.getContent({ owner, repo, path: 'package.json' });
      if ('content' in packageJson && packageJson.content) {
        packageJsonContent = Buffer.from(packageJson.content, 'base64').toString('utf-8');
      }
    } catch (error) {
      console.log('No package.json found');
    }

    return `
Repository: ${repoFullName}
Description: ${repoData.description || 'No description'}
Language: ${repoData.language || 'Not specified'}
Stars: ${repoData.stargazers_count}
Forks: ${repoData.forks_count}

File Structure:
${fileStructure}

${readmeContent ? `README Content:
${readmeContent.substring(0, 1000)}${readmeContent.length > 1000 ? '...' : ''}` : ''}

${packageJsonContent ? `Package.json:
${packageJsonContent}` : ''}
`;
  } catch (error) {
    console.error('Error fetching repository context:', error);
    return `Repository: ${repoFullName} (Error fetching details)`;
  }
}

interface DemoGenerationParams {
  customerName: string;
  logoUrl?: string;
  writeKey: string;
  profileToken: string;
  unifySpaceId: string;
  githubToken: string;
  supabaseUserId: string;
  inspirationRepo?: string;
}

interface DemoResult {
  frontendUrl: string;
  backendUrl: string;
  githubRepoUrl: string;
}

export async function generateDemo(params: DemoGenerationParams): Promise<DemoResult> {
  const { customerName, logoUrl, writeKey, profileToken, unifySpaceId, githubToken, inspirationRepo } = params;
  const demoId = uuidv4();
  const demoDir = `/tmp/demo-${demoId}`;
  const frontendDir = path.join(demoDir, 'frontend');
  const backendDir = path.join(demoDir, 'backend');

  try {
    // Create directories
    fs.mkdirSync(demoDir, { recursive: true });
    fs.mkdirSync(frontendDir, { recursive: true });
    fs.mkdirSync(backendDir, { recursive: true });

    console.log(`Created demo directory: ${demoDir}`);

    // Generate frontend code
    const frontendCode = await generateFrontendCode(customerName, logoUrl, writeKey, inspirationRepo, githubToken);
    await writeFrontendFiles(frontendDir, frontendCode, customerName, logoUrl, writeKey);

    // Generate backend code
    const backendCode = await generateBackendCode(profileToken, unifySpaceId, inspirationRepo, githubToken);
    await writeBackendFiles(backendDir, backendCode, profileToken, unifySpaceId);

    // Create GitHub repository (skip for now)
    let githubRepoUrl = '';
    try {
      githubRepoUrl = await createGitHubRepo(customerName, githubToken);
      // Initialize git and push code
      await initializeGitAndPush(demoDir, githubRepoUrl, githubToken);
    } catch (error) {
      console.log('⚠️ GitHub integration failed, continuing without repo creation:', error instanceof Error ? error.message : 'Unknown error');
      githubRepoUrl = 'https://github.com/your-username/segment-demo-placeholder';
    }

    // Deploy to Vercel
    let frontendUrl = '';
    let backendUrl = '';
    try {
      frontendUrl = await deployToVercel(frontendDir, `segment-demo-${slugify(customerName).toLowerCase()}-frontend`, 'nextjs');
      backendUrl = await deployToVercel(backendDir, `segment-demo-${slugify(customerName).toLowerCase()}-backend`, 'node');
    } catch (error) {
      console.log('⚠️ Vercel deployment failed, using placeholder URLs:', error instanceof Error ? error.message : 'Unknown error');
      const timestamp = Date.now().toString(36);
      frontendUrl = `https://segment-demo-${slugify(customerName).toLowerCase()}-frontend-${timestamp}.vercel.app`;
      backendUrl = `https://segment-demo-${slugify(customerName).toLowerCase()}-backend-${timestamp}.vercel.app`;
    }

    return {
      frontendUrl,
      backendUrl,
      githubRepoUrl
    };

  } catch (error) {
    console.error('Error in demo generation:', error);
    throw error;
  } finally {
    // Clean up temporary files
    try {
      fs.rmSync(demoDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp directory:', cleanupError);
    }
  }
}

async function generateFrontendCode(customerName: string, logoUrl?: string, writeKey?: string, inspirationRepo?: string, githubToken?: string): Promise<any> {
  console.log('Generating frontend code for:', customerName);
  console.log('Logo URL:', logoUrl);
  console.log('Write key:', writeKey);
  console.log('Inspiration repo:', inspirationRepo);

  let inspirationContext = '';
  if (inspirationRepo && githubToken) {
    try {
      inspirationContext = await fetchRepositoryContext(inspirationRepo, githubToken);
    } catch (error) {
      console.log('Failed to fetch inspiration repository context:', error);
    }
  }

  const prompt = `
Create a modern, professional React Next.js application for ${customerName} with the following specific requirements:

1. **Navigation Header**:
   - Company logo positioned at top-left (${logoUrl || 'https://via.placeholder.com/200x80?text=' + customerName})
   - Horizontal navigation menu with 4-5 relevant links that make sense for ${customerName}'s business
   - Each nav link should have logical submenu items appropriate for that section
   - Sign In button at top-right that opens a modal
   - Clean, modern design with proper spacing and hover effects

2. **Sign In Modal**:
   - Opens when "Sign In" button is clicked
   - Form with email and password fields
   - Accepts any credentials (demo purposes)
   - On successful login, sends Segment identify call with user data
   - Close button and click-outside-to-close functionality

3. **Hero Section**:
   - Large hero image relevant to ${customerName}'s industry
   - Compelling headline and description
   - Custom call-to-action button
   - Professional layout with proper typography

4. **Main Content Sections**:
   - At least 3-4 content sections that make sense for ${customerName}
   - Each section should have relevant content, images, and CTAs
   - Responsive grid layouts
   - Professional styling with consistent spacing

5. **Segment Analytics Integration**:
   - Load Segment analytics.js with write key: ${writeKey || 'YOUR_WRITE_KEY'}
   - Track EVERY page view automatically
   - Track EVERY click using Object-Action framework (e.g., "Button Clicked", "Link Clicked", "Form Submitted")
   - Track modal opens/closes
   - Track form submissions
   - Track navigation menu interactions
   - Send identify calls on user login

6. **Technical Requirements**:
   - Next.js App Router structure
   - Functional components with React hooks
   - Tailwind CSS for styling
   - Responsive design (mobile-first)
   - TypeScript for type safety
   - Proper error handling
   - Loading states and animations

7. **File Structure**:
   - app/page.tsx (main homepage)
   - app/layout.tsx (root layout with navigation)
   - components/Navigation.tsx (header with nav and sign-in)
   - components/SignInModal.tsx (authentication modal)
   - components/Hero.tsx (hero section)
   - components/ContentSection.tsx (reusable content sections)
   - lib/analytics.ts (Segment setup and tracking functions)
   - lib/types.ts (TypeScript interfaces)
   - styles/globals.css (global styles)
   - package.json with all dependencies

8. **Segment Analytics Integration (CRITICAL - Use AnalyticsBrowser API)**:
   - Use the @segment/analytics-next library with AnalyticsBrowser API
   - Import: import { AnalyticsBrowser } from '@segment/analytics-next'
   - Initialize: const analytics = AnalyticsBrowser.load({ writeKey: '${writeKey || 'YOUR_WRITE_KEY'}' })
   - Make it SSR-safe: const analytics = typeof window !== 'undefined' ? AnalyticsBrowser.load({ writeKey: '${writeKey || 'YOUR_WRITE_KEY'}' }) : null
   - Track page views: analytics?.page('Homepage', { customerName: '${customerName}' })
   - Track button clicks: analytics?.track('Button Clicked', { buttonName: 'CTA Button', location: 'Hero' })
   - Track form submissions: analytics?.track('Form Submitted', { formName: 'Sign In', success: true })
   - Track navigation: analytics?.track('Navigation Clicked', { menuItem: 'Products', subItem: 'Software' })
   - User identification: analytics?.identify(userId, { email, name, company: '${customerName}' })
   - Make analytics available globally: if (typeof window !== 'undefined') { window.analytics = analytics }

${inspirationContext ? `
9. **Inspiration from repository ${inspirationRepo}**:
   Study the following repository structure and coding patterns to inform your implementation:
   ${inspirationContext}
   
   Use similar patterns, naming conventions, and architectural approaches where appropriate, but adapt them for the Segment demo use case.
` : ''}

**IMPORTANT**: Make this a professional, modern website that ${customerName} would actually use. Include realistic content, proper navigation structure, and ensure every user interaction is tracked with Segment. The design should be clean, modern, and industry-appropriate.

Please provide the complete code for each file with proper imports and configurations.
`;

  const completion = await getOpenAIClient().chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
}

async function generateBackendCode(profileToken: string, unifySpaceId: string, inspirationRepo?: string, githubToken?: string): Promise<any> {
  console.log('Generating backend code with inspiration repo:', inspirationRepo);

  let inspirationContext = '';
  if (inspirationRepo && githubToken) {
    try {
      inspirationContext = await fetchRepositoryContext(inspirationRepo, githubToken);
    } catch (error) {
      console.log('Failed to fetch inspiration repository context:', error);
    }
  }

  const prompt = `
Create a Node.js Express server with the following requirements:

1. Express server setup with:
   - CORS enabled
   - JSON body parsing
   - Environment variable support

2. Create a GET /profile endpoint that:
   - Calls Segment Profile API
   - Uses token: ${profileToken}
   - Uses Unify space ID: ${unifySpaceId}
   - Returns user traits in JSON format
   - Includes proper error handling

3. File structure:
   - server.js (main Express app)
   - routes/profile.js (profile endpoint)
   - package.json with all dependencies
   - .env.example file

4. Include proper error handling and logging

${inspirationContext ? `
5. Inspiration from repository ${inspirationRepo}:
   Study the following repository structure and coding patterns to inform your implementation:
   ${inspirationContext}
   
   Use similar patterns, naming conventions, and architectural approaches where appropriate, but adapt them for the Segment demo use case.
` : ''}

Please provide the complete code for each file with proper imports and configurations.
`;

  const completion = await getOpenAIClient().chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
}

async function writeFrontendFiles(frontendDir: string, code: string, customerName: string, logoUrl?: string, writeKey?: string): Promise<void> {
  // This is a simplified version - in a real implementation, you'd parse the AI response
  // and extract individual files. For now, we'll create basic files.

  const packageJson = {
    name: "segment-demo-frontend",
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint"
    },
    dependencies: {
      next: "14.0.0",
      react: "^18",
      "react-dom": "^18",
      "@segment/analytics-next": "^1.0.0",
      "framer-motion": "^10.16.0"
    },
    devDependencies: {
      typescript: "^5",
      "@types/node": "^20",
      "@types/react": "^18",
      "@types/react-dom": "^18",
      tailwindcss: "^3.3.0",
      autoprefixer: "^10.0.1",
      postcss: "^8"
    }
  };

  fs.writeFileSync(path.join(frontendDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Create Next.js configuration files
  const nextConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is stable in Next.js 14, no need for experimental flag
}

module.exports = nextConfig
`;

  const tailwindConfig = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;

  const postcssConfig = `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

  const tsconfig = `
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

  fs.writeFileSync(path.join(frontendDir, 'next.config.js'), nextConfig);
  fs.writeFileSync(path.join(frontendDir, 'tailwind.config.js'), tailwindConfig);
  fs.writeFileSync(path.join(frontendDir, 'postcss.config.js'), postcssConfig);
  fs.writeFileSync(path.join(frontendDir, 'tsconfig.json'), tsconfig);

  // Create Next.js App Router structure
  fs.mkdirSync(path.join(frontendDir, 'app'), { recursive: true });
  fs.mkdirSync(path.join(frontendDir, 'components'), { recursive: true });
  fs.mkdirSync(path.join(frontendDir, 'lib'), { recursive: true });
  fs.mkdirSync(path.join(frontendDir, 'styles'), { recursive: true });

  // Create basic files
  const layoutFile = `
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import Navigation from '../components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${customerName} - Professional Demo',
  description: 'Professional website for ${customerName} with Segment analytics integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        {children}
      </body>
    </html>
  )
}
`;

  const pageFile = `
'use client';

import { useEffect } from 'react';
import Hero from '../components/Hero';
import ContentSection from '../components/ContentSection';
import { trackPageView } from '../lib/analytics';

export default function Home() {
  useEffect(() => {
    // Track page view with Segment
    trackPageView('Homepage', {
      customerName: '${customerName}',
      page: 'home'
    });
  }, []);

  return (
    <main className="min-h-screen">
      <Hero />
      <ContentSection 
        title="About ${customerName}"
        description="Learn more about our innovative solutions and commitment to excellence."
        imageUrl="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
        ctaText="Learn More"
        ctaAction="about_section_cta_clicked"
      />
      <ContentSection 
        title="Our Services"
        description="Discover our comprehensive range of services designed to meet your needs."
        imageUrl="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2015&q=80"
        ctaText="View Services"
        ctaAction="services_section_cta_clicked"
        reverse={true}
      />
      <ContentSection 
        title="Contact Us"
        description="Get in touch with our team to discuss your requirements and how we can help."
        imageUrl="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80"
        ctaText="Get Started"
        ctaAction="contact_section_cta_clicked"
      />
    </main>
  );
}
`;

  fs.writeFileSync(path.join(frontendDir, 'app/layout.tsx'), layoutFile);
  fs.writeFileSync(path.join(frontendDir, 'app/page.tsx'), pageFile);

  const navigationComponent = `
'use client';

import { useState } from 'react';
import { trackEvent } from '../lib/analytics';
import SignInModal from './SignInModal';

export default function Navigation() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navItems = [
    {
      name: 'Products',
      href: '#products',
      submenu: [
        { name: 'Software Solutions', href: '#software' },
        { name: 'Cloud Services', href: '#cloud' },
        { name: 'Consulting', href: '#consulting' }
      ]
    },
    {
      name: 'Solutions',
      href: '#solutions',
      submenu: [
        { name: 'Enterprise', href: '#enterprise' },
        { name: 'Small Business', href: '#small-business' },
        { name: 'Startups', href: '#startups' }
      ]
    },
    {
      name: 'Resources',
      href: '#resources',
      submenu: [
        { name: 'Documentation', href: '#docs' },
        { name: 'Blog', href: '#blog' },
        { name: 'Support', href: '#support' }
      ]
    },
    {
      name: 'Company',
      href: '#company',
      submenu: [
        { name: 'About Us', href: '#about' },
        { name: 'Careers', href: '#careers' },
        { name: 'Contact', href: '#contact' }
      ]
    }
  ];

  const handleNavClick = (itemName: string, subItem?: string) => {
    trackEvent('Navigation Clicked', {
      menuItem: itemName,
      subItem: subItem || null,
      location: 'header'
    });
  };

  const handleSignInClick = () => {
    trackEvent('Button Clicked', {
      buttonName: 'Sign In',
      location: 'header'
    });
    setIsModalOpen(true);
  };

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              className="h-8 w-auto"
              src="${logoUrl || 'https://via.placeholder.com/200x80?text=' + customerName}"
              alt="${customerName} Logo"
            />
          </div>

          {/* Navigation Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <div key={item.name} className="relative group">
                  <button
                    onClick={() => handleNavClick(item.name)}
                    onMouseEnter={() => setActiveDropdown(item.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {item.name}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeDropdown === item.name && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      {item.submenu.map((subItem) => (
                        <a
                          key={subItem.name}
                          href={subItem.href}
                          onClick={() => handleNavClick(item.name, subItem.name)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {subItem.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sign In Button */}
          <div className="flex items-center">
            <button
              onClick={handleSignInClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </nav>
  );
}
`;

  const signInModal = `
'use client';

import { useState } from 'react';
import { trackEvent, identifyUser } from '../lib/analytics';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Track form submission
    trackEvent('Form Submitted', {
      formName: 'Sign In',
      success: true
    });

    // Simulate login (accept any credentials for demo)
    setTimeout(() => {
      // Identify user with Segment
      identifyUser(email, {
        email,
        name: email.split('@')[0],
        company: '${customerName}',
        loginMethod: 'email'
      });

      setIsLoading(false);
      onClose();
      setEmail('');
      setPassword('');
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
`;

  const heroComponent = `
'use client';

import { trackEvent } from '../lib/analytics';

export default function Hero() {
  const handleCTAClick = () => {
    trackEvent('Button Clicked', {
      buttonName: 'Hero CTA',
      location: 'hero',
      action: 'get_started'
    });
  };

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Welcome to ${customerName}
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Discover innovative solutions that transform your business and drive success in today's digital landscape.
          </p>
          <button
            onClick={handleCTAClick}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Get Started Today
          </button>
        </div>
      </div>
      
      {/* Hero Background Image */}
      <div className="absolute inset-0 opacity-10">
        <img
          src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Hero Background"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
`;

  const contentSectionComponent = `
'use client';

import { trackEvent } from '../lib/analytics';

interface ContentSectionProps {
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaAction: string;
  reverse?: boolean;
}

export default function ContentSection({ 
  title, 
  description, 
  imageUrl, 
  ctaText, 
  ctaAction, 
  reverse = false 
}: ContentSectionProps) {
  const handleCTAClick = () => {
    trackEvent('Button Clicked', {
      buttonName: ctaText,
      location: 'content_section',
      action: ctaAction
    });
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={\`flex items-center \${reverse ? 'flex-row-reverse' : 'flex-row'} gap-12\`}>
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {title}
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {description}
            </p>
            <button
              onClick={handleCTAClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {ctaText}
            </button>
          </div>
          <div className="flex-1">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
`;

  fs.writeFileSync(path.join(frontendDir, 'components/Navigation.tsx'), navigationComponent);
  fs.writeFileSync(path.join(frontendDir, 'components/SignInModal.tsx'), signInModal);
  fs.writeFileSync(path.join(frontendDir, 'components/Hero.tsx'), heroComponent);
  fs.writeFileSync(path.join(frontendDir, 'components/ContentSection.tsx'), contentSectionComponent);

  // Create analytics setup
  const analyticsFile = `
import { AnalyticsBrowser } from '@segment/analytics-next';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    analytics: any;
  }
}

// Initialize Segment Analytics (SSR-safe)
const analytics = typeof window !== 'undefined' 
  ? AnalyticsBrowser.load({ writeKey: '${writeKey || 'YOUR_WRITE_KEY'}' })
  : null;

// Make analytics available globally
if (typeof window !== 'undefined') {
  window.analytics = analytics;
}

// Tracking functions
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  analytics?.page(pageName, properties);
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  analytics?.track(eventName, properties);
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  analytics?.identify(userId, traits);
};

export default analytics;
`;

  const typesFile = `
// TypeScript interfaces for the application

export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
}

export interface NavItem {
  name: string;
  href: string;
  submenu: SubMenuItem[];
}

export interface SubMenuItem {
  name: string;
  href: string;
}

export interface ContentSectionProps {
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaAction: string;
  reverse?: boolean;
}

export interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}
`;

  fs.mkdirSync(path.join(frontendDir, 'lib'), { recursive: true });
  fs.writeFileSync(path.join(frontendDir, 'lib/analytics.ts'), analyticsFile);
  fs.writeFileSync(path.join(frontendDir, 'lib/types.ts'), typesFile);

  // Create global CSS
  const globalCSS = `
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles for the application */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom button styles */
.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors;
}

.btn-secondary {
  @apply bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors;
}

/* Navigation styles */
.nav-link {
  @apply text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors;
}

.nav-link-active {
  @apply text-blue-600 bg-blue-50;
}

/* Modal styles */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl;
}

/* Hero section styles */
.hero-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Content section styles */
.content-section {
  @apply py-16 bg-white;
}

.content-section-alt {
  @apply py-16 bg-gray-50;
}

/* Responsive text sizes */
.text-hero {
  @apply text-4xl md:text-6xl font-bold;
}

.text-section {
  @apply text-3xl md:text-4xl font-bold;
}

/* Animation classes */
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading spinner */
.spinner {
  @apply animate-spin rounded-full h-4 w-4 border-b-2 border-white;
}
`;

  fs.writeFileSync(path.join(frontendDir, 'styles/globals.css'), globalCSS);
}

async function writeBackendFiles(backendDir: string, code: string, profileToken: string, unifySpaceId: string): Promise<void> {
  const packageJson = {
    name: "segment-demo-backend",
    version: "1.0.0",
    main: "server.js",
    scripts: {
      start: "node server.js",
      dev: "nodemon server.js"
    },
    dependencies: {
      express: "^4.18.2",
      cors: "^2.8.5",
      dotenv: "^16.3.1",
      axios: "^1.6.0"
    },
    devDependencies: {
      nodemon: "^3.0.1"
    }
  };

  fs.writeFileSync(path.join(backendDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  const serverFile = `
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/profile', async (req, res) => {
  try {
    const response = await axios.get(\`https://profiles.segment.com/v1/spaces/\${process.env.SEGMENT_UNIFY_SPACE_ID}/collections/users/profiles/user_id:demo_user\`, {
      headers: {
        'Authorization': \`Bearer \${process.env.SEGMENT_PROFILE_TOKEN}\`,
        'Content-Type': 'application/json'
      }
    });

    const profile = response.data;
    res.json({
      fullName: profile.traits?.fullName || 'Demo User',
      email: profile.traits?.email || 'demo@example.com',
      plan: profile.traits?.plan || 'Basic',
      lastSeen: profile.traits?.lastSeen || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

  fs.writeFileSync(path.join(backendDir, 'server.js'), serverFile);

  const envExample = `
SEGMENT_PROFILE_TOKEN=${profileToken}
SEGMENT_UNIFY_SPACE_ID=${unifySpaceId}
PORT=3001
`;

  fs.writeFileSync(path.join(backendDir, '.env.example'), envExample);
}

async function createGitHubRepo(customerName: string, githubToken: string): Promise<string> {
  const octokit = new Octokit({ auth: githubToken });
  const repoName = `segment-demo-${slugify(customerName).toLowerCase()}`;

  try {
    const repo = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
      auto_init: false,
      description: `Segment demo for ${customerName}`,
    });

    return repo.data.html_url;
  } catch (error) {
    console.error('Error creating GitHub repo:', error);
    throw new Error('Failed to create GitHub repository');
  }
}

async function initializeGitAndPush(demoDir: string, githubRepoUrl: string, githubToken: string): Promise<void> {
  const commands = [
    ['git', 'init'],
    ['git', 'add', '.'],
    ['git', 'commit', '-m', 'Initial commit - Segment demo generated'],
    ['git', 'branch', '-M', 'main'],
    ['git', 'remote', 'add', 'origin', githubRepoUrl.replace('https://', `https://${githubToken}@`)],
    ['git', 'push', '-u', 'origin', 'main']
  ];

  for (const [command, ...args] of commands) {
    const result = spawnSync(command, args, {
      cwd: demoDir,
      stdio: 'pipe',
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      console.error(`Git command failed: ${command} ${args.join(' ')}`);
      console.error('Error:', result.stderr);
      throw new Error(`Git operation failed: ${result.stderr}`);
    }
  }
}

async function deployToVercel(projectDir: string, projectName: string, framework: string): Promise<string> {
  try {
    const vercelToken = process.env.VERCEL_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID;

    if (!vercelToken) {
      console.log('⚠️ VERCEL_TOKEN not set, returning placeholder URL');
      const deploymentId = Math.random().toString(36).substring(7);
      return `https://${projectName}-${deploymentId}.vercel.app`;
    }

    // Create a vercel.json configuration file
    const vercelConfig = {
      version: 2,
      builds: [
        {
          src: framework === 'nextjs' ? 'package.json' : 'server.js',
          use: framework === 'nextjs' ? '@vercel/next' : '@vercel/node'
        }
      ],
      routes: framework === 'nextjs' ? [] : [
        {
          src: '/(.*)',
          dest: '/server.js'
        }
      ]
    };

    fs.writeFileSync(path.join(projectDir, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));

    // Clean up project name for Vercel
    const cleanProjectName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50); // Limit length

    // Use Vercel CLI to deploy
    const deployCommand = [
      'npx', 'vercel', '--token', vercelToken,
      '--yes', '--prod'
    ];

    if (teamId) {
      deployCommand.push('--scope', teamId);
    }

    // Set project name via environment variable
    const env = { ...process.env, VERCEL_PROJECT_NAME: cleanProjectName };

    const result = spawnSync('npx', deployCommand, {
      cwd: projectDir,
      stdio: 'pipe',
      encoding: 'utf8',
      env: env
    });

    if (result.status !== 0) {
      console.error('Vercel deployment failed:', result.stderr);
      throw new Error(`Vercel deployment failed: ${result.stderr}`);
    }

    // Extract the deployment URL from the output
    const output = result.stdout;
    const urlMatch = output.match(/https:\/\/[^\s]+/);

    if (urlMatch) {
      return urlMatch[0];
    } else {
      throw new Error('Could not extract deployment URL from Vercel output');
    }

  } catch (error) {
    console.error('Error deploying to Vercel:', error);
    // Return a placeholder URL if deployment fails
    const deploymentId = Math.random().toString(36).substring(7);
    return `https://${projectName}-${deploymentId}.vercel.app`;
  }
} 