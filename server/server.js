require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const createApp = require('./app');

const app = createApp(stripe);
app.listen(4242, () => console.log('Server running on port 4242'));
