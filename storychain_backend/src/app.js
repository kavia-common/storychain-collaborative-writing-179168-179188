const cors = require('cors');
const express = require('express');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');

// Initialize express app
const app = express();

/**
 * Configure CORS:
 * - Prefer CORS_FRONTEND_ORIGIN
 * - Fallback to FRONTEND_URL
 * - Default to '*'
 */
const allowedOrigin =
  process.env.CORS_FRONTEND_ORIGIN ||
  process.env.FRONTEND_URL ||
  '*';

if (!process.env.CORS_FRONTEND_ORIGIN && process.env.FRONTEND_URL) {
  console.warn('[cors] Using deprecated FRONTEND_URL; please set CORS_FRONTEND_ORIGIN.');
}
console.log(`[cors] Allowed origin: ${allowedOrigin}`);

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.set('trust proxy', true);

// Serve Swagger UI with dynamic server URL and bearer auth scheme
app.use('/docs', swaggerUi.serve, (req, res, next) => {
  const host = req.get('host'); // may or may not include port
  let protocol = req.protocol; // http or https

  const actualPort = req.socket.localPort;
  const hasPort = host.includes(':');

  const needsPort =
    !hasPort &&
    ((protocol === 'http' && actualPort !== 80) ||
      (protocol === 'https' && actualPort !== 443));
  const fullHost = needsPort ? `${host}:${actualPort}` : host;
  protocol = req.secure ? 'https' : protocol;

  const dynamicSpec = {
    ...swaggerSpec,
    servers: [{ url: `${protocol}://${fullHost}` }],
    components: {
      ...(swaggerSpec.components || {}),
      securitySchemes: {
        ...(swaggerSpec.components?.securitySchemes || {}),
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  };
  swaggerUi.setup(dynamicSpec)(req, res, next);
});

 // Parse JSON request body
app.use(express.json({ limit: '1mb' }));

// Mount routes at both a configurable API base path and at root for backward compatibility.
// This ensures clients using /api/* or root paths both work.
const apiBasePath = process.env.API_BASE_PATH || '/api';
if (apiBasePath !== '/' && apiBasePath !== '') {
  console.log(`[routes] Mounting API routes at '${apiBasePath}' and '/'`);
  app.use(apiBasePath, routes);
} else {
  console.log('[routes] API_BASE_PATH resolved to root; mounting at \'/\' only');
}
app.use('/', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  });
});

module.exports = app;
