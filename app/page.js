import { getRecentPosts } from '@/lib/db';
import PostCard from '@/components/PostCard';
import StickerSheet from '@/components/StickerSheet';
import FunFactCard from '@/components/FunFactCard';

export default async function HomePage() {
  const posts = await getRecentPosts(-1, 200);
  const stickerPosts = posts.slice(0, 6).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    body: p.body,
    image_url: p.image_url ?? null,
  }));

  return (
    <div>
      <section className="hero">
        <div className="hero-text">
          <h1>Jokes built for a very specific audience.</h1>
          <p className="hero-sub">
            If you laughed before you saw the translation, you're who we
            made this for. If you didn't — that's fine too, you'll just
            have to trust us it's funny.
          </p>
        </div>
        <StickerSheet posts={stickerPosts} />
      </section>

      <section className="manifesto">
        <p className="manifesto-item">
          <strong>The joke comes first.</strong> Every design starts as a bit
          someone's lab group would text each other. If the joke isn't real,
          it doesn't get made.
        </p>
        <p className="manifesto-item">
          <strong>We check our work.</strong> Puns get run past someone in
          the field before they're used, so the science is actually right.
        </p>
        <p className="manifesto-item">
          <strong>Small on purpose.</strong> Not trying to be a big store.
          Just trying to be the sticker on a water bottle that one person
          recognizes.
        </p>
      </section>

      <FunFactCard />

      <div className="section-heading">
        <h2>Full catalog</h2>
        <span className="mono-tag">n = {posts.length}</span>
      </div>

      {posts.length ? (
        <div className="post-grid">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="empty-state">No posts yet. Be the first to submit one.</div>
      )}
    </div>
  );
}
