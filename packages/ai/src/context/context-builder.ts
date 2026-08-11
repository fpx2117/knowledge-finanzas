import type { ToolRegistry } from "../tools/registry";

export type BuiltContext = {
  results: Record<string, unknown>;
  failures: string[];
};

// Fetches a fixed, bounded set of tools up front — there is no model-driven iteration or
// recursion here, so "bounded tool iterations" holds by construction, not by a runtime counter
// (docs task-038 Scope: "controlled assistant loop with bounded tool iterations"). A failing
// tool never aborts the whole context: it is recorded so the prompt can disclose the gap instead
// of the model fabricating a number for it (docs task-038 Domain Rules).
export function createContextBuilder(registry: ToolRegistry) {
  return {
    async buildContext(userId: string, toolNames: string[]): Promise<BuiltContext> {
      const results: Record<string, unknown> = {};
      const failures: string[] = [];

      await Promise.all(toolNames.map(async (name) => {
        try {
          results[name] = await registry.run(name, {}, { userId });
        } catch {
          failures.push(name);
        }
      }));

      return { results, failures };
    },
  };
}

export type ContextBuilder = ReturnType<typeof createContextBuilder>;
