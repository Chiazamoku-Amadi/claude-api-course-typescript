import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { fileURLToPath } from "url";

const client = new Anthropic();

export type Message = {
  role: "user" | "assistant";
  content: string;
};

// Helper Functions
// Adds user message to messages
export const addUserMessage = (messages: Message[], text: string) => {
  const userMessage: Message = {
    role: "user",
    content: text,
  };

  messages.push(userMessage);
};

// Takes Claude's response and adds it to messages as an assistant message
export const addAssistantMessage = (messages: Message[], text: string) => {
  const assistantMessage: Message = {
    role: "assistant",
    content: text,
  };

  messages.push(assistantMessage);
};

// Sends the entire conversation history to Claude
export const chat = async (
  messages: Message[],
  options?: {
    systemPrompt?: string;
    temperature?: number;
    stopSequences?: string[];
  },
) => {
  let message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 200,
    messages: messages,
    ...(options?.systemPrompt && { system: options?.systemPrompt }),
    ...(options?.temperature !== undefined && {
      temperature: options?.temperature,
    }),
    ...(options?.stopSequences && {
      stop_sequences: options?.stopSequences,
    }),
  });

  const block = message.content[0];

  if (block?.type === "text") {
    return block.text;
  }

  return "";
};

// process.argv[1] is the path of the file Node was told to run directly (e.g. npx tsx multi_turn_conversations.ts)
// import.meta.url is the URL of the current file (e.g. npx tsx multi_turn_conversations.ts or npx tsx chatbot.ts)
// fileURLToPath() converts that URL to a plain file path so the two can be compared
// When you run multi_turn_conversations.ts directly, both values point to the same file → isMain is true → execution() runs.
// When chatbot.ts imports from multi_turn_conversations.ts, process.argv[1] points to the chatbot file instead → isMain is false → execution() is skipped entirely.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  // Actual Execution
  // Initialise messages
  let messages: Message[] = [];

  const execution = async () => {
    // Add the initial user question
    addUserMessage(messages, "Hi Claude!");

    // Get Claude's response
    let response = await chat(messages);

    // Print Claude's response
    console.log(response);

    // Add Claude's response to the conversation history
    addAssistantMessage(messages, response);

    // Add a follow up question
    addUserMessage(messages, "What is today's date?");

    // Get the follow-up response with full context
    let followUpResponse = await chat(messages);

    // Print the follow-up response
    console.log(followUpResponse);
  };

  execution();
}
