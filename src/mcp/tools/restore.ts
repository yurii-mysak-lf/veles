import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSession, initializeIndexes } from "../../core/neo4j.js";

export function registerRestoreTool(server: McpServer) {
  server.tool(
    "veles_restore",
    "Restore Neo4j database from a JSON backup file created by veles_backup",
    {
      input_file: z
        .string()
        .describe(
          "Backup filename (must be in Neo4j's import directory, e.g. 'veles-backup.json')",
        ),
      confirm_overwrite: z
        .boolean()
        .describe(
          "Must be true to confirm — this will DELETE all existing data before restoring",
        ),
      brain: z
        .string()
        .optional()
        .describe("Brain/namespace to restore into (default: 'default')"),
    },
    async ({ input_file, confirm_overwrite, brain }) => {
      if (!confirm_overwrite) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Restore aborted. Set confirm_overwrite to true to proceed. WARNING: this will delete all existing data in the database before restoring.",
            },
          ],
        };
      }

      const session = getSession(brain);
      try {
        // Clear all existing data
        await session.run(`
          CALL apoc.periodic.iterate(
            'MATCH (n) RETURN n',
            'DETACH DELETE n',
            {batchSize: 1000}
          )
        `);

        // Drop existing indexes (they'll be recreated)
        const indexes = await session.run(`SHOW INDEXES YIELD name RETURN name`);
        for (const record of indexes.records) {
          const name = record.get("name") as string;
          if (!name.startsWith("__")) {
            try {
              await session.run(`DROP INDEX ${name} IF EXISTS`);
            } catch {
              try {
                await session.run(`DROP CONSTRAINT ${name} IF EXISTS`);
              } catch {
                // Ignore system indexes
              }
            }
          }
        }

        // Import from backup file
        const result = await session.run(
          `CALL apoc.import.json($file)`,
          { file: input_file },
        );

        const record = result.records[0];
        const nodes = record.get("nodes");
        const rels = record.get("relationships");

        // Recreate all indexes
        await initializeIndexes(brain);

        return {
          content: [
            {
              type: "text" as const,
              text: [
                `Restore complete.`,
                `  Nodes restored: ${nodes}`,
                `  Relationships restored: ${rels}`,
                `  Indexes: recreated`,
                ``,
                `The database has been fully restored from ${input_file}.`,
              ].join("\n"),
            },
          ],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Restore failed: ${msg}\n\nMake sure:\n  1. The backup file is in Neo4j's import directory\n  2. APOC import is enabled (NEO4J_apoc_import_file_enabled=true)\n  3. To copy the file into Docker: docker compose cp ./backup.json neo4j:/var/lib/neo4j/import/`,
            },
          ],
        };
      } finally {
        await session.close();
      }
    },
  );
}
