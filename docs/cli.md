# CLI scripts

Everything the terminal app does, in the order it happens. Written for an agent picking the project up cold.

## Run it

```bash
npm install
npm start          # or: node index.js, or the `teddy-math` bin
```

Requires Node 18+ (developed on Node 24). No build step, no tests yet (`npm test` is still the npm placeholder), no linter configured.

## File map

| File | Responsibility |
| --- | --- |
| `index.js` | Entrypoint. Runs `promptSession()`, dispatches to an activity runner via `ACTIVITY_RUNNERS`, owns the round loop and score printing, and swallows `ExitPromptError` (Ctrl+C) so quitting is not a crash. |
| `src/prompts.js` | Every setup prompt plus `promptAnotherRound()`. Owns the `ACTIVITIES` and `DIFFICULTIES` choice lists and the per-activity difficulty hints. |
| `src/summary.js` | `formatSession()` (the settings block) and `formatScore()` (`"4/6 (67%)"`). Imports the choice lists to turn stored values back into labels. |
| `src/feedback.js` | `report(isCorrect, expected)` — prints `Correct!` or `Not quite - the answer is X.` and returns `1`/`0` so callers can sum it into a score. |
| `src/placeValue.js` | Pure place-value helpers for number recognition. |
| `src/numberRecognition.js` | The number-recognition activity (prompting). |
| `src/compare.js` | The compare activity: scene generation, the script list, and prompting. |
| `src/addition.js` | The addition activity: scene generation, the script list, and prompting. |

## Session shape

`promptSession()` resolves to:

```js
{
  name: 'Teddy',                  // trimmed, non-empty
  activity: 'number-recognition', // | 'compare' | 'addition'
  difficulty: 'easy',             // | 'medium' | 'hard'
  questionCount: 5                // 1..50, per round
}
```

The difficulty labels are rewritten per activity by `DIFFICULTY_HINTS` — number recognition shows `Easy (tens)`, compare `Easy (up to 10)`, addition `Easy (sums up to 10)`. Each activity decides what difficulty means to it, so keep the hint and the generator in sync.

## Round loop (`index.js`)

```js
const runActivity = ACTIVITY_RUNNERS[session.activity];  // undefined -> exit after printing settings
do {
  const round = await runActivity(session);              // -> { asked, correct }
  total.asked += round.asked; total.correct += round.correct;
  // prints "Round score: x/y (z%)" and "Total score: ..."
} while (await promptAnotherRound(session.questionCount)); // "Try 5 more?" default yes
```

Every activity runner takes the whole session object and returns `{ asked, correct }`. `asked` is the number of *questions*, which is not necessarily `questionCount`: number recognition asks several questions per number.

Every activity in `ACTIVITIES` has a runner. Subtraction, multiplication and division do not exist yet; each should be added as its own activity, mirroring `src/addition.js`.

## Activity: number recognition

`src/placeValue.js` (pure, easy to check with `node -e`):

- `PLACES` — `ones, tens, hundreds, thousands` ascending, each with its `value` (1, 10, 100, 1000).
- `DIFFICULTY_RANGES` — `easy 10-99`, `medium 100-999`, `hard 1000-9999`.
- `randomNumber(difficulty)`, `largestPlace(527) -> 'hundreds'`,
  `digitsByPlace(527) -> [{place:'hundreds',digit:5},{place:'tens',digit:2},{place:'ones',digit:7}]` (largest place first).

`runNumberRecognition({ difficulty, questionCount })` asks, per random number:

1. `select` — "What is the largest place in this number?" (all four places offered as choices).
2. `number` — "How many hundreds?", then tens, then ones (0-9 validated), from `digitsByPlace`.

So a 3-digit number contributes 4 to `asked`.

## Activity: compare

`buildScene(difficulty)` picks two distinct `NAMES`, one item from `ITEMS`, and two counts from `COMPARE_RANGES` (`easy 1-10`, `medium 1-50`, `hard 1-100`). With probability `TIE_CHANCE` (0.15) the second count is forced equal to the first, so tie wordings actually come up.

```js
{ item: 'apples', first: { name: 'Joe', count: 10 }, second: { name: 'Mary', count: 3 } }
```

`COMPARE_SCRIPTS` is the list of question wordings. Each entry is:

```js
{
  id: 'who-has-more',
  build: (scene) => ({ type, message, choices?, answer }), // type: 'select' | 'confirm' | 'number'
  skipWhen?: (scene) => boolean                            // e.g. isTie, for wordings that need a winner
}
```

Current scripts, shown against `Joe 10 / Mary 3 apples`:

| id | Question | Answer form |
| --- | --- | --- |
| `who-has-more` | Who has more apples? | name or `They have the same` |
| `who-has-less` | Who has fewer apples? | name or `They have the same` |
| `larger-amount` | Who has the larger amount of apples? | name (skipped on tie) |
| `smaller-amount` | Who has the smaller amount of apples? | name (skipped on tie) |
| `greater-number` | Which number is greater: 10 or 3? | number (skipped on tie) |
| `lesser-number` | Which number is less: 10 or 3? | number (skipped on tie) |
| `greater-than-true-false` | Is 10 greater than 3? | yes/no |
| `less-than-true-false` | Is 10 less than 3? | yes/no |
| `same-amount` | Do they have the same number of apples? | yes/no |
| `how-many-more` | How many more apples does Joe have than Mary? | number (skipped on tie) |

`pickScript(scene)` filters out scripts whose `skipWhen` matches, then picks one at random. `askComparison` prints `describe(scene)` ("Joe has 10 apples, Mary has 3 apples." — singularised via `amount()`), prompts once, and compares the response to `question.answer` with `===`, so `choices` values must be the same type as `answer`.

### Adding a wording

Append one entry to `COMPARE_SCRIPTS`. Use `nameChoices(scene)` / `countChoices(scene)` for choice lists, add `skipWhen: isTie` if the wording assumes a winner, and check it without a TTY:

```bash
node -e "import('./src/compare.js').then(m=>{const s={item:'apples',first:{name:'Joe',count:10},second:{name:'Mary',count:3}};
for (const x of m.COMPARE_SCRIPTS) console.log(x.id, x.build(s).message, '=>', x.build(s).answer);})"
```

## Activity: addition

Same script-list shape as compare, but the scene is one addition fact dressed up in different wordings.

`buildScene(difficulty)` picks an `owner` and a distinct `giver` from `NAMES`, an item from `ITEMS`, and two addends from `addends(difficulty)`:

```js
{ item: { one: 'piece of candy', many: 'pieces of candy' }, owner: 'Ava', giver: 'Liam', start: 4, added: 3 }
```

Difficulty caps the **sum**, not the addends — `MAX_SUMS` is `easy 10`, `medium 50`, `hard 100`. `addends()` draws `start` from `1..maxSum-1`, then `added` from `1..maxSum-start`, so both addends are at least 1 and the total never exceeds the cap (easy never produces `8 + 4`). The `equation-choices` distractors are allowed past the cap.

`ITEMS` are `{ one, many }` pairs rather than plain plurals because of items like "pieces of candy" that do not singularise by dropping an `s`. `amount(scene, n)` renders "1 piece of candy" / "3 pieces of candy"; `more(scene, n)` renders "3 more pieces of candy".

`ADDITION_SCRIPTS` entries have the same `{ id, build, skipWhen? }` shape as `COMPARE_SCRIPTS`. Shown against `Ava / Liam, 4 + 3 pieces of candy`:

| id | Question | Answer form |
| --- | --- | --- |
| `equation` | What is 4 + 3? | number |
| `equation-choices` | What is 4 + 3? | number, picked from four shuffled options (answer ±1 and +10) |
| `missing-addend` | 4 + ___ = 7. What is the missing number? | number (`added`) |
| `gave` | Ava has 4 pieces of candy. Liam gives Ava 3 pieces of candy. How many … now? | number |
| `bought` | Ava has 4 pieces of candy. Then Ava buys 3 more pieces of candy. How many … now? | number |
| `found` | Ava found 4 pieces of candy and then found 3 more pieces of candy. How many … in all? | number |
| `added-to-basket` | There are 4 pieces of candy in a basket. Ava adds 3 pieces of candy. How many … now? | number |
| `altogether` | Ava has 4 pieces of candy and Liam has 3 pieces of candy. How many … altogether? | number |
| `sum-true-false` | Is 4 + 3 = 9? | yes/no (half the time the shown sum is correct) |

Word problems repeat the names instead of using pronouns, so no script has to guess a name's gender.

### Adding a wording

Append one entry to `ADDITION_SCRIPTS` and check the phrasing for every script without a TTY — use `start: 1` to catch singular/plural mistakes:

```bash
node -e "import('./src/addition.js').then(m=>{const s={item:{one:'piece of candy',many:'pieces of candy'},owner:'Ava',giver:'Liam',start:1,added:3};
for (const x of m.ADDITION_SCRIPTS) {const q=x.build(s); console.log(x.id,'|',q.message,'=>',q.answer);}})"
```

### Adding an activity

1. Create `src/<activity>.js` exporting `run<Activity>(session) -> { asked, correct }`, using `report()` from `src/feedback.js` for feedback and scoring.
2. Add a `{ name, value }` entry to `ACTIVITIES` in `src/prompts.js`, and difficulty wording to `DIFFICULTY_HINTS`.
3. Register the runner in `ACTIVITY_RUNNERS` in `index.js`.
4. Keep generation pure and separate from prompting, and add the doc row in `docs/index.md` if it needs its own document.

## Manual test checklist

The prompts need a TTY, so this is done by hand:

- every activity, with correct and incorrect answers;
- each prompt type at least once (`number`, `select`, `confirm`) — keep answering rounds until they all appear;
- a tie in compare (rerun until one appears, or raise `TIE_CHANCE` temporarily);
- `Try N more?` yes at least once — round vs total scores must diverge;
- Ctrl+C mid-prompt — prints `See you next time!`, no stack trace.
