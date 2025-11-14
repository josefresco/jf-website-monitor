# JF Monitor Documentation

Welcome to the JF Monitor documentation directory. This folder contains comprehensive guides for using, developing, and deploying the monitoring application.

## 📚 Documentation Index

### For Users

- **[Main README](../README.md)** - Start here! Overview, features, and quick start guide
- **[Setup Guide](../SETUP.md)** - Step-by-step setup instructions
- **[Deployment Guide](../DEPLOYMENT-FINAL.md)** - Production deployment walkthrough
- **[API Documentation](./API.md)** - Complete API reference with examples

### For Developers

- **[Architecture](./ARCHITECTURE.md)** - Technical architecture and design decisions
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to the project
- **[Changelog](../CHANGELOG.md)** - Version history and release notes

### Configuration

- **[Environment Variables](../.env.example)** - All available configuration options
- **[Database Schema](../prisma/schema.prisma)** - Prisma database schema
- **[Vercel Configuration](../vercel.json)** - Deployment configuration

## 🚀 Quick Links

### Live Application
- **Production**: https://jf-monitor-n2hfx3m17-josiah-coles-projects.vercel.app
- **Dashboard**: https://jf-monitor-n2hfx3m17-josiah-coles-projects.vercel.app/dashboard
- **Websites**: https://jf-monitor-n2hfx3m17-josiah-coles-projects.vercel.app/websites
- **Settings**: https://jf-monitor-n2hfx3m17-josiah-coles-projects.vercel.app/settings

### Development Resources
- **GitHub Repository**: https://github.com/josefresco/jf-website-monitor
- **Vercel Project**: https://vercel.com/josiah-coles-projects/jf-monitor
- **Issues**: https://github.com/josefresco/jf-website-monitor/issues
- **Discussions**: https://github.com/josefresco/jf-website-monitor/discussions

## 📖 Getting Started

### New Users

1. Read the [Main README](../README.md) for an overview
2. Follow the [Setup Guide](../SETUP.md) to get started
3. Check out the [API Documentation](./API.md) for integration

### Developers

1. Read the [Contributing Guide](./CONTRIBUTING.md)
2. Review the [Architecture](./ARCHITECTURE.md)
3. Set up your development environment
4. Submit a pull request!

## 📝 API Endpoints

Complete API reference available in [API.md](./API.md)

**Quick Reference:**
- `POST /api/monitor/check` - Trigger monitoring
- `GET /api/websites` - List websites
- `POST /api/websites` - Add website
- `GET /api/checks` - Check history
- `GET /api/incidents` - Incident logs
- `GET /api/reports/sla` - SLA metrics
- `GET /api/alerts/config` - Alert settings

## 🏗️ Architecture Overview

JF Monitor is built with:
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Serverless Functions
- **Database**: Vercel Postgres (Prisma ORM)
- **Hosting**: Vercel
- **Monitoring**: GitHub Actions (cron)

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🔧 Configuration

### Environment Variables

All configuration is done via environment variables. See [.env.example](../.env.example) for:
- Database connection
- API keys (Brevo, Telegram)
- Security secrets
- Application settings

### Alert Configuration

Configure alerts via the **Settings Page**:
1. Go to `/settings` in your application
2. Enable/disable email and Telegram alerts
3. Set recipient addresses
4. Configure alert preferences

## 🧪 Development

### Local Setup

```bash
# Clone repository
git clone https://github.com/josefresco/jf-website-monitor.git
cd jf-website-monitor

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Set up database
npx prisma db push

# Run development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open database GUI
npx prisma db push   # Sync schema to database
```

## 📊 Monitoring Flow

```
GitHub Actions (every 5 min)
    ↓
POST /api/monitor/check
    ↓
Check websites due for monitoring
    ↓
For each website:
  - Fetch content
  - Normalize HTML
  - Calculate hash
  - Compare changes
  - Record check
  - Detect incidents
    ↓
If incident detected:
  - Create incident record
  - Send alerts (email/Telegram)
    ↓
If recovered:
  - Resolve incident
  - Send recovery alert
```

## 🔐 Security

- Secret-based authentication for monitoring
- HTTPS enforced in production
- Environment variables for sensitive data
- SQL injection prevention via Prisma
- XSS protection via React

See [Architecture - Security](./ARCHITECTURE.md#security-considerations) for details.

## 🐛 Troubleshooting

Common issues and solutions:

### Database Connection Failed
- Check `DATABASE_URL` in environment variables
- Verify Vercel Postgres is connected to project
- Run `npx prisma db push` to sync schema

### Alerts Not Sending
- Verify API keys are correct in Settings page
- Check alert types are enabled
- Review Vercel function logs for errors

### Build Errors
```bash
rm -rf .next
npx prisma generate
npm run build
```

### More Help
See the [Main README - Troubleshooting](../README.md#troubleshooting) section.

## 📈 Performance

- Serverless functions auto-scale
- Database connection pooling (automatic)
- Static pages cached at edge
- API responses compressed
- Images optimized by Next.js

## 🗺️ Roadmap

Planned features:
- Multi-user authentication
- API endpoint monitoring
- SSL certificate monitoring
- Public status pages
- Advanced analytics
- Mobile app
- Slack/Discord integrations

See [CHANGELOG.md](../CHANGELOG.md) for version history.

## 🤝 Contributing

We welcome contributions! Please:
1. Read the [Contributing Guide](./CONTRIBUTING.md)
2. Fork the repository
3. Create a feature branch
4. Submit a pull request

## 📄 License

MIT License - See [LICENSE](../LICENSE) for details.

## 💬 Support

- **Issues**: https://github.com/josefresco/jf-website-monitor/issues
- **Discussions**: https://github.com/josefresco/jf-website-monitor/discussions
- **Email**: Contact maintainers

---

**Built with ❤️ using Next.js, TypeScript, and Prisma**

Last Updated: November 13, 2025
