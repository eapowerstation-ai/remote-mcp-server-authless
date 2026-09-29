import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

function createServer(env: Env) {
	const server = new McpServer({
		name: "Feishu AI Content Library",
		version: "1.0.0",
	});

	server.registerTool(
		"save_to_feishu",
		{
			description: "将内容保存到飞书多维表格。",
			inputSchema: z.object({
				text: z.string().min(1).describe("需要保存到飞书的内容"),
			}),
		},
		async ({ text }) => {
			try {
				const response = await fetch(
					"https://feishu-chatgpt-connector.eapowerstation.workers.dev/write",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${env.CONNECTOR_API_KEY}`,
						},
						body: JSON.stringify({ text }),
					},
				);

				const data = await response.json() as {
					ok?: boolean;
					message?: string;
					record_id?: string;
					error?: string;
				};

				if (!response.ok || !data.ok) {
					return {
						content: [
							{
								type: "text" as const,
								text: `保存失败：${JSON.stringify(data)}`,
							},
						],
					};
				}

				return {
					content: [
						{
							type: "text" as const,
							text: `已保存到飞书。record_id: ${data.record_id ?? "unknown"}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `保存失败：${String(error)}`,
						},
					],
				};
			}
		},
	);

	return server;
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const handler = createMcpHandler(() => createServer(env));
		return handler(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
