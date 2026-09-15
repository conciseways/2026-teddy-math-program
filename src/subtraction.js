import inquirer from 'inquirer';
import { report } from './feedback.js';
import {
  amount,
  between,
  castAndItem,
  choicesAround,
  pick,
  pickScriptFor
} from './scenes.js';

// Difficulty caps the number you start from, so the answer never goes negative.
export const MAX_STARTS = {
  easy: 10,
  medium: 50,
  hard: 100
};

export function terms(difficulty) {
  const maxStart = MAX_STARTS[difficulty] ?? MAX_STARTS.easy;
  const start = between(2, maxStart);
  return { start, removed: between(1, start) };
}

export function buildScene(difficulty) {
  const { item, owner, other } = castAndItem();
  return { item, owner, taker: other, ...terms(difficulty) };
}

const left = ({ start, removed }) => start - removed;

const isFood = ({ item }) => item.edible;

// Each script turns a scene into one question: what to ask, how to answer it, and the answer.
export const SUBTRACTION_SCRIPTS = [
  {
    id: 'equation',
    build: (scene) => ({
      type: 'number',
      message: `What is ${scene.start} - ${scene.removed}?`,
      answer: left(scene)
    })
  },
  {
    id: 'equation-choices',
    build: (scene) => ({
      type: 'select',
      message: `What is ${scene.start} - ${scene.removed}?`,
      choices: choicesAround(left(scene)),
      answer: left(scene)
    })
  },
  {
    id: 'missing-subtrahend',
    build: (scene) => ({
      type: 'number',
      message: `${scene.start} - ___ = ${left(scene)}. What is the missing number?`,
      answer: scene.removed
    })
  },
  {
    id: 'gave-away',
    build: (scene) => ({
      type: 'number',
      message: `${scene.owner} has ${amount(scene, scene.start)}. ${scene.owner} gives ${scene.taker} ${amount(scene, scene.removed)}. How many ${scene.item.many} does ${scene.owner} have left?`,
      answer: left(scene)
    })
  },
  {
    id: 'ate',
    skipWhen: (scene) => !isFood(scene),
    build: (scene) => ({
      type: 'number',
      message: `${scene.owner} had ${amount(scene, scene.start)} and ate ${amount(scene, scene.removed)}. How many ${scene.item.many} are left?`,
      answer: left(scene)
    })
  },
  {
    id: 'lost',
    skipWhen: (scene) => isFood(scene),
    build: (scene) => ({
      type: 'number',
      message: `${scene.owner} had ${amount(scene, scene.start)} and lost ${amount(scene, scene.removed)}. How many ${scene.item.many} does ${scene.owner} have now?`,
      answer: left(scene)
    })
  },
  {
    id: 'sold',
    build: (scene) => ({
      type: 'number',
      message: `${scene.owner} had ${amount(scene, scene.start)} to sell and sold ${amount(scene, scene.removed)}. How many ${scene.item.many} are still for sale?`,
      answer: left(scene)
    })
  },
  {
    id: 'taken-from-basket',
    build: (scene) => ({
      type: 'number',
      message: `There ${scene.start === 1 ? 'is' : 'are'} ${amount(scene, scene.start)} in a basket. ${scene.owner} takes ${amount(scene, scene.removed)} out. How many ${scene.item.many} are in the basket now?`,
      answer: left(scene)
    })
  },
  {
    id: 'how-many-more',
    build: (scene) => ({
      type: 'number',
      message: `${scene.owner} has ${amount(scene, scene.start)} and ${scene.taker} has ${amount(scene, scene.removed)}. How many more ${scene.item.many} does ${scene.owner} have than ${scene.taker}?`,
      answer: left(scene)
    })
  },
  {
    id: 'how-many-fewer',
    build: (scene) => ({
      type: 'number',
      message: `${scene.taker} has ${amount(scene, scene.removed)} and ${scene.owner} has ${amount(scene, scene.start)}. How many fewer ${scene.item.many} does ${scene.taker} have than ${scene.owner}?`,
      answer: left(scene)
    })
  },
  {
    id: 'difference-true-false',
    build: (scene) => {
      const shown = Math.random() < 0.5 ? left(scene) : left(scene) + pick([1, 2, 10]);
      return {
        type: 'confirm',
        message: `Is ${scene.start} - ${scene.removed} = ${shown}?`,
        answer: shown === left(scene)
      };
    }
  }
];

export function pickScript(scene) {
  return pickScriptFor(SUBTRACTION_SCRIPTS, scene);
}

function formatAnswer(answer) {
  if (typeof answer === 'boolean') {
    return answer ? 'yes' : 'no';
  }
  return answer;
}

async function askSubtraction(scene) {
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

export async function runSubtraction({ difficulty, questionCount }) {
  let correct = 0;

  for (let question = 0; question < questionCount; question += 1) {
    correct += await askSubtraction(buildScene(difficulty));
  }

  return { asked: questionCount, correct };
}
