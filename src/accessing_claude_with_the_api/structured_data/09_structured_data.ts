import "dotenv/config";
import {
  addAssistantMessage,
  addUserMessage,
  chat,
  type Message,
} from "../02_multi_turn_conversations.ts";

const structuredData = async () => {
  const messages: Message[] = [];

  addUserMessage(messages, "Generate a very short event bridge rule as json");
  addAssistantMessage(messages, "```json");

  const response = await chat(messages, { stopSequences: ["```"] });
  console.log(response);
};

structuredData();
