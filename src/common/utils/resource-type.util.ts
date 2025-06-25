export function inferResourceType(mime: string): 'image' | 'video' | 'raw' {
    if (mime.startsWith('video')) return 'video';
    if (mime.startsWith('image')) return 'image';
    return 'raw';
  }