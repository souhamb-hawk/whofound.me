# Architecture Rules

These rules are **hard constraints** that all agents MUST follow. Violations must be refused.

## Region Constraints

- All backend compute MUST run only in `eu-west-1` (Ireland)
- Allowed global exceptions:
  - CloudFront (global edge network)
  - ACM certificate in `us-east-1` (CloudFront requirement only)
- Any proposal to deploy compute in another region MUST be rejected

## Frontend Constraints

- Frontend MUST be built using **Astro** in **static-first mode**
- Output MUST be static HTML, CSS, and JS assets only
- Astro server features (SSR, API routes, adapters) are **FORBIDDEN**
- No dynamic server-side rendering
- Interactive elements use explicit hydration islands only (`client:load`, `client:idle`)

## Backend Constraints

- Backend runs on AWS Lambda (Node.js 20) + API Gateway HTTP API
- Lambda memory: ≤256MB
- Lambda timeout: ≤5 seconds
- No VPC attachment (avoid cold start + cost)

## Persistence Constraints

- **No databases of any kind**: RDS, DynamoDB, S3 writes, etc.
- **No persistent storage** or caching beyond in-memory execution
- All processing is stateless and in-memory only
- Request data is discarded immediately after response

## Forbidden Technologies

- No headless browsers (Puppeteer, Playwright, Selenium)
- No background jobs, queues, or schedulers
- No third-party backend services outside AWS
- No WebSockets or long-lived connections

## Agent Behavior

Agents MUST reject any suggestion that introduces:
- State or persistence
- SSR or server-side Astro features
- Non-AWS services
- Compute outside eu-west-1

