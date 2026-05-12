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

    if (scheduleExpr !== undefined) {
      // Use Hermes CLI to update schedule if provided
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        const os = require('os');
        
        const path = require('path');
        const workspacePath = require('../../lib/paths').getWorkspacePath();
        const envPath = path.join(workspacePath, '.env');
        
        let envVars = { ...process.env };
        try {
          const fs = require('fs');
          if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach((line: string) => {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith('#')) return;
              const firstEq = trimmed.indexOf('=');
              if (firstEq !== -1) {
                const key = trimmed.substring(0, firstEq).trim();
                let value = trimmed.substring(firstEq + 1).trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                  value = value.substring(1, value.length - 1);
                }
                envVars[key] = value;
              }
            });
          }
        } catch (e) {}

        const cmd = `hermes cron edit ${id} --schedule "${scheduleExpr}"`;
        await execAsync(cmd, {
          env: {
            ...envVars,
            PATH: `${process.env.PATH}:${os.homedir()}/.npm-global/bin`
          }
        });
      } catch (cliError: any) {
        console.error('Failed to update schedule via CLI:', cliError);
        return NextResponse.json({ 
          error: `Failed to update schedule via CLI: ${cliError.message}` 
        }, { status: 500 });
      }
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
    // Note: scheduleExpr was already handled via CLI if it existed, 
    // but we can still update the JSON just to be sure if CLI didn't reload yet.
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

