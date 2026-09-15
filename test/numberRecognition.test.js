import test from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTY_RANGES, randomNumber } from '../src/placeValue.js';
import { buildQuestions } from '../src/numberRecognition.js';
import { DIFFICULTIES, SAMPLE_SIZE, numbersIn, times } from './helpers.js';

const PLACE_OF_LENGTH = { 1: 'ones', 2: 'tens', 3: 'hundreds', 4: 'thousands' };

// The answers are checked against the digits of the number read as a string, not against
// the place-value helpers the questions are built from.
for (const difficulty of DIFFICULTIES) {
  test(`number recognition: ${SAMPLE_SIZE} ${difficulty} numbers are asked and answered correctly`, () => {
    const { min, max } = DIFFICULTY_RANGES[difficulty];

    for (const number of times(SAMPLE_SIZE, () => randomNumber(difficulty))) {
      assert.ok(number >= min && number <= max, `${number} outside ${difficulty} range`);

      const digits = String(number).split('');
      const [largest, ...perDigit] = buildQuestions(number);

      assert.equal(largest.answer, PLACE_OF_LENGTH[digits.length]);
      assert.ok(largest.choices.includes(largest.answer));

      assert.equal(perDigit.length, digits.length, `${number} should ask about every digit`);
      perDigit.forEach((question, index) => {
        assert.equal(question.message, `How many ${PLACE_OF_LENGTH[digits.length - index]}?`);
        assert.equal(question.answer, Number(digits[index]), `digit ${index} of ${number}`);
      });
    }
  });
}

test('number recognition: 527 asks the largest place then hundreds, tens, ones', () => {
  assert.deepEqual(
    buildQuestions(527).map(({ message, answer }) => [message, answer]),
    [
      ['What is the largest place in this number?', 'hundreds'],
      ['How many hundreds?', 5],
      ['How many tens?', 2],
      ['How many ones?', 7]
    ]
  );
});

test('number recognition: digit answers rebuild the number', () => {
  for (const number of times(SAMPLE_SIZE, () => randomNumber('hard'))) {
    const digits = buildQuestions(number).slice(1).map(({ answer }) => answer);
    assert.equal(Number(digits.join('')), number);
    assert.ok(digits.every((digit) => Number.isInteger(digit) && digit >= 0 && digit <= 9));
  }
});

test('number recognition: no question leaks a number into its text', () => {
  for (const number of times(SAMPLE_SIZE, () => randomNumber('medium'))) {
    for (const { message } of buildQuestions(number)) {
      assert.deepEqual(numbersIn(message), [], `"${message}" gives the answer away`);
    }
  }
});
