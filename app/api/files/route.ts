import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getWorkspacePath, HERMES_ROOT } from '../../lib/paths';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'memory';

  try {
    const workspacePath = getWorkspacePath();

    async function getFiles(dir: string): Promise<any[]> {
      const normalDir = dir.replace(/\\/g, '/');
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(workspacePath, fullPath);

        if (entry.isDirectory()) {
          // Internal folders to always skip
          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') {
            return null;
          }

          // Mode-specific directory filtering
          if (mode === 'specs') {
            if (entry.name !== 'specs' && !normalDir.includes('/specs')) return null;
          } else if (mode === 'old') {
            if (entry.name !== 'OLD' && !normalDir.includes('/OLD')) return null;
          } else if (mode === 'memory') {
            // Only recurse into the memories folder at root level, but allow recursion within memories
            if (!normalDir.includes('/memories') && entry.name !== 'memories') return null;
          } else if (mode === 'docs') {
            // Don't recurse into subfolders for docs mode
            return null;
          }

          const children = await getFiles(fullPath);
          if (children.length === 0) return null;

          return {
            name: entry.name,
            type: 'directory',
            path: relativePath,
            children: children
          };
        } else {
          const stats = await fs.stat(fullPath);
          const isMarkdown = entry.name.endsWith('.md');
          const codeExts = ['.sh', '.py', '.js', '.ts', '.tsx', '.css', '.json', '.gitignore', '.env', '.html', '.yaml', '.yml'];
          const isCode = codeExts.some(ext => entry.name.endsWith(ext));
          const isSpec = (entry.name.endsWith('_spec.md') || normalDir.includes('/specs')) && !isCode;
          const isOld = normalDir.includes('/OLD') || normalDir.includes('/memory/archive');
          const isMemoryFile = normalDir.includes('/memories');

          if (mode === 'specs') {
            return isSpec ? { name: entry.name, type: 'file', path: relativePath, isArchived: isOld, updatedAt: stats.mtimeMs } : null;
          }

          if (mode === 'old') {
            return isOld ? { name: entry.name, type: 'file', path: relativePath, isArchived: true, updatedAt: stats.mtimeMs } : null;
          }

          if (mode === 'memory') {
            // Return markdown files from memories folder
            return (isMemoryFile && entry.name.endsWith('.md') && !isSpec) ? { name: entry.name, type: 'file', path: relativePath, isArchived: isOld, updatedAt: stats.mtimeMs } : null;
          }

          if (mode === 'docs') {
            // Include all markdown files in the current directory (which is filtered in the directory logic above)
            return entry.name.endsWith('.md') ? { name: entry.name, type: 'file', path: relativePath, isArchived: isOld, updatedAt: stats.mtimeMs } : null;
          }

          return null;
        }
      }));
      // Flatten the array since memory mode might return nested arrays
      return files.flat().filter(f => f !== null);
    }

    let fileTree = await getFiles(workspacePath);

    // Mode-specific sorting
    if (mode === 'old') {
      const allOldFiles: any[] = [];
      const flatten = (nodes: any[]) => {
        for (const node of nodes) {
          if (node.type === 'file') allOldFiles.push(node);
          else if (node.type === 'directory' && node.children) flatten(node.children);
        }
      };
      flatten(fileTree);

      const groups: Record<string, any[]> = {};
      for (const file of allOldFiles) {
        const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || 'other' : 'other';
        if (!groups[ext]) groups[ext] = [];
        groups[ext].push(file);
      }

      const newTree: any[] = [];
      const sortedExts = Object.keys(groups).sort();
      for (const ext of sortedExts) {
        const sortedFiles = groups[ext].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        newTree.push({
          name: ext === 'other' ? 'NO EXTENSION' : `*.${ext.toUpperCase()}`,
          type: 'directory',
          path: `__VIRTUAL_EXT__/${ext}`,
          children: sortedFiles
        });
      }
      fileTree = newTree;
    }

    if (mode === 'memory') {
      // Flatten the tree to get all files from memories folder
      const allMemoryFiles: any[] = [];
      const flatten = (nodes: any[]) => {
        for (const node of nodes) {
          if (node.type === 'file') allMemoryFiles.push(node);
          else if (node.type === 'directory' && node.children) flatten(node.children);
        }
      };
      flatten(fileTree);
      fileTree = allMemoryFiles;

      // Sort everything alphabetically descending (which puts newest dates at top)
      fileTree.sort((a, b) => b.name.localeCompare(a.name));
    }

    if (mode === 'docs') {
      const workspaceChildren = fileTree.filter(f => f.type === 'file');
      fileTree = [];
      fileTree.push(...workspaceChildren);
    }

    return NextResponse.json(fileTree);
  } catch (error) {
    console.error('Failed to fetch files:', error);
    return NextResponse.json({ error: 'Failed to load files' }, { status: 500 });
  }
}

