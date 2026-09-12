export default function manifest() {
  return {
    name: 'Color Rush — Reflex Arena',
    short_name: 'Color Rush',
    description: 'A neon symbol and color reflex challenge.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#030817',
    theme_color: '#030817',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
  };
}
