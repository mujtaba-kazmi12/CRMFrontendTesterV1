// This is a static AMP page that bypasses Next.js layout system
export default function AMPStaticPage() {
  // This will be a static export that generates pure AMP HTML
  return null; // We'll handle this via static generation
}

// Generate static AMP HTML
export async function generateStaticParams() {
  return [];
}

// This will be handled by a custom webpack plugin or build step
// For now, we'll create a simple redirect to a static AMP file