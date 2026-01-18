# ContextFlow - Vibe-to-Task Bridge

A simplified SaaS dashboard that bridges the gap between code and non-technical stakeholders. ContextFlow automatically tracks your microservices development using manifest files and commit tags, visualizing everything in a beautiful Kanban board.

## Features

- **Manifest Files** - Each microservice has a `vibe.json` file describing status, tasks, and progress
- **Commit Tag Parsing** - Add tags like `[STATUS:DONE] [NEXT:Setup JWT]` to commits for automatic updates
- **Visual Kanban Board** - Real-time project status visualization
- **Health Monitoring** - Track repository activity and service health
- **GitHub Integration** - Webhooks for instant updates when commits are pushed
- **Smart Suggestions** - AI-powered recommendations for manifest updates

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind CSS + dnd-kit
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Git Integration**: Octokit + GitHub Webhooks
- **AI**: Gemini API (optional, for enhanced suggestions)

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- A Supabase account ([create one here](https://supabase.com))
- A GitHub account for OAuth authentication

### Installation

1. Clone the repository:
   ```bash
   cd ContextFlow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local` and fill in your credentials
   - Get Supabase credentials from [your project settings](https://app.supabase.com)
   - Set up GitHub OAuth in Supabase Dashboard → Authentication → Providers

4. Run database migrations:
   ```bash
   # Instructions for Supabase CLI will be added
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
contextflow/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # Authentication routes
│   │   ├── dashboard/    # Main Kanban dashboard
│   │   ├── api/          # API routes
│   │   └── templates/    # Template generator
│   ├── components/       # React components
│   │   ├── kanban/       # Kanban board components
│   │   ├── health/       # Health indicators
│   │   ├── suggestions/  # Update suggestions
│   │   └── templates/    # Template forms
│   ├── lib/              # Utilities and clients
│   │   ├── github/       # GitHub API integration
│   │   ├── supabase/     # Supabase client
│   │   └── ai/           # AI integrations
│   └── types/            # TypeScript definitions
├── supabase/
│   └── migrations/       # Database migrations
└── public/
    └── templates/        # Task templates
```

## Usage

### For Developers

1. Add a `vibe.json` file to each microservice:
   ```json
   {
     "serviceName": "Payment Gateway",
     "status": "In Progress",
     "currentTask": "Integration with Stripe",
     "progress": 75,
     "lastUpdate": "2024-01-18",
     "nextSteps": ["Test webhook", "Live key setup"]
   }
   ```

2. Use commit tags to suggest updates:
   ```bash
   git commit -m "Fixed auth bug [STATUS:DONE] [NEXT:Add tests]"
   ```

3. View your dashboard to see real-time updates and apply suggestions

### For Non-Technical Users

1. Login with GitHub
2. View the Kanban board to see project status
3. Check health indicators to know if services are active
4. Use the template generator to create new task requests

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Supabase

1. Create a new project
2. Run migrations from `supabase/migrations/`
3. Configure GitHub OAuth provider
4. Enable Row Level Security

## Contributing

Contributions are welcome! This is a vibe coding project, so keep it simple and practical.

## License

MIT License - feel free to use this for your own projects!

## Credits

Built with the "vibe coding" philosophy - simple, practical, and effective.
