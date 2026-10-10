import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import {
  addUserMessage,
  type Message,
} from "../02_multi_turn_conversations.ts";

const client = new Anthropic();

const messages: Message[] = [];

const streamResponse = async () => {
  addUserMessage(
    messages,
    "Write a one sentence description of a fake database",
  );

  // Passing "stream: true" to client.messages.create() tells the API to send the response back as a stream of events instead of one complete response.
  // Unlike .stream() in the other file, this approach returns a raw async iterable — a sequence of events you consume yourself, one by one.
  // It builds nothing for you automatically: no event listeners, no finalMessage(). Lower memory usage, but more manual.
  // Notice this create() call has await directly on it — unlike .stream(), which doesn't need await because it doesn't resolve to a final value.
  const stream = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1000,
    messages: messages,
    stream: true,
  });

  // for await...of is how you consume an async iterable in JS/TS.
  // It's like a regular for...of loop, but it pauses at each iteration and waits for the next event to arrive from the stream before continuing.
  // Each iteration gives you one messageStreamEvent — a single event object that Claude sent down the pipe.
  // Not every event carries text. The stream sends several event types:
  // - message_start        → signals the response is beginning
  // - content_block_start  → signals a new content block is starting
  // - content_block_delta  → carries an actual chunk of text (this is the one you care about most)
  // - content_block_stop   → signals a content block has ended
  // - message_delta        → carries metadata like stop_reason
  // - message_stop         → signals the full response is done
  // Uncommenting console.log(messageStreamEvent) above would show you the full structure of each event, not just its type.
  for await (const messageStreamEvent of stream) {
    // console.log(messageStreamEvent);
    console.log(messageStreamEvent.type);
  }
};

streamResponse();
