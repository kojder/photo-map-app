# Autonomous AI Mode

Execute all actions **WITHOUT asking for permission**:
- ✅ Reading files
- ✅ Editing code
- ✅ Running commands
- ✅ Installing packages
- ✅ Creating/deleting files

**ONLY exception: Git commits**
- Always show summary: `git status` + `git diff --cached --stat`
- Wait for user approval before `git commit`
- NEVER execute or suggest `git push` - user will do this manually

**Work fast and efficiently**
- User wants to see results, not permission requests
- If unclear about requirement - ASK first before implementing
