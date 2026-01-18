# ContextFlow - Setup Guide

Welcome to ContextFlow! This guide will help you set up and deploy your Vibe-to-Task Bridge.

## 🎉 What's Been Built

ContextFlow is now fully implemented with:

- ✅ **Complete Backend**: Supabase database, GitHub integration, webhook system
- ✅ **Full API**: REST endpoints for repos, manifests, suggestions, health checks
- ✅ **Beautiful UI**: Kanban board, authentication, suggestions system
- ✅ **Real-time Updates**: GitHub webhooks trigger instant dashboard updates
- ✅ **Health Monitoring**: Automatic service health tracking via cron jobs

## 📋 Prerequisites

Before you begin, make sure you have:

1. **Node.js 18+** and npm 9+ installed
2. A **Supabase account** ([sign up free](https://supabase.com))
3. A **GitHub account** for OAuth
4. A **Vercel account** for deployment (optional, but recommended)

## 🚀 Quick Start

### Step 1: Set Up Supabase

1. **Create a new Supabase project**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Click "New Project"
   - Fill in project details and wait for setup to complete

2. **Run the database migration**
   - Go to SQL Editor in Supabase Dashboard
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run the SQL

3. **Enable GitHub OAuth**
   - Go to Authentication → Providers → GitHub
   - Toggle "Enable Sign in with GitHub"
   - Create a GitHub OAuth App:
     - Go to [GitHub Developer Settings](https://github.com/settings/developers)
     - Click "New OAuth App"
     - **Application name**: ContextFlow
     - **Homepage URL**: `http://localhost:3000` (change for production)
     - **Authorization callback URL**: `https://YOUR_SUPABASE_URL/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

4. **Get your Supabase credentials**
   - Go to Project Settings → API
   - Copy:
     - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
     - Anon/Public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
     - Service Role key (`SUPABASE_SERVICE_ROLE_KEY`) - ⚠️ Keep this secret!

### Step 2: Configure Environment Variables

1. Open `.env.local` in the project root
2. Fill in your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GitHub Webhook Secret (generate a random string)
GITHUB_WEBHOOK_SECRET=your-random-secret-here

# Optional: Gemini AI (for enhanced suggestions)
GEMINI_API_KEY=your-gemini-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Generate webhook secret:**
```bash
# On macOS/Linux
openssl rand -hex 32

# On Windows PowerShell
[System.Convert]::ToBase64String((1..32 | %{ Get-Random -Minimum 0 -Maximum 256 }) -as [byte[]])
```

### Step 3: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app!

## 🎯 Using ContextFlow

### For Developers

#### 1. Add vibe.json to Your Microservices

Create a `vibe.json` file in each microservice directory:

```json
{
  "serviceName": "Payment Gateway",
  "status": "In Progress",
  "currentTask": "Integration with Stripe",
  "progress": 75,
  "lastUpdate": "2024-01-18T10:00:00.000Z",
  "nextSteps": ["Test webhook", "Live key setup"],
  "dependencies": ["Auth Service"],
  "priority": "P1"
}
```

**Example Structure:**
```
my-repo/
├── services/
│   ├── auth/
│   │   └── vibe.json
│   ├── payment/
│   │   └── vibe.json
│   └── inventory/
│       └── vibe.json
```

#### 2. Use Commit Tags

Add tags to your commit messages to auto-update manifests:

```bash
# Update status
git commit -m "Fixed auth bug [STATUS:DONE]"

# Add next steps
git commit -m "Completed API integration [STATUS:DONE] [NEXT:Add tests] [NEXT:Deploy to staging]"

# Update progress
git commit -m "Working on OAuth [PROGRESS:50]"

# Set priority
git commit -m "Critical bug fix [STATUS:DONE] [PRIORITY:P1]"

# Combine multiple tags
git commit -m "Auth module complete [STATUS:DONE] [PROGRESS:100] [NEXT:Code review]"
```

**Available Tags:**
- `[STATUS:BACKLOG|IN_PROGRESS|TESTING|DONE]` - Update service status
- `[NEXT:Task description]` - Add next step (can use multiple)
- `[PROGRESS:0-100]` - Update progress percentage
- `[PRIORITY:P1|P2|P3]` - Set priority level

#### 3. Connect Your Repository

1. Sign in to ContextFlow with GitHub
2. Click "Connect Repository"
3. Select your repository
4. ContextFlow will:
   - Scan for all `vibe.json` files
   - Set up a webhook for real-time updates
   - Display your services on the Kanban board

#### 4. Apply Suggestions

When you push commits with tags, ContextFlow will:
1. Detect the tags in your commit message
2. Create a suggestion to update the `vibe.json`
3. Show the suggestion in the dashboard
4. Let you apply or dismiss it with one click

### For Non-Technical Users

1. **View Progress**: See all services on the Kanban board
2. **Check Health**: Green 🟢 = active, Yellow 🟡 = stale, Red 🔴 = inactive
3. **Track Tasks**: View current tasks and next steps for each service
4. **Monitor Updates**: See real-time updates when developers push code

## 🚢 Deploying to Production

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/contextflow.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Add environment variables (same as `.env.local`)
   - Click "Deploy"

3. **Update Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel domain (e.g., `https://contextflow.vercel.app`)
   - Redeploy

4. **Update GitHub OAuth**
   - Go to your GitHub OAuth App settings
   - Update:
     - Homepage URL: `https://your-vercel-domain.vercel.app`
     - Callback URL: `https://YOUR_SUPABASE_URL/auth/v1/callback`

5. **Configure Cron Job**
   - The `vercel.json` file is already configured to run health checks every 6 hours
   - Vercel will automatically set this up on deployment

### Alternative: Deploy to Other Platforms

ContextFlow works on any platform that supports Next.js:
- **Netlify**: Similar to Vercel
- **Railway**: Great for full-stack apps
- **Fly.io**: Global edge deployment
- **Self-hosted**: Use `npm run build && npm start`

## 📊 Testing the Webhook

After deploying, test the webhook:

1. **Make a test commit** with tags:
   ```bash
   git commit -m "Test webhook [STATUS:IN_PROGRESS] [NEXT:Review code]" --allow-empty
   git push
   ```

2. **Check the dashboard** - you should see a new suggestion appear!

3. **Troubleshooting webhooks:**
   - Go to your GitHub repo → Settings → Webhooks
   - Click on the ContextFlow webhook
   - Check "Recent Deliveries" for any errors
   - Verify the webhook URL matches your deployment
   - Confirm the secret matches `GITHUB_WEBHOOK_SECRET`

## 🛠️ Advanced Configuration

### Custom Health Check Schedule

Edit `vercel.json` to change the cron schedule:

```json
{
  "crons": [
    {
      "path": "/api/health/cron",
      "schedule": "0 */6 * * *"  // Every 6 hours
    }
  ]
}
```

**Schedule syntax (cron format):**
- `0 * * * *` - Every hour
- `0 */12 * * *` - Every 12 hours
- `0 0 * * *` - Daily at midnight

### Enable Gemini AI (Optional)

For enhanced natural language suggestions:

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env.local`:
   ```env
   GEMINI_API_KEY=your-api-key
   ```
3. The system will use Gemini to suggest status updates for commits without tags

### Row-Level Security (RLS)

The database schema includes RLS policies to ensure users can only access their own data. No additional configuration needed!

## 🐛 Troubleshooting

### "Unauthorized" when accessing dashboard
- Check that GitHub OAuth is configured correctly in Supabase
- Verify callback URL matches your deployment
- Clear browser cookies and try signing in again

### Webhooks not working
- Verify `GITHUB_WEBHOOK_SECRET` matches in both `.env.local` and GitHub webhook settings
- Check webhook deliveries in GitHub repo settings
- Ensure your app URL is publicly accessible (localhost won't work for webhooks)

### No manifests found after scanning
- Ensure `vibe.json` files exist in your repository
- Check that file names are exactly `vibe.json` (case-sensitive)
- Verify the JSON format is valid

### Health status stuck on "Unknown"
- Run health check manually: `POST /api/health/cron`
- Check that cron jobs are enabled in Vercel
- Verify there are commits in the repository

## 📚 API Documentation

### Endpoints

- `GET /api/repos` - List repositories
- `POST /api/repos` - Connect new repository
- `GET /api/manifests?repoId=xxx` - List manifests
- `POST /api/manifests/scan` - Scan repository
- `GET /api/suggestions?repoId=xxx` - Get suggestions
- `POST /api/suggestions/:id` - Apply suggestion
- `POST /api/webhook` - GitHub webhook (internal)
- `POST /api/health/cron` - Run health check (cron)

### Database Schema

See `supabase/migrations/001_initial_schema.sql` for complete schema.

**Main tables:**
- `users` - GitHub users
- `repositories` - Connected repositories
- `microservices` - Tracked services with manifests
- `commit_suggestions` - Pending manifest updates

## 🎓 Next Steps

1. **Invite team members** - Share the dashboard URL
2. **Create templates** - Use the template generator for new services
3. **Monitor health** - Set up alerts based on health status
4. **Customize** - Modify the Kanban columns, add new features
5. **Scale** - Connect multiple repositories

## 💡 Tips & Best Practices

- **Commit often with tags** for automatic updates
- **Keep vibe.json files up-to-date** manually when needed
- **Review suggestions** before applying them
- **Use priority tags** (P1/P2/P3) for critical services
- **Document dependencies** in the manifest files
- **Run manual scans** after adding new services

## 🤝 Support

- Report issues: GitHub Issues
- Questions: Check the README.md
- Updates: Star the repo for notifications

---

Built with the "vibe coding" philosophy - simple, practical, and effective! 🚀
