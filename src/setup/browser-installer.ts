/**
 * BOSS 6: The Thorium Guardian - Browser Installer
 * Automates Thorium browser installation and setup
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface BrowserConfig {
  browserPath?: string;
  userDataDir?: string;
  profileName?: string;
  headless?: boolean;
  stealthMode?: boolean;
  fingerprintRandomization?: boolean;
}

export interface InstallResult {
  success: boolean;
  browserPath: string;
  version?: string;
  error?: string;
}

/**
 * BrowserInstaller - Manages Thorium browser installation and configuration
 */
export class BrowserInstaller {
  private platform: string;
  private arch: string;
  private installDir: string;

  constructor(installDir?: string) {
    this.platform = os.platform();
    this.arch = os.arch();
    this.installDir = installDir || path.join(os.homedir(), '.claude-agent-browser');
  }

  /**
   * Install Thorium browser
   */
  public async install(): Promise<InstallResult> {
    console.log(`📦 Installing Thorium browser for ${this.platform}-${this.arch}...`);

    try {
      await fs.mkdir(this.installDir, { recursive: true });

      switch (this.platform) {
        case 'linux':
          return await this.installLinux();
        case 'darwin':
          return await this.installMacOS();
        case 'win32':
          return await this.installWindows();
        default:
          return {
            success: false,
            browserPath: '',
            error: `Unsupported platform: ${this.platform}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        browserPath: '',
        error: String(error),
      };
    }
  }

  /**
   * Install on Linux
   */
  private async installLinux(): Promise<InstallResult> {
    const downloadUrl = this.getThoriumDownloadUrl('linux');

    if (!downloadUrl) {
      return {
        success: false,
        browserPath: '',
        error: 'No download URL available for Linux',
      };
    }

    const downloadPath = path.join(this.installDir, 'thorium.deb');

    console.log(`  → Downloading from ${downloadUrl}...`);
    await this.downloadFile(downloadUrl, downloadPath);

    console.log(`  → Installing package...`);
    try {
      await execAsync(`sudo dpkg -i ${downloadPath}`);
      await execAsync(`sudo apt-get install -f -y`); // Fix dependencies
    } catch (error) {
      // Package might already be installed
      console.log(`  ⚠️  Package install warning: ${error}`);
    }

    const browserPath = '/usr/bin/thorium-browser';
    const version = await this.getBrowserVersion(browserPath);

    return {
      success: true,
      browserPath,
      version,
    };
  }

  /**
   * Install on macOS
   */
  private async installMacOS(): Promise<InstallResult> {
    const downloadUrl = this.getThoriumDownloadUrl('mac');

    if (!downloadUrl) {
      return {
        success: false,
        browserPath: '',
        error: 'No download URL available for macOS',
      };
    }

    const downloadPath = path.join(this.installDir, 'Thorium.dmg');

    console.log(`  → Downloading from ${downloadUrl}...`);
    await this.downloadFile(downloadUrl, downloadPath);

    console.log(`  → Mounting DMG...`);
    await execAsync(`hdiutil attach ${downloadPath}`);

    console.log(`  → Copying to Applications...`);
    await execAsync(`cp -R "/Volumes/Thorium/Thorium.app" "/Applications/"`);

    console.log(`  → Unmounting DMG...`);
    await execAsync(`hdiutil detach "/Volumes/Thorium"`);

    const browserPath = '/Applications/Thorium.app/Contents/MacOS/Thorium';
    const version = await this.getBrowserVersion(browserPath);

    return {
      success: true,
      browserPath,
      version,
    };
  }

  /**
   * Install on Windows
   */
  private async installWindows(): Promise<InstallResult> {
    const downloadUrl = this.getThoriumDownloadUrl('windows');

    if (!downloadUrl) {
      return {
        success: false,
        browserPath: '',
        error: 'No download URL available for Windows',
      };
    }

    const downloadPath = path.join(this.installDir, 'thorium-installer.exe');

    console.log(`  → Downloading from ${downloadUrl}...`);
    await this.downloadFile(downloadUrl, downloadPath);

    console.log(`  → Running installer...`);
    await execAsync(`${downloadPath} /silent /install`);

    const browserPath = path.join(
      process.env.PROGRAMFILES || 'C:\\Program Files',
      'Thorium',
      'thorium.exe'
    );

    const version = await this.getBrowserVersion(browserPath);

    return {
      success: true,
      browserPath,
      version,
    };
  }

  /**
   * Get Thorium download URL for platform
   */
  private getThoriumDownloadUrl(platform: 'linux' | 'mac' | 'windows'): string | null {
    // Thorium browser GitHub releases
    // Note: These are placeholder URLs - actual URLs would come from GitHub API
    const baseUrl = 'https://github.com/Alex313031/thorium/releases/latest/download';

    const urls = {
      linux: `${baseUrl}/thorium-browser_latest_amd64.deb`,
      mac: `${baseUrl}/Thorium_MacOS.dmg`,
      windows: `${baseUrl}/thorium_mini_installer.exe`,
    };

    return urls[platform] || null;
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string, destination: string): Promise<void> {
    // Use curl/wget depending on platform
    const command = this.platform === 'win32'
      ? `curl -L -o "${destination}" "${url}"`
      : `wget -O "${destination}" "${url}"`;

    try {
      await execAsync(command);
    } catch (error) {
      throw new Error(`Failed to download ${url}: ${error}`);
    }
  }

  /**
   * Get browser version
   */
  private async getBrowserVersion(browserPath: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`"${browserPath}" --version`);
      return stdout.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Check if browser is installed
   */
  public async isInstalled(browserPath?: string): Promise<boolean> {
    const paths = browserPath ? [browserPath] : [
      '/usr/bin/thorium-browser', // Linux
      '/Applications/Thorium.app/Contents/MacOS/Thorium', // macOS
      path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Thorium', 'thorium.exe'), // Windows
    ];

    for (const p of paths) {
      try {
        await fs.access(p);
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }

  /**
   * Get installation directory
   */
  public getInstallDir(): string {
    return this.installDir;
  }
}
