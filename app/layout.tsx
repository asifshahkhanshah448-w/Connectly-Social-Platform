import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Connectly — Minimalist Social Media Platform',
  description: 'A modern, minimalist full-stack social media platform with user profiles, posts, comments, likes, and follow system.',
  openGraph: {
    title: 'Connectly — Minimalist Social Media Platform',
    description: 'A modern, minimalist full-stack social media platform with user profiles, posts, comments, likes, and follow system.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Connectly — Minimalist Social Media Platform',
    description: 'A modern, minimalist full-stack social media platform with user profiles, posts, comments, likes, and follow system.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF9F5] text-stone-800 antialiased min-h-screen selection:bg-emerald-100 selection:text-emerald-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
