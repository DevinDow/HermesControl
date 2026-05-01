import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse, NextRequest } from 'next/server';
import { getCronPath } from '../../../../lib/paths';

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')?.trim();
  const fileName = request.nextUrl.searchParams.get('file')?.trim();

  if (!jobId || !fileName) {
    return NextResponse.json({ error: 'Job ID and file name are required' }, { status: 400 });
  }

  if (fileName.includes('..') || path.isAbsolute(fileName)) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
  }

  try {
    const cronPath = getCronPath();
    const filePath = path.join(cronPath, 'output', jobId, fileName);
    const content = await fs.readFile(filePath, 'utf8');
    return NextResponse.json({ file: fileName, content });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Output file not found' }, { status: 404 });
    }
    console.error('Failed to read job output file:', error);
    return NextResponse.json({ error: 'Unable to read output file' }, { status: 500 });
  }
}
