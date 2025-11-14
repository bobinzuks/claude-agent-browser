/**
 * Training Data Analysis Script
 * Analyzes AgentDB patterns and generates comprehensive report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metadataPath = path.join(__dirname, 'data', 'unified-agentdb', 'metadata.json');

console.log('\n========================================');
console.log('TRAINING DATA GENERATION REPORT');
console.log('========================================\n');

try {
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

  console.log('DATABASE INFORMATION:');
  console.log('-'.repeat(40));
  console.log(`Version: ${metadata.version}`);
  console.log(`Dimensions: ${metadata.dimensions}`);
  console.log(`Total Patterns Captured: ${metadata.nextId}`);
  console.log(`Saved At: ${metadata.savedAt}`);
  console.log();

  // Analyze patterns
  const patterns = metadata.patternsWithIds || [];

  // Statistics
  const stats = {
    totalPatterns: patterns.length,
    successfulPatterns: 0,
    failedPatterns: 0,
    actionTypes: {},
    sources: {},
    urls: {},
    capabilities: {}
  };

  patterns.forEach(([id, pattern]) => {
    // Success rate
    if (pattern.success) {
      stats.successfulPatterns++;
    } else {
      stats.failedPatterns++;
    }

    // Action types
    stats.actionTypes[pattern.action] = (stats.actionTypes[pattern.action] || 0) + 1;

    // Sources
    if (pattern.metadata && pattern.metadata.source) {
      stats.sources[pattern.metadata.source] = (stats.sources[pattern.metadata.source] || 0) + 1;
    }

    // URLs
    if (pattern.url) {
      const domain = pattern.url.split('/')[2] || pattern.url;
      stats.urls[domain] = (stats.urls[domain] || 0) + 1;
    }

    // Capabilities
    if (pattern.metadata && pattern.metadata.capability) {
      stats.capabilities[pattern.metadata.capability] = (stats.capabilities[pattern.metadata.capability] || 0) + 1;
    }
  });

  const successRate = (stats.successfulPatterns / stats.totalPatterns * 100).toFixed(2);

  console.log('PATTERN STATISTICS:');
  console.log('-'.repeat(40));
  console.log(`Total Patterns: ${stats.totalPatterns}`);
  console.log(`Successful Patterns: ${stats.successfulPatterns}`);
  console.log(`Failed Patterns: ${stats.failedPatterns}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log();

  console.log('ACTION TYPE BREAKDOWN:');
  console.log('-'.repeat(40));
  Object.entries(stats.actionTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([action, count]) => {
      const percentage = (count / stats.totalPatterns * 100).toFixed(1);
      console.log(`  ${action.padEnd(25)} ${count.toString().padStart(5)} patterns (${percentage}%)`);
    });
  console.log();

  console.log('DATA SOURCES:');
  console.log('-'.repeat(40));
  Object.entries(stats.sources)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      const percentage = (count / stats.totalPatterns * 100).toFixed(1);
      console.log(`  ${source.padEnd(25)} ${count.toString().padStart(5)} patterns (${percentage}%)`);
    });
  console.log();

  console.log('CAPABILITY BREAKDOWN:');
  console.log('-'.repeat(40));
  Object.entries(stats.capabilities)
    .sort((a, b) => b[1] - a[1])
    .forEach(([capability, count]) => {
      const percentage = (count / stats.totalPatterns * 100).toFixed(1);
      console.log(`  ${capability.padEnd(25)} ${count.toString().padStart(5)} patterns (${percentage}%)`);
    });
  console.log();

  console.log('TOP 10 TESTED DOMAINS:');
  console.log('-'.repeat(40));
  Object.entries(stats.urls)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([url, count]) => {
      console.log(`  ${url.padEnd(40)} ${count.toString().padStart(4)} patterns`);
    });
  console.log();

  console.log('STORAGE INFORMATION:');
  console.log('-'.repeat(40));
  const indexSize = fs.statSync(path.join(__dirname, 'data', 'unified-agentdb', 'index.dat')).size;
  const metadataSize = fs.statSync(metadataPath).size;
  console.log(`Index Size: ${(indexSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Metadata Size: ${(metadataSize / 1024).toFixed(2)} KB`);
  console.log(`Total Storage: ${((indexSize + metadataSize) / 1024 / 1024).toFixed(2)} MB`);
  console.log();

  console.log('TRAINING DATA FILES:');
  console.log('-'.repeat(40));
  console.log(`  Index: ${path.join(__dirname, 'data/unified-agentdb/index.dat')}`);
  console.log(`  Metadata: ${metadataPath}`);
  console.log();

  console.log('========================================');
  console.log('ANALYSIS COMPLETE');
  console.log('========================================\n');

} catch (error) {
  console.error('Error analyzing training data:', error);
  process.exit(1);
}
