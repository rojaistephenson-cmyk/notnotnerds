import { getPendingSubmissions, getAllPostsForAdmin } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import {
  adminLogin,
  adminLogout,
  approveSubmission,
  rejectSubmission,
  setFeatured,
} from '@/lib/actions';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Admin' };

export default async function AdminPage({ searchParams }) {
  const authed = isAdminAuthenticated();

  if (!authed) {
    const error = searchParams?.error === '1';
    return (
      <div className="admin-login">
        <h1>Admin</h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 20 }}>
          Password-protected for now. Set <code>ADMIN_PASSWORD</code> in your
          environment.
        </p>
        {error ? (
          <div className="notice notice-error">Wrong password.</div>
        ) : null}
        <form action={adminLogin} className="stack">
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoFocus />
          </div>
          <button type="submit" className="btn">
            Enter
          </button>
        </form>
      </div>
    );
  }

  const pending = await getPendingSubmissions();
  const posts = await getAllPostsForAdmin();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin</h1>
        <form action={adminLogout}>
          <button type="submit" className="btn btn-ghost">
            Log out
          </button>
        </form>
      </div>

      <section className="admin-section">
        <div className="section-heading">
          <h2>Pending submissions</h2>
          <span className="mono-tag">n = {pending.length}</span>
        </div>

        {pending.length === 0 ? (
          <div className="empty-state">Queue is empty. Nice and caught up.</div>
        ) : (
          pending.map((s) => {
            const approve = approveSubmission.bind(null, s.id);
            const reject = rejectSubmission.bind(null, s.id);
            return (
              <div className="submission-card" key={s.id}>
                <div className="submission-meta">
                  <span>{formatDate(s.created_at)}</span>
                  {s.submitter_name ? <span>from {s.submitter_name}</span> : null}
                  {s.submitter_email ? <span>{s.submitter_email}</span> : null}
                </div>
                <h3>{s.title}</h3>
                <p className="submission-body">{s.body}</p>
                <div className="btn-row">
                  <form action={approve}>
                    <button type="submit" className="btn">
                      Approve &amp; publish
                    </button>
                  </form>
                  <form action={reject}>
                    <button type="submit" className="btn btn-danger">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <h2>Published posts</h2>
          <span className="mono-tag">n = {posts.length}</span>
        </div>

        {posts.map((p) => {
          const feature = setFeatured.bind(null, p.slug);
          return (
            <div className="post-manage-row" key={p.id}>
              <div>
                <strong>{p.title}</strong>{' '}
                {p.featured ? <span className="pill pill-featured">Post of the week</span> : null}
                <div className="mono-tag" style={{ marginTop: 4 }}>
                  {formatDate(p.publish_date)}
                </div>
              </div>
              {!p.featured && (
                <form action={feature}>
                  <button type="submit" className="btn btn-ghost">
                    Make post of the week
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
