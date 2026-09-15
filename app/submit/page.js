import { submitPost } from '@/lib/actions';

export const metadata = { title: 'Submit a bit' };

export default function SubmitPage({ searchParams }) {
  const success = searchParams?.success === '1';
  const error = searchParams?.error === 'missing';

  return (
    <div className="form-page">
      <div className="form-intro">
        <h1>Submit a bit</h1>
        <p>
          Got a joke, a meme caption, or a rant that only makes sense to
          people who've pipetted at 2am? Send it in. Everything goes into a
          moderation queue first — nothing publishes automatically.
        </p>
      </div>

      {success ? (
        <div className="notice notice-success">
          Got it. Thanks for the submission — someone will review it soon.
        </div>
      ) : null}
      {error ? (
        <div className="notice notice-error">
          Title and body are both required. Try again.
        </div>
      ) : null}

      <form action={submitPost} className="stack">
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" required maxLength={200} />
        </div>

        <div className="field">
          <label htmlFor="body">
            Body <span className="hint">— the actual joke/post</span>
          </label>
          <textarea id="body" name="body" rows={8} required maxLength={4000} />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="name">
              Name <span className="hint">(optional)</span>
            </label>
            <input id="name" name="name" type="text" maxLength={100} />
          </div>
          <div className="field">
            <label htmlFor="email">
              Email <span className="hint">(optional, not published)</span>
            </label>
            <input id="email" name="email" type="email" maxLength={200} />
          </div>
        </div>

        <button type="submit" className="btn">
          Send it to the queue
        </button>
      </form>
    </div>
  );
}
