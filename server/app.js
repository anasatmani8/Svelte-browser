const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

function createApp(stripeInstance) {
  const app = express();

  app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
  app.use(express.json());
  app.use('/create-checkout-session', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

  const isValidUrl = (url) => {
    try {
      const parsed = new URL(url);
      return ['https:', 'http:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  app.post('/create-checkout-session', async (req, res) => {
    const { success_url, cancel_url } = req.body;

    if (!isValidUrl(success_url) || !isValidUrl(cancel_url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    try {
      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: 'Premium Subscription' },
            unit_amount: 2000,
          },
          quantity: 1,
        }],
        success_url,
        cancel_url,
      });

      res.json({ url: session.url });
    } catch (err) {
      res.status(500).json({ error: 'Payment failed' });
    }
  });

  return app;
}

module.exports = createApp;
