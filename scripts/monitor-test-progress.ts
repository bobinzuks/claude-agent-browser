/**
 * Real-time Test Progress Monitor
 * Monitors the 100-page test progress and displays live statistics
 */

import * as fs from 'fs';
import * as path from 'path';

const progressPath = './data/test-results/100-page-progress.json';

function displayProgress() {
  console.clear();
  console.log('═══════════════════════════════════════════════');
  console.log('📊 100-PAGE TEST PROGRESS MONITOR');
  console.log('═══════════════════════════════════════════════\n');

  if (!fs.existsSync(progressPath)) {
    console.log('⏳ Waiting for test to start...\n');
    console.log('Progress file will appear at:', progressPath);
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

    const completed = data.completed || 0;
    const total = data.total || 100;
    const percentage = ((completed / total) * 100).toFixed(1);
    const results = data.results || [];

    console.log(`Progress: ${completed}/${total} pages (${percentage}%)`);
    console.log(`Last Updated: ${new Date(data.timestamp).toLocaleString()}\n`);

    // Progress bar
    const barLength = 50;
    const filledLength = Math.floor((completed / total) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`[${bar}]\n`);

    if (results.length > 0) {
      // Calculate statistics
      const totalPatterns = results.reduce((sum: number, r: any) => sum + r.patternsLearned, 0);
      const avgSuccessRate = results.reduce((sum: number, r: any) => sum + r.successRate, 0) / results.length;
      const totalDuration = results.reduce((sum: number, r: any) => sum + r.totalDuration, 0);
      const avgDuration = totalDuration / results.length;

      console.log('Statistics:');
      console.log(`  Avg Success Rate: ${(avgSuccessRate * 100).toFixed(1)}%`);
      console.log(`  Total Patterns Learned: ${totalPatterns}`);
      console.log(`  Avg Time per Page: ${(avgDuration / 1000).toFixed(2)}s`);
      console.log(`  Total Time Elapsed: ${(totalDuration / 1000 / 60).toFixed(2)} minutes`);

      // Estimate time remaining
      const estimatedTotalTime = (avgDuration * total) / 1000 / 60;
      const estimatedRemaining = (avgDuration * (total - completed)) / 1000 / 60;
      console.log(`  Estimated Time Remaining: ${estimatedRemaining.toFixed(2)} minutes\n`);

      // Recent results
      console.log('Recent Results:');
      const recent = results.slice(-5).reverse();
      recent.forEach((r: any, i: number) => {
        const icon = r.successRate > 0.8 ? '✅' : r.successRate > 0.5 ? '⚠️' : '❌';
        console.log(`  ${icon} ${r.site.name} - ${(r.successRate * 100).toFixed(1)}% success, ${r.patternsLearned} patterns`);
      });

      // Capability stats
      console.log('\n\nTop Performing Capabilities:');
      const capStats = new Map<string, { total: number; successful: number }>();

      results.forEach((r: any) => {
        r.capabilities.forEach((cap: any) => {
          const stats = capStats.get(cap.capability) || { total: 0, successful: 0 };
          stats.total++;
          if (cap.success) stats.successful++;
          capStats.set(cap.capability, stats);
        });
      });

      Array.from(capStats.entries())
        .sort((a, b) => (b[1].successful / b[1].total) - (a[1].successful / a[1].total))
        .slice(0, 5)
        .forEach(([capability, stats]) => {
          const rate = (stats.successful / stats.total * 100).toFixed(1);
          console.log(`  ${capability}: ${rate}%`);
        });
    }

    console.log('\n\n Press Ctrl+C to stop monitoring');
  } catch (error) {
    console.error('Error reading progress:', (error as Error).message);
  }
}

// Update every 2 seconds
setInterval(displayProgress, 2000);
displayProgress();
