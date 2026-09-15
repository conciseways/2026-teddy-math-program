import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADDITION_SCRIPTS,
  MAX_SUMS,
  addends,
  buildScene,
  pickScript
} from '../src/addition.js';
import { ITEMS, NAMES } from '../src/scenes.js';
import { DIFFICULTIES, SAMPLE_SIZE, numbersIn, times } from './helpers.js';

const scenes = (difficulty) => times(SAMPLE_SIZE, () => buildScene(difficulty));

// What the numbers printed in the question mean, and the answer they imply.
const ANSWER_FROM_MESSAGE = {
  equation: ([a, b]) => a + b,
  'equation-choices': ([a, b]) => a + b,
  'missing-addend': ([start, sum]) => sum - start,
  gave: ([start, given]) => start + given,
  bought: ([start, bought]) => start + bought,
  found: ([first, then]) => first + then,
  'added-to-basket': ([inBasket, added]) => inBasket + added,
  altogether: ([mine, yours]) => mine + yours,
  'sum-true-false': ([a, b, shown]) => a + b === shown
};

test('addition: every script is covered by this test', () => {
  assert.deepEqual(
    ADDITION_SCRIPTS.map(({ id }) => id).sort(),
    Object.keys(ANSWER_FROM_MESSAGE).sort()
  );
});

for (const difficulty of DIFFICULTIES) {
  test(`addition: ${SAMPLE_SIZE} ${difficulty} scenes stay inside the sum cap`, () => {
    const maxSum = MAX_SUMS[difficulty];

    for (const scene of scenes(difficulty)) {
      assert.ok(ITEMS.includes(scene.item));
      assert.ok(NAMES.includes(scene.owner) && NAMES.includes(scene.giver));
      assert.notEqual(scene.owner, scene.giver, 'the same kid twice');
      assert.ok(scene.start >= 1 && scene.added >= 1, `${scene.start} + ${scene.added} has a zero`);
      assert.ok(
        scene.start + scene.added <= maxSum,
        `${scene.start} + ${scene.added} is over the ${difficulty} cap of ${maxSum}`
      );
    }
  });

  test(`addition: every script answers ${SAMPLE_SIZE} ${difficulty} scenes correctly`, () => {
    for (const scene of scenes(difficulty)) {
      for (const script of ADDITION_SCRIPTS) {
        const question = script.build(scene);
        const shown = numbersIn(question.message);

        // The answer has to follow from the numbers the student can actually read.
        assert.equal(
          question.answer,
          ANSWER_FROM_MESSAGE[script.id](shown),
          `${script.id}: "${question.message}" -> ${question.answer}`
        );

        if (question.type === 'select') {
          assert.ok(question.choices.includes(question.answer), `${script.id} has no right choice`);
          assert.equal(new Set(question.choices).size, question.choices.length, 'duplicate choices');
          assert.ok(question.choices.every((choice) => choice >= 0), 'negative choice');
        }
      }
    }
  });
}

test(`addition: ${SAMPLE_SIZE} random questions read as sentences`, () => {
  for (const scene of times(SAMPLE_SIZE, () => ({ ...buildScene('easy'), start: 1, added: 1 }))) {
    for (const script of ADDITION_SCRIPTS) {
      const { message } = script.build(scene);
      assert.ok(
        !message.includes(`1 ${scene.item.many}`),
        `${script.id} says "1 ${scene.item.many}"`
      );
      assert.ok(!/\s{2,}/.test(message), `${script.id} has doubled spaces`);
    }
  }
});

test('addition: word problems name the kids in the scene', () => {
  for (const scene of scenes('medium')) {
    const { message } = pickScript(scene).build(scene);
    for (const name of NAMES) {
      if (message.includes(name)) {
        assert.ok([scene.owner, scene.giver].includes(name), `${message} invents ${name}`);
      }
    }
  }
});

test('addition: sums fill the range up to the cap', () => {
  const sums = new Set(times(300, () => {
    const { start, added } = addends('easy');
    return start + added;
  }));
  assert.ok(sums.has(MAX_SUMS.easy), 'never reaches the cap');
  assert.ok(sums.size >= 8, `only ${sums.size} distinct easy sums`);
});
