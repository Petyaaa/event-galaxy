<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# QA Agent System Configuration

## 1. Primary QA Automation Agent
- **Profile:** Primary Testing Handler
- **Model Standard:** GPT 5.5 (Medium/High Standard Speed)
- **Subagents:** None (Direct Execution Profile)
- **Core Task:** Scans repository, maps the `.next` compilation output, and executes localized Playwright E2E testing sweeps.

## 2. Agent Skills & Capability Schema
- **Automation Engine:** `playwright:test-execution`
- **DOM Parsing:** `nextjs:dom-analysis`
- **Log Diagnostics:** `github-actions:log-parsing`
- **Network Resilience:** `api:mocking` (Configured to bypass backend "failed to fetch" blocks during standalone testing)
