#!/usr/bin/env bash
# PostToolUse hook: format created/edited files with Prettier,
# and lint JS/TS with ESLint. Scoped to this project via .claude/settings.json.
set -euo pipefail

file=$(jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.md|*.mdx|*.json|*.css)
    npx prettier --write "$file" >/dev/null 2>&1 || true
    ;;
esac

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs)
    npx eslint --fix "$file" >/dev/null 2>&1 || true
    ;;
esac

exit 0
