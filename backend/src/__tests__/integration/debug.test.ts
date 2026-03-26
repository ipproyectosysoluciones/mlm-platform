import { testAgent } from '../setup';

describe('Debug Test', () => {
  it('should show actual response from /api/products', async () => {
    const res = await testAgent.get('/api/products');

    // Try to expose the result
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});
