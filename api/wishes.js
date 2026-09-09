const { neon } = require('@neondatabase/serverless');

// The Vercel/Neon integration writes DATABASE_URL; older projects use POSTGRES_URL.
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

let ready;
function ensureTable() {
  if (!ready) {
    ready = sql`
      CREATE TABLE IF NOT EXISTS wishes (
        id         BIGSERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        msg        TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
  }
  return ready;
}

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return req.body;
}

module.exports = async function handler(req, res) {
  try {
    await ensureTable();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id, name, msg, created_at
        FROM wishes
        ORDER BY id DESC
        LIMIT 300`;
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ wishes: rows });
    }

    if (req.method === 'POST') {
      const body = readBody(req);
      // Length caps only - they keep one oversized paste from breaking the page,
      // there is no moderation.
      const name = String(body.name || '').trim().slice(0, 80);
      const msg = String(body.msg || '').trim().slice(0, 1000);
      if (!name || !msg) {
        return res.status(400).json({ error: 'name and msg are required' });
      }
      const rows = await sql`
        INSERT INTO wishes (name, msg)
        VALUES (${name}, ${msg})
        RETURNING id, name, msg, created_at`;
      return res.status(201).json({ wish: rows[0] });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('wishes:', err);
    return res.status(500).json({ error: 'server error' });
  }
};
