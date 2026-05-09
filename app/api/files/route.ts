import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getWorkspacePath, INTERNAL_FOLDERS_TO_SKIP, getDashboardPath, getDronPath } from '../../lib/paths';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'memory';

  try {
    // Recursively traverses directory structure and filters files based on the current 'mode'
    // Each call returns an ARRAY of FILE/DIRECTORY objects with metadata, which are then flattened and filtered according to the mode's criteria
    async function getFiles(dir: string): Promise<any[]> {
      // Normalize path separators to forward slashes for consistent path comparisons
      const normalDir = dir.replace(/\\/g, '/');
      
      // Read all entries (files and directories) in the current directory
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files: any[] = [];
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(workspacePath, fullPath);

        // handle DIRECTORY
        if (entry.isDirectory()) {
          if (INTERNAL_FOLDERS_TO_SKIP.includes(entry.name)) continue; // Skip internal folders like .git, node_modules, etc.
          if (mode === 'dashboard') continue;// Don't recurse into subfolders for dashboard mode - only get top-level markdown files
          if (mode === 'docs') continue; // Don't recurse into subfolders for docs mode - only get top-level markdown files
          if (mode === 'memory' && entry.name !== 'memories' && !normalDir.includes('/memories')) continue; // Only include 'memories' folder and its contents for memory mode
          if (mode === 'logs' && entry.name !== 'logs' && !normalDir.includes('/logs')) continue; // Only include 'logs' folder and its contents
          if (mode === 'specs' && entry.name !== 'specs' && !normalDir.includes('/specs')) continue; // Only include 'specs' folder and its contents
          //console.log('Fetching directory:', fullPath);

          // Recursively get FILES from this SUBDIRECTORY - this will return an array of FILE/DIRECTORY objects for the subdirectory, which we will attach as 'children' to this directory object
          const children = await getFiles(fullPath);
          // Skip EMPTY DIRECTORIES
          if (children.length > 0) {
            files.push({
              name: entry.name,
              type: 'directory',
              path: relativePath,
              children
            });
          }
        } 

        // handle FILE
        else {
          // List of FILE EXTENSIONS that should be treated as code files
          const codeExts = ['.sh', '.py', '.js', '.ts', '.tsx', '.css', '.json', '.jsonl', '.gitignore', '.env', '.html', '.yaml', '.yml'];
          // Check if this FILE has a code extension
          const isCode = codeExts.some(ext => entry.name.endsWith(ext));
          // Check if this is a SPEC FILE (ends with _spec.md or is in specs folder) but not code
          const isSpec = (entry.name.endsWith('_spec.md') || normalDir.includes('/specs')) && !isCode;
          // Check if this FILE is in the memories folder
          const isMemoryFile = normalDir.includes('/memories');

          // Filter FILES based on mode - only return FILES that match the mode's criteria
          if (mode === 'dashboard' && !entry.name.endsWith('.md')) continue; // Only return MARKDOWN FILES for 'dashboard' mode
          if (mode === 'docs' && !entry.name.endsWith('.md')) continue; // Only return MARKDOWN FILES for 'docs' mode
          if (mode === 'memory' && !isMemoryFile && !entry.name.endsWith('.md') && !isSpec) continue; // Only return FILES in the memories folder or markdown/spec files for 'memory' mode  
          if (mode === 'specs' && !isSpec) continue; // Only return SPEC FILES for 'specs' mode
          if (mode === 'logs' && !entry.name.endsWith('.log')) continue; // Only return LOG FILES for 'logs' mode
          if (mode === 'system' && !entry.name.endsWith('.yaml') && !entry.name.endsWith('.json')) continue; // Only return YAML and JSON FILES for 'system' mode

          const stats = await fs.stat(fullPath);
          files.push({
            name: entry.name,
            type: 'file',
            path: relativePath,
            updatedAt: stats.mtimeMs
          });
        }
      }
      
      // Sort: directories then files, alphabetically
      return files.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }

    let workspacePath = getWorkspacePath();
    if (mode === 'dashboard') {
      workspacePath = getDashboardPath();
    }
    if (mode === 'dron') {
      workspacePath = getDronPath();
    }
    let fileTree = await getFiles(workspacePath);

    // Return the final JSON payload of files
    return NextResponse.json(fileTree);
  } catch (error) {
    console.error('Failed to fetch files:', error);
    return NextResponse.json({ error: 'Failed to load files' }, { status: 500 });
  }
}

