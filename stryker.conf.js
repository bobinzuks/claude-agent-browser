/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
module.exports = {
  packageManager: 'npm',
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**'
  ],
  thresholds: {
    high: 80,
    low: 70,
    break: 70
  },
  reporters: ['html', 'clear-text', 'progress'],
  htmlReporter: {
    fileName: 'mutation-report.html'
  }
};
