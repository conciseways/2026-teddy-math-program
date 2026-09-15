import inquirer from 'inquirer';
import { PLACES, digitsByPlace, largestPlace, randomNumber } from './placeValue.js';
import { report } from './feedback.js';

// The largest-place question, then one question per digit from that place down to ones.
export function buildQuestions(number) {
  return [
    {
      type: 'select',
      message: 'What is the largest place in this number?',
      choices: PLACES.map(({ name }) => name).reverse(),
      answer: largestPlace(number)
    },
    ...digitsByPlace(number).map(({ place, digit }) => ({
      type: 'number',
      message: `How many ${place}?`,
      answer: digit
    }))
  ];
}

async function askNumber(number) {
  const questions = buildQuestions(number);
  let correct = 0;

  console.log(`\nYour number is ${number}`);

  for (const question of questions) {
    const { response } = await inquirer.prompt([
      {
        type: question.type,
        name: 'response',
        message: question.message,
        choices: question.choices,
        validate:
          question.type === 'number'
            ? (value) =>
                Number.isInteger(value) && value >= 0 && value <= 9
                  ? true
                  : 'Enter a digit from 0 to 9'
            : undefined
      }
    ]);
    correct += report(response === question.answer, question.answer);
  }

  return { asked: questions.length, correct };
}

export async function runNumberRecognition({ difficulty, questionCount }) {
  let asked = 0;
  let correct = 0;

  for (let round = 0; round < questionCount; round += 1) {
    const result = await askNumber(randomNumber(difficulty));
    asked += result.asked;
    correct += result.correct;
  }

  return { asked, correct };
}
