'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace('/index.html');
    }
  }, []);

  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f8faf9', color: '#18221d' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>CONNECT</h1>
        <p style={{ color: '#6b7c73', fontSize: '0.9rem' }}>Loading platform feed...</p>
        <Link href="/index.html" style={{ display: 'inline-block', marginTop: '12px', color: '#3d6052', fontWeight: 600 }}>
          Click here if not redirected automatically
        </Link>
      </div>
    </main>
  );
}
