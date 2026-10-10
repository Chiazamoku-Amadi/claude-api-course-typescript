import Anthropic from "@anthropic-ai/sdk";

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
    max_tokens: 1000,
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
