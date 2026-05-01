import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

/**
 * POST /api/update
 * Executes 'hermes update' on the host.
 */
export async function POST() {
  try {
    // Note: 'hermes update' often pulls from pnpm/npm and may restart the gateway service.
    const { stdout, stderr } = await execAsync('hermes update');
    
    return NextResponse.json({
      success: true,
      stdout: stdout || '(Update command initiated)',
      stderr: stderr || ''
    });
  } catch (error: any) {
    console.error('Update Execution Error:', error);
    return NextResponse.json({ 
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    }, { status: 500 });
  }
}

