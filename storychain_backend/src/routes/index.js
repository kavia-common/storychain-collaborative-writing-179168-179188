const express = require('express');
const healthController = require('../controllers/health');
const authController = require('../controllers/auth');
const storiesController = require('../controllers/stories');
const paragraphsController = require('../controllers/paragraphs');
const reactionsController = require('../controllers/reactions');
const aiController = require('../controllers/ai');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
// Health endpoint

/**
 * @swagger
 * tags:
 *   - name: Health
 *   - name: Auth
 *   - name: Stories
 *   - name: Paragraphs
 *   - name: Reactions
 *   - name: AI
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/', healthController.check.bind(healthController));

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Signup new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username, password]
 *             properties:
 *               email: { type: string }
 *               username: { type: string }
 *               password: { type: string }
 *               displayName: { type: string }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict }
 */
router.post('/auth/signup', authController.signup.bind(authController));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               email: { type: string }
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 */
router.post('/auth/login', authController.login.bind(authController));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout (stateless)
 *     tags: [Auth]
 *     responses:
 *       200: { description: OK }
 */
router.post('/auth/logout', authController.logout.bind(authController));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 */
router.get('/auth/me', authRequired, authController.me.bind(authController));

/**
 * @swagger
 * /stories:
 *   get:
 *     summary: List stories
 *     tags: [Stories]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200: { description: OK }
 *   post:
 *     summary: Create a story
 *     tags: [Stories]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       201: { description: Created }
 *       401: { description: Unauthorized }
 */
router.get('/stories', storiesController.list.bind(storiesController));
router.post('/stories', authRequired, storiesController.create.bind(storiesController));

/**
 * @swagger
 * /stories/{id}:
 *   get:
 *     summary: Get story by id (with paragraphs)
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not Found }
 *   patch:
 *     summary: Update story fields
 *     tags: [Stories]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [ongoing, completed, archived] }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       404: { description: Not Found }
 */
router.get('/stories/:id', storiesController.getById.bind(storiesController));
router.patch('/stories/:id', authRequired, storiesController.update.bind(storiesController));

/**
 * @swagger
 * /stories/{storyId}/paragraphs:
 *   get:
 *     summary: List paragraphs for a story
 *     tags: [Paragraphs]
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *   post:
 *     summary: Add a paragraph to a story
 *     tags: [Paragraphs]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *               aiGenerated: { type: boolean }
 *     responses:
 *       201: { description: Created }
 *       401: { description: Unauthorized }
 */
router.get('/stories/:storyId/paragraphs', paragraphsController.listByStory.bind(paragraphsController));
router.post('/stories/:storyId/paragraphs', authRequired, paragraphsController.create.bind(paragraphsController));

/**
 * @swagger
 * /paragraphs/{paragraphId}/reactions:
 *   post:
 *     summary: Add reaction to paragraph
 *     tags: [Reactions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: paragraphId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reactionType]
 *             properties:
 *               reactionType: { type: string }
 *     responses:
 *       201: { description: Created }
 *       401: { description: Unauthorized }
 *   delete:
 *     summary: Remove reaction from paragraph
 *     tags: [Reactions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: paragraphId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reactionType]
 *             properties:
 *               reactionType: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 */
router.post('/paragraphs/:paragraphId/reactions', authRequired, reactionsController.add.bind(reactionsController));
router.delete('/paragraphs/:paragraphId/reactions', authRequired, reactionsController.remove.bind(reactionsController));

/**
 * @swagger
 * /ai/stories/{storyId}/suggest:
 *   post:
 *     summary: Suggest next paragraph for a story
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not Found }
 */
router.post('/ai/stories/:storyId/suggest', aiController.suggest.bind(aiController));

/**
 * @swagger
 * /ai/stories/{storyId}/edit:
 *   post:
 *     summary: Edit a paragraph for consistency
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not Found }
 *       400: { description: Bad Request }
 */
router.post('/ai/stories/:storyId/edit', aiController.edit.bind(aiController));

module.exports = router;
