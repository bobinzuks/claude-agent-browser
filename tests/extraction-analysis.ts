/**
 * Extraction Analysis Tool
 *
 * Analyzes Facebook Marketplace extraction results
 * Compares performance across different searches, locations, and time periods
 */

import * as fs from 'fs';
import * as path from 'path';

interface ExtractionResult {
  listingId: string;
  title: string | null;
  price: number | null;
  currency: string;
  daysListed: number | null;
  ageText: string | null;
  listingLocation: string | null;
  sellerName: string | null;
  url: string;
  imageUrl: string | null;
  extractedAt: number;
  extractionMethod: string;
}

interface TestResult {
  timestamp: number;
  searchQuery: string;
  location: string;
  totalListings: number;
  extractedListings: number;
  successRate: number;
  metrics: {
    priceSuccess: number;
    titleSuccess: number;
    daysListedSuccess: number;
    locationSuccess: number;
    sellerSuccess: number;
    imageSuccess: number;
  };
  extractionMethods: Record<string, number>;
  results: ExtractionResult[];
}

interface ComparisonReport {
  totalTests: number;
  overallSuccessRate: number;
  averageMetrics: {
    price: number;
    title: number;
    daysListed: number;
    location: number;
    seller: number;
    image: number;
  };
  methodDistribution: Record<string, number>;
  topPerformingSearches: Array<{ query: string; location: string; rate: number }>;
  worstPerformingSearches: Array<{ query: string; location: string; rate: number }>;
  recommendations: string[];
}

export class ExtractionAnalysis {
  private testResults: TestResult[] = [];

  constructor(private resultsDir: string = path.join(__dirname, '../test-results')) {}

  /**
   * Load all test results from directory
   */
  loadResults(): void {
    console.log(`📂 Loading test results from: ${this.resultsDir}\n`);

    if (!fs.existsSync(this.resultsDir)) {
      console.log('⚠️  Results directory not found. No data to analyze.\n');
      return;
    }

    const files = fs.readdirSync(this.resultsDir)
      .filter(f => f.endsWith('.json') && f.includes('marketplace-test'));

    console.log(`Found ${files.length} test result files\n`);

    files.forEach(file => {
      const filepath = path.join(this.resultsDir, file);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      this.testResults.push(data);
    });

    console.log(`✅ Loaded ${this.testResults.length} test results\n`);
  }

  /**
   * Load single result file
   */
  loadResult(filepath: string): void {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    this.testResults.push(data);
  }

  /**
   * Analyze single test result
   */
  analyzeTest(result: TestResult): void {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TEST ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`🔍 Search: "${result.searchQuery}" in ${result.location}`);
    console.log(`📅 Date: ${new Date(result.timestamp).toLocaleString()}`);
    console.log(`📦 Extracted: ${result.extractedListings}/${result.totalListings} (${result.successRate.toFixed(1)}%)\n`);

    console.log('📈 FIELD SUCCESS RATES:');
    Object.entries(result.metrics).forEach(([field, rate]) => {
      const icon = this.getFieldIcon(field);
      const status = this.getStatusIcon(field, rate);
      console.log(`  ${icon} ${field.padEnd(15)}: ${rate.toFixed(1)}% ${status}`);
    });

    console.log('\n🔧 EXTRACTION METHODS:');
    const sortedMethods = Object.entries(result.extractionMethods)
      .sort((a, b) => b[1] - a[1]);

    sortedMethods.forEach(([method, count]) => {
      const percentage = (count / result.extractedListings * 100).toFixed(1);
      console.log(`  ${method.padEnd(20)}: ${count.toString().padStart(3)} (${percentage}%)`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Compare multiple test results
   */
  compareTests(): ComparisonReport {
    if (this.testResults.length === 0) {
      throw new Error('No test results loaded');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 COMPARATIVE ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Calculate averages
    const totalTests = this.testResults.length;
    const overallSuccessRate = this.testResults.reduce((sum, t) => sum + t.successRate, 0) / totalTests;

    const averageMetrics = {
      price: this.testResults.reduce((sum, t) => sum + t.metrics.priceSuccess, 0) / totalTests,
      title: this.testResults.reduce((sum, t) => sum + t.metrics.titleSuccess, 0) / totalTests,
      daysListed: this.testResults.reduce((sum, t) => sum + t.metrics.daysListedSuccess, 0) / totalTests,
      location: this.testResults.reduce((sum, t) => sum + t.metrics.locationSuccess, 0) / totalTests,
      seller: this.testResults.reduce((sum, t) => sum + t.metrics.sellerSuccess, 0) / totalTests,
      image: this.testResults.reduce((sum, t) => sum + t.metrics.imageSuccess, 0) / totalTests,
    };

    // Aggregate method distribution
    const methodDistribution: Record<string, number> = {};
    this.testResults.forEach(test => {
      Object.entries(test.extractionMethods).forEach(([method, count]) => {
        methodDistribution[method] = (methodDistribution[method] || 0) + count;
      });
    });

    // Find top and worst performing searches
    const sortedByRate = [...this.testResults].sort((a, b) => b.successRate - a.successRate);
    const topPerforming = sortedByRate.slice(0, 3).map(t => ({
      query: t.searchQuery,
      location: t.location,
      rate: t.successRate,
    }));
    const worstPerforming = sortedByRate.slice(-3).reverse().map(t => ({
      query: t.searchQuery,
      location: t.location,
      rate: t.successRate,
    }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(averageMetrics, methodDistribution);

    const report: ComparisonReport = {
      totalTests,
      overallSuccessRate,
      averageMetrics,
      methodDistribution,
      topPerforming,
      worstPerforming,
      recommendations,
    };

    this.printComparisonReport(report);

    return report;
  }

  /**
   * Print comparison report
   */
  private printComparisonReport(report: ComparisonReport): void {
    console.log(`📊 Total Tests: ${report.totalTests}`);
    console.log(`✅ Overall Success Rate: ${report.overallSuccessRate.toFixed(1)}%\n`);

    console.log('📈 AVERAGE FIELD SUCCESS RATES:');
    Object.entries(report.averageMetrics).forEach(([field, rate]) => {
      const icon = this.getFieldIcon(field);
      const status = this.getStatusIcon(field, rate);
      console.log(`  ${icon} ${field.padEnd(15)}: ${rate.toFixed(1)}% ${status}`);
    });

    console.log('\n🔧 OVERALL METHOD DISTRIBUTION:');
    const sortedMethods = Object.entries(report.methodDistribution)
      .sort((a, b) => b[1] - a[1]);

    const totalExtractions = Object.values(report.methodDistribution).reduce((a, b) => a + b, 0);
    sortedMethods.forEach(([method, count]) => {
      const percentage = (count / totalExtractions * 100).toFixed(1);
      console.log(`  ${method.padEnd(20)}: ${count.toString().padStart(4)} (${percentage}%)`);
    });

    console.log('\n🏆 TOP PERFORMING SEARCHES:');
    report.topPerforming.forEach((item, i) => {
      console.log(`  ${i + 1}. "${item.query}" in ${item.location}: ${item.rate.toFixed(1)}%`);
    });

    console.log('\n⚠️  WORST PERFORMING SEARCHES:');
    report.worstPerforming.forEach((item, i) => {
      console.log(`  ${i + 1}. "${item.query}" in ${item.location}: ${item.rate.toFixed(1)}%`);
    });

    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    metrics: ComparisonReport['averageMetrics'],
    methods: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // Check days listed success rate
    if (metrics.daysListed < 90) {
      recommendations.push(
        `Days listed success rate is ${metrics.daysListed.toFixed(1)}% (target: 90%). Consider adding more fallback methods.`
      );
    } else {
      recommendations.push(
        `✅ Days listed extraction is performing well at ${metrics.daysListed.toFixed(1)}%.`
      );
    }

    // Check if NONE method is too high
    const totalExtractions = Object.values(methods).reduce((a, b) => a + b, 0);
    const noneCount = methods['NONE'] || 0;
    const nonePercentage = (noneCount / totalExtractions) * 100;

    if (nonePercentage > 10) {
      recommendations.push(
        `${nonePercentage.toFixed(1)}% of listings have no extraction method. Add METHOD 5 for better coverage.`
      );
    }

    // Check location extraction
    if (metrics.location < 80) {
      recommendations.push(
        `Location extraction is at ${metrics.location.toFixed(1)}% (target: 80%). Review location regex patterns.`
      );
    }

    // Check seller extraction
    if (metrics.seller < 70) {
      recommendations.push(
        `Seller extraction is at ${metrics.seller.toFixed(1)}% (target: 70%). Check seller link selectors.`
      );
    }

    // Method distribution insights
    const primaryMethod = Object.entries(methods).sort((a, b) => b[1] - a[1])[0];
    const primaryPercentage = (primaryMethod[1] / totalExtractions) * 100;

    if (primaryPercentage > 80) {
      recommendations.push(
        `${primaryMethod[0]} accounts for ${primaryPercentage.toFixed(1)}% of extractions. Other methods may be redundant.`
      );
    }

    return recommendations;
  }

  /**
   * Analyze extraction trends over time
   */
  analyzeTrends(): void {
    if (this.testResults.length < 2) {
      console.log('⚠️  Need at least 2 test results to analyze trends\n');
      return;
    }

    const sorted = [...this.testResults].sort((a, b) => a.timestamp - b.timestamp);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 TREND ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Date                    | Success | Days Listed | Location | Seller');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    sorted.forEach(test => {
      const date = new Date(test.timestamp).toLocaleDateString();
      const success = test.successRate.toFixed(1).padStart(6);
      const days = test.metrics.daysListedSuccess.toFixed(1).padStart(11);
      const location = test.metrics.locationSuccess.toFixed(1).padStart(8);
      const seller = test.metrics.sellerSuccess.toFixed(1).padStart(6);

      console.log(`${date.padEnd(23)} | ${success}% | ${days}% | ${location}% | ${seller}%`);
    });

    // Calculate trend direction
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    console.log('\n📊 TREND DIRECTION:');
    console.log(`  Overall: ${this.getTrendIndicator(first.successRate, last.successRate)}`);
    console.log(`  Days Listed: ${this.getTrendIndicator(first.metrics.daysListedSuccess, last.metrics.daysListedSuccess)}`);
    console.log(`  Location: ${this.getTrendIndicator(first.metrics.locationSuccess, last.metrics.locationSuccess)}`);
    console.log(`  Seller: ${this.getTrendIndicator(first.metrics.sellerSuccess, last.metrics.sellerSuccess)}`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Get trend indicator (improving/declining/stable)
   */
  private getTrendIndicator(oldValue: number, newValue: number): string {
    const diff = newValue - oldValue;

    if (diff > 5) {
      return `📈 Improving (+${diff.toFixed(1)}%)`;
    } else if (diff < -5) {
      return `📉 Declining (${diff.toFixed(1)}%)`;
    } else {
      return `➡️  Stable (${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%)`;
    }
  }

  /**
   * Get field icon
   */
  private getFieldIcon(field: string): string {
    const icons: Record<string, string> = {
      price: '💰',
      priceSuccess: '💰',
      title: '📝',
      titleSuccess: '📝',
      daysListed: '📅',
      daysListedSuccess: '📅',
      location: '📍',
      locationSuccess: '📍',
      seller: '👤',
      sellerSuccess: '👤',
      image: '🖼️',
      imageSuccess: '🖼️',
    };
    return icons[field] || '📊';
  }

  /**
   * Get status icon based on target thresholds
   */
  private getStatusIcon(field: string, rate: number): string {
    const targets: Record<string, number> = {
      price: 95,
      priceSuccess: 95,
      title: 95,
      titleSuccess: 95,
      daysListed: 90,
      daysListedSuccess: 90,
      location: 80,
      locationSuccess: 80,
      seller: 70,
      sellerSuccess: 70,
      image: 85,
      imageSuccess: 85,
    };

    const target = targets[field] || 75;

    if (rate >= target) {
      return '✅';
    } else if (rate >= target - 10) {
      return '⚠️';
    } else {
      return '❌';
    }
  }

  /**
   * Export comparison report
   */
  exportReport(filepath: string): void {
    const report = this.compareTests();

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`💾 Report exported to: ${filepath}\n`);
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(outputPath: string): void {
    const report = this.compareTests();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Facebook Marketplace Extraction Analysis</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 0 20px; }
    h1 { color: #1877f2; }
    h2 { color: #333; border-bottom: 2px solid #1877f2; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f0f2f5; font-weight: bold; }
    .metric { display: inline-block; width: 60px; text-align: right; }
    .status-good { color: #00a400; font-weight: bold; }
    .status-warn { color: #ff8c00; font-weight: bold; }
    .status-bad { color: #dc143c; font-weight: bold; }
    .chart { margin: 20px 0; }
  </style>
</head>
<body>
  <h1>📊 Facebook Marketplace Extraction Analysis</h1>

  <h2>Summary</h2>
  <p><strong>Total Tests:</strong> ${report.totalTests}</p>
  <p><strong>Overall Success Rate:</strong> <span class="metric status-${this.getStatusClass(report.overallSuccessRate, 75)}">${report.overallSuccessRate.toFixed(1)}%</span></p>

  <h2>Average Field Success Rates</h2>
  <table>
    <tr>
      <th>Field</th>
      <th>Success Rate</th>
      <th>Target</th>
      <th>Status</th>
    </tr>
    ${Object.entries(report.averageMetrics).map(([field, rate]) => {
      const targets: Record<string, number> = {
        price: 95, title: 95, daysListed: 90, location: 80, seller: 70, image: 85
      };
      const target = targets[field] || 75;
      return `
        <tr>
          <td>${field}</td>
          <td class="metric">${rate.toFixed(1)}%</td>
          <td class="metric">${target}%</td>
          <td class="status-${this.getStatusClass(rate, target)}">${rate >= target ? '✅ PASS' : '❌ FAIL'}</td>
        </tr>
      `;
    }).join('')}
  </table>

  <h2>Extraction Methods</h2>
  <table>
    <tr>
      <th>Method</th>
      <th>Count</th>
      <th>Percentage</th>
    </tr>
    ${Object.entries(report.methodDistribution)
      .sort((a, b) => b[1] - a[1])
      .map(([method, count]) => {
        const total = Object.values(report.methodDistribution).reduce((a, b) => a + b, 0);
        const percentage = (count / total * 100).toFixed(1);
        return `
          <tr>
            <td>${method}</td>
            <td>${count}</td>
            <td>${percentage}%</td>
          </tr>
        `;
      }).join('')}
  </table>

  <h2>Recommendations</h2>
  <ol>
    ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
  </ol>

  <p style="color: #666; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
    Generated on ${new Date().toLocaleString()}
  </p>
</body>
</html>
    `;

    fs.writeFileSync(outputPath, html);
    console.log(`📄 HTML report generated: ${outputPath}\n`);
  }

  /**
   * Get CSS class based on rate vs target
   */
  private getStatusClass(rate: number, target: number): string {
    if (rate >= target) return 'good';
    if (rate >= target - 10) return 'warn';
    return 'bad';
  }
}

// CLI mode
if (require.main === module) {
  const analysis = new ExtractionAnalysis();

  const args = process.argv.slice(2);
  const command = args[0] || 'compare';

  if (command === 'compare') {
    analysis.loadResults();
    analysis.compareTests();
  } else if (command === 'trends') {
    analysis.loadResults();
    analysis.analyzeTrends();
  } else if (command === 'html') {
    analysis.loadResults();
    const outputPath = args[1] || path.join(__dirname, '../test-results/report.html');
    analysis.generateHTMLReport(outputPath);
  } else if (command === 'single') {
    const filepath = args[1];
    if (!filepath) {
      console.error('❌ Please provide a result file path');
      process.exit(1);
    }
    analysis.loadResult(filepath);
    analysis.analyzeTest(analysis['testResults'][0]);
  } else {
    console.log('Usage:');
    console.log('  npm run analyze compare      # Compare all test results');
    console.log('  npm run analyze trends       # Show trends over time');
    console.log('  npm run analyze html [path]  # Generate HTML report');
    console.log('  npm run analyze single <file> # Analyze single result');
  }
}

export default ExtractionAnalysis;
