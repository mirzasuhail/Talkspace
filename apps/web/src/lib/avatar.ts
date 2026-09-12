export function generateAvatarSvg(seed: string, nickname: string): string {
  let hash = 0;
  const str = (seed || nickname || 'talksy').toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 40 + (Math.abs(hash >> 3) % 80)) % 360;
  const initial = (nickname || 'T').charAt(0).toUpperCase();

  const color1 = `hsl(${hue1}, 75%, 55%)`;
  const color2 = `hsl(${hue2}, 85%, 45%)`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="100%" height="100%">
      <defs>
        <linearGradient id="grad-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}" />
          <stop offset="100%" stop-color="${color2}" />
        </linearGradient>
      </defs>
      <rect width="80" height="80" rx="24" fill="url(#grad-${hash})" />
      <text x="50%" y="54%" font-family="Inter, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">
        ${initial}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
