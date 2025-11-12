/**
 * BOSS 6: Browser Profile Manager
 * Manages multiple browser profiles for different identities
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { BrowserConfig } from './browser-installer';

export interface BrowserProfile {
  id: string;
  name: string;
  userAgent?: string;
  fingerprint?: BrowserFingerprint;
  preferences?: Record<string, any>;
  createdAt: string;
  lastUsed?: string;
}

export interface BrowserFingerprint {
  screen: {
    width: number;
    height: number;
    colorDepth: number;
  };
  timezone: string;
  language: string;
  platform: string;
  vendor: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  webgl?: {
    vendor: string;
    renderer: string;
  };
}

/**
 * ProfileManager - Manages browser profiles and fingerprints
 */
export class ProfileManager {
  private profilesDir: string;
  private profiles: Map<string, BrowserProfile>;

  constructor(baseDir?: string) {
    this.profilesDir = baseDir || path.join(process.cwd(), 'profiles');
    this.profiles = new Map();
  }

  /**
   * Initialize profile manager
   */
  public async initialize(): Promise<void> {
    await fs.mkdir(this.profilesDir, { recursive: true });
    await this.loadProfiles();
  }

  /**
   * Create a new profile
   */
  public async createProfile(name: string, options: {
    randomizeFingerprint?: boolean;
    userAgent?: string;
  } = {}): Promise<BrowserProfile> {
    const id = this.generateProfileId();

    const profile: BrowserProfile = {
      id,
      name,
      userAgent: options.userAgent || this.generateUserAgent(),
      fingerprint: options.randomizeFingerprint ? this.generateRandomFingerprint() : undefined,
      createdAt: new Date().toISOString(),
    };

    this.profiles.set(id, profile);
    await this.saveProfile(profile);

    return profile;
  }

  /**
   * Get profile by ID
   */
  public getProfile(id: string): BrowserProfile | undefined {
    return this.profiles.get(id);
  }

  /**
   * Get profile by name
   */
  public getProfileByName(name: string): BrowserProfile | undefined {
    for (const profile of this.profiles.values()) {
      if (profile.name === name) {
        return profile;
      }
    }
    return undefined;
  }

  /**
   * List all profiles
   */
  public listProfiles(): BrowserProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Update profile
   */
  public async updateProfile(id: string, updates: Partial<BrowserProfile>): Promise<void> {
    const profile = this.profiles.get(id);

    if (!profile) {
      throw new Error(`Profile not found: ${id}`);
    }

    Object.assign(profile, updates);
    profile.lastUsed = new Date().toISOString();

    await this.saveProfile(profile);
  }

  /**
   * Delete profile
   */
  public async deleteProfile(id: string): Promise<void> {
    const profile = this.profiles.get(id);

    if (!profile) {
      throw new Error(`Profile not found: ${id}`);
    }

    this.profiles.delete(id);

    const profilePath = path.join(this.profilesDir, `${id}.json`);
    await fs.unlink(profilePath);

    // Delete profile data directory if exists
    const dataDir = path.join(this.profilesDir, id);
    try {
      await fs.rm(dataDir, { recursive: true });
    } catch {
      // Directory might not exist
    }
  }

  /**
   * Get profile data directory
   */
  public getProfileDataDir(id: string): string {
    return path.join(this.profilesDir, id);
  }

  /**
   * Generate random browser fingerprint
   */
  private generateRandomFingerprint(): BrowserFingerprint {
    const resolutions = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1600, height: 900 },
      { width: 2560, height: 1440 },
    ];

    const timezones = [
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Asia/Shanghai',
    ];

    const languages = ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES', 'ja-JP', 'zh-CN'];

    const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];

    const vendors = ['Google Inc.', 'Apple Computer, Inc.'];

    const resolution = resolutions[Math.floor(Math.random() * resolutions.length)];

    return {
      screen: {
        ...resolution,
        colorDepth: 24,
      },
      timezone: timezones[Math.floor(Math.random() * timezones.length)],
      language: languages[Math.floor(Math.random() * languages.length)],
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      hardwareConcurrency: 4 + Math.floor(Math.random() * 12), // 4-16 cores
      deviceMemory: Math.pow(2, 1 + Math.floor(Math.random() * 4)), // 2, 4, 8, or 16 GB
      webgl: {
        vendor: 'WebKit',
        renderer: 'WebKit WebGL',
      },
    };
  }

  /**
   * Generate realistic user agent
   */
  private generateUserAgent(): string {
    const chromeVersions = ['120.0.0.0', '119.0.0.0', '118.0.0.0'];

    const version = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];

    // Generate Windows UA (most common)
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
  }

  /**
   * Generate unique profile ID
   */
  private generateProfileId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Save profile to disk
   */
  private async saveProfile(profile: BrowserProfile): Promise<void> {
    const profilePath = path.join(this.profilesDir, `${profile.id}.json`);
    await fs.writeFile(profilePath, JSON.stringify(profile, null, 2));

    // Create profile data directory
    const dataDir = this.getProfileDataDir(profile.id);
    await fs.mkdir(dataDir, { recursive: true });
  }

  /**
   * Load all profiles from disk
   */
  private async loadProfiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.profilesDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const profilePath = path.join(this.profilesDir, file);
            const data = await fs.readFile(profilePath, 'utf-8');
            const profile: BrowserProfile = JSON.parse(data);
            this.profiles.set(profile.id, profile);
          } catch (error) {
            console.error(`Failed to load profile ${file}:`, error);
          }
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }
  }

  /**
   * Generate browser launch config for profile
   */
  public getBrowserConfig(profileId: string): BrowserConfig {
    const profile = this.profiles.get(profileId);

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    return {
      userDataDir: this.getProfileDataDir(profileId),
      profileName: profile.name,
      headless: false,
      stealthMode: true,
      fingerprintRandomization: profile.fingerprint !== undefined,
    };
  }

  /**
   * Export profile
   */
  public exportProfile(id: string): string {
    const profile = this.profiles.get(id);

    if (!profile) {
      throw new Error(`Profile not found: ${id}`);
    }

    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import profile
   */
  public async importProfile(data: string): Promise<BrowserProfile> {
    const profile: BrowserProfile = JSON.parse(data);

    // Generate new ID to avoid conflicts
    const newId = this.generateProfileId();
    profile.id = newId;

    this.profiles.set(newId, profile);
    await this.saveProfile(profile);

    return profile;
  }

  /**
   * Get profiles directory
   */
  public getProfilesDir(): string {
    return this.profilesDir;
  }
}
