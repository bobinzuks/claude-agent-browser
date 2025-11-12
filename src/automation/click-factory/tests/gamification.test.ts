/**
 * Gamification System - Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ClickFactoryGamification } from '../gamification';

describe('ClickFactoryGamification', () => {
  let gamification: ClickFactoryGamification;

  beforeEach(() => {
    gamification = new ClickFactoryGamification();
  });

  describe('initialization', () => {
    it('should start at level 1 with 0 XP', () => {
      const stats = gamification.getStats();
      expect(stats.level).toBe(1);
      expect(stats.xp).toBe(0);
      expect(stats.formsSubmitted).toBe(0);
    });

    it('should have all achievements locked initially', () => {
      const stats = gamification.getStats();
      const unlockedCount = stats.achievements.filter(a => a.unlocked).length;
      expect(unlockedCount).toBe(0);
    });
  });

  describe('XP and leveling', () => {
    it('should gain XP on successful submission', () => {
      const initialXP = gamification.getStats().xp;
      gamification.recordSubmission(true, 5, 5);
      const newXP = gamification.getStats().xp;

      expect(newXP).toBeGreaterThan(initialXP);
    });

    it('should level up when reaching XP threshold', () => {
      // Award enough XP to level up
      for (let i = 0; i < 10; i++) {
        gamification.recordSubmission(true, 10, 10);
      }

      const stats = gamification.getStats();
      expect(stats.level).toBeGreaterThan(1);
    });

    it('should calculate XP to next level correctly', () => {
      const stats = gamification.getStats();
      expect(stats.xpToNextLevel).toBe(100); // Level 1 requires 100 XP

      // Level up
      for (let i = 0; i < 10; i++) {
        gamification.recordSubmission(true, 10, 10);
      }

      const newStats = gamification.getStats();
      expect(newStats.xpToNextLevel).toBeGreaterThan(100); // Level 2 requires more
    });
  });

  describe('achievements', () => {
    it('should unlock "First Blood" achievement on first submission', () => {
      gamification.recordSubmission(true, 5, 5);

      const stats = gamification.getStats();
      const firstBlood = stats.achievements.find(a => a.id === 'first_blood');

      expect(firstBlood?.unlocked).toBe(true);
      expect(firstBlood?.unlockedAt).toBeInstanceOf(Date);
    });

    it('should unlock "Perfect Ten" with 10 streak', () => {
      // Submit 10 successful forms
      for (let i = 0; i < 10; i++) {
        gamification.recordSubmission(true, 5, 5);
      }

      const stats = gamification.getStats();
      const perfectTen = stats.achievements.find(a => a.id === 'perfect_ten');

      expect(stats.streak).toBe(10);
      expect(perfectTen?.unlocked).toBe(true);
    });

    it('should unlock "Marathon Runner" with 100 submissions', () => {
      for (let i = 0; i < 100; i++) {
        gamification.recordSubmission(true, 5, 5);
      }

      const stats = gamification.getStats();
      const marathon = stats.achievements.find(a => a.id === 'marathon_runner');

      expect(stats.formsSubmitted).toBe(100);
      expect(marathon?.unlocked).toBe(true);
    });
  });

  describe('streak tracking', () => {
    it('should increment streak on success', () => {
      gamification.recordSubmission(true, 5, 5);
      expect(gamification.getStats().streak).toBe(1);

      gamification.recordSubmission(true, 5, 5);
      expect(gamification.getStats().streak).toBe(2);
    });

    it('should reset streak on failure', () => {
      gamification.recordSubmission(true, 5, 5);
      gamification.recordSubmission(true, 5, 5);
      expect(gamification.getStats().streak).toBe(2);

      gamification.recordSubmission(false, 0, 5);
      expect(gamification.getStats().streak).toBe(0);
    });

    it('should track longest streak', () => {
      // First streak of 3
      for (let i = 0; i < 3; i++) {
        gamification.recordSubmission(true, 5, 5);
      }
      expect(gamification.getStats().longestStreak).toBe(3);

      // Break streak
      gamification.recordSubmission(false, 0, 5);

      // Second streak of 5
      for (let i = 0; i < 5; i++) {
        gamification.recordSubmission(true, 5, 5);
      }

      const stats = gamification.getStats();
      expect(stats.longestStreak).toBe(5);
      expect(stats.streak).toBe(5);
    });
  });

  describe('success rate', () => {
    it('should calculate success rate correctly', () => {
      gamification.recordSubmission(true, 5, 5);
      gamification.recordSubmission(true, 5, 5);
      gamification.recordSubmission(false, 0, 5);

      const stats = gamification.getStats();
      expect(stats.successRate).toBeCloseTo(66.67, 1); // 2 out of 3
    });

    it('should be 100% with all successful submissions', () => {
      for (let i = 0; i < 10; i++) {
        gamification.recordSubmission(true, 5, 5);
      }

      const stats = gamification.getStats();
      expect(stats.successRate).toBe(100);
    });
  });

  describe('speed tracking', () => {
    it('should calculate forms per minute', () => {
      // Submit forms rapidly
      for (let i = 0; i < 5; i++) {
        gamification.recordSubmission(true, 5, 5);
      }

      const stats = gamification.getStats();
      expect(stats.speed).toBeGreaterThan(0);
    });
  });

  describe('save and load', () => {
    it('should save stats to JSON', () => {
      gamification.recordSubmission(true, 5, 5);
      gamification.recordSubmission(true, 5, 5);

      const saved = gamification.saveStats();
      expect(saved).toContain('"formsSubmitted":2');
      expect(saved).toContain('"streak":2');
    });

    it('should load stats from JSON', () => {
      // Create stats
      gamification.recordSubmission(true, 5, 5);
      gamification.recordSubmission(true, 5, 5);

      const saved = gamification.saveStats();

      // Load into new instance
      const loaded = ClickFactoryGamification.loadStats(saved);
      const stats = loaded.getStats();

      expect(stats.formsSubmitted).toBe(2);
      expect(stats.streak).toBe(2);
    });
  });

  describe('accuracy bonus', () => {
    it('should award more XP for perfect accuracy', () => {
      const initialXP = gamification.getStats().xp;

      // Perfect accuracy: 10/10 fields
      gamification.recordSubmission(true, 10, 10);
      const perfectXP = gamification.getStats().xp - initialXP;

      // Reset
      gamification = new ClickFactoryGamification();

      // Poor accuracy: 5/10 fields
      gamification.recordSubmission(true, 5, 10);
      const poorXP = gamification.getStats().xp;

      expect(perfectXP).toBeGreaterThan(poorXP);
    });
  });
});
