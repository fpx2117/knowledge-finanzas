import type { ZodType } from "zod";
import { AIError } from "../errors";

// Server-authenticated context injected by the caller — never accepted as a tool argument, so a
// model can never supply/override an authoritative userId (docs task-038 Domain Rules).
export type ToolContext = { userId: string };

export type ToolDefinition<TArgs, TResult> = {
  name: string;
  description: string;
  argsSchema: ZodType<TArgs>;
  resultSchema: ZodType<TResult>;
  // Ownership is enforced by the concrete implementation using context.userId — every tool is
  // read-only by construction (no tool in this registry ever writes to packages/db).
  execute: (args: TArgs, context: ToolContext) => Promise<TResult>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyToolDefinition = ToolDefinition<any, any>;

export type ToolRegistry = {
  list(): Array<{ name: string; description: string }>;
  has(name: string): boolean;
  run(name: string, args: unknown, context: ToolContext): Promise<unknown>;
};

// Trusted tool registry: a fixed, allowlisted set of read-only tools. There is no arbitrary SQL
// or dynamic tool registration path — every tool a capability can call is enumerated here at
// wiring time (docs task-038 Domain Rules, Scope).
export function createToolRegistry(tools: AnyToolDefinition[]): ToolRegistry {
  const byName = new Map(tools.map((tool) => [tool.name, tool]));

  return {
    list() {
      return tools.map((tool) => ({ name: tool.name, description: tool.description }));
    },

    has(name: string) {
      return byName.has(name);
    },

    async run(name: string, args: unknown, context: ToolContext) {
      const tool = byName.get(name);
      if (!tool) throw new AIError("AI_INVALID_OUTPUT", { field: "tool" });

      const parsedArgs = tool.argsSchema.parse(args);
      const result = await tool.execute(parsedArgs, context);
      return tool.resultSchema.parse(result);
    },
  };
}
