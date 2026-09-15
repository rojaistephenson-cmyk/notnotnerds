import Link from 'next/link';
import { formatDate, excerpt } from '@/lib/format';

export default function PostCard({ post }) {
  return (
    <Link href={`/post/${post.slug}`} className="post-card">
      <span className="post-date">{formatDate(post.publish_date)}</span>
      <h3>{post.title}</h3>
      <p className="post-excerpt">{excerpt(post.body)}</p>
      <div className="post-card-reactions">
        <span>🧪 {post.reaction_beaker}</span>
        <span>🤯 {post.reaction_mindblown}</span>
      </div>
    </Link>
  );
}
