# Codex MCP Workflows

This directory contains OpenAI Agents SDK workflows that invoke Codex CLI as an MCP server for multi-agent development.

## Prerequisites

- **Codex CLI** installed and available on PATH (`codex --version`)
- **Python 3.10+**
- **Node.js 18+** (for MCP Inspector)
- **OpenAI API key**

## Setup

1. Copy the environment template and add your API key:
   ```bash
   cp .env.example .env
   # Edit .env and set OPENAI_API_KEY=sk-...
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   # source .venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   ```

## Scripts

### `codex_mcp.py` — Single-Agent Game Workflow

A designer agent hands off to a developer agent, which uses Codex MCP to generate a playable browser game.

```bash
python codex_mcp.py
```

The generated `index.html` will be saved in the current directory.

### `multi_agent_workflow.py` — Multi-Agent Project Workflow

A project manager orchestrates designer, frontend developer, backend developer, and tester agents to build a full project with gated hand-offs.

```bash
python multi_agent_workflow.py
```

Outputs are organized into role-specific folders (`/design`, `/frontend`, `/backend`, `/tests`).

## Inspect the MCP Server

Launch the MCP Inspector to browse available tools:

```bash
npx @modelcontextprotocol/inspector codex mcp-server
```

## Traces

After a run, inspect the execution timeline in the OpenAI Traces dashboard to audit prompts, tool calls, and hand-offs.
