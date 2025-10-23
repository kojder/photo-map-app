Show current project status with context usage

Read PROGRESS_TRACKER.md (Current Status section) and display:
1. Current phase and status emoji
2. Last completed task with commit hash
3. Currently working on task
4. Next action (first 2-3 items only)
5. **Context usage: X/200k tokens (Y% used, Z% free)**

If free context < 50k (75%+ used):
  Add: "💡 Sugestia: Warto zrobić /compact - zbliżamy się do limitu kontekstu"

If free context < 25k (87.5%+ used):
  Add: "⚠️ UWAGA: Mało kontekstu! Zrób /compact lub /clean przed kontynuacją"

If phase completed and free context < 100k:
  Add: "💡 Sugestia: Możesz zrobić /clean - faza ukończona, nowa faza się zaczyna"

Keep output concise - max 10-12 lines.
Format with emojis for quick visual scanning.
