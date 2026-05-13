interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Open Notify MCP — ISS position + people in space
 *
 * Auth: none. Note: the original /iss-pass.json endpoint was deprecated
 * in 2022; only iss-now and astros remain in service.
 *
 * Docs: http://open-notify.org/
 */


const BASE = 'http://api.open-notify.org';

const tools: McpToolExport['tools'] = [
  {
    name: 'iss_now',
    description: 'Current latitude / longitude of the International Space Station.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'astros',
    description: 'People currently in space — name + craft (ISS / Tiangong / etc.).',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function callTool(name: string, _args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'iss_now':
      return openNotifyGet('/iss-now.json');
    case 'astros':
      return openNotifyGet('/astros.json');
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function openNotifyGet(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'pipeworx-mcp-open-notify/1.0 (+https://pipeworx.io)',
    },
  });
  if (res.status === 404) throw new Error('Open Notify: not found');
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Open Notify error: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
