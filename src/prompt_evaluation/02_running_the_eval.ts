import { readFile } from "fs/promises";
import {
  addAssistantMessage,
  addUserMessage,
  chat,
  type Message,
} from "./index.ts";
import { gradeByModel } from "./03_model_based_grading.ts";
import { gradeSyntax } from "./04_code_based_grading.ts";

export type TestCase = {
  task: string;
  format: "json" | "javaScript" | "regex";
  solutionCriteria: string;
};

const getMean = (data: number[]) => {
  return data.reduce((a, b) => a + b, 0) / data.length;
};

const runPrompt = async (testCase: TestCase) => {
  // Merges the prompt and test case input, then returns the result
  const prompt = `Please solve the following task: ${testCase["task"]}
  
  * Respond only with javaScript, JSON, or a plain Regex
  * Do not add any comments or commentary or explanation
  `;

  let messages: Message[] = [];
  addUserMessage(messages, prompt);
  addAssistantMessage(messages, "```code");

  const response = await chat(messages, { stopSequences: ["```"] });

  return response;
};

const runTestCase = async (testCase: TestCase) => {
  // Calls runPrompt(), then grades the result
  const output = await runPrompt(testCase);

  // Grading
  const modelGrade = await gradeByModel(testCase, output);
  const modelScore = modelGrade["score"];
  const reasoning = modelGrade["reasoning"];

  const syntaxScore = gradeSyntax(testCase, output);

  const score = (modelScore + syntaxScore) / 2;

  return {
    output: output,
    testCase: testCase,
    score: score,
    reasoning: reasoning,
  };
};

const runEval = async (dataset: TestCase[]) => {
  // Loads the dataset and calls runTestCase with each case
  let results = [];

  for (const testCase of dataset) {
    let result = await runTestCase(testCase);
    results.push(result);
  }

  const averageScore = getMean(results.map((result) => result.score));
  console.log(`Average score: ${averageScore}`);

  return results;
};

// Read dataset.json from disk as a utf-8 string and parse it into a JS object
// JSON.parse = string → object
const dataset = JSON.parse(
  await readFile("src/prompt_evaluation/dataset.json", "utf-8"),
);

const results = await runEval(dataset);

console.log(JSON.stringify(results, null, 2));
