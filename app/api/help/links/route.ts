import { NextResponse } from 'next/server';

export async function GET() {
  const links = [
    {
      group: "Core Documentation",
      items: [
        { name: "Official Documentation", url: "https://hermes-agent.nousresearch.com/docs/" },
        { name: "CLI Reference", url: "https://hermes-agent.nousresearch.com/docs/reference/cli-commands" },
        { name: "Slash Command Reference", url: "https://hermes-agent.nousresearch.com/docs/reference/slash-commands" },
      ]
    },
    {
      group: "Community",
      items: [
        { name: "ClawHub.com", url: "https://clawhub.com" },
        { name: "Discord Community", url: "https://discord.com/invite/clawd" },
        { name: "Hermes GitHub Source", url: "https://github.com/NousResearch/hermes-agent" },
        { name: "OpenClaw GitHub Source", url: "https://github.com/openclaw/openclaw" },
        { name: "MoltBook (Submolts)", url: "https://www.moltbook.com/m" }
      ]
    }
  ];
  return NextResponse.json(links);
}

