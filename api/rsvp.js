const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

let ready;
function ensureTable() {
  if (!ready) {
    ready = sql`
      CREATE TABLE IF NOT EXISTS rsvp (
        id         BIGSERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        attending  TEXT NOT NULL,
        message    TEXT,
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

// POST only on purpose: answers carry guest names, so they are not served back
// over a public URL. Read them in the Neon SQL editor: SELECT * FROM rsvp;
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  try {
    await ensureTable();
    const body = readBody(req);
    const name = String(body.name || '').trim().slice(0, 80);
    const attending = body.attending === 'confirmed' ? 'confirmed'
      : body.attending === 'declined' ? 'declined' : '';
    const message = String(body.message || '').trim().slice(0, 1000) || null;

    if (!name || !attending) {
      return res.status(400).json({ error: 'name and attending are required' });
    }

    const rows = await sql`
      INSERT INTO rsvp (name, attending, message)
      VALUES (${name}, ${attending}, ${message})
      RETURNING id`;
    return res.status(201).json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error('rsvp:', err);
    return res.status(500).json({ error: 'server error' });
  }
};
