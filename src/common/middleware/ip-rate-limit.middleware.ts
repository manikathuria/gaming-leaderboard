import rateLimit from 'express-rate-limit';
export const ipRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,            // per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ success: false, statusCode: 429, message: 'Too many requests' });
  },
});
