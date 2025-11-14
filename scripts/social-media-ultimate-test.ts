/**
 * 🎮 SOCIAL MEDIA ULTIMATE TEST
 * Gamified recursive research + testing for 99%+ social media success
 */

import { chromium, Browser } from 'playwright';
import { RecursiveResearchTester } from '../src/automation/recursive-research-tester.js';
import * as fs from 'fs';

async function main() {
  console.log('\\n🚀 ════════════════════════════════════════════════');
  console.log('   SOCIAL MEDIA DOMINATION - ULTIMATE TEST');
  console.log('   99%+ Success Rate Challenge');
  console.log('   ════════════════════════════════════════════════\\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const tester = new RecursiveResearchTester('./data/unified-agentdb');

  const goal = {
    targetSuccessRate: 0.99,
    maxIterations: 10,
    capabilities: [
      'button-detection',
      'form-detection',
      'link-extraction',
      'self-healing',
      'stealth-mode',
      'captcha-avoidance',
    ],
    testSites: [
      // Social Media Platforms
      {
        name: 'GitHub',
        url: 'https://github.com',
        category: 'Tech Platform',
        requiredCapabilities: ['button-detection', 'link-extraction', 'stealth-mode'],
      },
      {
        name: 'Reddit',
        url: 'https://www.reddit.com',
        category: 'Social Media',
        requiredCapabilities: ['button-detection', 'stealth-mode', 'captcha-avoidance'],
      },
      {
        name: 'Twitter/X',
        url: 'https://twitter.com',
        category: 'Social Media',
        requiredCapabilities: ['form-detection', 'stealth-mode', 'captcha-avoidance'],
      },
      {
        name: 'LinkedIn',
        url: 'https://www.linkedin.com',
        category: 'Professional Network',
        requiredCapabilities: ['form-detection', 'button-detection', 'stealth-mode'],
      },
      {
        name: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        category: 'Q&A Platform',
        requiredCapabilities: ['button-detection', 'link-extraction', 'self-healing'],
      },
      {
        name: 'YouTube',
        url: 'https://www.youtube.com',
        category: 'Video Platform',
        requiredCapabilities: ['button-detection', 'stealth-mode'],
      },
      {
        name: 'Medium',
        url: 'https://medium.com',
        category: 'Publishing Platform',
        requiredCapabilities: ['button-detection', 'link-extraction'],
      },
      {
        name: 'Dev.to',
        url: 'https://dev.to',
        category: 'Developer Community',
        requiredCapabilities: ['button-detection', 'link-extraction'],
      },
      {
        name: 'Product Hunt',
        url: 'https://www.producthunt.com',
        category: 'Product Discovery',
        requiredCapabilities: ['button-detection', 'stealth-mode'],
      },
      {
        name: 'Hacker News',
        url: 'https://news.ycombinator.com',
        category: 'Tech News',
        requiredCapabilities: ['link-extraction', 'button-detection'],
      },
      // Testing Sites
      {
        name: 'The Internet - Login',
        url: 'https://the-internet.herokuapp.com/login',
        category: 'Test Site',
        requiredCapabilities: ['form-detection', 'button-detection'],
      },
      {
        name: 'Practice Test Automation',
        url: 'https://practicetestautomation.com/practice-test-login/',
        category: 'Test Site',
        requiredCapabilities: ['form-detection', 'button-detection'],
      },
      {
        name: 'SauceDemo',
        url: 'https://www.saucedemo.com/',
        category: 'Test Site',
        requiredCapabilities: ['form-detection', 'button-detection'],
      },
      {
        name: 'UI Testing Playground - Dynamic',
        url: 'http://uitestingplayground.com/dynamicid',
        category: 'Test Site',
        requiredCapabilities: ['button-detection', 'self-healing'],
      },
      {
        name: 'UI Testing Playground - Shadow DOM',
        url: 'http://uitestingplayground.com/shadowdom',
        category: 'Test Site',
        requiredCapabilities: ['button-detection'],
      },
    ],
  };

  try {
    await tester.runResearchLoop(browser, goal);

    // Get final stats
    const stats = tester.getStats();

    console.log('\\n📊 FINAL STATISTICS:\\n');
    console.log(`Total Iterations: ${stats.totalIterations}`);
    console.log(`Final Success Rate: ${(stats.currentSuccessRate * 100).toFixed(1)}%`);
    console.log(`Average Iteration Time: ${(stats.averageIterationTime / 1000).toFixed(2)}s`);
    console.log(`Total Improvements: ${stats.totalImprovements}`);

    // Save results
    const resultsPath = './data/test-results/social-media-ultimate-results.json';
    fs.writeFileSync(
      resultsPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          goal,
          stats,
          status: stats.currentSuccessRate >= goal.targetSuccessRate ? 'SUCCESS' : 'INCOMPLETE',
        },
        null,
        2
      )
    );

    console.log(`\\n✅ Results saved: ${resultsPath}\\n`);

    // Final grade
    const finalRate = stats.currentSuccessRate * 100;
    let grade = 'F';
    if (finalRate >= 100) grade = 'S++';
    else if (finalRate >= 99) grade = 'S+';
    else if (finalRate >= 95) grade = 'A+';
    else if (finalRate >= 90) grade = 'A';
    else if (finalRate >= 85) grade = 'B+';
    else if (finalRate >= 80) grade = 'B';

    console.log(`\\n🎓 FINAL GRADE: ${grade}\\n`);

    if (stats.currentSuccessRate >= goal.targetSuccessRate) {
      console.log('🎉 ════════════════════════════════════════════════');
      console.log('   MISSION ACCOMPLISHED!');
      console.log('   The Princess will be VERY pleased!');
      console.log('   ════════════════════════════════════════════════\\n');
    } else {
      console.log('⚠️  Goal not yet achieved. Continue iteration...');
    }
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
