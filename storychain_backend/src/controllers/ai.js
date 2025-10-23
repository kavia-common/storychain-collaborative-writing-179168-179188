const fetch = require('node-fetch');
const { query } = require('../db');

/**
 * AI Controller integrates with an OpenAI-compatible API if OPENAI_API_KEY is provided.
 * Uses OPENAI_BASE_URL if set (default https://api.openai.com/v1), and model from OPENAI_MODEL (default gpt-4o-mini).
 * If not configured, returns basic heuristic placeholders.
 */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function callOpenAI(messages, temperature = 0.7) {
  const url = `${OPENAI_BASE_URL}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  return content;
}

class AIController {
  // PUBLIC_INTERFACE
  async suggest(req, res) {
    /**
     * Suggest a next paragraph for a story based on existing context.
     * If OpenAI not configured, returns a deterministic suggestion.
     */
    try {
      const { storyId } = req.params;
      // Load last few paragraphs for context
      const storyRes = await query(
        'SELECT title, description FROM stories WHERE id = $1',
        [storyId]
      );
      if (storyRes.rows.length === 0) {
        return res.status(404).json({ error: 'Story not found' });
      }
      const { title, description } = storyRes.rows[0];
      const parasRes = await query(
        'SELECT content FROM paragraphs WHERE story_id = $1 ORDER BY paragraph_order DESC LIMIT 5',
        [storyId]
      );
      const latest = parasRes.rows.map((r) => r.content).reverse();

      if (!OPENAI_API_KEY) {
        const simple = `Continuing '${title}': ${latest.slice(-1)[0] || description || 'The story begins...'} [AI suggestion placeholder]`;
        return res.json({ suggestion: simple, provider: 'local-fallback' });
      }

      const messages = [
        { role: 'system', content: 'You are a helpful writing assistant that continues collaborative stories with coherent, engaging paragraphs.' },
        { role: 'user', content: `Story title: ${title}\nDescription: ${description || '(none)'}\nRecent paragraphs:\n${latest.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nWrite the next single paragraph (no meta text).` },
      ];
      const suggestion = await callOpenAI(messages, 0.8);
      return res.json({ suggestion: suggestion.trim(), provider: 'openai' });
    } catch (err) {
      console.error('[ai.suggest] error', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // PUBLIC_INTERFACE
  async edit(req, res) {
    /**
     * Edit a given paragraph for consistency with the story so far.
     * Body: { content }
     */
    try {
      const { storyId } = req.params;
      const { content } = req.body || {};
      if (!content) return res.status(400).json({ error: 'content is required' });

      const storyRes = await query(
        'SELECT title, description FROM stories WHERE id = $1',
        [storyId]
      );
      if (storyRes.rows.length === 0) return res.status(404).json({ error: 'Story not found' });
      const { title, description } = storyRes.rows[0];

      const parasRes = await query(
        'SELECT content FROM paragraphs WHERE story_id = $1 ORDER BY paragraph_order DESC LIMIT 5',
        [storyId]
      );
      const latest = parasRes.rows.map((r) => r.content).reverse();

      if (!OPENAI_API_KEY) {
        // Simple local edit: trim and ensure ending period
        let edited = content.trim();
        if (!/[.!?]'?$/.test(edited)) edited += '.';
        return res.json({ edited, provider: 'local-fallback' });
      }

      const messages = [
        { role: 'system', content: 'You edit text to improve consistency and tone with the ongoing story. Keep the original meaning.' },
        { role: 'user', content: `Story '${title}' context:\n${description || '(none)'}\nRecent paragraphs:\n${latest.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nEdit the following paragraph for consistency and clarity while preserving its meaning:\n---\n${content}\n---\nReturn only the edited paragraph.` },
      ];
      const edited = await callOpenAI(messages, 0.4);
      return res.json({ edited: edited.trim(), provider: 'openai' });
    } catch (err) {
      console.error('[ai.edit] error', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = new AIController();
