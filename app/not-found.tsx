import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'sans-serif' }}>
      <h2>404 - Page Not Found</h2>
      <p style={{ marginTop: '10px' }}>
        <Link href="/index.html" style={{ color: '#3d6052', textDecoration: 'underline' }}>
          Return to Connectly Home
        </Link>
      </p>
    </div>
  );
}
