import Link from 'next/link';
import { getFeaturedPost, getRecentPosts } from '@/lib/db';
import PostCard from '@/components/PostCard';
import ReactionForm from '@/components/ReactionForm';
import { formatDate } from '@/lib/format';

export default async function HomePage() {
  const featured = await getFeaturedPost();
  const recent = await getRecentPosts(featured?.id ?? -1, 12);

  return (
    <div>
      <div className="page-intro">
        <h1>Science humor for people who read the supplementary material.</h1>
        <p>
          Inside jokes for bio, chem, and med people. If you have to explain
          the punchline, it's probably a control group.
        </p>
      </div>

      {featured ? (
        <article className="featured">
          <span className="featured-label">🧫 Post of the week</span>
          <Link href={`/post/${featured.slug}`}>
            <h2>{featured.title}</h2>
          </Link>
          <p className="post-excerpt">{trim(featured.body)}</p>
          <div className="featured-meta">
            <span className="post-date">{formatDate(featured.publish_date)}</span>
            <ReactionForm
              slug={featured.slug}
              beakerCount={featured.reaction_beaker}
              mindblownCount={featured.reaction_mindblown}
            />
          </div>
        </article>
      ) : (
        <div className="empty-state">No posts yet. Be the first to submit one.</div>
      )}

      <div className="section-heading">
        <h2>Recent posts</h2>
        <span className="mono-tag">n = {recent.length}</span>
      </div>

      {recent.length ? (
        <div className="post-grid">
          {recent.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          Nothing else published yet — check back after the next lab meeting.
        </div>
      )}
    </div>
  );
}

function trim(text, length = 320) {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}
