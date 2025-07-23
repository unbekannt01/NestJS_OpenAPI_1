export function inferResourceType(mimeType: string): 'image' | 'video' | 'raw' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'raw';
}

export function extractPublicId(urlOrId: string): string {
  const match = urlOrId.match(/\/v\d+\/(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : urlOrId;
}
