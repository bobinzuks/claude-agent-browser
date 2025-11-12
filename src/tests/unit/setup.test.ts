/**
 * Initial test to validate project setup
 * This is the Tutorial Boss - ensures build system works
 */

describe('Project Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should have TypeScript working', () => {
    const message = 'TypeScript is configured!';
    expect(typeof message).toBe('string');
  });

  it('should support async/await', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });
});
