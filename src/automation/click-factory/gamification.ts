/**
 * Click Factory Gamification System
 * XP, achievements, leaderboards, and visual rewards
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  condition: (stats: PlayerStats) => boolean;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  formsSubmitted: number;
  formsSuccessful: number;
  successRate: number;
  speed: number; // forms per minute
  streak: number;
  longestStreak: number;
  totalTime: number; // milliseconds
  achievements: Achievement[];
}

export class ClickFactoryGamification {
  private stats: PlayerStats;
  private startTime: number = 0;
  private lastSubmitTime: number = 0;

  constructor(savedStats?: PlayerStats) {
    this.stats = savedStats || this.getDefaultStats();
  }

  private getDefaultStats(): PlayerStats {
    return {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      formsSubmitted: 0,
      formsSuccessful: 0,
      successRate: 0,
      speed: 0,
      streak: 0,
      longestStreak: 0,
      totalTime: 0,
      achievements: this.getAllAchievements()
    };
  }

  /**
   * All available achievements
   */
  private getAllAchievements(): Achievement[] {
    return [
      {
        id: 'first_blood',
        name: '🎯 First Blood',
        description: 'Submit your first form',
        icon: '🎯',
        xp: 10,
        condition: (stats) => stats.formsSubmitted >= 1,
        unlocked: false
      },
      {
        id: 'speed_demon',
        name: '⚡ Speed Demon',
        description: 'Submit 10 forms in 5 minutes',
        icon: '⚡',
        xp: 50,
        condition: (stats) => stats.formsSubmitted >= 10 && stats.totalTime <= 300000,
        unlocked: false
      },
      {
        id: 'perfect_ten',
        name: '💯 Perfect Ten',
        description: '10 successful submissions in a row',
        icon: '💯',
        xp: 75,
        condition: (stats) => stats.streak >= 10,
        unlocked: false
      },
      {
        id: 'accuracy_master',
        name: '🎓 Accuracy Master',
        description: '100% success rate on 20+ forms',
        icon: '🎓',
        xp: 100,
        condition: (stats) => stats.successRate === 100 && stats.formsSubmitted >= 20,
        unlocked: false
      },
      {
        id: 'marathon_runner',
        name: '🏃 Marathon Runner',
        description: 'Submit 100 forms',
        icon: '🏃',
        xp: 200,
        condition: (stats) => stats.formsSubmitted >= 100,
        unlocked: false
      },
      {
        id: 'ultra_marathon',
        name: '🏆 Ultra Marathon',
        description: 'Submit 500 forms',
        icon: '🏆',
        xp: 500,
        condition: (stats) => stats.formsSubmitted >= 500,
        unlocked: false
      },
      {
        id: 'centurion',
        name: '💪 Centurion',
        description: '100 streak',
        icon: '💪',
        xp: 300,
        condition: (stats) => stats.streak >= 100,
        unlocked: false
      },
      {
        id: 'speed_of_light',
        name: '🚀 Speed of Light',
        description: '20 forms per minute',
        icon: '🚀',
        xp: 150,
        condition: (stats) => stats.speed >= 20,
        unlocked: false
      },
      {
        id: 'efficiency_expert',
        name: '⚙️ Efficiency Expert',
        description: '95%+ success rate on 50+ forms',
        icon: '⚙️',
        xp: 125,
        condition: (stats) => stats.successRate >= 95 && stats.formsSubmitted >= 50,
        unlocked: false
      },
      {
        id: 'grandmaster',
        name: '👑 Grandmaster',
        description: 'Reach level 20',
        icon: '👑',
        xp: 1000,
        condition: (stats) => stats.level >= 20,
        unlocked: false
      }
    ];
  }

  /**
   * Record a form submission
   */
  recordSubmission(success: boolean, formsFilled: number, formsDetected: number) {
    const now = Date.now();

    if (this.startTime === 0) {
      this.startTime = now;
    }

    this.stats.formsSubmitted++;

    if (success) {
      this.stats.formsSuccessful++;
      this.stats.streak++;

      if (this.stats.streak > this.stats.longestStreak) {
        this.stats.longestStreak = this.stats.streak;
      }

      // Award XP based on performance
      const baseXP = 10;
      const accuracyBonus = formsDetected > 0 ? (formsFilled / formsDetected) * 10 : 0;
      const speedBonus = this.calculateSpeedBonus(now);
      const totalXP = Math.floor(baseXP + accuracyBonus + speedBonus);

      this.addXP(totalXP);
    } else {
      this.stats.streak = 0;
    }

    // Update stats
    this.stats.successRate = (this.stats.formsSuccessful / this.stats.formsSubmitted) * 100;
    this.stats.totalTime = now - this.startTime;
    this.stats.speed = (this.stats.formsSubmitted / (this.stats.totalTime / 60000));
    this.lastSubmitTime = now;

    // Check achievements
    this.checkAchievements();

    return this.stats;
  }

  private calculateSpeedBonus(now: number): number {
    if (this.lastSubmitTime === 0) return 0;

    const timeDiff = now - this.lastSubmitTime;

    // Bonus for submitting within 10 seconds
    if (timeDiff < 10000) return 5;
    // Bonus for submitting within 30 seconds
    if (timeDiff < 30000) return 2;

    return 0;
  }

  /**
   * Add XP and handle level ups
   */
  private addXP(amount: number) {
    this.stats.xp += amount;

    // Level up
    while (this.stats.xp >= this.stats.xpToNextLevel) {
      this.stats.xp -= this.stats.xpToNextLevel;
      this.stats.level++;
      this.stats.xpToNextLevel = this.calculateXPForLevel(this.stats.level);

      // Show level up notification
      this.showLevelUpAnimation();
    }
  }

  private calculateXPForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  /**
   * Check and unlock achievements
   */
  private checkAchievements() {
    let newAchievements = 0;

    for (const achievement of this.stats.achievements) {
      if (!achievement.unlocked && achievement.condition(this.stats)) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date();
        this.addXP(achievement.xp);
        this.showAchievementUnlockedAnimation(achievement);
        newAchievements++;
      }
    }

    return newAchievements;
  }

  /**
   * Inject visual elements into page
   */
  injectProgressBar(page: any): Promise<void> {
    return page.evaluate((stats: PlayerStats) => {
      // Remove existing
      const existing = document.getElementById('gamification-hud');
      if (existing) existing.remove();

      // Create HUD
      const hud = document.createElement('div');
      hud.id = 'gamification-hud';
      hud.style.cssText = `
        position: fixed;
        top: 80px;
        right: 10px;
        z-index: 2147483646;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 3px solid #fff;
        border-radius: 15px;
        padding: 20px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        font-family: 'Arial', sans-serif;
        color: white;
        min-width: 280px;
      `;

      hud.innerHTML = `
        <div style="margin-bottom: 15px;">
          <div style="font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 5px;">
            Level ${stats.level}
          </div>
          <div style="font-size: 12px; text-align: center; opacity: 0.9;">
            ${stats.xp} / ${stats.xpToNextLevel} XP
          </div>
        </div>

        <div style="background: rgba(0,0,0,0.3); border-radius: 10px; height: 20px; overflow: hidden; margin-bottom: 15px;">
          <div style="
            background: linear-gradient(90deg, #00ff00, #00cc00);
            height: 100%;
            width: ${(stats.xp / stats.xpToNextLevel) * 100}%;
            transition: width 0.5s ease;
          "></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
          <div>
            <div style="opacity: 0.8;">Forms</div>
            <div style="font-size: 18px; font-weight: bold;">${stats.formsSubmitted}</div>
          </div>
          <div>
            <div style="opacity: 0.8;">Success</div>
            <div style="font-size: 18px; font-weight: bold;">${stats.successRate.toFixed(1)}%</div>
          </div>
          <div>
            <div style="opacity: 0.8;">Streak</div>
            <div style="font-size: 18px; font-weight: bold;">🔥 ${stats.streak}</div>
          </div>
          <div>
            <div style="opacity: 0.8;">Speed</div>
            <div style="font-size: 18px; font-weight: bold;">${stats.speed.toFixed(1)}/min</div>
          </div>
        </div>

        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3);">
          <div style="font-size: 11px; opacity: 0.8; text-align: center;">
            Achievements: ${stats.achievements.filter(a => a.unlocked).length} / ${stats.achievements.length}
          </div>
        </div>
      `;

      document.body.appendChild(hud);
    }, this.stats);
  }

  /**
   * Show level up animation
   */
  private showLevelUpAnimation() {
    console.log(`
╔════════════════════════════════════════╗
║         🎉 LEVEL UP! 🎉               ║
║                                        ║
║         Level ${this.stats.level.toString().padStart(2, ' ')}                          ║
╚════════════════════════════════════════╝
    `);
  }

  /**
   * Show achievement unlocked animation
   */
  private showAchievementUnlockedAnimation(achievement: Achievement) {
    console.log(`
╔════════════════════════════════════════╗
║    🏆 ACHIEVEMENT UNLOCKED! 🏆        ║
║                                        ║
║    ${achievement.icon} ${achievement.name.padEnd(28, ' ')}  ║
║    ${achievement.description.padEnd(34, ' ')}  ║
║    +${achievement.xp} XP${' '.repeat(34 - achievement.xp.toString().length)}║
╚════════════════════════════════════════╝
    `);
  }

  /**
   * Get current stats
   */
  getStats(): PlayerStats {
    return { ...this.stats };
  }

  /**
   * Save stats to storage
   */
  saveStats(): string {
    return JSON.stringify(this.stats);
  }

  /**
   * Load stats from storage
   */
  static loadStats(data: string): ClickFactoryGamification {
    const stats = JSON.parse(data);
    return new ClickFactoryGamification(stats);
  }
}
