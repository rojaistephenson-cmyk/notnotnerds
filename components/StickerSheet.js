'use client';

import { useState } from 'react';
import Link from 'next/link';

const FALLBACK_VARIANTS = ['sticker-fallback-a', 'sticker-fallback-b', 'sticker-fallback-c'];
const ROTATIONS = ['-4deg', '3deg', '-2deg', '5deg', '-5deg', '2deg'];

export default function StickerSheet({ posts }) {
  const [activePost, setActivePost] = useState(null);

  if (!posts.length) return null;

  return (
    <>
      <div className="sticker-sheet">
        {posts.map((post, i) => (
          <button
            key={post.id}
            type="button"
            className="sticker"
            style={{ '--r': ROTATIONS[i % ROTATIONS.length] }}
            onClick={() => setActivePost(post)}
            aria-label={`Open ${post.title}`}
          >
            {post.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.image_url} alt="" className="sticker-image" />
            ) : (
              <div
                className={`sticker-fallback ${FALLBACK_VARIANTS[i % FALLBACK_VARIANTS.length]}`}
              >
                <span className="sticker-fallback-title">{post.title}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {activePost ? (
        <div className="sticker-modal-backdrop" onClick={() => setActivePost(null)}>
          <div className="sticker-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="sticker-modal-close"
              onClick={() => setActivePost(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <h3>{activePost.title}</h3>
            <div className="sticker-modal-body">{activePost.body}</div>
            <Link href={`/post/${activePost.slug}`} className="btn">
              Read the full post →
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
