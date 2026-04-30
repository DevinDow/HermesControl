import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

/**
 * GET /api/sessions
 * 
 * Executes `hermes sessions list` and returns the parsed session data as JSON.
 */
export async function GET() {
  try {
    const { stdout } = await execAsync('hermes sessions list', { encoding: 'utf8' });
    
    const lines = stdout.split('\n').filter(Boolean);
    
    // Skip header row (line 0) and separator (line 1)
    const dataLines = lines.slice(2);
    
    // Parse each data line into columns
    const sessions = dataLines.map(line => {
      // Split by multiple spaces to handle column separation
      // The columns are: Title, Preview, Last Active, ID
      const parts = line.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
      
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
        title: parts[0] || '—',
        preview: parts[1] || '',
        lastActive: parts[parts.length - 2] || '',
        id: parts[parts.length - 1] || '',
      };
    });
    
    return NextResponse.json(sessions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
