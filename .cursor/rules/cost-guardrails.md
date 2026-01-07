# Cost Guardrails

These rules are **hard constraints** that all agents MUST follow. Low cost is non-negotiable.

## Lambda Constraints

- Memory: **≤256MB** unless explicitly justified
- Timeout: **≤5 seconds**
- No VPC attachment (adds latency and cost)

## Execution Constraints

- **No unbounded loops or retries**
- Broker fetches must **fail fast**
- Maximum retry attempts: 1 (with exponential backoff)
- Per-broker timeout: enforced independently

## Rate Limiting

- Rate limiting MUST be enabled at API Gateway or WAF
- Per-IP rate limits to prevent abuse
- No unlimited request handling

## Resource Limits

- CloudWatch log retention: minimum viable period
- No long-running background processes
- No scheduled jobs or cron-like behavior

## Cost Targets

- Monthly operating cost: **≤$25/month** at expected usage
- No unbounded scaling without explicit limits
- WAF rules for abuse prevention

## Forbidden Patterns

- Infinite loops
- Recursive retries without limits
- Unbounded parallel requests
- Heavy dependencies (e.g., Puppeteer, Playwright)

## Agent Behavior

Agents MUST flag any code that risks runaway costs, including:
- Loops without exit conditions
- Retry logic without maximum attempts
- Resource-intensive operations
- Missing timeout enforcement

