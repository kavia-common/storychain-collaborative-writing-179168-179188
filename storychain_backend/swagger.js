const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StoryChain API',
      version: '1.0.0',
      description: 'REST API for the StoryChain collaborative writing app',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Health' },
      { name: 'Auth' },
      { name: 'Stories' },
      { name: 'Paragraphs' },
      { name: 'Reactions' },
      { name: 'AI' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
