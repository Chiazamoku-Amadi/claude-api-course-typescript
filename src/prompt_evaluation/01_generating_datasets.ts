import { writeFile } from "fs/promises";
import {
  addAssistantMessage,
  addUserMessage,
  chat,
  type Message,
} from "./index.ts";

const generateDataset = async () => {
  const prompt = `Generate an evaluation dataset for a prompt evaluation. The dataset will be used to evaluate prompts that generate JavaScript, JSON, or Regex specifically for AWS-related tasks. Generate an array of JSON objects, each representing tasks that requires JavaScript, JSON, or a Regex to complete.
        
        Example output:
        \`\`\`json
        [
            {
                "task": "Description of task",
                "format": "json" or "javaScript" or "regex",
                "solutionCriteria": "Key criteria for evaluating the solution"
            },
            ... additional 
        ]
        \`\`\`

        * Focus on tasks that can be solved by writing a single JavaScript function, a single JSON object, or a single regex
        * Focus on tasks that do not require writing much code
        
        Please generate 3 objects.
  `;

  let messages: Message[] = [];
  addUserMessage(messages, prompt);
  addAssistantMessage(messages, "```json");

  const response = await chat(messages, {
    stopSequences: ["```"],
  });
  console.log(response);

  return response;
};

// Call generateDataset() and wait for the full response string from Claude
const dataset = await generateDataset();

// Write the dataset to a file:
// - JSON.parse(dataset) converts Claude's raw JSON string into a JS object
// - JSON.stringify(..., null, 2) converts it back to a formatted JSON string with 2-space indentation
// - writeFile() writes that string to dataset.json in the prompt_evaluation folder root, encoded as utf-8
// JSON.stringify = object → string
// JSON.parse = string → object
await writeFile(
  "src/prompt_evaluation/dataset.json",
  //   dataset, // You can pass "dataset" directly
  JSON.stringify(JSON.parse(dataset), null, 2), // This is purely so you can decide how you want the file to be formatted
  "utf-8",
);
