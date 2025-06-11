const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51RXiCuQLkbYi7v7HAyCJpzMGvmv3cOCwJoUtn89HHhH2gxMFuskJbYdmI08LuFfWEkFQR8fh9EJlmU4DTHWWQE25003ndckBXj');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  const { success_url, cancel_url } = req.body;

  if (!success_url || !cancel_url) {
    console.warn('❌ Missing success_url or cancel_url');
    return res.status(400).json({ error: 'Missing URLs' });
  }

  console.log('✅ Received success_url:', success_url);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Test Product' },
          unit_amount: 2000,
        },
        quantity: 1,
      }],
      success_url,
      cancel_url,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session creation failed:', err.message);
    res.status(500).json({ error: 'Stripe session creation failed' });
  }
});

app.listen(4242, () => console.log('🚀 Server running at http://localhost:4242'));
