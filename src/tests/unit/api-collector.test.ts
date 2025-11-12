/**
 * API Collector Tests
 * BONUS LEVEL: The API Collector
 * @jest-environment jsdom
 */

import { APICollector, API_SIGNUP_FLOWS } from '../../extension/content/api-collector';

describe('API Collector - BONUS LEVEL', () => {
  let collector: APICollector;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="signup-page">
        <input type="email" name="email" id="email" />
        <input type="password" name="password" id="password" />
        <input type="text" name="username" id="username" />
        <button type="submit" id="submit">Sign Up</button>
        <div class="api-key" style="display:none">test-api-key-12345</div>
        <code class="token">ghp_test_token_abc123</code>
      </div>
    `;
    collector = new APICollector(document);
  });

  describe('Flow Execution', () => {
    it('should execute fill step', async () => {
      const flow = {
        service: 'TestAPI',
        steps: [{ type: 'fill' as const, selector: '#email', value: '{{email}}' }],
      };

      await collector.executeFlow(flow, 'test@example.com');
      const input = document.querySelector('#email') as HTMLInputElement;
      expect(input.value).toBe('test@example.com');
    });

    it('should execute click step', async () => {
      let clicked = false;
      const button = document.querySelector('#submit');
      button?.addEventListener('click', () => {
        clicked = true;
      });

      const flow = {
        service: 'TestAPI',
        steps: [{ type: 'click' as const, selector: '#submit' }],
      };

      await collector.executeFlow(flow, 'test@example.com');
      expect(clicked).toBe(true);
    });

    it('should extract API key', async () => {
      const flow = {
        service: 'TestAPI',
        steps: [{ type: 'extract' as const, selector: '.api-key', extractKey: 'apiKey' }],
      };

      const credential = await collector.executeFlow(flow, 'test@example.com');
      expect(credential.apiKey).toBe('test-api-key-12345');
    });

    it('should extract token', async () => {
      const flow = {
        service: 'TestAPI',
        steps: [{ type: 'extract' as const, selector: '.token', extractKey: 'token' }],
      };

      const credential = await collector.executeFlow(flow, 'test@example.com');
      expect(credential.token).toBe('ghp_test_token_abc123');
    });

    it('should store credential after execution', async () => {
      const flow = {
        service: 'TestAPI',
        steps: [{ type: 'extract' as const, selector: '.api-key', extractKey: 'apiKey' }],
      };

      await collector.executeFlow(flow, 'test@example.com');
      const credentials = collector.getCredentials();
      expect(credentials).toHaveLength(1);
      expect(credentials[0].service).toBe('TestAPI');
    });
  });

  describe('Credential Management', () => {
    it('should find credential by service name', async () => {
      const flow = {
        service: 'GitHub',
        steps: [{ type: 'extract' as const, selector: '.token', extractKey: 'token' }],
      };

      await collector.executeFlow(flow, 'github@example.com');
      const found = collector.findCredential('GitHub');
      expect(found).toBeDefined();
      expect(found?.service).toBe('GitHub');
    });

    it('should export credentials as JSON', async () => {
      const flow = {
        service: 'TestAPI',
        steps: [{ type: 'extract' as const, selector: '.api-key', extractKey: 'apiKey' }],
      };

      await collector.executeFlow(flow, 'test@example.com');
      const json = collector.exportCredentials();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('credentials');
      expect(parsed.credentials).toHaveLength(1);
    });

    it('should import credentials from JSON', () => {
      const json = JSON.stringify({
        version: '1.0',
        credentials: [
          {
            service: 'ImportedAPI',
            email: 'imported@example.com',
            apiKey: 'imported-key',
            signupUrl: 'https://example.com',
            apiDocsUrl: 'https://example.com/docs',
            collectedAt: new Date().toISOString(),
            metadata: {},
          },
        ],
      });

      collector.importCredentials(json);
      const credentials = collector.getCredentials();
      expect(credentials).toHaveLength(1);
      expect(credentials[0].service).toBe('ImportedAPI');
    });
  });

  describe('Training Data Generation', () => {
    it('should generate training data from collected credentials', async () => {
      const flow = {
        service: 'TrainingAPI',
        steps: [{ type: 'extract' as const, selector: '.api-key', extractKey: 'apiKey' }],
      };

      await collector.executeFlow(flow, 'training@example.com');
      const trainingData = collector.generateTrainingData();
      const parsed = JSON.parse(trainingData);

      expect(parsed).toHaveProperty('training');
      expect(parsed.training).toHaveLength(1);
      expect(parsed.training[0]).toHaveProperty('service', 'TrainingAPI');
      expect(parsed.training[0]).toHaveProperty('success', true);
    });

    it('should mark failed attempts in training data', async () => {
      const flow = {
        service: 'FailedAPI',
        steps: [{ type: 'click' as const, selector: '#submit' }], // No extraction
      };

      await collector.executeFlow(flow, 'failed@example.com');
      const trainingData = collector.generateTrainingData();
      const parsed = JSON.parse(trainingData);

      expect(parsed.training[0].success).toBe(false);
    });
  });

  describe('Pre-configured Flows', () => {
    it('should have GitHub flow configured', () => {
      expect(API_SIGNUP_FLOWS.github).toBeDefined();
      expect(API_SIGNUP_FLOWS.github.service).toBe('GitHub');
      expect(API_SIGNUP_FLOWS.github.steps.length).toBeGreaterThan(0);
    });

    it('should have OpenWeatherMap flow configured', () => {
      expect(API_SIGNUP_FLOWS.openweathermap).toBeDefined();
      expect(API_SIGNUP_FLOWS.openweathermap.service).toBe('OpenWeatherMap');
    });

    it('should have NewsAPI flow configured', () => {
      expect(API_SIGNUP_FLOWS.newsapi).toBeDefined();
      expect(API_SIGNUP_FLOWS.newsapi.service).toBe('NewsAPI');
    });

    it('should have RapidAPI flow configured', () => {
      expect(API_SIGNUP_FLOWS.rapidapi).toBeDefined();
      expect(API_SIGNUP_FLOWS.rapidapi.service).toBe('RapidAPI');
    });

    it('should have Anthropic Claude flow configured', () => {
      expect(API_SIGNUP_FLOWS.anthropic).toBeDefined();
      expect(API_SIGNUP_FLOWS.anthropic.service).toBe('Anthropic Claude');
    });

    it('should have all 5 required APIs', () => {
      const apiCount = Object.keys(API_SIGNUP_FLOWS).length;
      expect(apiCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Complete Flow Simulation', () => {
    it('should execute multi-step signup flow', async () => {
      const flow = {
        service: 'CompleteAPI',
        steps: [
          { type: 'fill' as const, selector: '#email', value: '{{email}}' },
          { type: 'fill' as const, selector: '#password', value: 'SecurePass123!' },
          { type: 'fill' as const, selector: '#username', value: 'testuser' },
          { type: 'click' as const, selector: '#submit' },
          { type: 'extract' as const, selector: '.api-key', extractKey: 'apiKey' },
        ],
      };

      const credential = await collector.executeFlow(flow, 'complete@example.com');

      expect(credential.service).toBe('CompleteAPI');
      expect(credential.email).toBe('complete@example.com');
      expect(credential.apiKey).toBe('test-api-key-12345');

      const emailInput = document.querySelector('#email') as HTMLInputElement;
      const passwordInput = document.querySelector('#password') as HTMLInputElement;
      expect(emailInput.value).toBe('complete@example.com');
      expect(passwordInput.value).toBe('SecurePass123!');
    });
  });
});
