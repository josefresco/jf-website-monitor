# Contributing to JF Monitor

Thank you for your interest in contributing to JF Monitor! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional. We're all here to build great software together.

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/jf-website-monitor.git
cd jf-website-monitor

# Add upstream remote
git remote add upstream https://github.com/josefresco/jf-website-monitor.git
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

### 3. Create a Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

## Development Workflow

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── monitor/       # Monitoring endpoints
│   │   ├── websites/      # Website CRUD
│   │   ├── checks/        # Check history
│   │   ├── incidents/     # Incident logs
│   │   ├── reports/       # SLA reports
│   │   └── alerts/        # Alert configuration
│   ├── dashboard/         # Dashboard page
│   ├── websites/          # Website management
│   └── layout.tsx         # Root layout
├── components/            # React components
└── lib/                   # Utility functions
    ├── prisma.ts          # Prisma client
    ├── monitor.ts         # Monitoring logic
    ├── html-utils.ts      # HTML processing
    ├── incident-handler.ts # Incident management
    └── alerts.ts          # Alert services
```

### Coding Standards

#### TypeScript

- Use TypeScript for all files
- Define interfaces for all data structures
- Avoid `any` type - use `unknown` if necessary
- Use explicit return types for functions
- Enable strict mode in tsconfig.json

```typescript
// Good
interface Website {
  id: string
  url: string
  name: string
}

function getWebsite(id: string): Promise<Website | null> {
  return prisma.website.findUnique({ where: { id } })
}

// Avoid
function getWebsite(id) {
  return prisma.website.findUnique({ where: { id } })
}
```

#### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript for props

```typescript
// Good
interface StatusCardProps {
  website: Website
  status: 'up' | 'down' | 'warning'
}

export default function StatusCard({ website, status }: StatusCardProps) {
  return (
    <div className="card">
      <h3>{website.name}</h3>
      <span className={`status-${status}`}>{status}</span>
    </div>
  )
}
```

#### API Routes

- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return appropriate status codes
- Include error handling
- Validate input with Zod or similar
- Document with JSDoc comments

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
})

/**
 * Creates a new website to monitor
 * @route POST /api/websites
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    const website = await prisma.website.create({ data })
    return NextResponse.json(website, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### Styling

- Use Tailwind CSS for styling
- Follow the existing design system
- Keep responsive design in mind
- Use consistent spacing and colors

```tsx
// Good
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
</div>

// Avoid inline styles
<div style={{ maxWidth: '1280px', margin: '0 auto' }}>
```

### Database Changes

#### Making Schema Changes

1. Update `prisma/schema.prisma`
2. Create a migration:
   ```bash
   npx prisma migrate dev --name descriptive-name
   ```
3. Test the migration locally
4. Commit both the schema and migration files

```prisma
// Example: Adding a new field
model Website {
  id          String   @id @default(cuid())
  url         String   @unique
  name        String
  description String?  // New field
  // ... other fields
}
```

### Testing

Currently, the project doesn't have automated tests, but we encourage:

- Manual testing of all changes
- Testing edge cases
- Testing error scenarios
- Cross-browser testing for UI changes

**Future:** We plan to add:
- Jest for unit tests
- React Testing Library for component tests
- Playwright for E2E tests

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(monitoring): add SSL certificate expiration check

Add endpoint to check SSL certificate expiration dates and alert
when certificates are expiring within 30 days.

Closes #123

fix(dashboard): correct uptime calculation

The uptime percentage was incorrectly calculated when there were
no checks in the last 24 hours. Now defaults to 0% instead of NaN.

docs(api): add examples for SLA report endpoint

refactor(alerts): extract email template to separate file
```

## Submitting Changes

### 1. Run Quality Checks

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

### 2. Commit Your Changes

```bash
git add .
git commit -m "feat(scope): description"
```

### 3. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 4. Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your feature branch
4. Fill out the PR template:
   - Description of changes
   - Related issues
   - Testing performed
   - Screenshots (if UI changes)

### 5. Address Review Comments

- Be responsive to feedback
- Make requested changes
- Push updates to the same branch
- Re-request review when ready

## What to Contribute

### High Priority

- 🐛 **Bug Fixes**: Check the [issues](https://github.com/josefresco/jf-website-monitor/issues) for bugs
- 📚 **Documentation**: Improve README, add examples, fix typos
- ♿ **Accessibility**: Improve keyboard navigation, screen reader support
- 🧪 **Tests**: Add unit, integration, or E2E tests

### Feature Ideas

- 🔐 **Authentication**: Add user accounts and multi-user support
- 📱 **Mobile App**: React Native app for monitoring on the go
- 🔔 **More Alert Channels**: Slack, Discord, PagerDuty, etc.
- 📊 **Advanced Analytics**: Trends, predictions, anomaly detection
- 🌍 **Status Pages**: Public status pages for monitored sites
- 🔍 **API Monitoring**: JSON validation, response time tracking
- 🔒 **SSL Monitoring**: Certificate expiration alerts
- 📈 **Performance Budgets**: Alert on response time thresholds

### Refactoring Opportunities

- Extract reusable UI components
- Improve error handling
- Add input validation
- Optimize database queries
- Improve loading states
- Add caching layer

## Code Review Process

1. **Automated Checks**: CI/CD runs linting and type checking
2. **Manual Review**: Maintainer reviews code quality and design
3. **Testing**: Changes are tested in staging environment
4. **Approval**: At least one maintainer approval required
5. **Merge**: Squash and merge to main branch

## Release Process

1. Version bump in package.json
2. Update CHANGELOG.md
3. Create GitHub release
4. Deploy to production
5. Announce in discussions

## Questions?

- 💬 Open a [Discussion](https://github.com/josefresco/jf-website-monitor/discussions)
- 🐛 File an [Issue](https://github.com/josefresco/jf-website-monitor/issues)
- 📧 Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to JF Monitor! 🎉
