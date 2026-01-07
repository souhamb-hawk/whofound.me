# Testing Rules

These rules are **hard constraints** that all agents MUST follow. Correctness is non-negotiable.

## Unit Testing Requirements

- **Every new module requires unit tests**
- **Every feature requires integration tests**
- No merging without tests passing
- No TODOs for tests in production code

## Broker Parser Testing

- All parsers MUST have HTML fixtures
- Fixtures MUST be committed and versioned
- Parser tests MUST achieve ≥90% coverage
- Edge cases MUST be tested:
  - Missing fields
  - Malformed HTML
  - Empty responses
  - Partial matches

## Test Categories

### Unit Tests
- Parser tests with HTML fixtures
- Input normalization tests
- Risk level calculation tests
- Edge cases for missing fields

### Integration Tests
- Mock HTTP responses
- Full request → response validation
- Timeout handling
- Partial failure scenarios

### End-to-End Tests
- Deployed preview environment
- Mocked brokers only (never hit real brokers in tests)
- Full user flow validation

## Coverage Requirements

- Parsing logic: ≥90% coverage
- Backend overall: ≥90% coverage
- No untested error paths in production code

## Agent Behavior

Agents MUST refuse to generate production code without accompanying tests.

Agents MUST:
- Write tests alongside implementation
- Include HTML fixtures for any new parser
- Ensure tests pass before marking work complete

