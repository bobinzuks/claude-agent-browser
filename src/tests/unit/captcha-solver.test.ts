/**
 * @jest-environment jsdom
 */

import { CAPTCHASolver, CAPTCHAType, SolverStrategy } from '../../extension/lib/captcha-solver';

describe('CAPTCHASolver', () => {
  let solver: CAPTCHASolver;
  let mockDocument: Document;

  beforeEach(() => {
    mockDocument = document;
    solver = new CAPTCHASolver(mockDocument);
  });

  describe('CAPTCHA Detection', () => {
    it('should detect reCAPTCHA v2 by iframe', () => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.google.com/recaptcha/api2/anchor';
      document.body.appendChild(iframe);

      const detected = solver.detect();
      expect(detected).toBe(true);
      expect(solver.getCaptchaType()).toBe(CAPTCHAType.RECAPTCHA_V2);

      document.body.removeChild(iframe);
    });

    it('should detect reCAPTCHA v3 by script', () => {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=';
      document.body.appendChild(script);

      const detected = solver.detect();
      expect(detected).toBe(true);
      expect(solver.getCaptchaType()).toBe(CAPTCHAType.RECAPTCHA_V3);

      document.body.removeChild(script);
    });

    it('should detect hCaptcha by iframe', () => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://hcaptcha.com/captcha/';
      document.body.appendChild(iframe);

      const detected = solver.detect();
      expect(detected).toBe(true);
      expect(solver.getCaptchaType()).toBe(CAPTCHAType.HCAPTCHA);

      document.body.removeChild(iframe);
    });

    it('should detect image CAPTCHA by common patterns', () => {
      const img = document.createElement('img');
      img.src = '/captcha.png';
      img.alt = 'CAPTCHA';
      document.body.appendChild(img);

      const detected = solver.detect();
      expect(detected).toBe(true);
      expect(solver.getCaptchaType()).toBe(CAPTCHAType.IMAGE);

      document.body.removeChild(img);
    });

    it('should return false when no CAPTCHA present', () => {
      const detected = solver.detect();
      expect(detected).toBe(false);
      expect(solver.getCaptchaType()).toBe(CAPTCHAType.NONE);
    });
  });

  describe('CAPTCHA Solving', () => {
    it('should attempt to solve reCAPTCHA v2', async () => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.google.com/recaptcha/api2/anchor';
      document.body.appendChild(iframe);

      solver.detect();
      const result = await solver.solve();

      expect(result).toBeDefined();
      expect(typeof result === 'string' || result === null).toBe(true);

      document.body.removeChild(iframe);
    });

    it('should return null when CAPTCHA cannot be solved', async () => {
      const img = document.createElement('img');
      img.src = '/complex-captcha.png';
      document.body.appendChild(img);

      solver.detect();
      const result = await solver.solve();

      expect(result).toBeNull();

      document.body.removeChild(img);
    });

    it('should use learned patterns from storage', async () => {
      const mockPattern = { type: CAPTCHAType.RECAPTCHA_V2, solution: 'mock-token', successCount: 5, failureCount: 1 };
      solver.loadPattern(mockPattern);

      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.google.com/recaptcha/api2/anchor';
      document.body.appendChild(iframe);

      solver.detect();
      const result = await solver.solve();

      expect(result).toBe('mock-token');

      document.body.removeChild(iframe);
    });
  });

  describe('Human-in-the-Loop Training', () => {
    it('should provide CAPTCHA challenge info for human', async () => {
      const img = document.createElement('img');
      img.src = '/captcha.png';
      document.body.appendChild(img);

      solver.detect();
      const challenge = solver.getChallengeForHuman();

      expect(challenge).toBeDefined();
      expect(challenge.type).toBe(CAPTCHAType.IMAGE);
      expect(challenge.imageUrl).toBeDefined();
      expect(challenge.context).toBeDefined();

      document.body.removeChild(img);
    });

    it('should store human solution as training data', () => {
      const img = document.createElement('img');
      img.src = '/captcha.png';
      document.body.appendChild(img);

      solver.detect();
      const humanSolution = 'ABC123';
      solver.storeHumanSolution(humanSolution);

      const patterns = solver.getStoredPatterns();
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].solution).toBe(humanSolution);

      document.body.removeChild(img);
    });

    it('should increment success count when pattern works', async () => {
      const pattern = { type: CAPTCHAType.RECAPTCHA_V2, solution: 'token', successCount: 0 };
      solver.loadPattern(pattern);

      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.google.com/recaptcha/api2/anchor';
      document.body.appendChild(iframe);

      solver.detect();
      await solver.solve();
      solver.markPatternSuccess();

      const patterns = solver.getStoredPatterns();
      expect(patterns[0].successCount).toBe(1);

      document.body.removeChild(iframe);
    });

    it('should increment failure count when pattern fails', async () => {
      const pattern = { type: CAPTCHAType.RECAPTCHA_V2, solution: 'bad-token', failureCount: 0 };
      solver.loadPattern(pattern);

      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.google.com/recaptcha/api2/anchor';
      document.body.appendChild(iframe);

      solver.detect();
      await solver.solve();
      solver.markPatternFailure();

      const patterns = solver.getStoredPatterns();
      expect(patterns[0].failureCount).toBe(1);

      document.body.removeChild(iframe);
    });
  });

  describe('Strategy Selection', () => {
    it('should use AI strategy for reCAPTCHA v2', () => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.google.com/recaptcha/api2/anchor';
      document.body.appendChild(iframe);

      solver.detect();
      const strategy = solver.getStrategy();

      expect(strategy).toBe(SolverStrategy.AI_MODEL);

      document.body.removeChild(iframe);
    });

    it('should use API strategy when configured', async () => {
      const solverWithAPI = new CAPTCHASolver(mockDocument, {
        preferredStrategy: SolverStrategy.API_SERVICE,
        apiKey: 'test-key',
      });

      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.google.com/recaptcha/api2/anchor';
      document.body.appendChild(iframe);

      solverWithAPI.detect();
      await solverWithAPI.solve();
      const strategy = solverWithAPI.getStrategy();

      expect(strategy).toBe(SolverStrategy.API_SERVICE);

      document.body.removeChild(iframe);
    });

    it('should use human strategy when AI fails', async () => {
      const img = document.createElement('img');
      img.src = '/complex-captcha.png';
      document.body.appendChild(img);

      solver.detect();
      await solver.solve(); // Will fail
      const strategy = solver.getStrategy();

      expect(strategy).toBe(SolverStrategy.HUMAN_FALLBACK);

      document.body.removeChild(img);
    });
  });

  describe('Pattern Management', () => {
    it('should export patterns to JSON', () => {
      solver.storeHumanSolution('test-solution');
      const json = solver.exportPatterns();

      expect(json).toBeDefined();
      const data = JSON.parse(json);
      expect(data.patterns).toBeDefined();
      expect(data.patterns.length).toBeGreaterThan(0);
    });

    it('should import patterns from JSON', () => {
      const json = JSON.stringify({
        patterns: [
          { type: CAPTCHAType.RECAPTCHA_V2, solution: 'imported-token', successCount: 5 },
        ],
      });

      solver.importPatterns(json);
      const patterns = solver.getStoredPatterns();

      expect(patterns.length).toBe(1);
      expect(patterns[0].solution).toBe('imported-token');
      expect(patterns[0].successCount).toBe(5);
    });

    it('should clear all patterns', () => {
      solver.storeHumanSolution('test');
      expect(solver.getStoredPatterns().length).toBeGreaterThan(0);

      solver.clearPatterns();
      expect(solver.getStoredPatterns().length).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should track solve attempts', async () => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.google.com/recaptcha/api2/anchor';
      document.body.appendChild(iframe);

      solver.detect();
      await solver.solve();

      const stats = solver.getStatistics();
      expect(stats.totalAttempts).toBe(1);

      document.body.removeChild(iframe);
    });

    it('should calculate success rate', () => {
      solver.loadPattern({ type: CAPTCHAType.RECAPTCHA_V2, solution: 'test', successCount: 8, failureCount: 2 });

      const stats = solver.getStatistics();
      expect(stats.successRate).toBe(0.8);
    });

    it('should track captcha types encountered', async () => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.google.com/recaptcha/api2/anchor';
      document.body.appendChild(iframe);

      solver.detect();
      await solver.solve();

      const stats = solver.getStatistics();
      expect(stats.typesCounted[CAPTCHAType.RECAPTCHA_V2]).toBe(1);

      document.body.removeChild(iframe);
    });
  });
});
