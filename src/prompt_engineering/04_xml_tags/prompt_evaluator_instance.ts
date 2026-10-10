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
  outputFile: "src/prompt_engineering/04_xml_tags/dataset.json", // Where to write the generated dataset
});

// Define and run the prompt you want to evaluate, returning the raw model output
// This function is executed once for each test case
const runPrompt = (promptInputs: PromptInputsSpec) => {
  const prompt = `Generate a one-day meal plan for an athlete that meets their dietary restrictions.

    <athlete_information>
    - Height: ${promptInputs["height"]}
    - Weight: ${promptInputs["weight"]}
    - Goal: ${promptInputs["goal"]}
    - Dietary restrictions: ${promptInputs["restrictions"]}
    </athlete_information>

    Guidelines:
    1. Include accurate daily calorie amount
    2. Show protein, fat, and carb amounts
    3. Specify when to eat each meal
    4. Use only foods that fit restrictions
    5. List all portion sizes in grams
    6. Keep budget-friendly if mentioned
  `;

  let messages: Message[] = [];
  addUserMessage(messages, prompt);

  return chat(messages);
};

const results = await evaluator.runEvaluation({
  runPromptFunction: runPrompt,
  datasetFile: "src/prompt_engineering/04_xml_tags/dataset.json",
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
// Average score: 7.333333333333333
