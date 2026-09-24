# Tick

> Minimal Developer Task CLI

**Tick** is a small, beautiful, developer-focused terminal task management application.

It is NOT a full productivity platform. It is an extremely small MVP designed to make task capture and completion faster than opening another application or leaving the terminal.

---

## 1. What Tick Is

* **Instant capture**: Capture a task in a single command without leaving your flow.
* **Personalized assistant**: Choose what to call your assistant on first launch (e.g., `Tick`, `friday`, `jarvis`).
* **Dynamic CLI command**: The chosen assistant name becomes your terminal command.
* **Minimal & beautiful**: Clean Chalk-based terminal output with subdued styling for completed items.
* **Zero bloat**: No databases, no background servers, no cloud sync, no web UI. Just instant terminal productivity.

---

## 2. Installation

### Using npm (Global)

```bash
npm install -g @mahavirtech/tick
```

### From Source

```bash
# Clone the repository
git clone <repo-url> tick
cd tick

# Install dependencies and build
npm install
npm run build

# Link globally
npm link
# or: npm install -g .
```

Once installed, the base `tick` command is available everywhere.

---

## 3. First-Run Setup

When launched for the first time, Tick detects that no configuration exists and prompts you:

```text
Welcome to Tick!

? What would you like to call your assistant? (Tick)
```

Type your chosen name (for example, `Tick` or `friday`).

```text
Great. I'm Tick.
✓ Your assistant is now Tick.

Try:

  Tick add "My first task"
  Tick list
```

### Dynamic Command Strategy

When you choose a custom assistant name (e.g., `friday`):

1. **Global Symlink / Shim**: Tick creates a symlink in your global bin directory (or `.cmd` and `.ps1` shims on Windows) pointing to the CLI.
2. **Shell Alias**: On macOS and Linux, Tick also configures an alias in your shell configuration (`~/.zshrc`, `~/.bashrc`, or `~/.config/fish/config.fish`).
3. **Local Bin**: A standalone wrapper is placed in `~/.Tick/bin/`.

Both `tick` and your chosen assistant name (e.g., `friday`) will invoke the CLI directly.

---

## 4. Adding a Task

Create a task using the `add` command:

```bash
Tick add "Fix invoice bug"
```

Output:

```text
✓ Task #1 added
```

---

## 5. Listing Tasks

Display all tasks using the `list` command:

```bash
Tick list
```

Output:

```text
Tick — Tasks

  ID  STATUS     TITLE
  ──  ─────────  ────────────────────
   1  ○ Pending  Fix invoice bug
   2  ○ Pending  Review pull request
   3  ✓ Done     Update documentation

2 remaining · 1 completed
```

* `ID`: Task identifier (aligned).
* `STATUS`: `○ Pending` or `✓ Done` indicator.
* `TITLE`: Task description with subdued styling for completed tasks.

---

## 6. Completing a Task

Mark a task as completed using its numeric ID:

```bash
Tick done 1
```

Output:

```text
✓ Task #1 completed
```

If the task does not exist:

```bash
Tick done 999
# Output: Task #999 not found.
```

---

## 7. Adding Notes (Remember)

Capture quick plain-text notes that aren't tasks:

```bash
Tick remember "Database password was rotated"
```

Output:

```text
✓ Note #1 remembered
```

---

## 8. Listing Notes

View all saved notes along with when each was created:

```bash
Tick notes
```

Output:

```text
Tick — Notes

  ID  CREATED                        NOTE
  ──  ─────────────────────────────  ────────────────────────────────────
   1  Today at 5:40 PM (15m ago)     Database password was rotated
   2  Just now (5:55 PM)             Meeting with DevOps at 3pm

2 notes
```

---

## 9. Where Local Data Is Stored

Tick stores all data locally in JSON files in a platform-independent directory in your home folder:

```text
~/.Tick/
├── config.json    # Stores assistant configuration
├── tasks.json     # Stores your task list
└── notes.json     # Stores your plain text notes
```

* On macOS/Linux: `~/.Tick/` (or `~/.tick/`)
* On Windows: `C:\Users\<username>\.Tick\`

You can override the data directory at any time by setting the `TICK_DATA_DIR` environment variable:

```bash
export TICK_DATA_DIR="/custom/path"
```

### Data Formats

**`config.json`**:
```json
{
  "assistantName": "Tick"
}
```

**`tasks.json`**:
```json
[
  {
    "id": 1,
    "title": "Fix invoice bug",
    "completed": false,
    "createdAt": "2026-09-24T10:00:00.000Z",
    "completedAt": null
  }
]
```

**`notes.json`**:
```json
[
  {
    "id": 1,
    "content": "Database password was rotated",
    "createdAt": "2026-09-24T17:45:00.000Z"
  }
]
```

---

## 10. Development Commands

Run Tick directly in development without compiling using `tsx`:

```bash
# Add a task in development
npm run dev -- add "Fix authentication bug"

# List tasks
npm run dev -- list

# Complete a task
npm run dev -- done 1

# Add a note
npm run dev -- remember "Meeting notes with frontend team"

# List notes
npm run dev -- notes

# Build TypeScript to dist/
npm run build

# Run automated tests
npm test
```

---

## 11. License

MIT © 2026 Mahavirtech

