import sanitizeHtml from 'sanitize-html';

export function sanitizeText(text: string): string {
  if (!text) return '';
  return sanitizeHtml(text.trim(), {
    allowedTags: [],
    allowedAttributes: {},
  });
}

export function sanitizeMarkdown(text: string): string {
  if (!text) return '';
  // Sanitize HTML input while allowing raw markdown syntax like * _ ` [ ]
  return sanitizeHtml(text.trim(), {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre', 'br'],
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
    },
    transformTags: {
      'a': sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
    },
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
