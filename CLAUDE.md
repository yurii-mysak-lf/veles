# Veles — Project Conventions

## Overview
Veles is a personal second-brain RAG system. It's an MCP server (TypeScript) that connects Claude Code to a Neo4j knowledge graph with Ollama embeddings.

## Architecture
- **MCP server** at `src/index.ts` — entry point, stdio transport
- **Tools** in `src/mcp/tools/` — one file per tool, registered via `server.tool()`
- **Core** in `src/core/` — neo4j driver, embeddings, ingestion pipeline, retrieval
- **Models** in `src/models/` — resource, chunk, tag CRUD
- **Utils** in `src/utils/` — markdown parsing, file system helpers

## Key Patterns
- All functions that touch Neo4j accept an optional `brain?: string` parameter to route to the correct Neo4j instance
- `getSession(brain)` returns a session connected to the brain's Neo4j instance
- Brain configs are read from env vars: `VELES_BRAIN_<NAME>_URI`, etc.
- Tags are always lowercased before storage
- Resources store a `brain` property for metadata/export purposes

## Tech Stack
- TypeScript with ESM (`"type": "module"` in package.json)
- LangChain.js for embeddings and text splitting
- Neo4j 5.x Community with vector indexes
- Ollama (nomic-embed-text, 768 dimensions)
- MCP SDK (`@modelcontextprotocol/sdk`)
- Vitest for testing

## Commands
- `npm run build` — compile TypeScript
- `npm run dev` — dev mode with tsx watch
- `npm test` — run tests
- `npm run setup` — first-time infrastructure setup
- `npm run reembed` — re-embed all chunks with current model (resumable)
- `npm run backup -- --output=<dir>` — APOC backup to JSON
- `npm run restore -- --input=<file>` — APOC restore from JSON

## Import Conventions
- Use `.js` extensions in imports (ESM requirement)
- Import from `../core/neo4j.js`, `../models/resource.js`, etc.

## Backup/Restore
- `src/mcp/tools/backup.ts` — APOC full graph export (MCP tool)
- `src/mcp/tools/restore.ts` — APOC full graph import with index recreation (MCP tool)
- `scripts/backup.ts` — CLI backup with Docker cp
- `scripts/restore.ts` — CLI restore with Docker cp
- `scripts/reembed.ts` — Resumable embedding migration

## Ticket Patterns
- Tags matching `[A-Z]+-\d+` (e.g., PROJ-1234) are highlighted in output
- `src/utils/tickets.ts` — detection and formatting utilities
- Ticket detection runs on add/edit to suggest untagged ticket references

## Adding New Tools
1. Create `src/mcp/tools/<name>.ts`
2. Export `registerXxxTool(server: McpServer)` function
3. Register in `src/mcp/server.ts`
4. Accept `brain?: string` parameter if the tool touches Neo4j
