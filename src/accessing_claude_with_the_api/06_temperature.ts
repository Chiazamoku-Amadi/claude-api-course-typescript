import "dotenv/config";
import {
  addUserMessage,
  chat,
  type Message,
} from "./02_multi_turn_conversations.ts";

const temperature = async () => {
  const messages: Message[] = [];

  addUserMessage(messages, "Generate a one sentence novie idea");

  const response = await chat(messages, { temperature: 1 });

  console.log(response);
};

temperature();
