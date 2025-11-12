/**
 * BOSS 6 Tests: Browser Installer
 */

import { BrowserInstaller } from '../../setup/browser-installer';

describe('BrowserInstaller', () => {
  let installer: BrowserInstaller;

  beforeEach(() => {
    installer = new BrowserInstaller();
  });

  it('should initialize with platform info', () => {
    expect(installer).toBeDefined();
    expect(installer.getInstallDir()).toContain('.claude-agent-browser');
  });

  it('should check if browser is installed', async () => {
    const result = await installer.isInstalled();
    expect(typeof result).toBe('boolean');
  });

  it('should get install directory', () => {
    const dir = installer.getInstallDir();
    expect(dir).toBeTruthy();
    expect(typeof dir).toBe('string');
  });
});
