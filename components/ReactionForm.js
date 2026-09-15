import { reactToPost } from '@/lib/actions';

export default function ReactionForm({ slug, beakerCount, mindblownCount }) {
  const reactBeaker = reactToPost.bind(null, slug, 'beaker');
  const reactMindblown = reactToPost.bind(null, slug, 'mindblown');

  return (
    <div className="reactions">
      <form action={reactBeaker}>
        <button type="submit" className="reaction-btn" aria-label="React: relatable">
          🧪 Relatable <span>{beakerCount}</span>
        </button>
      </form>
      <form action={reactMindblown}>
        <button type="submit" className="reaction-btn" aria-label="React: mind blown">
          🤯 Mind. Blown. <span>{mindblownCount}</span>
        </button>
      </form>
    </div>
  );
}
