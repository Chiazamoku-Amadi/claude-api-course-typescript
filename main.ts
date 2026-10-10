const greeting = () => {
  console.log("Hello there");
};

/**
 * Calculates pi to the 4th digit using the Bailey–Borwein–Plouffe formula
 * @returns {number} Pi approximation to the 4th decimal place (3.1416)
 */
const calculatePi = (): number => {
  // Using the Machin-like formula for fast pi calculation
  // pi/4 = 4 * arctan(1/5) - arctan(1/239)
  
  const arctan = (x: number, numTerms: number = 50): number => {
    let result = 0;
    let power = x;
    
    for (let n = 0; n < numTerms; n++) {
      const sign = n % 2 === 0 ? 1 : -1;
      result += sign * power / (2 * n + 1);
      power *= x * x;
    }
    
    return result;
  };
  
  // Calculate pi using Machin's formula
  const pi = 4 * (4 * arctan(1/5, 100) - arctan(1/239, 100));
  
  // Round to 4 decimal places
  return Math.round(pi * 10000) / 10000;
};

export { greeting, calculatePi };
