import "dotenv/config";
import {
  addAssistantMessage,
  addUserMessage,
  chat,
  type Message,
} from "../02_multi_turn_conversations.ts";

const structuredDataExercise = async () => {
  const messages: Message[] = [];

  const prompt =
    "Generate three different sample AWS CLI commands. Each should be very short.";

  addUserMessage(messages, prompt);
  addAssistantMessage(
    messages,
    "Here are all three commands in a single block, without any comments: ```bash",
  );

  const response = await chat(messages, { stopSequences: ["```"] });
  console.log(response);
};

structuredDataExercise();
