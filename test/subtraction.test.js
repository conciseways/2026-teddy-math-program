import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_STARTS,
  SUBTRACTION_SCRIPTS,
  buildScene,
  pickScript,
  terms
} from '../src/subtraction.js';
import { ITEMS, NAMES } from '../src/scenes.js';
import { DIFFICULTIES, SAMPLE_SIZE, numbersIn, times } from './helpers.js';

const scenes = (difficulty) => times(SAMPLE_SIZE, () => buildScene(difficulty));

const usableScripts = (scene) => SUBTRACTION_SCRIPTS.filter((script) => !script.skipWhen?.(scene));

// What the numbers printed in the question mean, and the answer they imply.
const ANSWER_FROM_MESSAGE = {
  equation: ([a, b]) => a - b,
  'equation-choices': ([a, b]) => a - b,
  'missing-subtrahend': ([start, difference]) => start - difference,
  'gave-away': ([had, given]) => had - given,
  ate: ([had, eaten]) => had - eaten,
  lost: ([had, lost]) => had - lost,
  sold: ([had, sold]) => had - sold,
  'taken-from-basket': ([inBasket, taken]) => inBasket - taken,
  'how-many-more': ([mine, yours]) => mine - yours,
  'how-many-fewer': ([yours, mine]) => mine - yours,
  'difference-true-false': ([a, b, shown]) => a - b === shown
};

test('subtraction: every script is covered by this test', () => {
  assert.deepEqual(
    SUBTRACTION_SCRIPTS.map(({ id }) => id).sort(),
    Object.keys(ANSWER_FROM_MESSAGE).sort()
  );
});

for (const difficulty of DIFFICULTIES) {
  test(`subtraction: ${SAMPLE_SIZE} ${difficulty} scenes never go below zero`, () => {
    const maxStart = MAX_STARTS[difficulty];

    for (const scene of scenes(difficulty)) {
      assert.ok(ITEMS.includes(scene.item));
      assert.ok(NAMES.includes(scene.owner) && NAMES.includes(scene.taker));
      assert.notEqual(scene.owner, scene.taker, 'the same kid twice');
      assert.ok(scene.removed >= 1, `nothing is taken away from ${scene.start}`);
      assert.ok(
        scene.removed <= scene.start,
        `${scene.start} - ${scene.removed} goes negative`
      );
      assert.ok(
        scene.start <= maxStart,
        `${scene.start} is over the ${difficulty} cap of ${maxStart}`
      );
    }
  });

  test(`subtraction: every script answers ${SAMPLE_SIZE} ${difficulty} scenes correctly`, () => {
    for (const scene of scenes(difficulty)) {
      for (const script of usableScripts(scene)) {
        const question = script.build(scene);
        const shown = numbersIn(question.message);

        // The answer has to follow from the numbers the student can actually read.
        assert.equal(
          question.answer,
          ANSWER_FROM_MESSAGE[script.id](shown),
          `${script.id}: "${question.message}" -> ${question.answer}`
        );

        if (typeof question.answer === 'number') {
          assert.ok(question.answer >= 0, `${script.id} answers ${question.answer}`);
        }

        if (question.type === 'select') {
          assert.ok(question.choices.includes(question.answer), `${script.id} has no right choice`);
          assert.equal(new Set(question.choices).size, question.choices.length, 'duplicate choices');
          assert.ok(question.choices.every((choice) => choice >= 0), 'negative choice');
        }
      }
    }
  });
}

test('subtraction: only food gets eaten', () => {
  for (const item of ITEMS) {
    const scene = { item, owner: 'Ava', taker: 'Liam', start: 5, removed: 2 };
    const ids = usableScripts(scene).map(({ id }) => id);
    assert.equal(ids.includes('ate'), item.edible, `ate vs ${item.many}`);
    assert.equal(ids.includes('lost'), !item.edible, `lost vs ${item.many}`);
  }
});

test(`subtraction: ${SAMPLE_SIZE} random questions read as sentences`, () => {
  for (const scene of times(SAMPLE_SIZE, () => ({ ...buildScene('easy'), start: 2, removed: 1 }))) {
    for (const script of usableScripts(scene)) {
      const { message } = script.build(scene);
      assert.ok(
        !message.includes(`1 ${scene.item.many}`),
        `${script.id} says "1 ${scene.item.many}"`
      );
      assert.ok(!/\s{2,}/.test(message), `${script.id} has doubled spaces`);
    }
  }
});

test('subtraction: word problems name the kids in the scene', () => {
  for (const scene of scenes('medium')) {
    const { message } = pickScript(scene).build(scene);
    for (const name of NAMES) {
      if (message.includes(name)) {
        assert.ok([scene.owner, scene.taker].includes(name), `${message} invents ${name}`);
      }
    }
  }
});

test('subtraction: differences reach both zero and the cap', () => {
  const differences = new Set(times(400, () => {
    const { start, removed } = terms('easy');
    return start - removed;
  }));
  assert.ok(differences.has(0), 'never takes everything away');
  assert.ok(differences.has(MAX_STARTS.easy - 1), 'never leaves almost everything');
});
