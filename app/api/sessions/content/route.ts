import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse, NextRequest } from 'next/server';
import { getSessionsPath } from '../../../lib/paths';

function safeId(id: string) {
  return /^[A-Za-z0-9_\-]+$/.test(id);
}

function truncateText(value: any) {
  if (typeof value !== 'string') return '';
  return value.length > 120 ? `${value.slice(0, 120)}…` : value;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Session id is required' }, { status: 400 });
  }
  if (!safeId(id)) {
    return NextResponse.json({ error: 'Invalid session id' }, { status: 400 });
  }

  const sessionsDir = getSessionsPath();
  const fileName = `session_${id}.json`;
  const filePath = join(sessionsDir, fileName);

  try {
    const content = await readFile(filePath, 'utf8');
    const parsedJson = JSON.parse(content);

    const messages = Array.isArray(parsedJson.messages)
      ? parsedJson.messages
      : Array.isArray(parsedJson)
        ? parsedJson
        : [];

    const getField = (...keys: string[]) => {
      const searchObjects = [parsedJson, ...messages];
      for (const item of searchObjects) {
        if (!item || typeof item !== 'object') continue;
        for (const key of keys) {
          if (item[key] !== undefined) return item[key];
          if (item.data && item.data[key] !== undefined) return item.data[key];
        }
      }
      return null;
    };

    const model = getField('model', 'modelId');
    const baseUrl = getField('baseUrl', 'url', 'endpoint');
    const platform = getField('platform', 'service', 'provider');
    const sessionStart = getField('sessionStart', 'startedAt', 'createdAt', 'timestamp', 'ts');

    const formattedMessages = messages.map((item: any, index: number) => {
      const role = item?.role || item?.actor || item?.type || 'unknown';
      let content = item?.content || item?.text || item?.message || item?.body || '';

      if (typeof content === 'object') {
        content = JSON.stringify(content);
      }
      if (content === '' && typeof item === 'object') {
        content = JSON.stringify(item);
      }

      return {
        index,
        role,
        content: truncateText(content),
        raw: item,
      };
    });

    return NextResponse.json({
      id,
      model: model || null,
      baseUrl: baseUrl || null,
      platform: platform || null,
      sessionStart: sessionStart || null,
      messages,
      content,
    });
  } catch (error: any) {
    console.error('Failed to read session file:', error);
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
