# Project Instructions for Codex

## General Rules

- Always inspect the current project before editing.
- Do not assume framework or file structure.
- Do not rewrite large parts unless explicitly requested.
- Keep existing UI style, spacing, colors, typography, and RTL behavior.
- Use Persian UI text when the project is Persian.
- Preserve previous user work.
- Do not remove features unless asked.
- Always report changed files.
- Always explain where the output/build file is located.

## For UI/UX Projects

- Keep layout mobile-first.
- Respect RTL.
- Keep typography consistent.
- Do not change reference pages unless explicitly asked.
- Use small, safe, incremental edits.
- Before adding new components, check if similar components already exist.

## For React/Vite Projects

- Prefer existing structure.
- Do not add libraries without asking.
- After changes, run:
  - npm install only if needed
  - npm run build
  - npm run lint if available

## For Static HTML/CSS/JS Projects

- Keep CSS and JS separate from HTML.
- Avoid inline styles.
- Reuse existing CSS variables.
- Do not convert to React unless explicitly requested.

## Final Response Format

Always answer with:

1. Summary
2. Changed files
3. How to test
4. Build/output location
5. Notes and risks
