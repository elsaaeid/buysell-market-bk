const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;

  // Ensure CORS headers are set on error responses
  const requestOrigin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://buysell-market.vercel.app",
  ];

  if (requestOrigin && (allowedOrigins.includes(requestOrigin) || requestOrigin.endsWith(".vercel.app"))) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, PUT, OPTIONS");
  }

  res.status(statusCode);

  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : null,
  });
};

module.exports = errorHandler;
