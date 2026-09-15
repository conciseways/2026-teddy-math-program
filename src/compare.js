import inquirer from 'inquirer';
import { report } from './feedback.js';

export const NAMES = ['Joe', 'Mary', 'Teddy', 'Ava', 'Liam', 'Sofia', 'Noah', 'Ella'];

export const ITEMS = ['apples', 'marbles', 'stickers', 'cookies', 'pencils', 'coins'];

export const COMPARE_RANGES = {
  easy: { min: 1, max: 10 },
  medium: { min: 1, max: 50 },
  hard: { min: 1, max: 100 }
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const randomCount = (difficulty) => {
  const { min, max } = COMPARE_RANGES[difficulty] ?? COMPARE_RANGES.easy;
  return min + Math.floor(Math.random() * (max - min + 1));
};

const TIE_CHANCE = 0.15;

export function buildScene(difficulty) {
  const first = pick(NAMES);
  const second = pick(NAMES.filter((name) => name !== first));
  const firstCount = randomCount(difficulty);
  return {
    item: pick(ITEMS),
    first: { name: first, count: firstCount },
    second: {
      name: second,
      count: Math.random() < TIE_CHANCE ? firstCount : randomCount(difficulty)
    }
  };
}

const amount = (count, item) => `${count} ${count === 1 ? item.replace(/s$/, '') : item}`;

const higher = ({ first, second }) => (first.count >= second.count ? first : second);
const lower = ({ first, second }) => (first.count <= second.count ? first : second);
const isTie = ({ first, second }) => first.count === second.count;

const SAME = 'They have the same';

const nameChoices = ({ first, second }) => [first.name, second.name, SAME];
const countChoices = ({ first, second }) => [
  { name: String(first.count), value: first.count },
  { name: String(second.count), value: second.count }
];

// Each script turns a scene into one question: what to ask, how to answer it, and the answer.
export const COMPARE_SCRIPTS = [
  {
    id: 'who-has-more',
    build: (scene) => ({
      type: 'select',
      message: `Who has more ${scene.item}?`,
      choices: nameChoices(scene),
      answer: isTie(scene) ? SAME : higher(scene).name
    })
  },
  {
    id: 'who-has-less',
    build: (scene) => ({
      type: 'select',
      message: `Who has fewer ${scene.item}?`,
      choices: nameChoices(scene),
      answer: isTie(scene) ? SAME : lower(scene).name
    })
  },
  {
    id: 'greater-number',
    build: (scene) => ({
      type: 'select',
      message: `Which number is greater: ${scene.first.count} or ${scene.second.count}?`,
      choices: countChoices(scene),
      answer: higher(scene).count
    }),
    skipWhen: isTie
  },
  {
    id: 'lesser-number',
    build: (scene) => ({
      type: 'select',
      message: `Which number is less: ${scene.first.count} or ${scene.second.count}?`,
      choices: countChoices(scene),
      answer: lower(scene).count
    }),
    skipWhen: isTie
  },
  {
    id: 'larger-amount',
    build: (scene) => ({
      type: 'select',
      message: `Which is the larger amount of ${scene.item}?`,
      choices: countChoices(scene),
      answer: higher(scene).count
    }),
    skipWhen: isTie
  },
  {
    id: 'smaller-amount',
    build: (scene) => ({
      type: 'select',
      message: `Which is the smaller amount of ${scene.item}?`,
      choices: countChoices(scene),
      answer: lower(scene).count
    }),
    skipWhen: isTie
  },
  {
    id: 'greater-than-true-false',
    build: (scene) => ({
      type: 'confirm',
      message: `Is ${scene.first.count} greater than ${scene.second.count}?`,
      answer: scene.first.count > scene.second.count
    })
  },
  {
    id: 'less-than-true-false',
    build: (scene) => ({
      type: 'confirm',
      message: `Is ${scene.first.count} less than ${scene.second.count}?`,
      answer: scene.first.count < scene.second.count
    })
  },
  {
    id: 'same-amount',
    build: (scene) => ({
      type: 'confirm',
      message: `Do they have the same number of ${scene.item}?`,
      answer: isTie(scene)
    })
  },
  {
    id: 'how-many-more',
    build: (scene) => ({
      type: 'number',
      message: `How many more ${scene.item} does ${higher(scene).name} have than ${lower(scene).name}?`,
      answer: Math.abs(scene.first.count - scene.second.count)
    }),
    skipWhen: isTie
  }
];

export function pickScript(scene) {
  const usable = COMPARE_SCRIPTS.filter((script) => !script.skipWhen?.(scene));
  return pick(usable);
}

function describe({ item, first, second }) {
  return `\n${first.name} has ${amount(first.count, item)}, ${second.name} has ${amount(second.count, item)}.`;
}

function formatAnswer(answer) {
  if (typeof answer === 'boolean') {
    return answer ? 'yes' : 'no';
  }
  return answer;
}

async function askComparison(scene) {
  const question = pickScript(scene).build(scene);

  console.log(describe(scene));

  const { response } = await inquirer.prompt([
    {
      type: question.type,
      name: 'response',
      message: question.message,
      choices: question.choices,
      validate:
        question.type === 'number'
          ? (value) => (Number.isInteger(value) && value >= 0 ? true : 'Enter a whole number')
          : undefined
    }
  ]);

  return report(response === question.answer, formatAnswer(question.answer));
}

export async function runCompare({ difficulty, questionCount }) {
  let correct = 0;

  for (let question = 0; question < questionCount; question += 1) {
    correct += await askComparison(buildScene(difficulty));
  }

  return { asked: questionCount, correct };
}
