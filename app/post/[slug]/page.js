import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug } from '@/lib/db';
import ReactionForm from '@/components/ReactionForm';
import { formatDate, excerpt } from '@/lib/format';

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: excerpt(post.body, 150),
  };
}

export default async function PostPage({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <article className="post-page">
      <Link href="/" className="back-link">
        ← Back to posts
      </Link>

      <div className="post-page-header">
        {post.featured ? <span className="featured-label">🧫 Post of the week</span> : null}
        <h1>{post.title}</h1>
        <span className="post-date">{formatDate(post.publish_date)}</span>
      </div>

      {post.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="post-image" src={post.image_url} alt="" />
      ) : null}

      <div className="post-body">{post.body}</div>

      <ReactionForm
        slug={post.slug}
        beakerCount={post.reaction_beaker}
        mindblownCount={post.reaction_mindblown}
      />
    </article>
  );
}
