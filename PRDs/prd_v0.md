# whofound.me — Full Product Requirements & Engineering Specification

> **Status:** Authoritative, self-contained, no placeholders
> **Audience:** Cursor agents using Claude Opus 4.5
> **Scope:** End-to-end product, engineering, testing, infra, security, legal, and operational specification
> **Constraint:** Zero ambiguity. Correctness > speed. No silent assumptions.

---

## Table of Contents

1. Purpose & Vision
2. Explicit Non-Goals
3. Definitions & Terminology
4. Target Users & Use Cases
5. Product Principles (Non-Negotiable)
6. User Experience (Canonical Flows)
7. Functional Requirements
8. Broker Coverage & Integration Contracts
9. Data Models & Schemas
10. System Architecture (AWS)
11. Networking, Caching & Rate Limiting
12. Security & Privacy Requirements
13. Legal & Compliance Positioning
14. Error Handling & Edge Cases
15. Testing Strategy (Unit, Integration, E2E)
16. CI/CD & Environments
17. Observability (Strictly Limited)
18. Cost Controls & Abuse Prevention
19. Cursor Rules & Agent Governance
20. Milestones & Delivery Gates
21. Acceptance Criteria
22. Change Management

---

## 1. Purpose & Vision

**whofound.me** is a free, privacy-first web tool that allows individuals to discover **where their personal data is publicly listed online** across common data broker websites.

The product provides **visibility only**. It does not remove data, contact brokers, or store user information. It automates what a person could do manually using a browser, faster and with clarity.

Primary success metric: **users understand their exposure**.
Secondary success metric: **users voluntarily donate after receiving value**.

---

## 2. Explicit Non-Goals

The system MUST NOT:

* Create user accounts
* Store, log, or persist personal inputs
* Perform automated opt-outs or removals
* Scrape behind authentication or paywalls
* Circumvent bot protection or rate limits
* Provide legal advice or guarantees
* Send emails, notifications, or alerts
* Track users via analytics, cookies, or fingerprinting

Any feature implying these behaviors is out of scope and must be rejected by agents.

---

## 3. Definitions & Terminology

* **Data Broker:** A website that aggregates and republishes personal data sourced from public records and third parties.
* **Public Listing:** A page accessible without authentication showing personal information.
* **Exposure:** Presence of user-identifying data on a broker site.
* **Broker Integration:** Code responsible for querying and parsing one broker.
* **Stateless:** No persistence of request or response data beyond in-memory execution.

---

## 4. Target Users & Use Cases

### Primary Users

* US / EU residents
* Non-technical individuals
* Privacy-conscious users

### Secondary Users

* Journalists
* Security researchers
* Developers validating personal OSINT exposure

### Core Use Cases

* “Where is my data listed?”
* “Which sites expose my relatives / address?”
* “Is it worth paying for a removal service?”

---

## 5. Product Principles (Non-Negotiable)

1. **Privacy First:** Never store or log personal data.
2. **Transparency:** Clearly explain what is and is not done.
3. **Determinism:** Same input → same output (subject to broker changes).
4. **Graceful Failure:** Partial results are acceptable.
5. **Low Cost:** AWS serverless, minimal spend.

---

## 6. User Experience (Canonical Flows)

### 6.0 Global Design System & Interaction Model (Authoritative)

The entire site MUST follow a **modern, clean, trust-imbibing design pattern** that feels **native, fluid, and intentional** across:

* Desktop and mobile
* Touch and mouse input
* All major browsers (Chrome, Safari, Firefox, Edge)
* All common screen sizes and pixel densities

The design MUST feel:

* Calm
* Serious
* Human-crafted
* Non-experimental
* Non-marketing-driven

This is a **privacy-sensitive utility**, not a growth product.

---

### 6.1 Design Pattern (Chosen & Locked)

The design pattern for whofound.me is:

> **Minimal Utility Interface with Subtle Motion**

Characteristics:

* Clear hierarchy
* Generous whitespace
* Strong typographic structure
* Neutral color palette
* Motion used only to reinforce understanding

Explicitly avoided:

* Card overload
* Neon colors
* Gamification
* “Startup landing page” tropes
* Over-animated transitions

---

### 6.2 Layout System

* Responsive, mobile-first layout
* Single-column flow on mobile
* Constrained-width content on desktop
* Consistent margins and rhythm

Breakpoints MUST adapt content naturally without hiding information.

---

### 6.3 Typography

Requirements:

* System-first or privacy-respecting fonts (no Google Fonts)
* Clear distinction between headings, body, and meta text
* Comfortable line height for reading

Typography must communicate **clarity and seriousness**, not personality.

---

### 6.4 Color & Visual Language

* Neutral base (light or dark, but consistent)
* High contrast for accessibility
* Color used sparingly for:

  * Status (found / not found)
  * Warnings
  * Links

No gradients or decorative color blocks unless functionally justified.

---

### 6.5 Motion & Animation (Purpose-Driven Only)

Animations MUST:

* Be subtle
* Be fast
* Have clear purpose

Allowed uses:

* Loading state transitions
* Revealing results progressively
* Focus and hover feedback

Forbidden:

* Infinite animations
* Attention-grabbing motion
* Parallax or gimmicks

Motion should reinforce:

* “Something is happening”
* “This is safe and controlled”

---

### 6.6 Interaction & Feedback

* Clear affordances
* Immediate feedback on input
* Deterministic responses
* No surprise state changes

Errors MUST be:

* Human-readable
* Calmly phrased
* Non-alarming

---

### 6.7 Accessibility (Non-Negotiable)

The site MUST:

* Meet WCAG 2.1 AA standards
* Be keyboard navigable
* Support screen readers
* Respect reduced-motion preferences

Animations MUST:

* Disable or simplify when `prefers-reduced-motion` is enabled

---

### 6.8 Cross-Browser & Device Compatibility

The frontend MUST be tested on:

* Chrome (latest)
* Safari (desktop + iOS)
* Firefox
* Edge

The experience MUST:

* Feel equally usable on touch and mouse
* Avoid hover-only interactions
* Avoid browser-specific hacks

---

### 6.9 Implementation Guidance (Astro-Compatible)

* Layout and structure in `.astro` components
* Interactive pieces isolated as hydrated islands
* Animations implemented via CSS or lightweight JS only
* No heavy animation libraries

Fluidity should come from **good layout and timing**, not visual excess.

---

### 6.10 Design Consistency Enforcement

All new UI changes MUST:

* Match the established design pattern
* Include visual review in PRs
* Be rejected if they introduce visual noise or inconsistency

Design consistency is a **functional requirement**, not a cosmetic one.

---

### 6.0 Privacy Assurances in UI (Authoritative, User-Facing)

The UI MUST explicitly surface privacy guarantees to users, including highly privacy-conscious (“paranoid”) users, in a **clear, inspectable, and non-marketing manner**.

Privacy assurances MUST NOT be hidden only in legal pages. They must be visible **in-context**, near user interaction points.

---

### 6.1 Landing Page (Before Input)

The landing page MUST include a visible, plain-language privacy block above or immediately below the input form.

Required content (verbatim or near-verbatim):

* “No accounts. No tracking. No cookies.”
* “Your input is never stored or logged.”
* “All checks run on-demand and disappear after the page loads.”

Optional but recommended:

* “You can verify this in your browser’s Network tab.”

This block MUST:

* Be visible without scrolling on standard desktop screens
* Use neutral, factual language (no marketing tone)

---

### 6.2 During Processing (Loading State)

While checks are running, the UI MUST display a lightweight reassurance message such as:

* “Checking public listings… nothing is being saved.”

This message MUST:

* Be informational, not animated or distracting
* Reinforce statelessness during execution

---

### 6.3 Results Page (After Value Delivery)

After results are shown, the UI MUST include a dedicated **Privacy & Trust** section.

Required bullets:

* “We did not store your name or search.”
* “We did not create a profile about you.”
* “We did not contact any data broker.”
* “Refreshing this page erases the results.”

Optional advanced note (collapsed / expandable):

* “No analytics, no logs, no identifiers. Source code available for inspection.”

---

### 6.4 Visual & Interaction Constraints

UI design MUST:

* Avoid dark patterns
* Avoid countdowns, progress bars tied to identity, or urgency cues
* Avoid modal dialogs that trap focus
* Avoid language implying surveillance, monitoring, or protection

The UI MUST feel:

* Calm
* Transparent
* Non-coercive

---

### 6.5 Verification Aids (Paranoid-Friendly)

The UI MAY include a small, optional link labeled:

> “How we protect your privacy”

This link SHOULD:

* Explain guarantees in technical but readable terms
* Encourage users to inspect DevTools / Network tab
* Link to the privacy section of the repository

---

### 6.6 Donation UI Placement Constraint (Privacy-Sensitive)

Donation prompts MUST:

* Appear only **after** results are shown
* Be visually separated from privacy assurances
* Never imply payment improves privacy, coverage, or results

Any UI suggesting a relationship between payment and privacy guarantees MUST be rejected.

---

### 6.7 SEO, Discoverability & AI-Agent Indexing (New)

The UI and frontend output MUST be optimized for **human search engines and AI-based discovery agents** (e.g. Google, Bing, DuckDuckGo, Perplexity, ChatGPT browsing, and similar systems).

#### 6.7.1 Technical SEO (Mandatory)

* All pages MUST render as **static HTML** with meaningful content (no JS-only rendering of critical text)

* Each page MUST include:

  * `<title>` tag with concise, human-readable phrasing
  * `<meta name="description">` written for humans, not keyword stuffing
  * Canonical URL tags

* Robots configuration:

  * `robots.txt` MUST explicitly allow indexing
  * No blanket `noindex` or `nofollow`

* Sitemap:

  * `sitemap.xml` MUST be generated and submitted
  * Include all public pages (home, results template, disclaimer, privacy)

---

#### 6.7.2 Structured Data & Rich Results

* Pages SHOULD include **Schema.org structured data** where appropriate:

  * `WebSite`
  * `WebPage`
  * `SoftwareApplication` (for the tool itself)

* Structured data MUST:

  * Be valid JSON-LD
  * Describe the tool accurately (free, informational, no accounts)
  * Avoid spammy or misleading claims

* The site MUST expose a **favicon and web app icon** so that search listings and AI tools display a proper web icon.

Preferred formats:

* SVG (primary)
* PNG fallback (multiple sizes)

---

#### 6.7.3 AI-Agent Discoverability

Content MUST be written so that AI agents can:

* Clearly understand what the tool does
* Clearly understand what the tool does NOT do
* Quote or summarize the site without hallucination

Requirements:

* Plain-language explanations
* Explicit non-goals
* No exaggerated claims
* No keyword stuffing or SEO spam

Optional but recommended:

* A short “What this tool does / does not do” section in visible HTML

---

#### 6.7.4 Visual Language & Aesthetic Constraints

To avoid "AI slop" and maintain a human-crafted feel:

* Prefer **SVG icons** over emojis
* Icons MUST be simple, restrained, and functional
* Avoid overuse of icons or decorative graphics
* Typography MUST be clean and readable
* Layout MUST feel intentional and minimal

Emojis MAY be used sparingly in informal sections (e.g. FAQs), but SVG icons are preferred everywhere else.

---

### 6.0 Privacy Assurances in UI (Authoritative, User-Facing)

The UI MUST explicitly surface privacy guarantees to users, including highly privacy-conscious (“paranoid”) users, in a **clear, inspectable, and non-marketing manner**.

Privacy assurances MUST NOT be hidden only in legal pages. They must be visible **in-context**, near user interaction points.

---

### 6.1 Landing Page (Before Input)

The landing page MUST include a visible, plain-language privacy block above or immediately below the input form.

Required content (verbatim or near-verbatim):

* “No accounts. No tracking. No cookies.”
* “Your input is never stored or logged.”
* “All checks run on-demand and disappear after the page loads.”

Optional but recommended:

* “You can verify this in your browser’s Network tab.”

This block MUST:

* Be visible without scrolling on standard desktop screens
* Use neutral, factual language (no marketing tone)

---

### 6.2 During Processing (Loading State)

While checks are running, the UI MUST display a lightweight reassurance message such as:

* “Checking public listings… nothing is being saved.”

This message MUST:

* Be informational, not animated or distracting
* Reinforce statelessness during execution

---

### 6.3 Results Page (After Value Delivery)

After results are shown, the UI MUST include a dedicated **Privacy & Trust** section.

Required bullets:

* “We did not store your name or search.”
* “We did not create a profile about you.”
* “We did not contact any data broker.”
* “Refreshing this page erases the results.”

Optional advanced note (collapsed / expandable):

* “No analytics, no logs, no identifiers. Source code available for inspection.”

---

### 6.4 Visual & Interaction Constraints

UI design MUST:

* Avoid dark patterns
* Avoid countdowns, progress bars tied to identity, or urgency cues
* Avoid modal dialogs that trap focus
* Avoid language implying surveillance, monitoring, or protection

The UI MUST feel:

* Calm
* Transparent
* Non-coercive

---

### 6.5 Verification Aids (Paranoid-Friendly)

The UI MAY include a small, optional link labeled:

> “How we protect your privacy”

This link SHOULD:

* Explain guarantees in technical but readable terms
* Encourage users to inspect DevTools / Network tab
* Link to the privacy section of the repository

---

### 6.6 Donation UI Placement Constraint (Privacy-Sensitive)

Donation prompts MUST:

* Appear only **after** results are shown
* Be visually separated from privacy assurances
* Never imply payment improves privacy, coverage, or results

Any UI suggesting a relationship between payment and privacy guarantees MUST be rejected.

---

### 6.0 Global Layout & Astro Constraints (New)

All UI pages MUST be implemented as Astro pages.

Rules:

* Static layout components (header, footer, legal copy) MUST be `.astro`
* Interactive elements (form submission, results rendering) MUST be isolated hydrated components
* Hydration directives must be explicit (e.g. `client:load`, `client:idle`)
* No global hydration is permitted

This ensures minimal JavaScript execution and maximum privacy.

---

### 6.1 Global Footer (Authoritative)

Every page of the application (landing page, results page, error states, legal pages) MUST include a persistent footer.

Footer requirements:

* Text: **“A HawkLogic Systems project”**
* The text MUST link to **[https://hawklogicsystems.com](https://hawklogicsystems.com)**
* Link opens in a new tab
* No tracking parameters or referral tags
* Footer must be visible without scrolling on standard desktop viewports

The footer MUST NOT:

* Contain advertisements
* Contain affiliate links
* Contain analytics or tracking scripts

This footer requirement is mandatory and non-optional.

---

### 6.0 Global Footer (Authoritative)

Every page of the application (landing page, results page, error states, legal pages) MUST include a persistent footer.

Footer requirements:

* Text: **“A HawkLogic Systems project”**
* The text MUST link to **[https://hawklogicsystems.com](https://hawklogicsystems.com)**
* Link opens in a new tab
* No tracking parameters or referral tags
* Footer must be visible without scrolling on standard desktop viewports

The footer MUST NOT:

* Contain advertisements
* Contain affiliate links
* Contain analytics or tracking scripts

This footer requirement is mandatory and non-optional.

---

### 6.1 Landing Page

* Explains purpose in plain language
* States non-goals clearly
* Input form

### 6.2 Input Form

Required:

* Full name (string, min 2 tokens)

Optional:

* City
* State / Country

Client-side validation only. No server validation errors should echo inputs.

### 6.3 Results Page

For each broker:

* Broker name
* Found / Not found
* Categories of exposed data
* Link to public listing (if available)
* Risk indicator

Also includes:

* Explanation section
* Manual opt-out links
* Donation CTA (post-results)

---

## 7. Functional Requirements

### 7.1 Request Lifecycle

1. Receive request
2. Normalize inputs
3. Dispatch broker queries (sequential, not parallel in MVP)
4. Parse results
5. Aggregate
6. Return response

### 7.2 Input Normalization

* Trim whitespace
* Collapse multiple spaces
* Case-insensitive matching

### 7.3 Output Requirements

* JSON response must conform to schema
* UI must never render raw HTML from brokers

---

## 8. Broker Coverage & Integration Contracts

### 8.0 Broker Registry Governance (New)

The system **explicitly supports periodic manual updates** to the data broker list. Broker discovery is **not automated** and must never be automated.

A human-maintained **Broker Registry** is the single source of truth for which brokers are checked.

Manual updates are:

* **Expected** (brokers appear, disappear, merge, or change behavior)
* **Versioned** (changes are explicit and auditable)
* **Non-breaking** (registry changes must not affect historical logic)

The registry is stored in-repo as a versioned configuration file (e.g. `brokers.registry.json`).

No runtime discovery, crawling, or dynamic enumeration of brokers is permitted.

---

### 8.1 MVP Brokers (Initial Baseline)

The following brokers constitute the **initial baseline** for MVP launch:

1. Whitepages
2. Spokeo
3. MyLife
4. BeenVerified
5. PeopleFinder

This list is **not fixed permanently**. It is expected to evolve via manual updates as defined in §8.3.

### 8.2 Integration Contract

Each broker integration MUST adhere to a strict contract and remain independent of the registry update lifecycle.

Each broker module MUST expose:

```ts
search(input: NormalizedInput): Promise<BrokerResult>
```

Rules:

* No shared state between brokers
* Failure must not throw uncaught exceptions
* Timeouts must be enforced per broker
* Registry changes must never require touching unrelated broker code

---

Each broker module MUST expose:

```ts
search(input: NormalizedInput): Promise<BrokerResult>
```

Rules:

* No shared state between brokers
* Failure must not throw uncaught exceptions
* Timeouts must be enforced per broker

### 8.3 Manual Broker Update Process (Authoritative)

Manual updates to the broker list MUST follow this exact process:

1. **Identification (Human)**

   * Broker is identified via privacy research, regulatory reports, or reputable community discussion.
   * Broker must publish personal profiles publicly and allow name-based search.

2. **Eligibility Verification**
   A broker may be added ONLY IF:

   * Profiles are accessible without authentication
   * Search is possible via URL or HTML form
   * Robots.txt does not explicitly forbid search page access
   * No paywall or CAPTCHA blocks normal access

3. **Registry Update**

   * Add broker metadata to `brokers.registry.json`
   * Fields include:

```json
{
  "id": "string",
  "name": "string",
  "regionsSupported": ["US", "EU"],
  "searchType": "html",
  "status": "active",
  "introducedAt": "ISO8601",
  "notes": "optional"
}
```

4. **Parser Implementation**

   * Create isolated parser module
   * Add HTML fixtures
   * Write unit tests

5. **Validation Gate**

   * Unit tests ≥90% coverage
   * Integration test added
   * No existing broker behavior changes

6. **Release**

   * Registry version incremented
   * Changelog entry added

### 8.4 Broker Deprecation & Pausing

Brokers may be marked as:

* `paused` — temporarily disabled due to layout or access issues
* `deprecated` — permanently removed from active checks

Deprecation rules:

* Code is retained
* UI explains limitation
* No silent removals

---

## 9. Data Models & Schemas

### 9.1 NormalizedInput

```ts
{
  fullName: string
  city?: string
  region?: string
}
```

### 9.2 BrokerResult

```ts
{
  brokerId: string
  brokerName: string
  found: boolean
  exposedFields: string[]
  publicUrl?: string
  riskLevel: "low" | "medium" | "high"
  notes?: string
}
```

### 9.3 ExposureReport

```ts
{
  queryHash: string
  timestamp: string
  results: BrokerResult[]
}
```

---

## 10. System Architecture (AWS)

### 10.0 AWS Region (Authoritative)

All backend infrastructure for **whofound.me** MUST be deployed in **`eu-west-1` (Ireland)**.

Rationale:

* GDPR-friendly jurisdiction
* Lower latency for EU users
* Clear data residency posture

No backend compute, logging, or request handling may run outside `eu-west-1`, except where explicitly required by AWS global services (see below).

**Allowed global exceptions (explicit):**

* CloudFront (global edge network)
* ACM certificate provisioning in `us-east-1` (CloudFront requirement only)

Any proposal to deploy compute in another region MUST be rejected.

---

### 10.1 Frontend

### 10.1.0 Frontend Framework (Authoritative)

The frontend MUST be built using **Astro** in **static-first mode**.

Astro is approved specifically because:

* It ships zero JavaScript by default
* It supports explicit, minimal hydration
* It aligns with privacy, cost, and security goals

Astro MUST be used ONLY for:

* Static page generation
* Presentation logic
* Explicit client-side interactivity (hydrated islands)

Astro MUST NOT be used for:

* Server-side rendering (SSR)
* API routes
* Backend logic
* Data fetching from brokers

---

Frontend requirements:

* Output MUST be static HTML, CSS, and JS assets

* Assets hosted on S3 and served via CloudFront

* No cookies, analytics, or telemetry

* HawkLogic Systems footer required on every page

* S3 static hosting

* CloudFront CDN

* HTTPS only

### 10.2 Backend

* AWS Lambda (Node.js 20)
* API Gateway (HTTP API)
* **Region: eu-west-1 only**
* No VPC (avoid cold start + cost)

All Lambda functions, API Gateway stages, and supporting AWS resources MUST be created in `eu-west-1`.

* AWS Lambda (Node.js 20)
* API Gateway HTTP API
* No VPC

### 10.3 Domain

* Domain: `whofound.me`

* Managed via Route53

* ACM certificate:

  * Issued in `us-east-1` (CloudFront requirement)
  * Used only for TLS termination at the edge

* CloudFront distribution:

  * Origin: S3 (frontend) and API Gateway (backend)
  * Backend origin region: **eu-west-1 only**

* whofound.me managed in Route53

* ACM cert in us-east-1

---

## 11. Networking, Caching & Rate Limiting

* Broker fetches cached via CloudFront where possible
* API Gateway rate limits per IP
* WAF rules for abuse

---

## 12. Security & Privacy Requirements

### 12.0 Privacy Posture (Authoritative)

**whofound.me** is designed to be safe even for **highly privacy-conscious / paranoid users**.

The system assumes users may:

* Be using Tor / VPNs
* Be security professionals
* Actively inspect network requests
* Read source code
* Assume worst-case threat models

All privacy guarantees below are **intentional, explicit, and verifiable**.

---

### 12.1 Frontend Privacy Guarantees

The frontend MUST:

* Serve **static HTML/CSS/JS only** (Astro build output)
* Contain **no analytics, trackers, beacons, pixels, or session replay tools**
* Set **no cookies** (first-party or third-party)
* Use **no localStorage, sessionStorage, IndexedDB, or Cache APIs**
* Load **no third-party scripts** (including fonts, CDNs, widgets)
* Avoid fingerprinting vectors (canvas, audio, WebGL, font probing)

Additional requirements:

* All external links (including payments) open in a new tab
* CSP headers must block inline scripts and external domains by default
* Source maps MAY be published to allow user inspection

---

### 12.2 Backend Privacy Guarantees

The backend MUST:

* Be fully **stateless**
* Process requests **in-memory only**
* Perform no persistence of any kind

Explicit prohibitions:

* No databases (DynamoDB, RDS, S3 writes, etc.)
* No request body logging
* No query parameter logging
* No IP address storage
* No User-Agent storage
* No correlation IDs tied to user identity

Allowed:

* Anonymous invocation counts
* Aggregate error counts

---

### 12.3 Logging & Observability Constraints

Logging rules:

* Logs may include high-level operational messages only
* Logs MUST NOT include:

  * Names
  * Locations
  * Inputs
  * URLs queried
  * Broker result details

CloudWatch log retention MUST be set to the minimum viable period.

---

### 12.4 Network-Level Privacy

* TLS enforced end-to-end
* No mixed content
* No WebSockets
* No long-lived connections
* No background polling

API Gateway and Lambda must not add identifying headers beyond what AWS requires.

---

### 12.5 Cryptographic Handling

* User inputs may be **hashed in-memory (SHA-256)** only to generate a request correlation token
* Hashes MUST NOT be stored, logged, or reused
* Hashes MUST be discarded immediately after response

---

### 12.6 Payment Privacy Boundary

* Payment flows occur entirely on provider-hosted pages
* whofound.me never sees:

  * Card data
  * Billing details
  * Email addresses
  * Payment identifiers

Payments are cryptographically and operationally isolated from application logic.

---

### 12.7 User-Verifiable Guarantees

The following MUST be verifiable by users:

* Static site source inspection
* Network tab inspection (no third-party calls)
* Open-source backend code
* Clear privacy statements on-site

No privacy guarantee may rely solely on trust or policy language.

---

### 12.8 Explicit Threat Model Statement

whofound.me is designed so that even if:

* Logs are subpoenaed
* Infrastructure is compromised
* Traffic metadata is inspected

The system **cannot reconstruct user search history or identities**.

---

* No request bodies in logs
* No third-party scripts
* Strict CSP headers
* SHA-256 hash of query used only in-memory

---

## 13. Legal & Compliance Positioning

### 13.0 Bulletproof Disclaimer Page (Authoritative)

The application MUST include a dedicated, explicitly accessible **Disclaimer page** (e.g. `/disclaimer`) linked from the global footer.

This page is mandatory and non-optional.

The purpose of the Disclaimer page is to clearly establish that:

* whofound.me provides **informational visibility only**
* Users are **solely responsible** for how they interpret, use, or act upon the information
* HawkLogic Systems and whofound.me disclaim liability to the maximum extent permitted by law

---

### 13.1 Disclaimer Page — Required Structure

The Disclaimer page MUST contain the following sections, in plain, unambiguous language.

#### 1. Informational Use Only

* whofound.me provides information for **general informational and educational purposes only**.
* The tool does **not provide legal, financial, investigative, or professional advice**.
* Information shown may be incomplete, outdated, inaccurate, or misleading.

#### 2. No Guarantees or Warranties

* whofound.me makes **no representations or warranties** regarding accuracy, completeness, or correctness of results.
* Presence or absence of information does **not imply truth, endorsement, or verification**.
* Data broker content is controlled entirely by third parties.

#### 3. User Responsibility (Critical)

* By accessing or using whofound.me, the user acknowledges that **they are solely responsible** for any actions taken based on the information provided.

* This includes, but is not limited to:

  * Contacting data brokers
  * Submitting opt-out or removal requests
  * Sharing, publishing, or acting on results
  * Making personal, professional, or legal decisions

* HawkLogic Systems and whofound.me bear **no responsibility or liability**, directly or indirectly, for user actions.

#### 4. No Affiliation or Endorsement

* whofound.me is **not affiliated with, endorsed by, or partnered with** any data broker, third-party website, or service referenced.
* Links are provided solely for user convenience.

#### 5. Limitation of Liability

* To the maximum extent permitted by applicable law, HawkLogic Systems and whofound.me **shall not be liable** for:

  * Direct or indirect damages
  * Loss of data, privacy, reputation, or opportunity
  * Consequences arising from use or inability to use the site

* This limitation applies regardless of theory of liability (contract, tort, negligence, strict liability, or otherwise).

#### 6. Assumption of Risk

* The user assumes **all risks** associated with using whofound.me.
* Visiting the site itself constitutes acceptance of this risk.

#### 7. Jurisdiction & Governing Law

* Governing law: **India**
* Jurisdiction: **Bangalore, Karnataka, India**

---

### 13.2 UI & Accessibility Requirements

* The Disclaimer page MUST be:

  * Linked from the global footer
  * Accessible without authentication
  * Rendered as static Astro content

* Users MUST NOT be required to explicitly accept the disclaimer to use the tool (no click-through), but continued use constitutes acceptance.

---

### 13.3 Cursor Rule Implications

Cursor rules MUST forbid:

* Removal or softening of disclaimer language
* Moving disclaimers exclusively to external documents
* Introducing contradictory marketing language elsewhere in the UI

Any agent attempting to weaken or bypass the disclaimer MUST stop and request explicit approval.

---

### 13.4 Consistency Requirement

All other copy (landing page, results page, FAQ, donation copy) MUST be consistent with the Disclaimer page and MUST NOT contradict it.

---

### 13.5 Mandatory Footer Link

The global footer MUST include a clear link labeled **“Disclaimer”** pointing to the Disclaimer page.

---

### 13.1 Ownership & Attribution

whofound.me is operated as an independent, free public tool and is **explicitly attributed** as a project by **HawkLogic Systems**.

Attribution rules:

* HawkLogic Systems attribution MUST appear in the global footer on every page
* Attribution MUST link to [https://hawklogicsystems.com](https://hawklogicsystems.com)
* Attribution MUST NOT imply endorsement, data sharing, or operational dependency

### 13.2 Mandatory Disclaimers

Mandatory disclaimers:

* Informational purpose only
* Public data only
* No guarantees
* No affiliation with brokers

Mandatory disclaimers:

* Informational only
* Public data only
* No guarantees
* No affiliation with brokers

---

## 14. Error Handling & Edge Cases

### 14.1 Broker Changes HTML

* Parser returns `found=false`
* Notes indicate parsing failure

### 14.2 Partial Matches

* Flag as low confidence

### 14.3 Rate Limited by Broker

* Treat as temporary failure
* Do not retry

### 14.4 Identical Names

* Warn user about ambiguity

### 14.5 International Users

* Some brokers US-only → explain limitation

---

## 15. Testing Strategy

### 15.1 Unit Tests

* Parser tests with HTML fixtures
* Edge cases for missing fields

### 15.2 Integration Tests

* Mock HTTP responses
* Full request → response validation

### 15.3 End-to-End Tests

* Deployed preview
* Mocked brokers only

Coverage requirement: ≥90% on parsing logic.

---

## 16. CI/CD & Environments

### 16.0 Git Branching & Development Workflow (Authoritative)

The repository MUST follow a strict, enforced branching and merge discipline.

#### Branch Structure

* `main` — stable, production-ready branch
* `dev` — integration branch for completed features
* `feature/*` — short-lived branches for individual features or changes

The `dev` branch MUST be created directly from `main` at project start.

---

### 16.1 Feature Development Rules

For **every feature, fix, or change**, the following rules apply.

#### Feature Branch Creation Threshold (New)

A new `feature/*` branch MUST be created **only if the agent reasonably expects the work to require at least 4 commits**.

* If a change can be completed in **1–3 small, clear commits**, it SHOULD be done directly as a short-lived change and merged via PR without creating an unnecessarily large feature branch.
* If the scope grows beyond 3 commits at any point, the agent MUST immediately:

  * Stop committing
  * Create a `feature/*` branch
  * Continue work there

This rule exists to:

* Avoid branch sprawl
* Encourage intentional scoping
* Keep the commit graph readable

---

#### Commit Discipline (Mandatory)

All commits MUST be:

* Small
* Focused on a single logical change
* Readable without external context

Commit rules:

* No commit should mix unrelated concerns
* No commit should exceed what can be reviewed in ~5 minutes
* Large diffs MUST be split across multiple commits

Commit messages MUST:

* Be descriptive
* Explain *what* changed and *why*
* Avoid generic messages (e.g. "fix", "update", "wip")

---

#### Branch Usage Summary

* `feature/*` branches are for **non-trivial work only** (≥4 commits)
* Trivial or surgical changes should remain compact
* Readability of history is a first-class requirement

---

1. Create a new branch from `dev`

   ```
   git checkout dev
   git checkout -b feature/<descriptive-name>
   ```

2. Implement the feature **incrementally**, with:

   * Unit tests
   * Integration tests
   * Documentation updates (if applicable)

3. No direct commits to `dev` or `main` are allowed.

For **every feature, fix, or change**:

1. Create a new branch from `dev`

   ```
   git checkout dev
   git checkout -b feature/<descriptive-name>
   ```

2. Implement the feature **incrementally**, with:

   * Unit tests
   * Integration tests
   * Documentation updates (if applicable)

3. No direct commits to `dev` or `main` are allowed.

---

### 16.2 Pull Request (PR) Requirements

Every feature branch MUST be merged via a Pull Request into `dev`.

Each PR MUST include:

* A clear summary of the feature
* Rationale (why the change exists)
* Before/after screenshots or diagrams ("visual PR")
* List of tests added or updated
* Confirmation that all CI checks pass

PRs without visual context or test descriptions MUST be rejected.

---

### 16.3 Merge Policy

* Feature branches merge **only into `dev`**
* `dev` MUST NOT be merged into `main` continuously

`dev → main` merges occur ONLY when one of the following is true:

* **Every 6 commits** have been merged into `dev`, OR
* **The project or milestone is complete**

Each `dev → main` merge MUST:

* Be performed via a PR
* Include a consolidated changelog
* Pass full CI (unit, integration, and E2E tests)

---

### 16.4 CI Enforcement

CI MUST enforce:

* No merge to `dev` without passing tests
* No merge to `main` except from `dev`
* No direct commits to `main`

Any automation or agent suggestion that bypasses this workflow MUST be rejected.

* GitHub Actions
* Dev / Staging / Prod
* Block deploy on test failure

---

## 17. Observability (Strictly Limited)

Allowed:

* Invocation counts
* Error counts

Disallowed:

* Request payload logging
* User identifiers

---

## 18. Cost Controls & Abuse Prevention

### 18.0 Payments Architecture (Provider-Agnostic Placeholder)

The payments / support-contribution mechanism for **whofound.me** MUST be treated as a **provider-agnostic integration point**.

At the PRD level, the payments architecture is intentionally left as a **placeholder**, to allow adaptation to different payment processors (e.g. Stripe, Skydo, or equivalent) without requiring architectural changes.

#### Authoritative Constraints (Non-Negotiable)

Regardless of provider, the following rules MUST hold:

* Payments are **optional, one-time support contributions only**
* No subscriptions or recurring billing
* No gated access or paywalls
* No backend payment processing logic
* No storage of payment events, customer data, or transaction metadata
* No webhooks that persist data
* No invoices or receipts generated by whofound.me
* Payment provider is the **system of record**

The application MUST treat payments as:

> A voluntary external action performed entirely on the provider’s hosted checkout.

---

### 18.1 Integration Boundary

The frontend MAY:

* Display static links or buttons to provider-hosted payment pages
* Open payment flows in a new tab

The backend MUST:

* Have **no awareness** of payment success or failure
* Not receive callbacks or webhooks
* Not change behavior based on payment state

---

### 18.2 Provider Requirements

Any payment provider used MUST:

* Support hosted checkout / payment links
* Handle receipts directly with the customer
* Handle compliance, tax, and card data
* Pay out to an Indian company bank account

Examples (non-binding):

* Stripe Payment Links
* Skydo hosted payment flows

The specific provider choice is **out of scope** for this PRD and may be finalized later without requiring a PRD change.

---

### 18.3 Cursor Rule Implications

Cursor rules MUST forbid:

* Adding DynamoDB or any database for payments
* Adding payment webhooks
* Adding custom checkout flows
* Adding analytics tied to payments

Any agent attempting to introduce provider-specific payment logic MUST stop and request explicit approval.

---

* Lambda memory ≤256MB
* Timeouts ≤5s
* WAF rate limits

---

## 19. Cursor Rules & Agent Governance

### 19.1 Purpose of Cursor Rules

Cursor rules exist to **constrain agent behavior**, prevent scope creep, and enforce architectural, privacy, workflow, and infrastructure guarantees defined in this PRD.

All agents (including Claude Opus 4.5) MUST treat Cursor rules as **hard constraints**, not suggestions.

If a requested change violates a Cursor rule, the agent MUST:

* Refuse to implement the change
* Explicitly state which rule is violated
* Propose an alternative that complies with the PRD

---

### 19.2 Required Cursor Rule Files

The repository MUST contain the following rule files under:

```
.cursor/rules/
```

Each rule file is mandatory.

---

### 19.3 architecture.md

**Purpose:** Prevent architectural drift, cost escalation, and region sprawl.

Rules to include:

* Backend compute MUST run only in `eu-west-1`
* Frontend MUST be static Astro output only
* Astro server features (SSR, API routes, adapters) are FORBIDDEN
* No databases of any kind (RDS, DynamoDB, S3 writes, etc.)
* No persistent storage or caching beyond in-memory execution
* No headless browsers (Puppeteer, Playwright, Selenium)
* No background jobs, queues, or schedulers
* No third-party backend services outside AWS

Agents MUST reject any suggestion that introduces state, persistence, SSR, or non-AWS services.

---

### 19.4 privacy.md

**Purpose:** Enforce strict privacy guarantees.

Rules to include:

* No logging of request bodies or personal inputs
* No analytics, tracking pixels, cookies, or fingerprinting
* No user identifiers stored or derived
* No request/response persistence
* No third-party scripts on frontend pages

Agents MUST flag any code that could indirectly log or leak personal data (including debug logs).

---

### 19.5 testing.md

**Purpose:** Guarantee correctness and long-term maintainability.

Rules to include:

* Every new module requires unit tests
* Every feature requires integration tests
* Parsers must have HTML fixtures
* No merging without tests passing
* No TODOs for tests in production code

Agents MUST refuse to generate production code without accompanying tests.

---

### 19.6 workflow.md

**Purpose:** Enforce Git discipline and review quality.

Rules to include:

* No direct commits to `main` or `dev`
* Feature branches only for work ≥4 commits
* Commits must be small and single-purpose
* Commit messages must be descriptive
* Every PR must be visual (screenshots/diagrams)
* UI PRs MUST include Astro page/component screenshots
* PRs without tests or visuals must be rejected

Agents MUST explicitly remind users of these rules when proposing changes.

---

### 19.7 scope.md

**Purpose:** Prevent scope creep and product dilution.

Rules to include:

* No automated broker discovery
* No data removal or opt-out automation
* No user accounts or authentication
* No alerts, emails, or notifications
* No expansion into OSINT, breach data, or social networks

Agents MUST refuse any suggestion that expands scope beyond the PRD.

---

### 19.8 cost-guardrails.md

**Purpose:** Keep operating costs predictable and low.

Rules to include:

* Lambda memory ≤256MB unless explicitly justified
* Lambda timeout ≤5 seconds
* No unbounded loops or retries
* Broker fetches must fail fast
* Rate limiting must be enabled at API Gateway or WAF

Agents MUST flag any code that risks runaway costs.

---

### 19.9 infra-as-code.md (New)

**Purpose:** Enforce Infrastructure-as-Code discipline and prevent configuration drift.

Rules to include:

* **ALL AWS resources MUST be provisioned using AWS CDK**
* CDK stacks MUST synthesize to CloudFormation templates
* **NO manual resource creation** via AWS Console is permitted
* **NO ad-hoc configuration changes** in AWS Console are permitted
* S3 buckets, CloudFront distributions, API Gateway, Lambda, IAM, WAF, ACM, Route53 records — **everything** must be defined in CDK
* Environment configuration MUST be versioned in Git
* Secrets MUST be managed via AWS-native mechanisms (no hardcoding)

Agents MUST refuse:

* Any instruction to "just create it in the console"
* Any resource not represented in CDK
* Any undocumented manual infra change

---

### 19.10 Enforcement Expectations

Agents are expected to:

* Reference Cursor rules explicitly when making decisions
* Explain rejections clearly and concisely
* Default to safety, simplicity, correctness, and reproducibility

Cursor rules are part of the **contract** between maintainers and agents.

---

### 19.1 Purpose of Cursor Rules

Cursor rules exist to **constrain agent behavior**, prevent scope creep, and enforce architectural, privacy, and workflow guarantees defined in this PRD.

All agents (including Claude Opus 4.5) MUST treat Cursor rules as **hard constraints**, not suggestions.

If a requested change violates a Cursor rule, the agent MUST:

* Refuse to implement the change
* Explicitly state which rule is violated
* Propose an alternative that complies with the PRD

---

### 19.2 Required Cursor Rule Files

The repository MUST contain the following rule files under:

```
.cursor/rules/
```

Each rule file is mandatory.

---

### 19.3 architecture.md

**Purpose:** Prevent architectural drift and cost escalation.

Rules to include:

* Backend compute MUST run only in `eu-west-1`
* Frontend MUST be static Astro output only
* Astro server features (SSR, API routes, adapters) are FORBIDDEN
* No databases of any kind (RDS, DynamoDB, S3 writes, etc.)
* No persistent storage or caching beyond in-memory execution
* No headless browsers (Puppeteer, Playwright, Selenium)
* No background jobs, queues, or schedulers
* No third-party backend services outside AWS

Agents MUST reject any suggestion that introduces state, persistence, SSR, or non-AWS services.

**Purpose:** Prevent architectural drift and cost escalation.

Rules to include:

* Backend compute MUST run only in `eu-west-1`
* No databases of any kind (RDS, DynamoDB, S3 writes, etc.)
* No persistent storage or caching beyond in-memory execution
* No headless browsers (Puppeteer, Playwright, Selenium)
* No background jobs, queues, or schedulers
* No third-party backend services outside AWS

Agents MUST reject any suggestion that introduces state, persistence, or non-AWS services.

---

### 19.4 privacy.md

**Purpose:** Enforce strict privacy guarantees.

Rules to include:

* No logging of request bodies or personal inputs
* No analytics, tracking pixels, cookies, or fingerprinting
* No user identifiers stored or derived
* No request/response persistence
* No third-party scripts on frontend pages

Agents MUST flag any code that could indirectly log or leak personal data (including debug logs).

---

### 19.5 testing.md

**Purpose:** Guarantee correctness and long-term maintainability.

Rules to include:

* Every new module requires unit tests
* Every feature requires integration tests
* Parsers must have HTML fixtures
* No merging without tests passing
* No TODOs for tests in production code

Agents MUST refuse to generate production code without accompanying tests.

---

### 19.6 workflow.md

**Purpose:** Enforce Git discipline and review quality.

Rules to include:

* No direct commits to `main` or `dev`
* Feature branches only for work ≥4 commits
* Commits must be small and single-purpose
* Commit messages must be descriptive
* Every PR must be visual (screenshots/diagrams)
* UI PRs MUST include Astro page/component screenshots
* PRs without tests or visuals must be rejected

Agents MUST explicitly remind users of these rules when proposing changes.

**Purpose:** Enforce Git discipline and review quality.

Rules to include:

* No direct commits to `main` or `dev`
* Feature branches only for work ≥4 commits
* Commits must be small and single-purpose
* Commit messages must be descriptive
* Every PR must be visual (screenshots/diagrams)
* PRs without tests or visuals must be rejected

Agents MUST explicitly remind users of these rules when proposing changes.

---

### 19.7 scope.md

**Purpose:** Prevent scope creep and product dilution.

Rules to include:

* No automated broker discovery
* No data removal or opt-out automation
* No user accounts or authentication
* No alerts, emails, or notifications
* No expansion into OSINT, breach data, or social networks

Agents MUST refuse any suggestion that expands scope beyond the PRD.

---

### 19.8 cost-guardrails.md

**Purpose:** Keep operating costs predictable and low.

Rules to include:

* Lambda memory ≤256MB unless explicitly justified
* Lambda timeout ≤5 seconds
* No unbounded loops or retries
* Broker fetches must fail fast
* Rate limiting must be enabled at API Gateway or WAF

Agents MUST flag any code that risks runaway costs.

---

### 19.9 Enforcement Expectations

Agents are expected to:

* Reference Cursor rules explicitly when making decisions
* Explain rejections clearly and concisely
* Default to safety, simplicity, and correctness

Cursor rules are part of the **contract** between maintainers and agents.

---

Agents must:

* Refuse scope creep
* Enforce tests
* Reject persistence
* Prefer clarity over cleverness

Rule files must exist in `.cursor/rules/`.

---

## 20. Milestones & Delivery Gates

### Phase 0 — Frontend Scaffolding (Astro)

* Astro project initialized
* Static pages scaffolded
* HawkLogic footer implemented
* No hydration yet

### Phase 1 — Foundations

* Repo structure
* Cursor rules
* CI pipeline
* API contract defined

### Phase 2 — Broker Engine

* Normalized schema
* 1 broker end-to-end
* Full unit + integration test coverage

### Phase 3 — MVP Completion

* All baseline brokers
* Aggregation logic
* Astro UI hydration for form + results
* Donation CTA

### Phase 4 — Hardening

* Rate limiting
* Abuse protection
* Copy review
* Legal review

1. Repo + rules
2. One broker end-to-end
3. All brokers
4. UI + CTA
5. Hardening

---

## 21. Acceptance Criteria

* No personal data stored
* Tests passing
* Costs ≤$25/month
* Manual verification matches output

---

## 22. Change Management

This document is the single source of truth. All changes must be explicit and versioned.

---

**End of document.**
