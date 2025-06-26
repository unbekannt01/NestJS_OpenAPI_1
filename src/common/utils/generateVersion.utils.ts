export function getVersionedFileName(
  originalName: string,
  existingFileNames: string[],
): string {
  const ext = originalName.substring(originalName.lastIndexOf('.')); // .png
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')); // image

  let version = 0;
  const namePattern = new RegExp(`^${baseName}(\\((\\d+)\\))?${ext}$`);

  existingFileNames.forEach((name) => {
    const match = name.match(namePattern);
    if (match) {
      const ver = match[2] ? parseInt(match[2], 10) : 0;
      if (ver >= version) {
        version = ver + 1;
      }
    }
  });

  return version === 0 ? `${baseName}${ext}` : `${baseName}(${version})${ext}`;
}
