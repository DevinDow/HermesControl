import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse, NextRequest } from 'next/server';
import { getCronPath } from '../../lib/paths';

export async function GET() {
  try {
    const cronPath = getCronPath();
    const filePath = path.join(cronPath, 'jobs.json');
    const runsDir = path.join(cronPath, 'runs');
    const fileContent = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    //console.log('Loaded jobs:', data.jobs);
    
    // Sort jobs by time (rough estimation from schedule expr)
    const sortedJobs = data.jobs.sort((a: any, b: any) => {
      const getMinutes = (expr: string) => {
        const [m, h] = expr.split(' ');
        return parseInt(h) * 60 + parseInt(m);
      };
      return getMinutes(a.schedule.expr) - getMinutes(b.schedule.expr);
    });
    //console.log('Sorted jobs:', sortedJobs);

    return NextResponse.json(sortedJobs);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, enabled, scheduleExpr, thinking } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const cronPath = getCronPath();
    const filePath = path.join(cronPath, 'jobs.json');
    const fileContent = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    const jobIndex = data.jobs.findIndex((j: any) => j.id === id);
    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = data.jobs[jobIndex];
    if (enabled !== undefined) job.enabled = enabled;
    if (scheduleExpr !== undefined) job.schedule.expr = scheduleExpr;
    if (thinking !== undefined) job.payload.thinking = thinking;
    
    job.updatedAtMs = Date.now();

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Failed to update job:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

