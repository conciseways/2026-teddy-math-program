import inquirer from 'inquirer';
import { PLACES, digitsByPlace, largestPlace, randomNumber } from './placeValue.js';
import { report } from './feedback.js';

async function askNumber(number) {
  let correct = 0;
  let asked = 0;

  console.log(`\nYour number is ${number}`);

  const { place } = await inquirer.prompt([
    {
      type: 'select',
      name: 'place',
      message: 'What is the largest place in this number?',
      choices: PLACES.map(({ name }) => name).reverse()
    }
  ]);
  asked += 1;
  const expectedPlace = largestPlace(number);
  correct += report(place === expectedPlace, expectedPlace);

  for (const { place: placeName, digit } of digitsByPlace(number)) {
    const { count } = await inquirer.prompt([
      {
        type: 'number',
        name: 'count',
        message: `How many ${placeName}?`,
        validate: (value) =>
          Number.isInteger(value) && value >= 0 && value <= 9
            ? true
            : 'Enter a digit from 0 to 9'
      }
    ]);
    asked += 1;
    correct += report(count === digit, digit);
  }

  return { asked, correct };
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
