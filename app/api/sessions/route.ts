import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

/**
 * GET /api/sessions
 * 
 * Executes `hermes sessions list`, which returns tabular session data in the format:
Title                            Preview                                  Last Active   ID
──────────────────────────────────────────────────────────────────────────────────────────────────────────────
—                                [IMPORTANT: You are running as a sched   6h ago        cron_3e02bb43d4a1_20260506_130026
Cron Jobs and Watchdog Process   Darvis (OpenClaw) had a HEARTBEAT.  Do   6h ago        20260506_044256_5c559f37
—                                [IMPORTANT: You are running as a sched   14h ago       cron_5a709e34f548_20260506_041041

 * returns the parsed SESSIONS data as JSON
*/
export async function GET() {
  try {
    const { stdout } = await execAsync('/home/devin/.local/bin/hermes sessions list', { encoding: 'utf8' });
    
    const lines = stdout.split('\n').filter(Boolean);
    
    // Skip header row (line 0) and separator (line 1)
    const dataLines = lines.slice(2);
    
    // Parse each data line into columns
    const sessions = dataLines.map(line => {
      return {
        title: line.slice(0, 33).trim(),
        preview: line.slice(33, 74).trim(),
        lastActive: line.slice(74, 88).trim(),
        id: line.slice(88).trim(),
      };

      /*// Split by 3 spaces to handle column separation - PROBLEM: This can break if the preview text contains 3 spaces!
      const parts = line.split(/\s{3,}/).map(p => p.trim()).filter(Boolean);
      
      if (parts.length >= 4) {
        return {
          title: parts[0],
          preview: parts[1],
          lastActive: parts[2],
          id: parts[3],
        };
      }
      
      // Handle cases with fewer columns (like the "—" entries)
      return {
        title: parts[0] || '',
        preview: parts[1] || '',
        lastActive: parts[parts.length - 2] || '',
        id: parts[parts.length - 1] || '',
      };*/
    });
    
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error executing `hermes sessions list`:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
