/**
 * Saves file content to the server via the /api/files/content endpoint.
 *
 * @param filePath     - The path of the file to save.
 * @param folderPath     - The path of the folder to save.
 * @param content  - The new file content to write.
 * @returns        - true on success; throws on network/server error.
 */
export async function saveFile(filePath: string, folderPath: string, content: string): Promise<true> {
  const res = await fetch('/api/files/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath: filePath, folderPath: folderPath, content }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? `Save failed: ${res.status} ${res.statusText}`);
  }

  return true;
}

