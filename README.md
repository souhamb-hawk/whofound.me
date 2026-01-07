# whofound.me

A free, privacy-first web tool that shows you where your personal data is publicly listed on data broker websites.

## Features

- **Privacy First**: No accounts, no tracking, no cookies, no data storage
- **5 Major Brokers**: Checks Whitepages, Spokeo, MyLife, BeenVerified, PeopleFinder
- **Instant Results**: See your exposure in seconds
- **Opt-Out Links**: Direct links to remove your data from each broker

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│   S3 (Static)   │     │   Data Brokers  │
│   (CDN + WAF)   │     │   Astro Build   │     │   (5 sites)     │
└────────┬────────┘     └─────────────────┘     └────────▲────────┘
         │                                               │
         │ /api/*                                        │
         ▼                                               │
┌─────────────────┐     ┌─────────────────┐             │
│   API Gateway   │────▶│     Lambda      │─────────────┘
│   (HTTP API)    │     │   (Node.js 20)  │
└─────────────────┘     └─────────────────┘
```

All infrastructure runs in **eu-west-1** (Ireland) for GDPR-friendly data residency.

## Tech Stack

- **Frontend**: Astro (static output)
- **Backend**: AWS Lambda + API Gateway
- **Infrastructure**: AWS CDK (TypeScript)
- **Testing**: Vitest (97%+ coverage)

## Project Structure

```
whofound.me/
├── .cursor/rules/     # Agent governance rules
├── backend/           # Lambda handlers & broker parsers
├── frontend/          # Astro static site
├── infra/             # AWS CDK stacks
├── .github/           # CI/CD workflows
└── brokers.registry.json
```

## Development

### Prerequisites

- Node.js 20+
- AWS CLI (configured)
- AWS CDK CLI

### Setup

```bash
# Install all dependencies
npm install --workspaces

# Run backend tests
cd backend && npm test

# Build frontend
cd frontend && npm run build

# Preview frontend locally
cd frontend && npm run preview
```

### Running Tests

```bash
# Backend tests with coverage (must be ≥90%)
cd backend && npm run test:coverage

# Frontend type check
cd frontend && npm run typecheck
```

### Deployment

```bash
# Deploy infrastructure
cd infra && npx cdk deploy --all

# Or use GitHub Actions (automatic on push to main)
```

## Privacy Guarantees

- **No data storage**: All processing is in-memory, discarded after response
- **No logging**: Request bodies and personal data are never logged
- **No tracking**: No analytics, cookies, or fingerprinting
- **No third-party scripts**: Entire frontend is self-contained
- **Verifiable**: Open source, inspect the code yourself

## Legal

This tool is for informational purposes only. See [Disclaimer](/disclaimer) for full terms.

A [HawkLogic Systems](https://hawklogicsystems.com) project.

## License

Proprietary. All rights reserved.

