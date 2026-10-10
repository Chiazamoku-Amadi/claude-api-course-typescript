import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import {
  addUserMessage,
  type Message,
} from "../02_multi_turn_conversations.ts";

const client = new Anthropic();

const messages2: Message[] = [];

const streamResponse2 = async () => {
  addUserMessage(
    messages2,
    "Write a one sentence description of a fake database",
  );

  // client.messages.stream() opens a streaming connection to the API.
  // Instead of waiting for the full response before doing anything, Claude sends the response back in small chunks (tokens) as it generates them.
  // This returns a stream object, not a response — think of it as a live pipe between your code and Claude, not a one-time request/response.
  const stream2 = client.messages
    .stream({
      model: "claude-haiku-4-5",
      max_tokens: 1000,
      messages: messages2,
    })
    // .on() is an event listener. It says "every time a new text chunk arrives through the pipe, run this callback immediately with that chunk."
    // The "text" event fires once per chunk, not once for the full response. So if Claude's reply is 10 tokens long, this fires 10 times.
    // This is what makes streaming feel like Claude is "typing" in real time.
    .on("text", (text) => console.log(text)); // Text stream

  // By the time we reach this line, the stream is still running (or just finished).
  // finalMessage() waits for ALL chunks to arrive and then assembles them into the same complete Message object you'd get from client.messages.create().
  // This is useful when you need the full structured response e.g. to store in a database, check stop_reason, or read token usage.
  // The await here is what actually pauses execution until streaming is complete.
  const response2 = await stream2.finalMessage(); // Final message object
  console.log(response2);
};

streamResponse2();
