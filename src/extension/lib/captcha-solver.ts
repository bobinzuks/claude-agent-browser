/**
 * CAPTCHA Solver - SECRET BOSS 13
 * Detects and solves CAPTCHAs with AI training and human fallback
 */

export enum CAPTCHAType {
  NONE = 'none',
  RECAPTCHA_V2 = 'recaptcha_v2',
  RECAPTCHA_V3 = 'recaptcha_v3',
  HCAPTCHA = 'hcaptcha',
  IMAGE = 'image',
  TEXT = 'text',
  UNKNOWN = 'unknown',
}

export enum SolverStrategy {
  AI_MODEL = 'ai_model',
  API_SERVICE = 'api_service',
  HUMAN_FALLBACK = 'human_fallback',
  LEARNED_PATTERN = 'learned_pattern',
}

export interface CAPTCHAPattern {
  type: CAPTCHAType;
  solution: string;
  successCount?: number;
  failureCount?: number;
  timestamp?: string;
  context?: Record<string, unknown>;
}

export interface CAPTCHAChallenge {
  type: CAPTCHAType;
  imageUrl?: string;
  context: Record<string, unknown>;
  siteKey?: string;
  url?: string;
}

export interface SolverConfig {
  preferredStrategy?: SolverStrategy;
  apiKey?: string;
  apiService?: 'twocaptcha' | 'anticaptcha' | 'deathbycaptcha';
  timeout?: number;
}

export interface SolverStatistics {
  totalAttempts: number;
  successRate: number;
  typesCounted: Record<string, number>;
  strategiesUsed: Record<string, number>;
}

/**
 * CAPTCHASolver - Detects, solves, and learns from CAPTCHAs
 */
export class CAPTCHASolver {
  private document: Document;
  private config: SolverConfig;
  private currentType: CAPTCHAType = CAPTCHAType.NONE;
  private currentStrategy: SolverStrategy = SolverStrategy.AI_MODEL;
  private patterns: CAPTCHAPattern[] = [];
  private statistics: {
    attempts: number;
    successes: number;
    failures: number;
    typesCounted: Record<string, number>;
    strategiesUsed: Record<string, number>;
  };

  constructor(document: Document, config: SolverConfig = {}) {
    this.document = document;
    this.config = {
      timeout: 30000,
      ...config,
    };
    this.statistics = {
      attempts: 0,
      successes: 0,
      failures: 0,
      typesCounted: {},
      strategiesUsed: {},
    };
  }

  /**
   * Detect if CAPTCHA is present on the page
   */
  public detect(): boolean {
    // Reset current type
    this.currentType = CAPTCHAType.NONE;

    // Check for image CAPTCHA first (most specific)
    const imageCaptcha = this.document.querySelector('img[src*="captcha"], img[alt*="CAPTCHA"], img[alt*="captcha"]');
    if (imageCaptcha) {
      this.currentType = CAPTCHAType.IMAGE;
      this.incrementTypeCount(CAPTCHAType.IMAGE);
      return true;
    }

    // Check for reCAPTCHA v2
    const recaptchaV2 = this.document.querySelector('iframe[src*="google.com/recaptcha/api2/anchor"]');
    if (recaptchaV2) {
      this.currentType = CAPTCHAType.RECAPTCHA_V2;
      this.incrementTypeCount(CAPTCHAType.RECAPTCHA_V2);
      return true;
    }

    // Check for reCAPTCHA v3
    const recaptchaV3 = this.document.querySelector('script[src*="google.com/recaptcha/api.js?render="]');
    if (recaptchaV3) {
      this.currentType = CAPTCHAType.RECAPTCHA_V3;
      this.incrementTypeCount(CAPTCHAType.RECAPTCHA_V3);
      return true;
    }

    // Check for hCaptcha
    const hcaptcha = this.document.querySelector('iframe[src*="hcaptcha.com/captcha"]');
    if (hcaptcha) {
      this.currentType = CAPTCHAType.HCAPTCHA;
      this.incrementTypeCount(CAPTCHAType.HCAPTCHA);
      return true;
    }

    return false;
  }

  /**
   * Get the type of CAPTCHA detected
   */
  public getCaptchaType(): CAPTCHAType {
    return this.currentType;
  }

  /**
   * Attempt to solve the CAPTCHA
   */
  public async solve(): Promise<string | null> {
    this.statistics.attempts++;

    if (this.currentType === CAPTCHAType.NONE) {
      return null;
    }

    // Try learned patterns first (highest priority)
    const learnedSolution = this.tryLearnedPattern();
    if (learnedSolution) {
      this.currentStrategy = SolverStrategy.LEARNED_PATTERN;
      this.incrementStrategyCount(SolverStrategy.LEARNED_PATTERN);
      return learnedSolution;
    }

    // Use configured strategy if set
    if (this.config.preferredStrategy === SolverStrategy.API_SERVICE && this.config.apiKey) {
      this.currentStrategy = SolverStrategy.API_SERVICE;
      this.incrementStrategyCount(SolverStrategy.API_SERVICE);
      const apiResult = await this.solveWithAPI();
      return apiResult; // Return result (or null), don't try other strategies
    }

    // Try AI model as default
    this.currentStrategy = SolverStrategy.AI_MODEL;
    this.incrementStrategyCount(SolverStrategy.AI_MODEL);
    const aiSolution = await this.solveWithAI();

    if (aiSolution) {
      return aiSolution;
    }

    // Fallback to human
    this.currentStrategy = SolverStrategy.HUMAN_FALLBACK;
    this.incrementStrategyCount(SolverStrategy.HUMAN_FALLBACK);
    return null;
  }

  /**
   * Get the current solving strategy
   */
  public getStrategy(): SolverStrategy {
    return this.currentStrategy;
  }

  /**
   * Try to solve using learned patterns
   */
  private tryLearnedPattern(): string | null {
    const matchingPatterns = this.patterns.filter(
      (p) => p.type === this.currentType && (p.successCount ?? 0) > (p.failureCount ?? 0)
    );

    if (matchingPatterns.length === 0) {
      return null;
    }

    // Sort by success rate and return best
    matchingPatterns.sort((a, b) => {
      const aRate = (a.successCount ?? 0) / ((a.successCount ?? 0) + (a.failureCount ?? 0) || 1);
      const bRate = (b.successCount ?? 0) / ((b.successCount ?? 0) + (b.failureCount ?? 0) || 1);
      return bRate - aRate;
    });

    return matchingPatterns[0].solution;
  }

  /**
   * Solve using AI model (placeholder for NopeCHA integration)
   */
  private async solveWithAI(): Promise<string | null> {
    // Placeholder: In real implementation, this would integrate with NopeCHA
    // or a trained ML model
    if (this.currentType === CAPTCHAType.RECAPTCHA_V3) {
      // reCAPTCHA v3 is invisible, would extract token from page
      return null;
    }

    // For now, return null to trigger human fallback
    return null;
  }

  /**
   * Solve using API service (2Captcha, etc.)
   */
  private async solveWithAPI(): Promise<string | null> {
    // Placeholder: In real implementation, this would call 2Captcha API
    return null;
  }

  /**
   * Get CAPTCHA challenge info for human to solve
   */
  public getChallengeForHuman(): CAPTCHAChallenge {
    const challenge: CAPTCHAChallenge = {
      type: this.currentType,
      context: {
        url: this.document.location?.href || '',
        timestamp: new Date().toISOString(),
      },
    };

    if (this.currentType === CAPTCHAType.IMAGE) {
      const img = this.document.querySelector('img[src*="captcha"], img[alt*="CAPTCHA"]') as HTMLImageElement;
      if (img) {
        challenge.imageUrl = img.src;
      }
    }

    if (this.currentType === CAPTCHAType.RECAPTCHA_V2 || this.currentType === CAPTCHAType.HCAPTCHA) {
      const iframe = this.document.querySelector('iframe[src*="recaptcha"], iframe[src*="hcaptcha"]') as HTMLIFrameElement;
      if (iframe) {
        challenge.url = iframe.src;
        // Extract site key from URL
        const match = iframe.src.match(/[?&]k=([^&]+)/);
        if (match) {
          challenge.siteKey = match[1];
        }
      }
    }

    return challenge;
  }

  /**
   * Store human solution as training data
   */
  public storeHumanSolution(solution: string): void {
    const pattern: CAPTCHAPattern = {
      type: this.currentType,
      solution,
      successCount: 0,
      failureCount: 0,
      timestamp: new Date().toISOString(),
      context: {
        url: this.document.location?.href || '',
        strategy: SolverStrategy.HUMAN_FALLBACK,
      },
    };

    this.patterns.push(pattern);
  }

  /**
   * Mark the last used pattern as successful
   */
  public markPatternSuccess(): void {
    if (this.patterns.length > 0) {
      const lastPattern = this.patterns[this.patterns.length - 1];
      lastPattern.successCount = (lastPattern.successCount ?? 0) + 1;
      this.statistics.successes++;
    }
  }

  /**
   * Mark the last used pattern as failed
   */
  public markPatternFailure(): void {
    if (this.patterns.length > 0) {
      const lastPattern = this.patterns[this.patterns.length - 1];
      lastPattern.failureCount = (lastPattern.failureCount ?? 0) + 1;
      this.statistics.failures++;
    }
  }

  /**
   * Load a pattern into memory
   */
  public loadPattern(pattern: CAPTCHAPattern): void {
    this.patterns.push({
      successCount: 0,
      failureCount: 0,
      timestamp: new Date().toISOString(),
      ...pattern,
    });
  }

  /**
   * Get all stored patterns
   */
  public getStoredPatterns(): CAPTCHAPattern[] {
    return [...this.patterns];
  }

  /**
   * Export patterns to JSON
   */
  public exportPatterns(): string {
    return JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      patterns: this.patterns,
      statistics: this.statistics,
    }, null, 2);
  }

  /**
   * Import patterns from JSON
   */
  public importPatterns(json: string): void {
    try {
      const data = JSON.parse(json);
      if (data.patterns && Array.isArray(data.patterns)) {
        this.patterns = data.patterns;
      }
    } catch (error) {
      throw new Error(`Failed to import patterns: ${error}`);
    }
  }

  /**
   * Clear all patterns
   */
  public clearPatterns(): void {
    this.patterns = [];
  }

  /**
   * Get solver statistics
   */
  public getStatistics(): SolverStatistics {
    const totalSuccesses = this.patterns.reduce((sum, p) => sum + (p.successCount ?? 0), 0);
    const totalFailures = this.patterns.reduce((sum, p) => sum + (p.failureCount ?? 0), 0);
    const totalPatternAttempts = totalSuccesses + totalFailures;

    return {
      totalAttempts: this.statistics.attempts,
      successRate: totalPatternAttempts > 0 ? totalSuccesses / totalPatternAttempts : 0,
      typesCounted: { ...this.statistics.typesCounted },
      strategiesUsed: { ...this.statistics.strategiesUsed },
    };
  }

  private incrementTypeCount(type: CAPTCHAType): void {
    this.statistics.typesCounted[type] = (this.statistics.typesCounted[type] ?? 0) + 1;
  }

  private incrementStrategyCount(strategy: SolverStrategy): void {
    this.statistics.strategiesUsed[strategy] = (this.statistics.strategiesUsed[strategy] ?? 0) + 1;
  }
}
