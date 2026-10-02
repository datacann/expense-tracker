import { toMinorUnits, formatCurrency } from './money';

function test() {
  const cases = [
    { input: '120', expected: 12000 },
    { input: '120,50', expected: 12050 },
    { input: '120.50', expected: 12050 },
  ];

  console.log('Testing toMinorUnits...');
  cases.forEach(({ input, expected }) => {
    const result = toMinorUnits(input);
    if (result !== expected) {
      throw new Error(`Failed for ${input}: expected ${expected}, got ${result}`);
    }
    console.log(`Passed: ${input} -> ${result}`);
  });

  console.log('Testing formatCurrency...');
  const formatted = formatCurrency(12050);
  console.log(`Formatted 12050: ${formatted}`);

  console.log('Test passed successfully.');
}

try {
  test();
} catch (e) {
  console.error(e);
  process.exit(1);
}
