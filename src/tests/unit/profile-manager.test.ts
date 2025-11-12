/**
 * BOSS 6 Tests: Profile Manager
 */

import { ProfileManager } from '../../setup/browser-profile-manager';
import * as path from 'path';

describe('ProfileManager', () => {
  let manager: ProfileManager;

  beforeEach(async () => {
    const testDir = path.join(process.cwd(), 'test-profiles-' + Date.now());
    manager = new ProfileManager(testDir);
    await manager.initialize();
  });

  it('should create a profile', async () => {
    const profile = await manager.createProfile('test-profile');

    expect(profile).toBeDefined();
    expect(profile.name).toBe('test-profile');
    expect(profile.id).toBeTruthy();
    expect(profile.userAgent).toBeTruthy();
  });

  it('should create profile with random fingerprint', async () => {
    const profile = await manager.createProfile('stealth-profile', {
      randomizeFingerprint: true,
    });

    expect(profile.fingerprint).toBeDefined();
    expect(profile.fingerprint?.screen).toBeDefined();
    expect(profile.fingerprint?.timezone).toBeTruthy();
  });

  it('should list profiles', async () => {
    await manager.createProfile('profile1');
    await manager.createProfile('profile2');

    const profiles = manager.listProfiles();
    expect(profiles.length).toBe(2);
  });

  it('should get profile by name', async () => {
    await manager.createProfile('test');

    const profile = manager.getProfileByName('test');
    expect(profile).toBeDefined();
    expect(profile?.name).toBe('test');
  });

  it('should generate browser config', async () => {
    const profile = await manager.createProfile('test');

    const config = manager.getBrowserConfig(profile.id);
    expect(config.userDataDir).toBeTruthy();
    expect(config.stealthMode).toBe(true);
  });
});
