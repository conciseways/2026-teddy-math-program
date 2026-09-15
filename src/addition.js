import inquirer from 'inquirer';
import { report } from './feedback.js';
import {
  amount,
  between,
  castAndItem,
  choicesAround,
  more,
  pick,
  pickScriptFor
} from './scenes.js';

// Difficulty caps the sum, not the addends: easy stays inside single digits.
export const MAX_SUMS = {
  easy: 10,
  medium: 50,
  hard: 100
};

export function addends(difficulty) {
  const maxSum = MAX_SUMS[difficulty] ?? MAX_SUMS.easy;
  const start = between(1, maxSum - 1);
  return { start, added: between(1, maxSum - start) };
}

export function buildScene(difficulty) {
  const { item, owner, other } = castAndItem();
  return { item, owner, giver: other, ...addends(difficulty) };
}

const total = ({ start, added }) => start + added;

// Each script turns a scene into one question: what to ask, how to answer it, and the answer.
export const ADDITION_SCRIPTS = [
  {
    id: 'equation',
    build: (scene) => ({
      type: 'number',
      message: `What is ${scene.start} + ${scene.added}?`,
      answer: total(scene)
    })
  },
  {
    id: 'equation-choices',
    build: (scene) => ({
      type: 'select',
      message: `What is ${scene.start} + ${scene.added}?`,
      choices: choicesAround(total(scene)),
      answer: total(scene)
    })
  },
  {
    id: 'missing-addend',
    build: (scene) => ({
      type: 'number',
      message: `${scene.start} + ___ = ${total(scene)}. What is the missing number?`,
      answer: scene.added
    })
  },
  {
    id: 'gave',
    build: (scene) => ({
      type: 'number',
      message: `${scene.owner} has ${amount(scene, scene.start)}. ${scene.giver} gives ${scene.owner} ${amount(scene, scene.added)}. How many ${scene.item.many} does ${scene.owner} have now?`,
      answer: total(scene)
    })
  },
  {
    id: 'bought',
    build: (scene) => ({
      type: 'number',
      message: `${scene.owner} has ${amount(scene, scene.start)}. Then ${scene.owner} buys ${more(scene, scene.added)}. How many ${scene.item.many} does ${scene.owner} have now?`,
      answer: total(scene)
    })
  },
  {
    id: 'found',
    build: (scene) => ({
      type: 'number',
      message: `${scene.owner} found ${amount(scene, scene.start)} and then found ${more(scene, scene.added)}. How many ${scene.item.many} did ${scene.owner} find in all?`,
      answer: total(scene)
    })
  },
  {
    id: 'added-to-basket',
    build: (scene) => ({
      type: 'number',
      message: `There ${scene.start === 1 ? 'is' : 'are'} ${amount(scene, scene.start)} in a basket. ${scene.owner} adds ${amount(scene, scene.added)}. How many ${scene.item.many} are in the basket now?`,
      answer: total(scene)
    })
  },
  {
    id: 'altogether',
    build: (scene) => ({
      type: 'number',
      message: `${scene.owner} has ${amount(scene, scene.start)} and ${scene.giver} has ${amount(scene, scene.added)}. How many ${scene.item.many} do they have altogether?`,
      answer: total(scene)
    })
  },
  {
    id: 'sum-true-false',
    build: (scene) => {
      const shown = Math.random() < 0.5 ? total(scene) : total(scene) + pick([1, 2, 10]);
      return {
        type: 'confirm',
        message: `Is ${scene.start} + ${scene.added} = ${shown}?`,
        answer: shown === total(scene)
      };
    }
  }
];

export function pickScript(scene) {
  return pickScriptFor(ADDITION_SCRIPTS, scene);
}

function formatAnswer(answer) {
  if (typeof answer === 'boolean') {
    return answer ? 'yes' : 'no';
  }
  return answer;
}

async function askAddition(scene) {
  const question = pickScript(scene).build(scene);

  console.log('');

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

export async function runAddition({ difficulty, questionCount }) {
  let correct = 0;

  for (let question = 0; question < questionCount; question += 1) {
    correct += await askAddition(buildScene(difficulty));
  }

  return { asked: questionCount, correct };
}
