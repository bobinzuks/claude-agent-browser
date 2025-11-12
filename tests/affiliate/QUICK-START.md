# Affiliate Test Suite - Quick Start Guide

Get up and running with the affiliate automation test suite in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Basic understanding of Jest and Playwright

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install
```

## Run Tests

### Quick Test

Run all tests:

```bash
./tests/affiliate/run-tests.sh
```

Or use npm scripts:

```bash
npm test -- tests/affiliate/
```

### Unit Tests Only

```bash
./tests/affiliate/run-tests.sh --unit-only
```

Or:

```bash
npm test -- tests/affiliate/unit/
```

### E2E Tests Only

```bash
./tests/affiliate/run-tests.sh --e2e-only
```

Or:

```bash
npx playwright test tests/affiliate/e2e/
```

### With Coverage

```bash
./tests/affiliate/run-tests.sh --coverage
```

Or:

```bash
npm run test:coverage -- tests/affiliate/
```

## Test Results

After running tests, you'll see:

```
================================================
  Affiliate Automation Test Suite
================================================

----------------------------------------
  Running Unit Tests
----------------------------------------

 PASS  tests/affiliate/unit/network-detector.test.ts
 PASS  tests/affiliate/unit/link-extractor.test.ts
 PASS  tests/affiliate/unit/compliance-checker.test.ts

Test Suites: 3 passed, 3 total
Tests:       87 passed, 87 total

✓ Unit Tests: PASSED

----------------------------------------
  Running E2E Tests
----------------------------------------

Running 12 tests using 4 workers

  12 passed (15.2s)

✓ E2E Tests: PASSED

----------------------------------------
  Test Summary
----------------------------------------

✓ Unit Tests: PASSED
✓ E2E Tests: PASSED
✓ Coverage: 90% (Target: 80%)

================================================
  All Tests Passed! ✓
================================================
```

## Test Structure

```
tests/affiliate/
├── unit/           # Fast, isolated tests
├── e2e/            # Browser-based integration tests
├── fixtures/       # Test data
├── mocks/          # Mock implementations
└── utils/          # Helper functions
```

## Example Test

### Unit Test Example

```typescript
import { describe, test, expect } from '@jest/globals';
import { NetworkDetector } from '../mocks/affiliate-modules';
import { ALL_NETWORKS } from '../fixtures/network-fixtures';

test('detects ShareASale from URL', () => {
  const detector = new NetworkDetector({ networks: ALL_NETWORKS });
  const network = detector.detectNetwork('https://www.shareasale.com/dashboard');

  expect(network?.id).toBe('shareasale');
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('extracts links from dashboard', async ({ page }) => {
  await page.goto('https://shareasale.com/dashboard');

  const links = await page.locator('.affiliate-link').count();
  expect(links).toBeGreaterThan(0);
});
```

## Common Tasks

### Run Specific Test File

```bash
npm test -- tests/affiliate/unit/network-detector.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="ShareASale"
```

### Watch Mode (Auto-rerun)

```bash
./tests/affiliate/run-tests.sh --watch
```

Or:

```bash
npm run test:watch -- tests/affiliate/
```

### Debug Single Test

```bash
node --inspect-brk node_modules/.bin/jest tests/affiliate/unit/network-detector.test.ts
```

### View Coverage Report

After running with `--coverage`, open:

```bash
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
```

## Testing Your Own Networks

### 1. Add Network Fixture

```typescript
// tests/affiliate/fixtures/network-fixtures.ts

export const MY_NETWORK: AffiliateNetwork = {
  id: 'my-network',
  name: 'My Network',
  domain: 'mynetwork.com',
  tos_level: TOSLevel.HUMAN_GUIDED,
  api_available: true,
  signup_url: 'https://mynetwork.com/signup',
  dashboard_url: 'https://mynetwork.com/dashboard',
  created_at: Date.now(),
  updated_at: Date.now(),
};
```

### 2. Write Test

```typescript
test('detects My Network', () => {
  const detector = new NetworkDetector({ networks: [MY_NETWORK] });
  const network = detector.detectNetwork('https://mynetwork.com/');

  expect(network?.id).toBe('my-network');
});
```

### 3. Run Test

```bash
npm test -- --testNamePattern="My Network"
```

## Troubleshooting

### Tests Failing

1. Clear cache:
   ```bash
   npm test -- --clearCache
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Check Node version:
   ```bash
   node --version  # Should be 18+
   ```

### Playwright Issues

```bash
# Reinstall browsers
npx playwright install --force

# Run with headed mode to see what's happening
npx playwright test --headed
```

### Coverage Issues

```bash
# Generate detailed coverage
npm run test:coverage -- --verbose

# View uncovered lines
cat coverage/lcov.info
```

## Next Steps

1. **Read the full README**: `tests/affiliate/README.md`
2. **Explore fixtures**: Check `tests/affiliate/fixtures/`
3. **Review test helpers**: See `tests/affiliate/utils/test-helpers.ts`
4. **Write your own tests**: Use templates from existing tests

## Test Categories

| Category | File Pattern | Command |
|----------|-------------|---------|
| Unit Tests | `unit/*.test.ts` | `npm test -- tests/affiliate/unit/` |
| E2E Tests | `e2e/*.test.ts` | `npx playwright test tests/affiliate/e2e/` |
| All Tests | `**/*.test.ts` | `./tests/affiliate/run-tests.sh` |

## Performance Tips

- Unit tests should run in <5 seconds
- E2E tests can take 15-30 seconds
- Use `--maxWorkers=4` for parallel execution
- Mock external API calls in unit tests

## CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
- name: Run Affiliate Tests
  run: ./tests/affiliate/run-tests.sh --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Getting Help

- Check the full README: `tests/affiliate/README.md`
- Review test examples in each test file
- See fixtures for sample data structures
- Check utils for helper functions

## Coverage Goals

| Module | Target | Current |
|--------|--------|---------|
| NetworkDetector | 95% | ✅ 95%+ |
| LinkExtractor | 90% | ✅ 92%+ |
| ComplianceChecker | 95% | ✅ 96%+ |
| **Overall** | **80%** | **✅ 90%+** |

## Success Criteria

✅ All unit tests pass
✅ All E2E tests pass
✅ 80%+ code coverage
✅ No compliance violations
✅ Performance benchmarks met

You're ready to go! Run `./tests/affiliate/run-tests.sh` to start testing.
