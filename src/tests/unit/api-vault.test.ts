/**
 * API Vault Tests
 * BONUS LEVEL: Secure Credential Storage
 */

import { APIVault } from '../../extension/lib/api-vault';
import type { APICredential } from '../../extension/content/api-collector';

describe('API Vault - BONUS LEVEL', () => {
  let vault: APIVault;
  let testCredential: APICredential;

  beforeEach(() => {
    vault = new APIVault('test-encryption-key');
    testCredential = {
      service: 'GitHub',
      email: 'test@example.com',
      token: 'ghp_test_token_123',
      signupUrl: 'https://github.com/signup',
      apiDocsUrl: 'https://docs.github.com',
      collectedAt: new Date().toISOString(),
      metadata: {},
    };
  });

  describe('Storage Operations', () => {
    it('should store a credential and return ID', () => {
      const id = vault.store(testCredential);
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('should retrieve credential by ID', () => {
      const id = vault.store(testCredential);
      const retrieved = vault.retrieve(id);
      expect(retrieved).toEqual(testCredential);
    });

    it('should retrieve credential by service name', () => {
      vault.store(testCredential);
      const retrieved = vault.retrieve('GitHub');
      expect(retrieved).toEqual(testCredential);
    });

    it('should return null for non-existent credential', () => {
      const retrieved = vault.retrieve('NonExistent');
      expect(retrieved).toBeNull();
    });

    it('should track access count', () => {
      const id = vault.store(testCredential);
      vault.retrieve(id);
      vault.retrieve(id);
      vault.retrieve(id);

      const stats = vault.getStats();
      expect(stats.totalAccesses).toBe(3);
    });
  });

  describe('Service Listing', () => {
    it('should list all stored services', () => {
      vault.store(testCredential);
      vault.store({
        ...testCredential,
        service: 'OpenWeatherMap',
        email: 'weather@example.com',
      });

      const services = vault.listServices();
      expect(services).toContain('GitHub');
      expect(services).toContain('OpenWeatherMap');
      expect(services.length).toBe(2);
    });
  });

  describe('Import/Export', () => {
    it('should export vault as document', () => {
      vault.store(testCredential);
      const doc = vault.exportVault();

      expect(doc).toHaveProperty('version');
      expect(doc).toHaveProperty('entries');
      expect(doc.metadata.totalAPIs).toBe(1);
      expect(doc.metadata.services).toContain('GitHub');
    });

    it('should import vault from document', () => {
      vault.store(testCredential);
      const exported = vault.exportVault();

      const newVault = new APIVault();
      newVault.importVault(exported);

      const retrieved = newVault.retrieve('GitHub');
      expect(retrieved).toEqual(testCredential);
    });

    it('should save vault to JSON string', () => {
      vault.store(testCredential);
      const json = vault.saveToFile();

      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.entries.length).toBe(1);
    });

    it('should load vault from JSON string', () => {
      vault.store(testCredential);
      const json = vault.saveToFile();

      const newVault = new APIVault();
      newVault.loadFromFile(json);

      const retrieved = newVault.retrieve('GitHub');
      expect(retrieved?.service).toBe('GitHub');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      vault.store(testCredential);
      vault.store({
        ...testCredential,
        service: 'GitHub Actions',
        email: 'actions@example.com',
      });
      vault.store({
        ...testCredential,
        service: 'OpenWeatherMap',
        email: 'weather@example.com',
      });
    });

    it('should search by partial service name', () => {
      const results = vault.search('GitHub');
      expect(results.length).toBe(2);
    });

    it('should search case-insensitively', () => {
      const results = vault.search('github');
      expect(results.length).toBe(2);
    });

    it('should return empty array for no matches', () => {
      const results = vault.search('NonExistent');
      expect(results.length).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should track total APIs', () => {
      vault.store(testCredential);
      vault.store({ ...testCredential, service: 'API2' });
      vault.store({ ...testCredential, service: 'API3' });

      const stats = vault.getStats();
      expect(stats.totalAPIs).toBe(3);
    });

    it('should identify most accessed credential', () => {
      const id1 = vault.store(testCredential);
      const id2 = vault.store({ ...testCredential, service: 'PopularAPI' });

      vault.retrieve(id2);
      vault.retrieve(id2);
      vault.retrieve(id2);
      vault.retrieve(id1);

      const stats = vault.getStats();
      expect(stats.mostAccessed).toBe('PopularAPI');
    });

    it('should return null for most accessed when vault is empty', () => {
      const stats = vault.getStats();
      expect(stats.mostAccessed).toBeNull();
    });
  });

  describe('Complete Workflow', () => {
    it('should handle full vault lifecycle', () => {
      // Store 5 APIs
      const apis = [
        { ...testCredential, service: 'GitHub', apiKey: 'gh_key_1' },
        { ...testCredential, service: 'OpenWeatherMap', apiKey: 'owm_key_2' },
        { ...testCredential, service: 'NewsAPI', apiKey: 'news_key_3' },
        { ...testCredential, service: 'RapidAPI', apiKey: 'rapid_key_4' },
        { ...testCredential, service: 'Anthropic', apiKey: 'sk-ant_key_5' },
      ];

      apis.forEach((api) => vault.store(api));

      // Verify all stored
      const stats = vault.getStats();
      expect(stats.totalAPIs).toBe(5);

      // Export to file
      const json = vault.saveToFile();
      expect(json).toBeTruthy();

      // Load into new vault
      const newVault = new APIVault();
      newVault.loadFromFile(json);

      // Verify all APIs accessible
      apis.forEach((api) => {
        const retrieved = newVault.retrieve(api.service);
        expect(retrieved).toBeTruthy();
        expect(retrieved?.apiKey).toBe(api.apiKey);
      });
    });
  });
});
