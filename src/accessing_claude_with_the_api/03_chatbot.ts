import "dotenv/config";
import * as readline from "readline/promises";
import {
  addAssistantMessage,
  addUserMessage,
  chat,
  type Message,
} from "./02_multi_turn_conversations.ts";

const messages: Message[] = [];

const chatBot = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Chat with Claude. Type 'exit' to quit.\n");

  while (true) {
    // Prompt user to enter some input
    const input = await rl.question("You: ");

    if (input.toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close(); // Clean up the prompt interface
      break; // Exit the loop
    }

    // Add it to a list of messages
    addUserMessage(messages, input);

    // Call the Claude API
    const response = await chat(messages);

    // Add generated text to the messages list
    addAssistantMessage(messages, response);

    // Print the generated text
    console.log(`\nClaude: ${response}\n`);
  }
};

chatBot();
