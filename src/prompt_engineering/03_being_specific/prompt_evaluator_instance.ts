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
  outputFile: "src/prompt_engineering/03_being_specific/dataset.json", // Where to write the generated dataset
});

// Define and run the prompt you want to evaluate, returning the raw model output
// This function is executed once for each test case
const runPrompt = (promptInputs: PromptInputsSpec) => {
  // Guidelines Approach
  // When to use this:
  //    - You should include quality guidelines in almost every prompt you write. They're your safety net for getting consistent, useful results.

  const prompt = `Generate a one-day meal plan for an athlete that meets their dietary restrictions.

    - Height: ${promptInputs["height"]}
    - Weight: ${promptInputs["weight"]}
    - Goal: ${promptInputs["goal"]}
    - Dietary restrictions: ${promptInputs["restrictions"]}

    Guidelines:
    1. Include accurate daily calorie amount
    2. Show protein, fat, and carb amounts
    3. Specify when to eat each meal
    4. Use only foods that fit restrictions
    5. List all portion sizes in grams
    6. Keep budget-friendly if mentioned
  `;

  // Steps Approach
  // Use Process Steps For Complex Problems
  // Add step-by-step instructions when you're dealing with:
  //    - Troubleshooting complex problems
  //    - Decision-making scenarios
  //    - Critical thinking tasks
  //    - Any situation where you want Claude to consider multiple angles

  // const prompt = `Generate a one-day meal plan for an athlete that meets their dietary restrictions.

  //   - Height: ${promptInputs["height"]}
  //   - Weight: ${promptInputs["weight"]}
  //   - Goal: ${promptInputs["goal"]}
  //   - Dietary restrictions: ${promptInputs["restrictions"]}

  //   Follow these steps::
  //   1. Calculate daily calories needed
  //   2. Figure out protein, fat, carb amounts
  //   3. Plan meal timing around workouts
  //   4. Choose foods that fit restrictions
  //   5. Set portion sizes in grams
  //   6. Adjust for budget if needed
  // `;

  let messages: Message[] = [];
  addUserMessage(messages, prompt);

  return chat(messages);
};

const results = await evaluator.runEvaluation({
  runPromptFunction: runPrompt,
  datasetFile: "src/prompt_engineering/03_being_specific/dataset.json",
  extraCriteria: `
  The output should contain:
  - Daily caloric total
  - Macronutrient breakdown
  - Meals with exact foods, portions, and timing
  `,
});

// Console Logs
// Guidelines Approach
// Generated 1/3 test cases
// Generated 2/3 test cases
// Generated 3/3 test cases
// Graded 1/3 test cases
// Graded 2/3 test cases
// Graded 3/3 test cases
// Average score: 7.666666666666667

// Steps Approach
// Generated 1/3 test cases
// Generated 2/3 test cases
// Generated 3/3 test cases
// Graded 1/3 test cases
// Graded 2/3 test cases
// Graded 3/3 test cases
// Average score: 5.333333333333333
