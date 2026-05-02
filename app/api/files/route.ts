import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getWorkspacePath, HERMES_ROOT } from '../../lib/paths';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'memory';

  try {
    const workspacePath = getWorkspacePath();

    // Recursively traverses directory structure and filters files based on the current 'mode'
    // Each call returns an ARRAY of FILE/DIRECTORY objects with metadata, which are then flattened and filtered according to the mode's criteria
    async function getFiles(dir: string): Promise<any[]> {
      // Normalize path separators to forward slashes for consistent path comparisons
      const normalDir = dir.replace(/\\/g, '/');
      
      // Read all entries (files and directories) in the current directory
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      // Process each ENTRY asynchronously and collect results
      const files = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(workspacePath, fullPath);

        // handle DIRECTORY
        if (entry.isDirectory()) {
          // Skip these standard system folders regardless of mode
          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') {
            return null;
          }

          //console.log('Checking', mode, 'mode for directory:', entry.name, 'in', normalDir);

          // Filter directories based on the current mode - only include matching directory patterns
          if (mode === 'docs') {
            // Don't recurse into subfolders for docs mode - only get top-level markdown files
            return null;
          } else if (mode === 'memory') {
            // Only include 'memories' folder and its contents
            if (entry.name !== 'memories' && !normalDir.includes('/memories')) return null;
          } else if (mode === 'logs') {
            // Only include 'logs' folder and its contents
            if (entry.name !== 'logs' && !normalDir.includes('/logs')) return null;
          } else if (mode === 'specs') {
            // Only include 'specs' folder and its contents
            if (entry.name !== 'specs' && !normalDir.includes('/specs')) return null;
          }

          // Recursively get FILES from this SUBDIRECTORY - this will return an array of FILE/DIRECTORY objects for the subdirectory, which we will attach as 'children' to this directory object
          const children = await getFiles(fullPath);
          // Skip EMPTY DIRECTORIES
          if (children.length === 0) return null;

          return {
            name: entry.name,
            type: 'directory',
            path: relativePath,
            children: children
          };
        } 

        // handle FILE
        else {
          // Process FILE entries
          const stats = await fs.stat(fullPath);
          
          // List of FILE EXTENSIONS that should be treated as code files
          const codeExts = ['.sh', '.py', '.js', '.ts', '.tsx', '.css', '.json', '.gitignore', '.env', '.html', '.yaml', '.yml'];
          // Check if this FILE has a code extension
          const isCode = codeExts.some(ext => entry.name.endsWith(ext));
          // Check if this is a SPEC FILE (ends with _spec.md or is in specs folder) but not code
          const isSpec = (entry.name.endsWith('_spec.md') || normalDir.includes('/specs')) && !isCode;
          // Check if this FILE is in the memories folder
          const isMemoryFile = normalDir.includes('/memories');

          // Filter FILES based on mode - only return FILES that match the mode's criteria
          if (mode === 'docs') {
            // Return only MARKDOWN FILES for 'docs' mode
            return entry.name.endsWith('.md') ? { name: entry.name, type: 'file', path: relativePath, updatedAt: stats.mtimeMs } : null;
          }

          if (mode === 'memory') {
            // Return only MARKDOWN FILES from 'memories' folder that aren't specs
            return (isMemoryFile && entry.name.endsWith('.md') && !isSpec) ? { name: entry.name, type: 'file', path: relativePath, updatedAt: stats.mtimeMs } : null;
          }

          if (mode === 'logs') {
            // Return only LOG FILES for 'logs' mode
            return entry.name.endsWith('.log') ? { name: entry.name, type: 'file', path: relativePath, updatedAt: stats.mtimeMs } : null;
          }

          if (mode === 'specs') {
            // Return only SPEC FILES for 'specs' mode (files that are identified as specs but not code files)
            return isSpec ? { name: entry.name, type: 'file', path: relativePath, updatedAt: stats.mtimeMs } : null;
          }

          // If no mode matched, return null (file doesn't match any filter)
          return null;
        }
      }));
      
      // Flatten the array (removes nested arrays from directory recursion) and remove null entries
      return files.flat().filter(f => f !== null);
    }

    let fileTree = await getFiles(workspacePath);

    // Mode-specific sorting and formatting
    if (mode === 'docs' || mode === 'memory' || mode === 'logs' || mode === 'specs') {
      // For these modes the UI expects a flat list of files, so flatten the directory tree completely
      //console.log('Flattening file tree for mode:', mode);
      //console.log('Original file tree:', JSON.stringify(fileTree, null, 2));
      const allFiles: any[] = [];
      const flatten = (nodes: any[]) => {
        for (const node of nodes) {
          // collect all file nodes into a single flat array, ignoring directories (which are just organizational wrappers for the UI in these modes)
          if (node.type === 'file') allFiles.push(node);
          else if (node.type === 'directory' && node.children) flatten(node.children);
        }
      };
      flatten(fileTree);
      fileTree = allFiles;

      // Ensure we only return file nodes, dropping any directory wrappers that may remain
      const children = fileTree.filter(f => f.type === 'file');
      fileTree = [];
      fileTree.push(...children);
      //console.log('Flattened file tree:', JSON.stringify(fileTree, null, 2));
    }

    // Return the final JSON payload of files
    return NextResponse.json(fileTree);
  } catch (error) {
    console.error('Failed to fetch files:', error);
    return NextResponse.json({ error: 'Failed to load files' }, { status: 500 });
  }
}

