# Scope Rules

These rules are **hard constraints** that all agents MUST follow. Scope creep is forbidden.

## Product Scope

whofound.me provides **visibility only**. It shows users where their personal data is publicly listed on data broker websites.

## Explicit Non-Goals

The system MUST NOT:

### User Management
- Create user accounts
- Implement authentication
- Store user profiles
- Track user sessions

### Data Operations
- Perform automated opt-outs or removals
- Contact data brokers on behalf of users
- Scrape behind authentication or paywalls
- Circumvent bot protection or rate limits

### Communications
- Send emails, notifications, or alerts
- Create mailing lists
- Implement push notifications

### Tracking
- Track users via analytics, cookies, or fingerprinting
- Store, log, or persist personal inputs
- Create user behavior profiles

### Scope Expansion
- Automated broker discovery
- OSINT, breach data, or social network integration
- Legal advice or guarantees
- Premium/paid features that gate functionality

## Broker Updates

- Broker list is manually maintained
- No runtime discovery, crawling, or dynamic enumeration
- Updates are versioned and auditable

## Agent Behavior

Agents MUST refuse any suggestion that:
- Expands scope beyond the PRD
- Introduces features implying non-goals
- Adds persistence, accounts, or tracking

Any feature implying these behaviors is out of scope and must be rejected.

