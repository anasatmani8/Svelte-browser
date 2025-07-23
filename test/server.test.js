const request = require('supertest');
const createApp = require('../server/app');

// Create a mock Stripe instance
const mockCreate = jest.fn();

const mockStripe = {
  checkout: {
    sessions: {
      create: mockCreate
    }
  }
};

describe('POST /create-checkout-session', () => {
  let app;

  beforeEach(() => {
    app = createApp(mockStripe);
  });

  it('should return a Stripe checkout URL for valid input', async () => {
    mockCreate.mockResolvedValueOnce({ url: 'https://stripe.com/checkout/test' });

    const response = await request(app)
      .post('/create-checkout-session')
      .send({
        success_url: 'https://laizee.ai/y',
        cancel_url: 'https://example.com/cancel'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.url).toBe('https://stripe.com/checkout/test');
  });

  it('should return 400 for invalid URLs', async () => {
    const response = await request(app)
      .post('/create-checkout-session')
      .send({
        success_url: 'not-a-url',
        cancel_url: 'still-bad'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should handle Stripe API failure', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Stripe is down'));

    const response = await request(app)
      .post('/create-checkout-session')
      .send({
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel'
      });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe('Payment failed');
  });
});
