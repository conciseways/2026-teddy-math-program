import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPARE_RANGES,
  COMPARE_SCRIPTS,
  ITEMS,
  NAMES,
  buildScene,
  pickScript
} from '../src/compare.js';
import { DIFFICULTIES, SAMPLE_SIZE, numbersIn, times } from './helpers.js';

const SAME = 'They have the same';

const counts = ({ first, second }) => [first.count, second.count];
const winner = ({ first, second }) => (first.count > second.count ? first.name : second.name);
const loser = ({ first, second }) => (first.count < second.count ? first.name : second.name);
const tied = (scene) => scene.first.count === scene.second.count;

// Expected answers, written out independently of how the scripts build them.
const EXPECTED = {
  'who-has-more': (scene) => (tied(scene) ? SAME : winner(scene)),
  'who-has-less': (scene) => (tied(scene) ? SAME : loser(scene)),
  'larger-amount': (scene) => winner(scene),
  'smaller-amount': (scene) => loser(scene),
  'greater-number': (scene) => Math.max(...counts(scene)),
  'lesser-number': (scene) => Math.min(...counts(scene)),
  'greater-than-true-false': ({ first, second }) => first.count > second.count,
  'less-than-true-false': ({ first, second }) => first.count < second.count,
  'same-amount': (scene) => tied(scene),
  'how-many-more': (scene) => Math.max(...counts(scene)) - Math.min(...counts(scene))
};

const scenes = (difficulty) => times(SAMPLE_SIZE, () => buildScene(difficulty));

// A tie is only ~15% of scenes, so force some to cover the tie-only wordings.
const tieScene = () => {
  const scene = buildScene('easy');
  return { ...scene, second: { ...scene.second, count: scene.first.count } };
};

test('compare: every script has an expected answer in this test', () => {
  assert.deepEqual(COMPARE_SCRIPTS.map(({ id }) => id).sort(), Object.keys(EXPECTED).sort());
});

for (const difficulty of DIFFICULTIES) {
  test(`compare: ${SAMPLE_SIZE} ${difficulty} scenes are well formed`, () => {
    const { min, max } = COMPARE_RANGES[difficulty];

    for (const scene of scenes(difficulty)) {
      assert.ok(ITEMS.includes(scene.item));
      assert.ok(NAMES.includes(scene.first.name) && NAMES.includes(scene.second.name));
      assert.notEqual(scene.first.name, scene.second.name, 'the same kid twice');
      for (const count of counts(scene)) {
        assert.ok(count >= min && count <= max, `${count} outside ${difficulty} range`);
      }
    }
  });

  test(`compare: every script answers ${SAMPLE_SIZE} ${difficulty} scenes correctly`, () => {
    for (const scene of scenes(difficulty)) {
      for (const script of COMPARE_SCRIPTS) {
        if (script.skipWhen?.(scene)) {
          continue;
        }

        const question = script.build(scene);
        assert.equal(question.answer, EXPECTED[script.id](scene), `${script.id} on ${JSON.stringify(scene)}`);

        if (question.type === 'select') {
          const values = question.choices.map((choice) => choice.value ?? choice);
          assert.ok(values.includes(question.answer), `${script.id} cannot be answered correctly`);
        }
      }
    }
  });
}

test(`compare: ${SAMPLE_SIZE} ties only ask wordings that make sense`, () => {
  for (const scene of times(SAMPLE_SIZE, tieScene)) {
    const usable = COMPARE_SCRIPTS.filter((script) => !script.skipWhen?.(scene)).map(({ id }) => id);
    assert.deepEqual(usable.sort(), [
      'greater-than-true-false',
      'less-than-true-false',
      'same-amount',
      'who-has-less',
      'who-has-more'
    ]);

    const script = pickScript(scene);
    assert.ok(usable.includes(script.id), `${script.id} should be skipped on a tie`);
    assert.notEqual(script.build(scene).answer, undefined);
  }
});

test(`compare: ${SAMPLE_SIZE} random questions state the counts they ask about`, () => {
  for (const scene of scenes('hard')) {
    const question = pickScript(scene).build(scene);
    const shown = numbersIn(question.message);
    for (const number of shown) {
      assert.ok(counts(scene).includes(number), `${question.message} invents the number ${number}`);
    }
  }
});
