const { query } = require('../db');

class ParagraphsController {
  // PUBLIC_INTERFACE
  async listByStory(req, res) {
    /** List paragraphs for a story, ordered by paragraph_order */
    try {
      const { storyId } = req.params;
      const rows = await query(
        'SELECT id, story_id AS "storyId", author_id AS "authorId", content,' +
          ' paragraph_order AS "paragraphOrder", ai_generated AS "aiGenerated",' +
          ' created_at AS "createdAt", updated_at AS "updatedAt"' +
          ' FROM paragraphs' +
          ' WHERE story_id = $1' +
          ' ORDER BY paragraph_order ASC',
        [storyId]
      );
      return res.json({ items: rows.rows });
    } catch (err) {
      console.error('[paragraphs.listByStory] error', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // PUBLIC_INTERFACE
  async create(req, res) {
    /** Create a paragraph at next order for a story (auth required) */
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { storyId } = req.params;
      const { content, aiGenerated } = req.body || {};
      if (!content) return res.status(400).json({ error: 'content is required' });

      // Determine next paragraph_order
      const nextRes = await query(
        'SELECT COALESCE(MAX(paragraph_order), -1) + 1 AS next_order' +
          ' FROM paragraphs WHERE story_id = $1',
        [storyId]
      );
      const nextOrder = nextRes.rows[0]?.next_order ?? 0;

      const insertRes = await query(
        'INSERT INTO paragraphs (story_id, author_id, content, paragraph_order, ai_generated)' +
          ' VALUES ($1, $2, $3, $4, $5)' +
          ' RETURNING id, story_id AS "storyId", author_id AS "authorId", content,' +
          ' paragraph_order AS "paragraphOrder", ai_generated AS "aiGenerated",' +
          ' created_at AS "createdAt", updated_at AS "updatedAt"',
        [storyId, userId, content, nextOrder, aiGenerated ? true : false]
      );

      // Update the story's current_paragraph_order
      await query(
        'UPDATE stories SET current_paragraph_order = $2, updated_at = NOW() WHERE id = $1',
        [storyId, nextOrder]
      );

      return res.status(201).json(insertRes.rows[0]);
    } catch (err) {
      console.error('[paragraphs.create] error', err);
      if (err && err.code === '23503') {
        return res.status(400).json({ error: 'Invalid storyId' });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = new ParagraphsController();
