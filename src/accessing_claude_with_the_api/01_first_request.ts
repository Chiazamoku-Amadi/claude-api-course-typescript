import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const main = async () => {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 100,
    messages: [{ role: "user", content: "Hi Claude." }],
  });

  const block = response.content[0];

  if (block?.type === "text") {
    console.log(block.text);
  }
};

main();
