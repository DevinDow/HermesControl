import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getWorkspacePath, INTERNAL_FOLDERS_TO_SKIP, getDashboardPath, getDronPath } from '../../lib/paths';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || '';

  try {
    // getFileTree(dir) collect FILES & DIRECTORIES for `dir` (recurses into DIRECTORIES to store their `children`))
    // returns hierarchical JSON array of FILES & DIRECTORIES with `name`, `type`, `path`, `updatedAt` (FILES only), and `children` (DIRECTORIES only)
    async function getFileTree(dir: string): Promise<any[]> {
      const dirEntries = await fs.readdir(dir, { withFileTypes: true });

      const fileTree: any[] = [];
      const dirNormalized = dir.replace(/\\/g, '/'); // Normalize path separators to forward slashes for consistent path comparisons
      for (const entry of dirEntries) {
        const entryFullPath = path.join(dir, entry.name);
        const entryRelativePath = path.relative(workspacePath, entryFullPath);

        // handle DIRECTORY
        if (entry.isDirectory()) {
          if (INTERNAL_FOLDERS_TO_SKIP.includes(entry.name)) continue; // Skip internal folders like .git, node_modules, etc.

          //console.log(`* DIRECTORY ENTRY '${entryRelativePath}' in '${dirNormalized}'`);

          switch (mode) {
            case 'dashboard':
              if (entryRelativePath != 'app' && !dirNormalized.includes('/app')) continue; // only include getDashboardPath() and its 'app' folder
              break;
            case 'docs':
              continue; // Don't recurse into subfolders for docs mode - only get top-level markdown files
            case 'memory':
              if (entry.name !== 'memories' && !dirNormalized.includes('/memories')) continue; // Only include 'memories' folder and its contents for memory mode
              break;
            case 'specs':
              if (entry.name !== 'specs' && !dirNormalized.includes('/specs')) continue; // Only include 'specs' folder and its contents
              break;
            case 'scripts':
              if (entry.name !== 'scripts' && !dirNormalized.includes('/scripts')) continue; // Only include 'scripts' folder and its contents
              break;
            case 'logs':
              if (entry.name !== 'logs' && !dirNormalized.includes('/logs')) continue; // Only include 'logs' folder and its contents
              break;
            case 'system':
              break; // recurse all subfolders
          }

          //console.log(`** recursing & adding DIRECTORY ENTRY ${entryFullPath} **`);

          // recurse getFileTree() for this DIRECTORY
          // - returns array of DIRECTORY/FILE objects for this DIRECTORY (which is attached as 'children' to this DIRECTORY object)
          const children = await getFileTree(entryFullPath);
          if (children.length > 0) { // only add this DIRECTORY if it has children (don't include empty folders in the file tree)
            fileTree.push({
              name: entry.name,
              type: 'directory',
              path: entryRelativePath,
              children
            });
          }
        } 

        // handle FILE
        else {
          // List of FILE EXTENSIONS that should be treated as code files
          const codeExts = ['.sh', '.py', '.js', '.ts', '.tsx', '.css'];
          // Check if this FILE has a code extension
          const isCode = codeExts.some(ext => entry.name.endsWith(ext));

          //console.log(`* FILE ENTRY '${entryRelativePath}' in '${dirNormalized}'`);

          switch (mode) {
            case 'dashboard':
              if (!dirNormalized.includes('/app') && !entry.name.endsWith('.md')) continue; // include '.md' files in getDashboardPath() + ALL in 'app' SUBDIRECTORY
              break;
            case 'docs':
              if (!entry.name.endsWith('.md')) continue;
              break;
            case 'memory':
              if (!entry.name.endsWith('.md')) continue;
              if (!dirNormalized.includes('/memories')) continue;
              break;
            case 'specs':
              if (!entry.name.endsWith('_spec.md')) continue;
              break;
            case 'scripts':
              if (!dirNormalized.includes('/scripts')) continue;
              if (!isCode) continue;
              break;
            case 'logs':
              if (!entry.name.endsWith('.log')) continue;
              if (!dirNormalized.includes('/logs')) continue;
              break;
            case 'system':
              if (!entry.name.endsWith('.yaml') && !entry.name.endsWith('.json')) continue;
              break;
          }

          //console.log(`*** adding FILE ENTRY ${entryFullPath} ***`);

          const stats = await fs.stat(entryFullPath);
          fileTree.push({
            name: entry.name,
            type: 'file',
            path: entryRelativePath,
            updatedAt: stats.mtimeMs
          });
        }
      }
      
      // sort this `fileTree[]` DIRECTORIES then FILES, alphabetically
      const dirContentsSorted = fileTree.sort((a, b) => {
        if (a.type !== b.type)
          return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      // return `dirContentsSorted[]` for this `dir` (each SUBDIRECTORY (with `children[]`) plus each FILE)
      return dirContentsSorted;
    }

    // 'dashboard' mode uses getDashboardPath()
    // 'dron' mode uses getDronPath()
    // all other modes use getWorkspacePath()
    let workspacePath = getWorkspacePath();
    if (mode === 'dashboard') {
      workspacePath = getDashboardPath();
    }
    if (mode === 'dron') {
      workspacePath = getDronPath();
    }
    let fileTree = await getFileTree(workspacePath);

    // Return the final JSON payload of files
    return NextResponse.json(fileTree);
  } catch (error) {
    console.error('Failed to fetch files:', error);
    return NextResponse.json({ error: 'Failed to load files' }, { status: 500 });
  }
}

