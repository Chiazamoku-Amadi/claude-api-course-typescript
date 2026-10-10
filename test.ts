import { calculatePi, greeting } from './main';

/**
 * Test suite for the calculatePi function
 */

console.log('=== Testing calculatePi() function ===\n');

// Test 1: Basic calculation
const result = calculatePi();
console.log(`Test 1 - Basic Calculation:`);
console.log(`  Result: ${result}`);
console.log(`  Expected: 3.1416`);
console.log(`  Pass: ${result === 3.1416}\n`);

// Test 2: Verify it's a number
console.log(`Test 2 - Type Check:`);
console.log(`  Type: ${typeof result}`);
console.log(`  Pass: ${typeof result === 'number'}\n`);

// Test 3: Verify it's in the correct range
console.log(`Test 3 - Range Check:`);
console.log(`  Value is between 3.1 and 3.2: ${result > 3.1 && result < 3.2}`);
console.log(`  Pass: ${result > 3.1 && result < 3.2}\n`);

// Test 4: Verify decimal places
console.log(`Test 4 - Decimal Places Check:`);
const decimalPlaces = result.toString().split('.')[1]?.length || 0;
console.log(`  Decimal places: ${decimalPlaces}`);
console.log(`  Pass: ${decimalPlaces <= 4}\n`);

// Test 5: Compare with Math.PI
console.log(`Test 5 - Comparison with Math.PI:`);
console.log(`  calculatePi(): ${result}`);
console.log(`  Math.PI: ${Math.PI}`);
console.log(`  Math.PI rounded to 4 decimals: ${Math.round(Math.PI * 10000) / 10000}`);
console.log(`  Pass: ${result === Math.round(Math.PI * 10000) / 10000}\n`);

// Test 6: Call greeting function to ensure exports work
console.log(`Test 6 - Export Test:`);
console.log(`  Calling greeting function...`);
greeting();

console.log('\n=== All tests completed ===');
