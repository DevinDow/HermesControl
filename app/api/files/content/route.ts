import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getWorkspacePath, getDashboardPath, getDronPath } from '../../../lib/paths';

function resolveFilePath(folderPath: string, filePath: string): string | null {
  /*if (path.startsWith(getWorkspacePath()) || path.startsWith(getDashboardPath()) || path.startsWith(getDronPath())) {
    return path;
  }*/

  // resolve Relative Paths
  const absolutePath = path.resolve(folderPath, filePath);
  if (absolutePath.startsWith(folderPath)) {
    return absolutePath;
  }
  
  return null;
}

/**
 * GET /api/files/content?path=...
 * Reads the content of a workspace file.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('file');
  const folderPath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  try {
    const absolutePath = resolveFilePath(folderPath, filePath);
    console.log('Resolved absolute path:', absolutePath);

    if (!absolutePath) {
      return NextResponse.json({ error: 'Access denied: Path outside allowed scope' }, { status: 403 });
    }

    const content = await fs.readFile(absolutePath, 'utf8');
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('File Read Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/files/content
 * Overwrites the content of a workspace file.
 */
export async function POST(request: Request) {
  try {
    const { file: filePath, path: folderPath, content } = await request.json();

    if (!filePath || !folderPath || content === undefined) {
      return NextResponse.json({ error: 'Path and content are required' }, { status: 400 });
    }

    const absolutePath = resolveFilePath(folderPath, filePath);
    console.log('Resolved absolute path:', absolutePath);

    await fs.writeFile(absolutePath, content, 'utf8');

    return NextResponse.json({ success: true, path: absolutePath });
  } catch (error: any) {
    console.error('File Write Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
