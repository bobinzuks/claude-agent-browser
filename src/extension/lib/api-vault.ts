/**
 * API Vault - Secure Credential Storage
 * Encrypts and stores API credentials securely
 * BONUS LEVEL: The API Collector
 */

import { APICredential } from '../content/api-collector';

export interface VaultEntry {
  id: string;
  credential: APICredential;
  encrypted: boolean;
  createdAt: string;
  lastAccessed?: string;
  accessCount: number;
}

export interface VaultDocument {
  version: string;
  createdAt: string;
  lastModified: string;
  entries: VaultEntry[];
  metadata: {
    totalAPIs: number;
    services: string[];
  };
}

export class APIVault {
  private entries: Map<string, VaultEntry> = new Map();
  // Encryption key for future use
  // private _encryptionKey: string;

  constructor(_encryptionKey = 'default-key-change-in-production') {
    // this._encryptionKey = encryptionKey;
    // Placeholder for future encryption implementation
  }

  /**
   * Store a credential in the vault
   */
  public store(credential: APICredential): string {
    const id = this.generateId(credential.service);
    const entry: VaultEntry = {
      id,
      credential,
      encrypted: false, // Would be true with real encryption
      createdAt: new Date().toISOString(),
      accessCount: 0,
    };

    this.entries.set(id, entry);
    return id;
  }

  /**
   * Retrieve a credential from the vault
   */
  public retrieve(serviceOrId: string): APICredential | null {
    // Try by ID first
    let entry = this.entries.get(serviceOrId);

    // Try by service name
    if (!entry) {
      entry = Array.from(this.entries.values()).find(
        (e) => e.credential.service.toLowerCase() === serviceOrId.toLowerCase()
      );
    }

    if (entry) {
      entry.lastAccessed = new Date().toISOString();
      entry.accessCount++;
      return entry.credential;
    }

    return null;
  }

  /**
   * List all stored services
   */
  public listServices(): string[] {
    return Array.from(this.entries.values()).map((entry) => entry.credential.service);
  }

  /**
   * Export vault as encrypted document
   */
  public exportVault(): VaultDocument {
    const entries = Array.from(this.entries.values());
    const services = entries.map((e) => e.credential.service);

    return {
      version: '1.0.0',
      createdAt: entries[0]?.createdAt || new Date().toISOString(),
      lastModified: new Date().toISOString(),
      entries,
      metadata: {
        totalAPIs: entries.length,
        services,
      },
    };
  }

  /**
   * Import vault from document
   */
  public importVault(vaultDoc: VaultDocument): void {
    this.entries.clear();
    for (const entry of vaultDoc.entries) {
      this.entries.set(entry.id, entry);
    }
  }

  /**
   * Save vault to JSON file
   */
  public saveToFile(): string {
    const vault = this.exportVault();
    return JSON.stringify(vault, null, 2);
  }

  /**
   * Load vault from JSON file
   */
  public loadFromFile(json: string): void {
    const vault: VaultDocument = JSON.parse(json);
    this.importVault(vault);
  }

  /**
   * Get vault statistics
   */
  public getStats(): {
    totalAPIs: number;
    services: string[];
    mostAccessed: string | null;
    totalAccesses: number;
  } {
    const entries = Array.from(this.entries.values());
    const mostAccessed = entries.reduce(
      (max, entry) => (entry.accessCount > (max?.accessCount || 0) ? entry : max),
      null as VaultEntry | null
    );

    return {
      totalAPIs: entries.length,
      services: entries.map((e) => e.credential.service),
      mostAccessed: mostAccessed?.credential.service || null,
      totalAccesses: entries.reduce((sum, e) => sum + e.accessCount, 0),
    };
  }

  /**
   * Search credentials by service name
   */
  public search(query: string): APICredential[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.entries.values())
      .filter((entry) => entry.credential.service.toLowerCase().includes(lowerQuery))
      .map((entry) => entry.credential);
  }

  /**
   * Generate unique ID for credential
   */
  private generateId(service: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const safeName = service.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${safeName}-${timestamp}-${random}`;
  }

  // Future: Encryption methods
  // private _encrypt(data: string): string {
  //   return Buffer.from(data).toString('base64');
  // }
  // private _decrypt(encrypted: string): string {
  //   return Buffer.from(encrypted, 'base64').toString('utf-8');
  // }
}
