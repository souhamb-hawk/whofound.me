# Privacy Rules

These rules are **hard constraints** that all agents MUST follow. Privacy is non-negotiable.

## Logging Constraints

- **No logging of request bodies** or personal inputs
- **No logging of query parameters** containing user data
- **No logging of IP addresses** or User-Agent strings
- **No correlation IDs** tied to user identity
- Allowed logging: anonymous invocation counts, aggregate error counts only

## Frontend Privacy

- **No analytics, tracking pixels, or beacons**
- **No cookies** (first-party or third-party)
- **No localStorage, sessionStorage, IndexedDB, or Cache APIs**
- **No third-party scripts** (including fonts, CDNs, widgets)
- **No fingerprinting vectors** (canvas, audio, WebGL, font probing)
- All external links open in a new tab with no referrer tracking

## Backend Privacy

- All processing is **stateless** and **in-memory only**
- **No request/response persistence** of any kind
- **No user identifiers** stored or derived
- User inputs may be hashed in-memory (SHA-256) only for request correlation
- Hashes MUST be discarded immediately after response

## Payment Privacy

- Payment flows occur entirely on provider-hosted pages
- whofound.me never sees card data, billing details, email addresses, or payment identifiers
- No webhooks that persist payment data
- No analytics tied to payments

## Debug Logging

Agents MUST flag any code that could indirectly log or leak personal data, including:
- Debug logs that print request objects
- Error handlers that include stack traces with user data
- Console.log statements in production code

## Verification

All privacy guarantees must be verifiable by users:
- Static site source inspection
- Network tab inspection (no third-party calls)
- Open-source backend code

