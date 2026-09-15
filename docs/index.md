# Documentation index

Directory of all documents in this repo. Add a row here whenever a new doc is created.

| Document | Covers | Read it when |
| --- | --- | --- |
| [cli.md](./cli.md) | CLI architecture: session prompts, the round loop, the number-recognition, compare and addition activities, and how to add new ones | Changing or extending anything the CLI asks or scores |
| [testing.md](./testing.md) | `npm test`: what the generated-question suite checks per activity, how to test a new activity, what is not covered | Changing question generation, or adding an activity or a script |

## Project in one paragraph

`2026-teddy-math-program` is a Node.js (ESM) terminal app that drills elementary math. `npm start` prompts for a student name, an activity, a difficulty, and a questions-per-round count, runs that many questions, prints round and running totals, then offers another round. Questions are generated randomly; nothing is persisted between runs.

## Conventions

- Node ESM only (`"type": "module"`); all imports at the top of the file.
- `inquirer` v14 for every prompt. The legacy `list` type was removed in v14 — use `select`.
- Question generation is kept pure and separate from prompting so `npm test` can check it without a TTY.
- Run `npm test` after any change to question generation; every activity is checked against 30 generated questions per difficulty.
- Comments are rare; names carry the meaning.
