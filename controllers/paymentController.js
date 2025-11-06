const { Order, Product, User } = require('../models');
const { sendReceipt } = require('../utils/mailer');

// Usar explícitamente la dependencia clásica 'mercadopago' presente en package.json
let mercadopago = null;
let configured = false;
let mpConfig = null;
let preferenceClient = null;
let paymentClient = null;

try {
  mercadopago = require('mercadopago');
} catch (e) {
  console.error('No se pudo cargar el paquete "mercadopago":', e.message);
  throw e;
}

function ensureConfigured() {
  if (configured && mercadopago) return;
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token || String(token).trim() === '') {
    throw new Error('MP_ACCESS_TOKEN no definido en las variables de entorno. Añade MP_ACCESS_TOKEN a .env');
  }

  // Inicialización con la API clásica
  // The installed SDK (v2.x) exposes a MercadoPagoConfig class and clients (Preference, Payment, ...)
  // Build a config and client instances for Preference and Payment
  try {
    const ConfigClass = mercadopago.MercadoPagoConfig || mercadopago.default || mercadopago;
    mpConfig = new ConfigClass({ accessToken: token, options: {} });
    const Preference = mercadopago.Preference || (mercadopago.default && mercadopago.default.Preference);
    const Payment = mercadopago.Payment || (mercadopago.default && mercadopago.default.Payment);
    if (Preference) preferenceClient = new Preference(mpConfig);
    if (Payment) paymentClient = new Payment(mpConfig);
  } catch (e) {
    // If building clients fails, leave variables null and let subsequent checks throw clearer errors
    console.warn('No se pudieron inicializar clientes de Mercado Pago:', e && e.message ? e.message : e);
  }

  configured = true;
}

// Helpers para compatibilidad con distintas versiones del SDK
async function createPreference(preference) {
  ensureConfigured();
  // Use new SDK client if available
  if (preferenceClient && typeof preferenceClient.create === 'function') {
    // SDK expects an object: { body, requestOptions? }
    return preferenceClient.create({ body: preference });
  }

  // Older signatures (fallback)
  if (mercadopago && mercadopago.preferences && typeof mercadopago.preferences.create === 'function') {
    return mercadopago.preferences.create(preference);
  }

  if (mercadopago && typeof mercadopago.create_preference === 'function') return mercadopago.create_preference(preference);
  if (mercadopago && typeof mercadopago.createPreference === 'function') return mercadopago.createPreference(preference);

  throw new Error('mercadopago: método para crear preference no encontrado en SDK');
}

async function findPaymentById(id) {
  ensureConfigured();
  // Use new SDK client if available
  if (paymentClient && typeof paymentClient.get === 'function') {
    return paymentClient.get({ id });
  }

  // Older signatures (fallback)
  if (mercadopago && mercadopago.payment && typeof mercadopago.payment.get === 'function') return mercadopago.payment.get(id);
  if (mercadopago && mercadopago.payment && typeof mercadopago.payment.findById === 'function') return mercadopago.payment.findById(id);

  if (mercadopago && typeof mercadopago.getPayment === 'function') return mercadopago.getPayment(id);
  if (mercadopago && typeof mercadopago.get === 'function') return mercadopago.get(id);

  throw new Error('mercadopago: método para buscar payment no encontrado en SDK');
}

function extractInitPoint(prefResponse) {
  if (!prefResponse) return null;
  if (prefResponse.body && prefResponse.body.init_point) return prefResponse.body.init_point;
  if (prefResponse.result && prefResponse.result.init_point) return prefResponse.result.init_point;
  if (prefResponse.response && prefResponse.response.body && prefResponse.response.body.init_point) return prefResponse.response.body.init_point;
  if (prefResponse.init_point) return prefResponse.init_point;
  return null;
}
function extractPaymentBody(paymentResponse) {
  if (!paymentResponse) return null;
  if (paymentResponse.body) return paymentResponse.body;
  if (paymentResponse.result) return paymentResponse.result;
  if (paymentResponse.response && paymentResponse.response.body) return paymentResponse.response.body;
  return paymentResponse;
}

async function createOrderAndPreference(req, res) {
  try {
    // asegurarse de que el SDK está configurado (lanzará error si no hay token)
    ensureConfigured();

    const { items, payerEmail, backUrls = {} } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items requeridos' });
    }
    if (!payerEmail) {
      return res.status(400).json({ error: 'payerEmail requerido' });
    }

    let total = 0;
    const snapshotItems = [];
    for (const i of items) {
      const prod = await Product.findByPk(i.product);
      if (!prod || !prod.isActive) return res.status(400).json({ error: 'Producto inválido' });
      snapshotItems.push({
        product: prod.id,
        name: prod.name,
        model: prod.model,
        size: prod.size,
        unitPrice: prod.price,
        quantity: i.quantity
      });
      total += prod.price * i.quantity;
    }

    const order = await Order.create({
      user: req.user ? req.user.id : 'guest',
      items: snapshotItems,
      total,
      paymentMethod: 'CREDITO',
      status: 'PENDING'
    });
    console.info('Order created:', order && order.id ? order.id : order);

    const mpItems = snapshotItems.map(it => ({
      title: it.name,
      description: `${it.model} - ${it.size}`,
      quantity: Number(it.quantity),
      unit_price: Number(it.unitPrice),
      currency_id: process.env.MP_CURRENCY || 'COP'
    }));

    const notification_url = `${process.env.WEBHOOK_BASE}/api/payments/webhook`;
    const preference = {
      items: mpItems,
      payer: { email: payerEmail },
      external_reference: order.id,
      back_urls: {
        success: backUrls.success || (process.env.CLIENT_ORIGIN || '').replace(/\/$/, '') + '/payment-success',
        failure: backUrls.failure || (process.env.CLIENT_ORIGIN || '').replace(/\/$/, '') + '/payment-failure',
        pending: backUrls.pending || (process.env.CLIENT_ORIGIN || '').replace(/\/$/, '') + '/payment-pending'
      },
      auto_return: 'approved',
      notification_url,
    };

    const response = await createPreference(preference);
    const init_point = extractInitPoint(response);
  try { console.info('Preference created, init_point:', init_point); } catch(e) {}

    res.json({ orderId: order.id, init_point, raw: response });
  } catch (err) {
    console.error('createOrderAndPreference error', err && err.message ? err.message : err);
    res.status(500).json({ error: err.message || 'Error creando preference' });
  }
}

async function webhookHandler(req, res) {
  try {
    ensureConfigured();

    // Log incoming webhook for diagnosis
    try {
      console.info('--- WEBHOOK IN ---');
      console.info('Headers:', JSON.stringify(req.headers));
      console.info('Body:', JSON.stringify(req.body));
    } catch (e) { /* ignore */ }

    const topic = req.body.type || req.query.topic || req.body.topic;
    const id = (req.body.data && req.body.data.id) || req.query.id || req.body.id;
    if (!topic || !id) {
      console.warn('Webhook missing topic or id', { topic, id });
      return res.status(400).send('no topic/id');
    }

    if (topic === 'payment') {
      const paymentResp = await findPaymentById(id);
      console.info('Payment API response:', JSON.stringify(paymentResp).slice(0,2000));
      const paymentBody = extractPaymentBody(paymentResp);
      console.info('Extracted payment body:', JSON.stringify(paymentBody).slice(0,2000));
      const status = (paymentBody && paymentBody.status) || (paymentBody && paymentBody.state) || '';
      const externalRef = (paymentBody && (paymentBody.external_reference || (paymentBody.order && paymentBody.order.external_reference))) || null;

      if (!externalRef) {
        console.warn('Webhook: payment sin external_reference', paymentBody);
        return res.status(200).send('ok');
      }

      console.info('Webhook external_reference:', externalRef);

      const order = await Order.findByPk(externalRef);
      if (!order) {
        console.warn('Webhook: orden no encontrada en DB con external_reference', externalRef);
        return res.status(200).send('ok');
      }

      console.info('Order before update:', order.toJSON());

      const normalizedStatus = (status || 'PENDING').toString().toUpperCase();
      if (normalizedStatus === 'APPROVED') {
        if (order.status !== 'PAID') {
          order.status = 'PAID';
          await order.save();
          try {
            const user = order.user ? await User.findByPk(order.user) : null;
            await sendReceipt(order, user || (paymentBody && paymentBody.payer));
          } catch (mailErr) {
            console.warn('No se pudo enviar comprobante:', mailErr && mailErr.message ? mailErr.message : mailErr);
          }
        }
      } else if (['REJECTED', 'CANCELLED', 'FAILED'].includes(normalizedStatus)) {
        order.status = 'FAILED';
        await order.save();
      } else {
        order.status = normalizedStatus;
        await order.save();
      }
    }
    res.status(200).send('ok');
  } catch (err) {
    console.error('Webhook error', err && err.message ? err.message : err);
    res.status(500).send('error');
  }
}

module.exports = { createOrderAndPreference, webhookHandler };

// Simple endpoints used by the static demo pages. Kept minimal to avoid side-effects.
async function methods(req, res) {
  return res.json({ methods: ['credit', 'debit', 'pse'] });
}

async function simulate(req, res) {
  // This is a lightweight simulator used by the static payment pages.
  // It returns a redirect field so the page can navigate. For a real flow,
  // you'd create a preference and return its init_point.
  const { method, amount } = req.body || {};
  const redirect = (process.env.CLIENT_ORIGIN || '').replace(/\/$/, '') + '/payments/index.html';
  return res.json({ ok: true, method: method || 'unknown', amount: amount || 0, redirect });
}

module.exports = { createOrderAndPreference, webhookHandler, methods, simulate };