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
      title: 'The Central Dogma of Procrastination',
      body: `DNA gets transcribed into RNA. RNA gets translated into protein. And my to-do list gets transcribed into a slightly different to-do list, then translated into an excuse, then degraded by proteasomes of guilt before it ever reaches the ribosome of Getting Anything Done.\n\nSomewhere there's a repressor protein binding my motivation's promoter region and I have not identified the operon.\n\nReviewer 2 says my methods section is "insufficiently reproducible." Reviewer 2 has clearly never tried to reproduce my sleep schedule.`,
      featured: 1,
      reaction_beaker: 41,
      reaction_mindblown: 12,
      daysAgo: 1,
    },
    {
      title: "Schrödinger's Gel",
      body: `Ran a gel at 8pm. Did not check it until 11pm. For three hours, my bands were simultaneously perfect and completely smeared, existing in a superposition of "Nature-paper-worthy" and "start over."\n\nOpened the imager. Wave function collapsed. It was smeared.\n\nMy PI is now asking why I "wasted a whole tube of ladder observing quantum mechanics."`,
      featured: 0,
      reaction_beaker: 33,
      reaction_mindblown: 9,
      daysAgo: 3,
    },
    {
      title: 'SOAP Note From a Broken Heart',
      body: `S: Patient reports "I'm fine," denies distress. Further questioning reveals repeated checking of ex's Instagram story views.\n\nO: HR 118 bpm on standing, notably elevated only when ex's name appears in group chat. Affect flat except when "our song" plays, at which point affect becomes decidedly not flat.\n\nA: Acute exacerbation of chronic My Chart Says I'm Over It But My Vitals Disagree.\n\nP: NSAIDs for the associated tension headache. Ibuprofen will not, unfortunately, treat the underlying etiology. Recommend follow-up with friends, a playlist ban, and time.`,
      featured: 0,
      reaction_beaker: 27,
      reaction_mindblown: 15,
      daysAgo: 5,
    },
    {
      title: 'PCR: Please Cool it, Reviewer 2',
      body: `Denaturation: 95°C, 30 seconds. My blood pressure reading Reviewer 2's comments: significantly higher, significantly longer.\n\nAnnealing: primers bind specifically to their target sequence. Reviewer 2 binds nonspecifically to every sentence in my discussion section, including the one where I thanked my funding source.\n\nExtension: Taq polymerase adds nucleotides 5' to 3', faithfully, methodically, without judgment. I am aspiring to be more like Taq polymerase in this revision cycle.\n\n35 cycles later: exponential amplification of both my dataset and my will to live.`,
      featured: 0,
      reaction_beaker: 22,
      reaction_mindblown: 6,
      daysAgo: 8,
    },
  ];

  const now = Date.now();
  for (const p of seedPosts) {
    const iso = new Date(now - p.daysAgo * 86400000).toISOString();
    // eslint-disable-next-line no-await-in-loop
    const slug = await computeUniqueSlug(p.title);
    // eslint-disable-next-line no-await-in-loop
    await client.execute({
      sql: `INSERT INTO posts (slug, title, body, publish_date, featured, reaction_beaker, reaction_mindblown, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        slug,
        p.title,
        p.body,
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
