import type { TestCase } from "./02_running_the_eval.ts";
import {
  addAssistantMessage,
  addUserMessage,
  chat,
  type Message,
} from "./index.ts";

export const gradeByModel = async (testCase: TestCase, output: string) => {
  // Create evaluation prompt
  const evalPrompt = `You are an expert code reviewer. Evaluate this AI-generated solution

    <task>
    Original task:
    Task: ${testCase.task}
    </task>

    <solution>
    Solution to evaluate:
    ${output}
    </solution>

    <criteria>
    Criteria you should use to evaluate the solution:
    ${testCase.solutionCriteria}
    </criteria>

    Provide your evaluation as a structured JSON object with:
    - "strengths": An array of 1-3 key strengths
    - "weaknesses": An array of 1-3 key areas for improvement  
    - "reasoning": A concise explanation of your assessment
    - "score": A number between 1-10
    `;

  let messages: Message[] = [];

  addUserMessage(messages, evalPrompt);
  addAssistantMessage(messages, "```json");
  let response = await chat(messages, {
    stopSequences: ["```"],
  });

  return JSON.parse(response);
};
