import { NextResponse } from 'next/server';

export async function GET() {
  const links = [
    {
      group: "Core Documentation",
      items: [
        { name: "Official Documentation", url: "https://docs.hermes.ai/" },
        { name: "CLI Reference", url: "https://docs.hermes.ai/cli" },
        { name: "Architecture", url: "https://docs.hermes.ai/architecture" },
        { name: "Security Model", url: "https://docs.hermes.ai/security" },
        { name: "Skill Spec", url: "https://docs.hermes.ai/skills" }
      ]
    },
    {
      group: "Community",
      items: [
        { name: "ClawHub.com", url: "https://clawhub.com" },
        { name: "Discord Community", url: "https://discord.com/invite/clawd" },
        { name: "GitHub Source", url: "https://github.com/hermes/hermes" },
        { name: "MoltBook (Submolts)", url: "https://www.moltbook.com/m" }
      ]
    }
  ];
  return NextResponse.json(links);
}

