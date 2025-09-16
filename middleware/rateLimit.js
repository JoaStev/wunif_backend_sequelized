const rateLimit = require('rate-limiter-flexible');

const loginLimiter = new rateLimit.RateLimiterMemory({
  points: 10, // 10 intentos
  duration: 900, // 15 minutos
});

exports.limiter = (keyPrefix) => async (req, res, next) => {
  try {
    await loginLimiter.consume(req.ip);
    next();
  } catch (err) {
    res.status(429).json({ error: 'Demasiados intentos, espera unos minutos.' });
  }
};
