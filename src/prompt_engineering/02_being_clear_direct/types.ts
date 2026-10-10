export type PromptInputsSpec = Record<string, string>;

export type GeneratedTestCase = {
  promptInputs: Record<string, string>;
  solutionCriteria: string[];
  taskDescription: string;
  scenario: string;
};

export type ModelGrade = {
  strengths: string[];
  weaknesses: string[];
  reasoning: string;
  score: number;
};

export type EvalResult = {
  output: string;
  testCase: GeneratedTestCase;
  score: number;
  reasoning: string;
};

export type RunPromptFunction = (
  promptInputs: Record<string, string>,
) => Promise<string>;
