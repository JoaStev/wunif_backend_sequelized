require('dotenv').config();
(async () => {
  try {
    const productId = process.argv[2];
    const payerEmail = process.argv[3] || 'cliente@example.com';
    const userId = process.argv[4] || null;

    if (!productId) {
      console.error('ERROR: falta PRODUCT_ID. Uso: node scripts/create-preference.js <PRODUCT_ID> <PAYER_EMAIL> [USER_ID]');
      process.exit(1);
    }
    
    const baseForBackUrls = (process.env.WEBHOOK_BASE && process.env.WEBHOOK_BASE.startsWith('http')) 
      ? process.env.WEBHOOK_BASE.replace(/\/$/, '') 
      : (process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.replace(/\/$/, '') : 'http://localhost:4000');

    const backUrls = {
      success: `${baseForBackUrls}/payment-success`,
      failure: `${baseForBackUrls}/payment-failure`,
      pending: `${baseForBackUrls}/payment-pending`
    };

    // Crea un req/res "mock" similar a Express y llama al controlador
    const controller = require('../controllers/paymentController');

    const req = {
      body: {
        items: [{ product: productId, quantity: 1 }],
        payerEmail,
        backUrls
      },
      user: userId ? { id: userId } : null
    };

    const res = {
      json: (payload) => {
        console.log('--- RESPONSE JSON ---');
        console.log(JSON.stringify(payload, null, 2));
        process.exit(0);
      },
      status: (code) => ({
        json: (payload) => {
          console.log(`--- STATUS ${code} ---`);
          console.log(JSON.stringify(payload, null, 2));
          process.exit(code === 200 ? 0 : 1);
        }
      })
    };

    await controller.createOrderAndPreference(req, res);
  } catch (err) {
    console.error('ERROR en script:', err && err.message ? err.message : err);
    console.error(err);
    process.exit(1);
  }
})();