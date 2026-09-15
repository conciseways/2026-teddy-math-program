export function report(isCorrect, expected) {
  if (isCorrect) {
    console.log('  Correct!\n');
    return 1;
  }
  console.log(`  Not quite - the answer is ${expected}.\n`);
  return 0;
}
