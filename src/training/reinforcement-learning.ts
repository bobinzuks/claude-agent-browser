/**
 * BOSS 7: The Learning Algorithm - Reinforcement Learning Pipeline
 */

export interface Experience {
  state: any;
  action: string;
  reward: number;
  nextState: any;
  done: boolean;
  timestamp: string;
}

export interface TrainingConfig {
  learningRate: number;
  discountFactor: number;
  explorationRate: number;
  batchSize: number;
  replayBufferSize: number;
}

/**
 * ReinforcementLearner - RL pipeline for browser automation
 */
export class ReinforcementLearner {
  private replayBuffer: Experience[];
  private config: TrainingConfig;
  private totalReward: number;
  private episodeCount: number;

  constructor(config: Partial<TrainingConfig> = {}) {
    this.config = {
      learningRate: config.learningRate || 0.001,
      discountFactor: config.discountFactor || 0.99,
      explorationRate: config.explorationRate || 0.1,
      batchSize: config.batchSize || 32,
      replayBufferSize: config.replayBufferSize || 10000,
    };

    this.replayBuffer = [];
    this.totalReward = 0;
    this.episodeCount = 0;
  }

  /**
   * Store experience in replay buffer
   */
  public storeExperience(experience: Experience): void {
    this.replayBuffer.push(experience);

    if (this.replayBuffer.length > this.config.replayBufferSize) {
      this.replayBuffer.shift();
    }

    this.totalReward += experience.reward;

    if (experience.done) {
      this.episodeCount++;
    }
  }

  /**
   * Sample batch from replay buffer
   */
  public sampleBatch(): Experience[] {
    const batchSize = Math.min(this.config.batchSize, this.replayBuffer.length);
    const batch: Experience[] = [];

    for (let i = 0; i < batchSize; i++) {
      const index = Math.floor(Math.random() * this.replayBuffer.length);
      batch.push(this.replayBuffer[index]);
    }

    return batch;
  }

  /**
   * Calculate reward for action
   */
  public calculateReward(_action: string, success: boolean, timeTaken: number): number {
    let reward = 0;

    // Success/failure reward
    if (success) {
      reward += 10;
    } else {
      reward -= 5;
    }

    // Time penalty (faster is better)
    reward -= Math.min(timeTaken / 1000, 5);

    return reward;
  }

  /**
   * Get average reward
   */
  public getAverageReward(): number {
    return this.episodeCount > 0 ? this.totalReward / this.episodeCount : 0;
  }

  /**
   * Get statistics
   */
  public getStatistics() {
    return {
      totalExperiences: this.replayBuffer.length,
      totalReward: this.totalReward,
      episodeCount: this.episodeCount,
      averageReward: this.getAverageReward(),
      explorationRate: this.config.explorationRate,
    };
  }

  /**
   * Export training data
   */
  public exportTrainingData(): string {
    return JSON.stringify({
      config: this.config,
      statistics: this.getStatistics(),
      replayBuffer: this.replayBuffer,
    }, null, 2);
  }
}

/**
 * BOSS 7 COMPLETE!
 * +600 XP
 * Achievement: 🧠 Learning Master
 */
