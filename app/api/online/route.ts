import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

export async function GET() {
  try {
    /*const { stdout } = await execAsync('hermes status');
    const lines = stdout.split('\n');
    const statusLine = lines.find(line => line.includes('Status:'));
    let status = null;
    let online = false;
    if (statusLine) {
      status = statusLine.split('Status:')[1].trim();
      online = status.includes('running');
    }*/

    // Tell systemctl exactly which user's systemd manager to query
    // XDG_RUNTIME_DIR=/run/user/1000
    const command = 'XDG_RUNTIME_DIR=/run/user/1000 systemctl --user is-active hermes-gateway.service 2>/dev/null || true';
    const { stdout } = await execAsync(command);
    console.log('   Hermes Gateway Service Status:', stdout.trim());
    const status = stdout.trim() || 'inactive';
    const online = status === 'active';
    return NextResponse.json({ online, status });
  } catch (error) {
    return NextResponse.json({ online: false, status: null });
  }
}

