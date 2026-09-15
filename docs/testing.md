# Testing

```bash
npm test          # node --test "test/*.test.js"
```

Node's built-in runner (Node 20+), no dependencies. Run it after every change to question generation.

## What it checks

Each activity generates `SAMPLE_SIZE` (30) questions **per difficulty**, and every generated question is checked for a correct answer. The prompts themselves are not exercised — inquirer needs a TTY — so activity modules must keep question building pure and exported:

| Export | Used by |
| --- | --- |
| `buildQuestions(number)` (`src/numberRecognition.js`) | `test/numberRecognition.test.js` |
| `buildScene`, `COMPARE_SCRIPTS`, `pickScript` (`src/compare.js`) | `test/compare.test.js` |
| `buildScene`, `addends`, `ADDITION_SCRIPTS`, `pickScript` (`src/addition.js`) | `test/addition.test.js` |
| `buildScene`, `terms`, `SUBTRACTION_SCRIPTS`, `pickScript` (`src/subtraction.js`) | `test/subtraction.test.js` |

The point is to catch a wrong answer, so a test must never compute the expected answer the way the source does:

- **number recognition** — answers are checked against the digits of `String(number)`, not against `digitsByPlace()`. Also rebuilds the number from the digit answers, and asserts no question text contains the number itself.
- **compare** — `EXPECTED` in the test spells out each script's answer independently (`Math.max`, `Math.min`, name of the winner). Also checks counts stay in range, names differ, `select` choices contain the answer, and that forced ties only leave the five wordings that make sense on a tie.
- **addition** — the strongest check: each question's numbers are parsed back out of its **message text** and the answer must follow from those (`ANSWER_FROM_MESSAGE`). A wording that prints different numbers than it scores fails. Also checks the sum cap, addends >= 1, choice lists, and, with `start: 1`, that no wording says "1 apples".
- **subtraction** — same message-parsing check (note `how-many-fewer` states the smaller count first, so its entry subtracts the other way round), plus: no answer is negative, `removed <= start`, `start` is within `MAX_STARTS`, and `ate`/`lost` are offered for exactly the edible/non-edible items.

Both script-based activities assert their script list matches the test's expectation table, so a new script cannot be added without a test for it.

## Adding tests for a new activity

1. Export the pure question builder from `src/<activity>.js`.
2. Add `test/<activity>.test.js` using `SAMPLE_SIZE`, `DIFFICULTIES`, `times()` and `numbersIn()` from `test/helpers.js`.
3. Loop over difficulties, generate `SAMPLE_SIZE` questions each, and verify the answers from a source the implementation does not share.

## Confirming the suite can fail

The tests were validated by mutation: introducing each bug below made `npm test` fail, and reverting it made it pass.

| Injected bug | Failures |
| --- | --- |
| `missing-addend` answers `start` instead of `added` | 3 |
| `added` drawn from the full cap so sums exceed it | 3 |
| items always plural ("1 apples") | 1 |
| `smaller-amount` answers the person with more | 3 |
| `skipWhen: isTie` removed from compare | 4 |
| `digitsByPlace` order flipped | 5 |
| `how-many-fewer` answers `removed - start` (negative) | 3 |
| `removed` drawn from `1..maxStart` so subtraction can go negative | 6 |
| `ate`'s `skipWhen` removed ("Ava ate 4 pencils") | 1 |

Worth repeating when the suite changes shape.

## Not covered

- Prompting and rendering (needs a TTY) — see the manual checklist in [cli.md](./cli.md).
- The round loop and score totals in `index.js`.
- `formatSession()` / `formatScore()` output.
