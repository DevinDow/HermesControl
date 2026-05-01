import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync('hermes version');
    const lines = stdout.trim().split('\n');
    const firstLine = lines[0] ?? '';
    const versionMatch = firstLine.match(/Hermes Agent\s+([^\s]+)\s+\(([^)]+)\)/);
    const versionNumber = versionMatch?.[1] ?? null;
    const versionDate = versionMatch?.[2] ?? null;

    const result: Record<string, string | null> = {
      version: firstLine,
      versionNumber,
      versionDate,
    };

    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line) continue;
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) {
        result[`line_${i}`] = line;
        continue;
      }
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      result[key] = value;
    }

    const updateString = result['Update available'] ?? null;
    return NextResponse.json({
      ...result,
      updateString,
      updateAvailable: !!updateString,
    });
  } catch (error) {
    return NextResponse.json({
      version: null,
      versionNumber: null,
      versionDate: null,
      error: 'Unable to execute hermes version',
    }, { status: 500 });
  }
}
