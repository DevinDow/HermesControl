import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse, NextRequest } from 'next/server';
import { getCronPath } from '../../../lib/paths';

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')?.trim();
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  try {
    const cronPath = getCronPath();
    const outputDir = path.join(cronPath, 'output', jobId);
    const entries = await fs.readdir(outputDir, { withFileTypes: true });
    const mdFiles = entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .map((entry) => entry.name)
      .reverse();

    return NextResponse.json({ files: mdFiles });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ files: [] });
    }
    console.error('Failed to list job output files:', error);
    return NextResponse.json({ error: 'Unable to list output files' }, { status: 500 });
  }
}
