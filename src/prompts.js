import inquirer from 'inquirer';

export const OPERATIONS = [
  { name: 'Addition (+)', value: 'addition' },
  { name: 'Subtraction (-)', value: 'subtraction' },
  { name: 'Multiplication (x)', value: 'multiplication' },
  { name: 'Division (/)', value: 'division' },
  { name: 'Mixed', value: 'mixed' }
];

export const DIFFICULTIES = [
  { name: 'Easy (numbers up to 10)', value: 'easy' },
  { name: 'Medium (numbers up to 50)', value: 'medium' },
  { name: 'Hard (numbers up to 100)', value: 'hard' }
];

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
      name: 'operation',
      message: 'Which kind of problems do you want to practice?',
      choices: OPERATIONS
    },
    {
      type: 'select',
      name: 'difficulty',
      message: 'How hard should the problems be?',
      choices: DIFFICULTIES
    },
    {
      type: 'number',
      name: 'questionCount',
      message: 'How many questions?',
      default: 10,
      validate: (value) =>
        Number.isInteger(value) && value >= 1 && value <= 50
          ? true
          : 'Pick a whole number between 1 and 50'
    },
    {
      type: 'confirm',
      name: 'timed',
      message: 'Show how long each answer takes?',
      default: false
    }
  ]);
}
