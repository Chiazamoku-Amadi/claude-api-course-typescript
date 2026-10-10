import { addUserMessage, chat, type Message } from "../index.ts";
import { PromptEvaluator } from "./prompt_evaluator.ts";
import type { PromptInputsSpec } from "./types.ts";

// Create an instance of PromptEvaluator
// Increase maxConcurrentTasks for greater concurrency, but beware of rate limit errors!
const evaluator = new PromptEvaluator({ maxConcurrentTasks: 1 });

const dataset = await evaluator.generateDataset({
  taskDescription:
    "Extract topics out of a passage of text from a scholarly article into a JSON array of strings", // Describe the purpose or goal of the prompt you're trying to test
  promptInputsSpec: {
    content:
      "One paragraph of text from a scholarly journey written in English",
  }, // Describe the different inputs that your prompt requires
  numCases: 3, // Number of test cases to generate (recommend keeping this low if you're getting rate limit errors)
  outputFile: "src/prompt_engineering/06_prompting_exercise/dataset.json", // Where to write the generated dataset
});

// Define and run the prompt you want to evaluate, returning the raw model output
// This function is executed once for each test case
const runPrompt = (promptInputs: PromptInputsSpec) => {
  const prompt = `Extract key topics discussed in a passage of text from a scholarly journal into a JSON array of strings containing only topic names.
  
    <text>
    - Content: ${promptInputs["content"]} 
    </text>

    Follow these steps:
    1. Closely examine the provided text.
    2. Identify each topic mentioned.
    3. Add each topic to a JSON array.
    4. Respond with a JSON array. Do not provide any other text or commentary.
    `;

  let messages: Message[] = [];
  addUserMessage(messages, prompt);

  return chat(messages);
};

const results = await evaluator.runEvaluation({
  runPromptFunction: runPrompt,
  datasetFile: "src/prompt_engineering/06_prompting_exercise/dataset.json",
  extraCriteria: `
  - Contains a JSON array of strings, containing each topic mentioned in the article.
  - The strings should contain only a topic without any extra commentary.
  - Response should contain the JSON array and nothing else.
  `,
});

// Console Logs
// Generated 1/3 test cases
// Generated 2/3 test cases
// Generated 3/3 test cases
// Graded 1/3 test cases
// Graded 2/3 test cases
// Graded 3/3 test cases
// Average score: 9
