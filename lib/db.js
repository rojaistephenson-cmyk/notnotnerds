import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

// DATABASE_URL defaults to a local SQLite file so `npm run dev` works with
// zero setup. Point it at a Turso database (libsql://...) in production —
// see .env.example and the README for how to get one.
const url = process.env.DATABASE_URL || 'file:./data/notnotnerds.db';

if (url.startsWith('file:')) {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

// Reuse one client across hot reloads in dev so we don't leak connections.
const globalForDb = globalThis;
const client =
  globalForDb.__nnnClient ||
  createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
if (process.env.NODE_ENV !== 'production') globalForDb.__nnnClient = client;

let readyPromise = globalForDb.__nnnReady;

function ensureReady() {
  if (!readyPromise) {
    readyPromise = setup();
    if (process.env.NODE_ENV !== 'production') globalForDb.__nnnReady = readyPromise;
  }
  return readyPromise;
}

async function setup() {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        image_url TEXT,
        publish_date TEXT NOT NULL,
        featured INTEGER NOT NULL DEFAULT 0,
        reaction_beaker INTEGER NOT NULL DEFAULT 0,
        reaction_mindblown INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        submitter_name TEXT,
        submitter_email TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ],
    'write'
  );
  await seedIfEmpty();
}

function slugify(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60) || 'post'
  );
}

// Internal — assumes the schema already exists. Used both by the public
// uniqueSlug() below and during seeding, before ensureReady() would resolve.
async function computeUniqueSlug(title) {
  const base = slugify(title);
  let slug = base;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while ((await client.execute({ sql: 'SELECT 1 FROM posts WHERE slug = ?', args: [slug] })).rows.length) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export async function uniqueSlug(title) {
  await ensureReady();
  return computeUniqueSlug(title);
}

async function seedIfEmpty() {
  const res = await client.execute('SELECT COUNT(*) AS count FROM posts');
  if (Number(res.rows[0].count) > 0) return;

  const seedPosts = [
    {
      title: "Null hypothesis: I'm fine",
      image_url: '/images/sticker-null.jpg',
      body: `In statistics you start by assuming nothing's going on — that's the null hypothesis. You only reject it once the data clears a threshold (p < 0.05). This one's assuming everything's fine until proven otherwise.`,
      featured: 1,
      reaction_beaker: 41,
      reaction_mindblown: 12,
      daysAgo: 1,
    },
    {
      title: 'Currently in G0',
      image_url: '/images/sticker-g0.jpg',
      body: `G0 is the resting phase of the cell cycle — the cell isn't growing, isn't dividing, just sitting there. Borrowing cell-cycle vocabulary to announce you're taking the day off.`,
      featured: 0,
      reaction_beaker: 35,
      reaction_mindblown: 10,
      daysAgo: 2,
    },
    {
      title: 'Ask me about my Michaelis constant',
      image_url: '/images/sticker-km.jpg',
      body: `Km (the Michaelis constant) is the substrate concentration where an enzyme runs at half its top speed. It's enzyme kinetics doing double duty as a pickup line.`,
      featured: 0,
      reaction_beaker: 29,
      reaction_mindblown: 14,
      daysAgo: 3,
    },
    {
      title: 'N=1 but trust me',
      image_url: '/images/sticker-n1.jpg',
      body: `N is your sample size. N=1 means the entire dataset is one (1) person's experience — statistically it proves nothing. Anecdotally, it's iron-clad.`,
      featured: 0,
      reaction_beaker: 33,
      reaction_mindblown: 9,
      daysAgo: 4,
    },
    {
      title: 'Gram-negative and I know it',
      image_url: '/images/sticker-gram.jpg',
      body: `Gram staining sorts bacteria into two camps based on their cell wall. This one's a Gram-stain riff on a certain 2011 party anthem, for the negative-staining crowd.`,
      featured: 0,
      reaction_beaker: 27,
      reaction_mindblown: 15,
      daysAgo: 5,
    },
    {
      title: 'My love language is beta oxidation',
      image_url: '/images/sticker-beta.jpg',
      body: `Beta oxidation is how your body breaks fatty acids down into usable energy, two carbons at a time. Weirdly romantic once you're the one being broken down for someone.`,
      featured: 0,
      reaction_beaker: 22,
      reaction_mindblown: 6,
      daysAgo: 6,
    },
  ];

  const now = Date.now();
  for (const p of seedPosts) {
    const iso = new Date(now - p.daysAgo * 86400000).toISOString();
    // eslint-disable-next-line no-await-in-loop
    const slug = await computeUniqueSlug(p.title);
    // eslint-disable-next-line no-await-in-loop
    await client.execute({
      sql: `INSERT INTO posts (slug, title, body, image_url, publish_date, featured, reaction_beaker, reaction_mindblown, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        slug,
        p.title,
        p.body,
        p.image_url || null,
        iso.slice(0, 10),
        p.featured,
        p.reaction_beaker,
        p.reaction_mindblown,
        iso,
      ],
    });
  }
}

// --- Reads ---------------------------------------------------------------

export async function getFeaturedPost() {
  await ensureReady();
  const featured = await client.execute(
    'SELECT * FROM posts WHERE featured = 1 ORDER BY created_at DESC LIMIT 1'
  );
  if (featured.rows[0]) return featured.rows[0];
  const fallback = await client.execute('SELECT * FROM posts ORDER BY created_at DESC LIMIT 1');
  return fallback.rows[0] || null;
}

export async function getRecentPosts(excludeId, limit = 12) {
  await ensureReady();
  const res = await client.execute({
    sql: 'SELECT * FROM posts WHERE id != ? ORDER BY created_at DESC LIMIT ?',
    args: [excludeId ?? -1, limit],
  });
  return res.rows;
}

export async function getPostBySlug(slug) {
  await ensureReady();
  const res = await client.execute({ sql: 'SELECT * FROM posts WHERE slug = ?', args: [slug] });
  return res.rows[0] || null;
}

export async function getAllPostsForAdmin() {
  await ensureReady();
  const res = await client.execute(
    'SELECT id, slug, title, featured, publish_date FROM posts ORDER BY created_at DESC'
  );
  return res.rows;
}

export async function getPendingSubmissions() {
  await ensureReady();
  const res = await client.execute(
    "SELECT * FROM submissions WHERE status = 'pending' ORDER BY created_at ASC"
  );
  return res.rows;
}

// --- Writes ----------------------------------------------------------------

export async function insertSubmission({ title, body, name, email }) {
  await ensureReady();
  await client.execute({
    sql: `INSERT INTO submissions (title, body, submitter_name, submitter_email)
          VALUES (?, ?, ?, ?)`,
    args: [title, body, name || null, email || null],
  });
}

export async function incrementReaction(slug, type) {
  await ensureReady();
  const column = type === 'mindblown' ? 'reaction_mindblown' : 'reaction_beaker';
  await client.execute({
    sql: `UPDATE posts SET ${column} = ${column} + 1 WHERE slug = ?`,
    args: [slug],
  });
}

export async function approveSubmissionRow(id) {
  await ensureReady();
  const res = await client.execute({ sql: 'SELECT * FROM submissions WHERE id = ?', args: [id] });
  const submission = res.rows[0];
  if (!submission || submission.status !== 'pending') return;

  const slug = await computeUniqueSlug(submission.title);
  await client.batch(
    [
      {
        sql: `INSERT INTO posts (slug, title, body, publish_date) VALUES (?, ?, ?, date('now'))`,
        args: [slug, submission.title, submission.body],
      },
      {
        sql: "UPDATE submissions SET status = 'approved' WHERE id = ?",
        args: [id],
      },
    ],
    'write'
  );
}

export async function rejectSubmissionRow(id) {
  await ensureReady();
  await client.execute({
    sql: "UPDATE submissions SET status = 'rejected' WHERE id = ?",
    args: [id],
  });
}

export async function setFeaturedPost(slug) {
  await ensureReady();
  await client.batch(
    ['UPDATE posts SET featured = 0', { sql: 'UPDATE posts SET featured = 1 WHERE slug = ?', args: [slug] }],
    'write'
  );
}
