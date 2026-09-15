import inquirer from 'inquirer';

export const ACTIVITIES = [
  { name: 'Number recognition (place values)', value: 'number-recognition' },
  { name: 'Compare (more, less, greater than)', value: 'compare' },
  { name: 'Addition (equations and word problems)', value: 'addition' },
  { name: 'Subtraction (equations and word problems)', value: 'subtraction' }
];

export const DIFFICULTIES = [
  { name: 'Easy', value: 'easy' },
  { name: 'Medium', value: 'medium' },
  { name: 'Hard', value: 'hard' }
];

const DIFFICULTY_HINTS = {
  'number-recognition': { easy: 'tens', medium: 'hundreds', hard: 'thousands' },
  compare: { easy: 'up to 10', medium: 'up to 50', hard: 'up to 100' },
  addition: { easy: 'sums up to 10', medium: 'sums up to 50', hard: 'sums up to 100' },
  subtraction: { easy: 'from 10 or less', medium: 'from 50 or less', hard: 'from 100 or less' }
};

function difficultyChoices(activity) {
  const hints = DIFFICULTY_HINTS[activity] ?? {};
  return DIFFICULTIES.map(({ name, value }) => ({
    name: hints[value] ? `${name} (${hints[value]})` : name,
    value
  }));
}

export function promptSession() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: "What is the student's name?",
      default: 'Teddy',
      validate: (value) => (value.trim().length > 0 ? true : 'Please enter a name'),
      filter: (value) => value.trim()
    },
    {
      type: 'select',
      name: 'activity',
      message: 'What do you want to practice?',
      choices: ACTIVITIES
    },
    {
      type: 'select',
      name: 'difficulty',
      message: 'How hard should the problems be?',
      choices: (answers) => difficultyChoices(answers.activity)
    },
    {
      type: 'number',
      name: 'questionCount',
      message: 'How many questions per round?',
      default: 5,
      validate: (value) =>
        Number.isInteger(value) && value >= 1 && value <= 50
          ? true
          : 'Pick a whole number between 1 and 50'
    }
  ]);
}

export async function promptAnotherRound(questionCount) {
  const { again } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'again',
      message: `Try ${questionCount} more?`,
      default: true
    }
  ]);
  return again;
}
