import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getWorkspacePath, getDashboardPath } from '../../../lib/paths';

function resolveFilePath(filePath: string): string | null {
  if (filePath.startsWith(getDashboardPath())){
    console.log('Resolving file path:', filePath);
    return filePath; // Already an absolute path to the Dashboard folder, which is outside the workspace but allowed
  }
  
  // resolve Relative Paths
  const workspacePath = getWorkspacePath();
  const absolutePath = path.resolve(workspacePath, filePath);
  if (absolutePath.startsWith(workspacePath)) {
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
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  try {
    const absolutePath = resolveFilePath(filePath);

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
    const { path: relativePath, content } = await request.json();

    if (!relativePath || content === undefined) {
      return NextResponse.json({ error: 'Path and content are required' }, { status: 400 });
    }

    const absolutePath = resolveFilePath(relativePath);

    if (!absolutePath) {
      return NextResponse.json({ error: 'Access denied: Path outside allowed scope' }, { status: 403 });
    }

    await fs.writeFile(absolutePath, content, 'utf8');

    return NextResponse.json({ success: true, path: relativePath });
  } catch (error: any) {
    console.error('File Write Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
