import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'notnotnerds',
    template: '%s · notnotnerds',
  },
  description:
    'Science humor for people who already know what a Bonferroni correction is.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      >
        <div className="site-shell">
          <header className="site-header">
            <Link href="/" className="wordmark">
              <span className="wordmark-not">not</span>
              <span className="wordmark-not">not</span>
              <span className="wordmark-nerds">nerds</span>
            </Link>
            <nav className="site-nav">
              <Link href="/">Posts</Link>
              <Link href="/submit">Submit a bit</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </header>

          <main className="site-main">{children}</main>

          <footer className="site-footer">
            <p>
              <span className="mono-tag">p &lt; 0.05</span> humor, allegedly.
            </p>
            <p className="footer-fine">
              notnotnerds — for people in STEM who laugh at the footnotes.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
