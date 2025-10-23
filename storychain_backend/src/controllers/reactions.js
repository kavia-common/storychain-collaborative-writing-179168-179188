const { query } = require('../db');

class ReactionsController {
  // PUBLIC_INTERFACE
  async add(req, res) {
    /** Add a reaction to a paragraph (auth required). Unique per user/type/paragraph */
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { paragraphId } = req.params;
      const { reactionType } = req.body || {};
      if (!reactionType) return res.status(400).json({ error: 'reactionType is required' });

      const insert = await query(
        'INSERT INTO reactions (paragraph_id, user_id, reaction_type)' +
          ' VALUES ($1, $2, $3)' +
          ' ON CONFLICT (paragraph_id, user_id, reaction_type) DO NOTHING' +
          ' RETURNING id, paragraph_id AS "paragraphId", user_id AS "userId",' +
          ' reaction_type AS "reactionType", created_at AS "createdAt"',
        [paragraphId, userId, reactionType]
      );
      if (insert.rows.length === 0) {
        // already exists, return current
        const exists = await query(
          'SELECT id, paragraph_id AS "paragraphId", user_id AS "userId",' +
            ' reaction_type AS "reactionType", created_at AS "createdAt"' +
            ' FROM reactions WHERE paragraph_id = $1 AND user_id = $2 AND reaction_type = $3',
          [paragraphId, userId, reactionType]
        );
        return res.json(exists.rows[0]);
      }
      return res.status(201).json(insert.rows[0]);
    } catch (err) {
      console.error('[reactions.add] error', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // PUBLIC_INTERFACE
  async remove(req, res) {
    /** Remove a reaction (auth required). */
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { paragraphId } = req.params;
      const { reactionType } = req.body || {};
      if (!reactionType) return res.status(400).json({ error: 'reactionType is required' });

      const del = await query(
        'DELETE FROM reactions WHERE paragraph_id = $1 AND user_id = $2 AND reaction_type = $3',
        [paragraphId, userId, reactionType]
      );
      return res.json({ success: true, deleted: del.rowCount });
    } catch (err) {
      console.error('[reactions.remove] error', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = new ReactionsController();
