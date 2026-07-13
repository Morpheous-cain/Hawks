---
name: interaction-summary
description: Summary of session interactions, prompt adjustments, and CLAUDE.md handling
metadata:
  type: project
---

# Interaction Summary
- **Stack Alignment:** Prompts updated to React/Vite/Supabase (from Next.js/Go/Fiber).
- **Audit Prompts:** Created `fix-prompts/` directory with 5 new/improved audit prompts.
- **CLAUDE.md:** Current size is ~48k chars. Identified as exceeding limit.

# CLAUDE.md Strategy
- **Why:** File too large (>40k chars).
- **How to apply:**
  1. Archive old `CLAUDE.md` to `CLAUDE_ARCHIVE.md`.
  2. Create new `CLAUDE.md` containing only core project identity, tech stack, and key patterns.
  3. Create `CLAUDE_OPERATIONS.md` containing all table schemas, build orders, and operational details (the bulk of the content).
  4. Cross-link both files.
