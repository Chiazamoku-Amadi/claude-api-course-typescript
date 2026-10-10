import { addUserMessage, chat, type Message } from "../index.ts";
import { PromptEvaluator } from "./prompt_evaluator.ts";
import type { PromptInputsSpec } from "./types.ts";

// Create an instance of PromptEvaluator
// Increase maxConcurrentTasks for greater concurrency, but beware of rate limit errors!
const evaluator = new PromptEvaluator({ maxConcurrentTasks: 1 });

const dataset = await evaluator.generateDataset({
  taskDescription:
    "Write a compact, concise 1 day meal plan for a single athlete", // Describe the purpose or goal of the prompt you're trying to test
  promptInputsSpec: {
    height: "Athlete's height in cm",
    weight: "Athlete's weight in kg",
    goal: "Goal of the athlete",
    restrictions: "Dietary restrictions of the athlete",
  }, // Describe the different inputs that your prompt requires
  numCases: 3, // Number of test cases to generate (recommend keeping this low if you're getting rate limit errors)
  outputFile: "src/prompt_engineering/01_prompting/dataset.json", // Where to write the generated dataset
});

// Define and run the prompt you want to evaluate, returning the raw model output
// This function is executed once for each test case
const runPrompt = (promptInputs: PromptInputsSpec) => {
  const prompt = `What should this person eat?
  
    - Height: ${promptInputs["height"]}
    - Weight: ${promptInputs["weight"]}
    - Goal: ${promptInputs["goal"]}
    - Dietary restrictions: ${promptInputs["restrictions"]}
    `;

  let messages: Message[] = [];
  addUserMessage(messages, prompt);

  return chat(messages);
};

const results = await evaluator.runEvaluation({
  runPromptFunction: runPrompt,
  datasetFile: "src/prompt_engineering/01_prompting/dataset.json",
  extraCriteria: `
  The output should contain:
  - Daily caloric total
  - Macronutrient breakdown
  - Meals with exact foods, portions, and timing
  `,
});

// Console Logs
// Generated 1/3 test cases
// Generated 2/3 test cases
// Generated 3/3 test cases
// Graded 1/3 test cases
// Graded 2/3 test cases
// Graded 3/3 test cases
// Average score: 2.6666666666666665
