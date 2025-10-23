const { query } = require('../db');

class StoriesController {
  // PUBLIC_INTERFACE
  async list(req, res) {
    /** List stories with basic info and counts */
    try {
      const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
      const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
      const rows = await query(
        `SELECT s.id, s.title, s.description, s.status, s.created_by AS "createdBy",
                s.created_at AS "createdAt", s.updated_at AS "updatedAt",
                COALESCE(p.count,0) AS "paragraphCount"
         FROM stories s
         LEFT JOIN (
           SELECT story_id, COUNT(*)::int AS count
           FROM paragraphs GROUP BY story_id
         ) p ON p.story_id = s.id
         ORDER BY s.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return res.json({ items: rows.rows, limit, offset });
    } catch (err) {
      console.error('[stories.list] error', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // PUBLIC_INTERFACE
  async create(req, res) {
    /** Create a new story (auth required) */
    try {
      const userId = req.user?.id;
      const { title, description } = req.body || {};
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      if (!title) return res.status(400).json({ error: 'title is required' });
      const result = await query(
        `INSERT INTO stories (title, description, created_by)
         VALUES ($1, $2, $3)
         RETURNING id, title, description, status, created_by AS "createdBy",
                   created_at AS "createdAt", updated_at AS "updatedAt"`,
        [title, description || null, userId]
      );
      return res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('[stories.create] error', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // PUBLIC_INTERFACE
  async getById(req, res) {
    /** Get story by id including paragraphs */
    try {
      const { id } = req.params;
      const storyRes = await query(
        `SELECT id, title, description, status, created_by AS "createdBy",
                created_at AS "createdAt", updated_at AS "updatedAt",
                current_paragraph_order AS "currentParagraphOrder"
         FROM stories WHERE id = $1`,
        [id]
      );
      if (storyRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });

      const paraRes = await query(
        `SELECT id, story_id AS "storyId", author_id AS "authorId", content,
                paragraph_order AS "paragraphOrder", ai_generated AS "aiGenerated",
                created_at AS "createdAt", updated_at AS "updatedAt"
         FROM paragraphs WHERE story_id = $1
         ORDER BY paragraph_order ASC`,
        [id]
      );
      return res.json({ ...storyRes.rows[0], paragraphs: paraRes.rows });
    } catch (err) {
      console.error('[stories.getById] error', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // PUBLIC_INTERFACE
  async update(req, res) {
    /** Update story title/description/status (auth required for now) */
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const { title, description, status } = req.body || {};
      const result = await query(
        `UPDATE stories
         SET title = COALESCE($2, title),
             description = COALESCE($3, description),
             status = COALESCE($4, status),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, title, description, status, created_by AS "createdBy",
                   created_at AS "createdAt", updated_at AS "updatedAt"`,
        [id, title || null, description || null, status || null]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json(result.rows[0]);
    } catch (err) {
      console.error('[stories.update] error', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = new StoriesController();
