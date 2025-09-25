const express = require('express');
const router = express.Router();
const { sendTestMail } = require('../utils/mailer');

// POST /api/test/send-mail  { "to": "destino@ejemplo.com" }
router.post('/send-mail', async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'Campo "to" requerido' });
    const info = await sendTestMail(to);
    res.json({ ok: true, info });
  } catch (err) {
    console.error('Error enviando mail de prueba:', err && err.message ? err.message : err);
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

module.exports = router;