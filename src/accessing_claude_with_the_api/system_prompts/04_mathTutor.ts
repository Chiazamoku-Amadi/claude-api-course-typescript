import "dotenv/config";
import * as readline from "readline/promises";
import {
  addAssistantMessage,
  addUserMessage,
  chat,
  type Message,
} from "../02_multi_turn_conversations.ts";

const messages: Message[] = [];
const systemPrompt = `
You are a patient math tutor.
Do not directly answer a student's questions.
Guide them to a solution step by step.
`;

const mathTutor = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Chat with Claude. Type 'exit' to quit.\n");

  while (true) {
    const input: string = await rl.question("You: ");

    if (input.toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
      break;
    }

    addUserMessage(messages, input);

    // const response = await chat(messages); // Without system prompt
    const response = await chat(messages, { systemPrompt }); // With system prompt

    addAssistantMessage(messages, response);

    console.log(`Claude: ${response}\n`);
  }
};

mathTutor();
