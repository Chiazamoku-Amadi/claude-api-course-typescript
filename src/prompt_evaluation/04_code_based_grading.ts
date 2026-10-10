import type { TestCase } from "./02_running_the_eval.ts";

const validateJson = (text: string): number => {
  try {
    JSON.parse(text.trim());
    return 10;
  } catch {
    return 0;
  }
};

// There's no built-in JS AST (Abstract Syntax Tree) parser
// new Function() attempts to compile the string as JS and throws a SyntaxError if it's invalid
// Note: Never call the result; just constructing it is enough to validate syntax
// Never use it on untrusted user input in a production app, as it can execute arbitrary code
const validateJavaScript = (text: string): number => {
  try {
    new Function(text.trim());
    return 10;
  } catch {
    return 0;
  }
};

const validateRegex = (text: string): number => {
  try {
    new RegExp(text.trim());
    return 10;
  } catch {
    return 0;
  }
};

export const gradeSyntax = (testCase: TestCase, response: string) => {
  const format = testCase["format"];

  if (format === "json") {
    return validateJson(response);
  } else if (format === "javaScript") {
    return validateJavaScript(response);
  } else {
    return validateRegex(response);
  }
};
