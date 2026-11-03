import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'CONNECT – Professional Full-Stack Social Media Platform',
  description: 'A minimal, modern full-stack social media web application with user authentication, profiles, posts, comments, likes, and follow system.',
  openGraph: {
    title: 'CONNECT – Professional Full-Stack Social Media Platform',
    description: 'A minimal, modern full-stack social media web application with user authentication, profiles, posts, comments, likes, and follow system.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CONNECT – Professional Full-Stack Social Media Platform',
    description: 'A minimal, modern full-stack social media web application with user authentication, profiles, posts, comments, likes, and follow system.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
