#!/usr/bin/env ts-node
/**
 * Import Marathon Training Data into Click Factory AgentDB
 *
 * This script imports 521 patterns from the Affiliate-Networks-that-Bundle
 * marathon training session into the Click Factory's AgentDB instance.
 */

import { AgentDBClient } from '../src/training/agentdb-client';
import * as fs from 'fs';
import * as path from 'path';

interface MarathonPattern {
  timestamp: string;
  site: string;
  selector: string;
  action: string;
  value: string;
  success: boolean;
  confidence: number;
}

interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  duration: number;
}

class MarathonTrainingImporter {
  private db: AgentDBClient;
  private dbPath: string;
  private marathonDataPath: string;

  constructor(dbPath: string, marathonDataPath: string) {
    this.dbPath = dbPath;
    this.marathonDataPath = marathonDataPath;
    this.db = new AgentDBClient(dbPath, 384);
  }

  async importMarathonData(): Promise<ImportStats> {
    const startTime = Date.now();
    console.log('🚀 Starting Marathon Training Data Import\n');
    console.log(`Database: ${this.dbPath}`);
    console.log(`Source: ${this.marathonDataPath}\n`);

    // Verify source file exists
    if (!fs.existsSync(this.marathonDataPath)) {
      throw new Error(`Marathon data file not found: ${this.marathonDataPath}`);
    }

    // Create database directory if needed
    const dbDir = path.dirname(path.join(this.dbPath, 'index.dat'));
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`✓ Created database directory: ${dbDir}\n`);
    }

    // Load marathon data
    console.log('📂 Loading marathon training data...');
    const marathonData: MarathonPattern[] = JSON.parse(
      fs.readFileSync(this.marathonDataPath, 'utf-8')
    );
    console.log(`✓ Loaded ${marathonData.length} patterns\n`);

    // Import patterns
    console.log('📥 Importing patterns...\n');
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < marathonData.length; i++) {
      const entry = marathonData[i];

      try {
        // Validate required fields
        if (!entry.action) {
          console.log(`  ⚠️  Pattern ${i + 1}: Missing action, skipping`);
          skipped++;
          continue;
        }

        // Transform to AgentDB format
        const pattern = {
          action: entry.action,
          selector: entry.selector,
          value: entry.value || undefined,
          url: entry.site, // RENAME: site → url
          success: entry.success ?? true,
          timestamp: entry.timestamp || new Date().toISOString(),
          metadata: {
            confidence: entry.confidence,
            source: 'marathon-training',
            originalSite: entry.site,
            importedAt: new Date().toISOString()
          }
        };

        // Store in AgentDB
        this.db.storeAction(pattern);
        imported++;

        // Progress indicator
        if (imported % 50 === 0) {
          console.log(`  📊 Progress: ${imported}/${marathonData.length} patterns imported...`);
        }
      } catch (error) {
        console.error(`  ❌ Error importing pattern ${i + 1}: ${(error as Error).message}`);
        errors++;
      }
    }

    // Save database
    console.log('\n💾 Saving database...');
    this.db.save();
    console.log('✓ Database saved\n');

    const duration = Date.now() - startTime;

    return {
      total: marathonData.length,
      imported,
      skipped,
      errors,
      duration
    };
  }

  printResults(stats: ImportStats): void {
    console.log('═══════════════════════════════════════');
    console.log('📊 IMPORT COMPLETE - SUMMARY REPORT');
    console.log('═══════════════════════════════════════\n');

    console.log('Import Statistics:');
    console.log(`  Total patterns: ${stats.total}`);
    console.log(`  ✓ Imported: ${stats.imported} (${((stats.imported / stats.total) * 100).toFixed(1)}%)`);
    console.log(`  ⚠ Skipped: ${stats.skipped} (${((stats.skipped / stats.total) * 100).toFixed(1)}%)`);
    console.log(`  ✗ Errors: ${stats.errors} (${((stats.errors / stats.total) * 100).toFixed(1)}%)`);
    console.log(`  Duration: ${(stats.duration / 1000).toFixed(2)}s\n`);

    // Get AgentDB statistics
    const dbStats = this.db.getStatistics();
    console.log('AgentDB Statistics:');
    console.log(`  Total actions: ${dbStats.totalActions}`);
    console.log(`  Success rate: ${(dbStats.successRate * 100).toFixed(2)}%`);
    console.log(`  Action types:`, dbStats.actionTypes);
    console.log(`  Avg embedding time: ${dbStats.averageEmbeddingTime.toFixed(2)}ms\n`);

    // Get top patterns
    console.log('Top 10 Most Common Patterns:');
    const topPatterns = this.db.getTopPatterns(10);
    topPatterns.forEach((pattern, i) => {
      const successRate = (pattern.successRate * 100).toFixed(0);
      console.log(`  ${i + 1}. ${pattern.pattern}`);
      console.log(`     Count: ${pattern.count}, Success: ${successRate}%`);
    });

    console.log('\n✅ Marathon training data successfully imported!');
    console.log(`📁 Database location: ${this.dbPath}/\n`);
  }

  async testQueries(): Promise<void> {
    console.log('🔍 Testing Pattern Queries...\n');

    // Test username field query
    const usernameResults = this.db.findSimilar(
      { action: 'fill', selector: '#username' },
      5
    );
    console.log(`Username patterns found: ${usernameResults.length}`);
    if (usernameResults.length > 0) {
      console.log('  Top match:', usernameResults[0].pattern);
      console.log('  Similarity:', (usernameResults[0].similarity * 100).toFixed(1) + '%');
    }

    // Test email field query
    const emailResults = this.db.findSimilar(
      { action: 'fill', selector: 'input[type="email"]' },
      5
    );
    console.log(`\nEmail patterns found: ${emailResults.length}`);
    if (emailResults.length > 0) {
      console.log('  Top match:', emailResults[0].pattern);
      console.log('  Similarity:', (emailResults[0].similarity * 100).toFixed(1) + '%');
    }

    // Test password field query
    const passwordResults = this.db.findSimilar(
      { action: 'fill', selector: '#password' },
      5
    );
    console.log(`\nPassword patterns found: ${passwordResults.length}`);
    if (passwordResults.length > 0) {
      console.log('  Top match:', passwordResults[0].pattern);
      console.log('  Similarity:', (passwordResults[0].similarity * 100).toFixed(1) + '%');
    }

    console.log('\n✅ Query tests complete\n');
  }
}

async function main() {
  // Paths
  const dbPath = path.resolve('./data/click-factory');
  const marathonDataPath = path.resolve(
    '/media/terry/data/projects/projects/Affiliate-Networks-that-Bundle/training-results/marathon/agentdb-export.json'
  );

  try {
    // Create importer
    const importer = new MarathonTrainingImporter(dbPath, marathonDataPath);

    // Import data
    const stats = await importer.importMarathonData();

    // Print results
    importer.printResults(stats);

    // Test queries
    await importer.testQueries();

    console.log('🎉 All done! Click Factory can now use these patterns.');
  } catch (error) {
    console.error('\n❌ Import failed:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

// Run if called directly
main().catch(console.error);

export { MarathonTrainingImporter };
