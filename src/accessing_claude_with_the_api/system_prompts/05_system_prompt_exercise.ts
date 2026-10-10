import "dotenv/config";
import {
  addUserMessage,
  chat,
  type Message,
} from "../02_multi_turn_conversations.ts";

const codeGenerator = async () => {
  const messages: Message[] = [];

  addUserMessage(
    messages,
    "Write a TypeScript function that checks a string for duplicate characters.",
  );
  const response = await chat(messages, {
    systemPrompt:
      "You are a seasoned TypeScript engineer with 10 years of experience who always writes highly efficient, optimised, and concise code.",
  });
  console.log(response);
};

codeGenerator();
