# Contributing to ContextFlow

Thank you for your interest in contributing to ContextFlow! This document provides guidelines and information for contributors.

## 🎯 Project Philosophy

ContextFlow follows the **"vibe coding"** philosophy:
- Keep it simple and practical
- Prefer clarity over complexity
- Build features that solve real problems
- No over-engineering

## 🛠️ Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/contextflow.git
   cd contextflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.local` and fill in your credentials
   - See [SETUP.md](./SETUP.md) for detailed instructions

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
contextflow/
├── src/
│   ├── app/                  # Next.js app router pages
│   │   ├── (auth)/          # Authentication routes
│   │   ├── api/             # API routes
│   │   ├── dashboard/       # Main dashboard
│   │   └── templates/       # Template generator
│   ├── components/          # React components
│   │   ├── kanban/         # Kanban board components
│   │   ├── health/         # Health indicators
│   │   └── suggestions/    # Suggestion components
│   ├── lib/                # Utilities and integrations
│   │   ├── github/         # GitHub API & webhook handling
│   │   ├── supabase/       # Database client & queries
│   │   ├── ai/             # AI integrations (optional)
│   │   └── auth/           # Authentication helpers
│   └── types/              # TypeScript definitions
├── supabase/
│   └── migrations/         # Database migrations
└── public/
    └── templates/          # Template files
```

## 🎨 Code Style

- **TypeScript**: Use strict typing, avoid `any`
- **Components**: Prefer function components with hooks
- **Naming**:
  - Components: PascalCase
  - Functions: camelCase
  - Files: kebab-case or PascalCase for components
- **Imports**: Use absolute imports with `@/` prefix
- **Comments**: Add JSDoc comments for public functions

## 🧪 Testing

Currently, ContextFlow doesn't have automated tests (vibe coding!), but please:
- Test manually before submitting PRs
- Verify API endpoints work correctly
- Check UI on different screen sizes
- Test with real GitHub repositories

## 📝 Commit Messages

Use conventional commit format:

```
feat: add drag-and-drop to Kanban board
fix: resolve webhook signature validation
docs: update setup instructions
refactor: simplify commit tag parsing
```

## 🔧 Areas for Contribution

### High Priority
- [ ] Add drag-and-drop to Kanban board (using dnd-kit)
- [ ] Implement dependency mapping visualization
- [ ] Add multi-repository dashboard view
- [ ] Create mobile-responsive layouts
- [ ] Add notifications (Slack/Discord webhooks)

### Medium Priority
- [ ] Template generator UI
- [ ] Analytics dashboard (velocity, cycle time)
- [ ] Export functionality (CSV, PDF)
- [ ] Custom status columns
- [ ] Team collaboration features

### Documentation
- [ ] Video tutorials
- [ ] More examples of vibe.json files
- [ ] Troubleshooting guide
- [ ] API documentation improvements

### Infrastructure
- [ ] Add automated tests
- [ ] Set up CI/CD pipeline
- [ ] Docker support
- [ ] Monitoring and logging

## 🚀 Submitting a Pull Request

1. **Create a feature branch**
   ```bash
   git checkout -b feat/amazing-feature
   ```

2. **Make your changes**
   - Follow code style guidelines
   - Test thoroughly
   - Update documentation if needed

3. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

4. **Push to your fork**
   ```bash
   git push origin feat/amazing-feature
   ```

5. **Open a Pull Request**
   - Describe what you changed and why
   - Reference any related issues
   - Add screenshots for UI changes

## 🐛 Reporting Bugs

When reporting bugs, include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment (browser, OS, Node version)

## 💡 Suggesting Features

We love feature suggestions! Please:
- Check if it's already been suggested
- Explain the use case
- Keep it aligned with the vibe coding philosophy
- Consider submitting a PR yourself!

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution, no matter how small, is appreciated. Together we can make ContextFlow better for everyone!
