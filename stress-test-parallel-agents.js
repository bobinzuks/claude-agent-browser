#!/usr/bin/env node
/**
 * STRESS TEST - Multiple Parallel Browser Agents
 * Each agent performs increasingly difficult automation tasks
 */

import { BrowserController } from './dist/mcp-bridge/browser-controller.js';
import { AgentDBClient } from './dist/training/agentdb-client.js';

const AGENT_TASKS = [
  {
    id: 'agent-1',
    difficulty: 'EASY',
    task: 'Navigate and extract page title',
    url: 'https://example.com',
    actions: async (controller) => {
      await controller.navigate('https://example.com');
      const result = await controller.executeScript('() => document.title');
      return { title: result.data };
    }
  },
  {
    id: 'agent-2',
    difficulty: 'EASY',
    task: 'Navigate to IANA and extract domain info',
    url: 'https://www.iana.org',
    actions: async (controller) => {
      await controller.navigate('https://www.iana.org/domains/reserved');
      const result = await controller.executeScript('() => document.querySelector("h1")?.textContent');
      return { header: result.data };
    }
  },
  {
    id: 'agent-3',
    difficulty: 'MEDIUM',
    task: 'Multi-page navigation with data extraction',
    url: 'https://httpbin.org',
    actions: async (controller) => {
      await controller.navigate('https://httpbin.org/html');
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = await controller.executeScript('() => document.body.textContent.substring(0, 100)');
      return { content: result.data };
    }
  },
  {
    id: 'agent-4',
    difficulty: 'MEDIUM',
    task: 'JavaScript execution and DOM manipulation',
    url: 'https://example.com',
    actions: async (controller) => {
      await controller.navigate('https://example.com');
      const result = await controller.executeScript(`() => {
        const h1 = document.querySelector('h1');
        const p = document.querySelector('p');
        return {
          h1Text: h1?.textContent,
          pText: p?.textContent?.substring(0, 50),
          elementCount: document.querySelectorAll('*').length
        };
      }`);
      return result.data;
    }
  },
  {
    id: 'agent-5',
    difficulty: 'HARD',
    task: 'Multi-tab management with parallel operations',
    url: 'multiple',
    actions: async (controller) => {
      const page1 = await controller.getActivePage();
      await controller.navigate('https://example.com', page1);

      const page2 = await controller.newPage();
      await controller.navigate('https://www.iana.org', page2);

      const page3 = await controller.newPage();
      await controller.navigate('https://httpbin.org', page3);

      return {
        pages: controller.getPageCount(),
        pageIds: controller.getPageIds()
      };
    }
  },
  {
    id: 'agent-6',
    difficulty: 'HARD',
    task: 'Complex selector patterns and form detection',
    url: 'https://httpbin.org/forms/post',
    actions: async (controller) => {
      await controller.navigate('https://httpbin.org/forms/post');
      const result = await controller.executeScript(`() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const selects = Array.from(document.querySelectorAll('select'));
        const buttons = Array.from(document.querySelectorAll('button'));
        return {
          inputCount: inputs.length,
          inputTypes: inputs.map(i => i.type),
          selectCount: selects.length,
          buttonCount: buttons.length
        };
      }`);
      return result.data;
    }
  },
  {
    id: 'agent-7',
    difficulty: 'VERY HARD',
    task: 'Screenshot capture and visual verification',
    url: 'https://example.com',
    actions: async (controller) => {
      await controller.navigate('https://example.com');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const screenshotPath = `test-agent-7-${Date.now()}.png`;
      await controller.screenshot(screenshotPath);
      return {
        screenshot: screenshotPath,
        captured: true
      };
    }
  },
  {
    id: 'agent-8',
    difficulty: 'VERY HARD',
    task: 'Deep DOM traversal and pattern recognition',
    url: 'https://www.iana.org',
    actions: async (controller) => {
      await controller.navigate('https://www.iana.org');
      const result = await controller.executeScript(`() => {
        const findLinks = (element) => {
          const links = [];
          const anchors = element.querySelectorAll('a');
          anchors.forEach(a => {
            if (a.href) links.push({ text: a.textContent.trim(), href: a.href });
          });
          return links;
        };

        const links = findLinks(document.body);
        return {
          totalLinks: links.length,
          topLinks: links.slice(0, 5)
        };
      }`);
      return result.data;
    }
  },
  {
    id: 'agent-9',
    difficulty: 'EXTREME',
    task: 'Pattern learning and AgentDB storage',
    url: 'https://httpbin.org/forms/post',
    actions: async (controller) => {
      await controller.navigate('https://httpbin.org/forms/post');

      // Extract form patterns
      const patterns = await controller.executeScript(`() => {
        const forms = Array.from(document.querySelectorAll('form'));
        return forms.map(form => ({
          action: form.action,
          method: form.method,
          inputs: Array.from(form.querySelectorAll('input')).map(input => ({
            name: input.name,
            type: input.type,
            id: input.id
          }))
        }));
      }`);

      // Store in AgentDB
      const db = new AgentDBClient('./test-stress-db', 384);
      const patternId = db.storeAction({
        action: 'form_detected',
        url: 'https://httpbin.org/forms/post',
        selector: 'form',
        success: true,
        metadata: { patterns: patterns.data }
      });
      db.save();

      return {
        patternId,
        formsFound: patterns.data?.length || 0
      };
    }
  },
  {
    id: 'agent-10',
    difficulty: 'EXTREME',
    task: 'Advanced pattern matching with AgentDB similarity search',
    url: 'multiple',
    actions: async (controller) => {
      const db = new AgentDBClient('./test-stress-db', 384);

      // Store multiple patterns
      const urls = [
        'https://example.com',
        'https://www.iana.org',
        'https://httpbin.org'
      ];

      const patternIds = [];
      for (const url of urls) {
        await controller.navigate(url);
        const pageInfo = await controller.executeScript(`() => ({
          title: document.title,
          url: window.location.href,
          linkCount: document.querySelectorAll('a').length
        })`);

        const id = db.storeAction({
          action: 'navigate_and_analyze',
          url: url,
          success: true,
          metadata: pageInfo.data
        });
        patternIds.push(id);
      }

      // Find similar patterns
      const similar = db.findSimilar({
        action: 'navigate_and_analyze',
        url: 'https://example.org'
      }, 3);

      db.save();

      return {
        storedPatterns: patternIds.length,
        similarFound: similar.length,
        topSimilarity: similar[0]?.similarity
      };
    }
  }
];

async function runAgent(agentConfig, agentIndex) {
  const startTime = Date.now();
  console.log(`\n[${"█".repeat(agentIndex + 1)}${"░".repeat(10 - agentIndex)}] ${agentConfig.id.toUpperCase()}`);
  console.log(`🎯 ${agentConfig.difficulty} | ${agentConfig.task}`);

  const controller = new BrowserController({
    headless: true,
    slowMo: 50
  });

  try {
    await controller.launch();
    console.log(`   ⚡ Browser launched`);

    const result = await agentConfig.actions(controller);
    const duration = Date.now() - startTime;

    console.log(`   ✅ COMPLETED in ${duration}ms`);
    console.log(`   📊 Result:`, JSON.stringify(result, null, 2).substring(0, 150));

    await controller.close();

    return {
      agent: agentConfig.id,
      difficulty: agentConfig.difficulty,
      success: true,
      duration,
      result
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ FAILED in ${duration}ms`);
    console.log(`   Error: ${error.message}`);

    try {
      await controller.close();
    } catch (e) {}

    return {
      agent: agentConfig.id,
      difficulty: agentConfig.difficulty,
      success: false,
      duration,
      error: error.message
    };
  }
}

async function stressTest() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🔥 PARALLEL AGENT STRESS TEST - PUSH THE BOUNDARIES 🔥     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`🤖 Launching ${AGENT_TASKS.length} parallel agents with increasing difficulty...\n`);

  const overallStart = Date.now();

  // Launch ALL agents in parallel
  const results = await Promise.all(
    AGENT_TASKS.map((task, index) => runAgent(task, index))
  );

  const overallDuration = Date.now() - overallStart;

  // Summary
  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    📊 STRESS TEST RESULTS                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => r.success === false).length;

  console.log(`⏱️  Total Duration: ${overallDuration}ms (${(overallDuration / 1000).toFixed(2)}s)`);
  console.log(`🤖 Total Agents: ${AGENT_TASKS.length}`);
  console.log(`✅ Successful: ${successful} (${((successful / AGENT_TASKS.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failed}\n`);

  // By difficulty
  const byDifficulty = results.reduce((acc, r) => {
    if (!acc[r.difficulty]) acc[r.difficulty] = { total: 0, success: 0 };
    acc[r.difficulty].total++;
    if (r.success) acc[r.difficulty].success++;
    return acc;
  }, {});

  console.log('📈 Results by Difficulty:\n');
  Object.entries(byDifficulty).forEach(([diff, stats]) => {
    const rate = ((stats.success / stats.total) * 100).toFixed(0);
    console.log(`   ${diff.padEnd(12)} ${stats.success}/${stats.total} (${rate}%)`);
  });

  // Performance stats
  const durations = results.map(r => r.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  console.log('\n⚡ Performance Stats:\n');
  console.log(`   Average: ${avgDuration.toFixed(0)}ms`);
  console.log(`   Fastest: ${minDuration}ms`);
  console.log(`   Slowest: ${maxDuration}ms`);
  console.log(`   Parallel Speedup: ${(durations.reduce((a, b) => a + b, 0) / overallDuration).toFixed(2)}x\n`);

  // Individual results
  console.log('📋 Individual Agent Results:\n');
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`   ${status} ${r.agent} [${r.difficulty}] - ${r.duration}ms`);
  });

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  if (successful === AGENT_TASKS.length) {
    console.log('║  🏆 ALL AGENTS COMPLETED SUCCESSFULLY! SYSTEM ROCKS! 🏆     ║');
  } else if (successful >= AGENT_TASKS.length * 0.8) {
    console.log('║  💪 MOST AGENTS SUCCEEDED! SYSTEM IS STRONG! 💪             ║');
  } else {
    console.log('║  ⚠️  SOME AGENTS STRUGGLED - BOUNDARY FOUND! ⚠️             ║');
  }
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  return results;
}

// RUN IT!
stressTest().then((results) => {
  console.log('🎉 Stress test complete!\n');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
