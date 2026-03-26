/**
 * Simple debug test
 */
describe('Simple debug', () => {
  it('should run basic test', async () => {
    console.log('TEST STARTING');
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log('TEST ENDING');
    expect(true).toBe(true);
  });
});
