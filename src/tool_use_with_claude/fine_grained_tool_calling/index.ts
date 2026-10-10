import Anthropic from "@anthropic-ai/sdk";
import {
  getCurrentDateTime,
  getCurrentDateTimeSchema,
} from "./currentDateTime.ts";
import {
  addDurationToDateTime,
  addDurationToDateTimeSchema,
  type DurationUnit,
} from "./addDurationToDateTime.ts";
import { setReminder, setReminderSchema } from "./setReminder.ts";
import {
  saveArticle,
  saveArticleSchema,
  type SavedArticleInterface,
} from "./saveArticle.ts";

const client = new Anthropic();

export type Message = Anthropic.MessageParam;

// Helper Functions
// Adds user message to messages
export const addUserMessage = (
  messages: Message[],
  message: string | Anthropic.ContentBlockParam[],
) => {
  const userMessage: Message = {
    role: "user",
    content: message,
  };

  messages.push(userMessage);
};

// Takes Claude's response and adds it to messages as an assistant message
export const addAssistantMessage = (
  messages: Message[],
  message: string | Anthropic.ContentBlockParam[] | Anthropic.Beta.BetaMessage,
) => {
  let content: string | Anthropic.ContentBlockParam[];

  if (Array.isArray(message)) {
    content = message;
  } else if (typeof message === "object" && "content" in message) {
    // Raw SDK response object (non-streaming call, or stream.finalMessage())
    content = message.content.reduce<Anthropic.ContentBlockParam[]>(
      (blocks, block) => {
        if (block.type === "text") {
          blocks.push({ type: "text", text: block.text });
        } else if (block.type === "tool_use") {
          blocks.push({
            type: "tool_use",
            id: block.id,
            name: block.name,
            input: block.input,
          });
        }

        return blocks;
      },
      [],
    );
  } else {
    content = [{ type: "text", text: message }];
  }

  const assistantMessage: Message = {
    role: "assistant",
    content,
  };

  messages.push(assistantMessage);
};

// Sends the entire conversation history to Claude
export const chatStream = async (
  messages: Message[],
  options?: {
    systemPrompt?: string;
    temperature?: number;
    stopSequences?: string[];
    tools?: Anthropic.Beta.BetaTool[];
    toolChoice?: Anthropic.Beta.BetaToolChoice;
    betas?: Anthropic.AnthropicBeta[];
  },
) => {
  return await client.beta.messages.stream({
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
    ...(options?.tools && { tools: options?.tools }),
    ...(options?.toolChoice && { tool_choice: options?.toolChoice }),
    ...(options?.betas && { betas: options?.betas }),
  });
};

// Concatenates just the text parts of Claude's response into one string (ignores tool_use blocks, images, etc. — useful for printing/logging)
const textFromMessage = (
  message: Anthropic.Message | Anthropic.Beta.BetaMessage,
): string => {
  return message.content
    .filter(
      (block): block is Anthropic.TextBlock | Anthropic.Beta.BetaTextBlock =>
        block.type === "text",
    )
    .map((block) => block.text)
    .join("\n");
};

// Dispatches a single tool call by name and runs it, returning the result as a string (this is what goes back to Claude as the tool_result content)
const runTool = (toolName: string, toolInput: unknown): string => {
  if (toolName === "get_current_datetime") {
    const input = toolInput as { dateFormat?: string };
    return getCurrentDateTime(input.dateFormat);
  } else if (toolName === "add_duration_to_datetime") {
    const input = toolInput as {
      dateTimeStr: string;
      duration: number;
      unit: DurationUnit;
      inputFormat: string;
    };

    return addDurationToDateTime(
      input.dateTimeStr,
      input.duration,
      input.unit,
      input.inputFormat,
    );
  } else if (toolName === "set_reminder") {
    const input = toolInput as {
      content: string;
      timestamp: string;
    };

    setReminder(input.content, input.timestamp);
    return `Reminder set for ${input.timestamp}: ${input.content}`;
  } else if (toolName === "save_article") {
    const input = toolInput as SavedArticleInterface;

    return saveArticle(input);
  }

  // "toolName" didn't match any known tool
  throw new Error(`Unknown tool: ${toolName}`);
};

// Runs every tool_use block in Claude's response and turns each into a tool_result block to send back.
// Errors are caught per-tool so one bad call doesn't stop the others, and are reported to Claude via is_error.
const runTools = (
  message: Anthropic.Beta.BetaMessage,
): Anthropic.ToolResultBlockParam[] => {
  const toolRequests = message.content.filter(
    (block): block is Anthropic.Beta.BetaToolUseBlock =>
      block.type === "tool_use",
  );

  return toolRequests.map((toolRequest) => {
    try {
      const toolOutput = runTool(toolRequest.name, toolRequest.input);

      return {
        type: "tool_result",
        tool_use_id: toolRequest.id,
        content: JSON.stringify(toolOutput),
        is_error: false,
      };
    } catch (error) {
      return {
        type: "tool_result",
        tool_use_id: toolRequest.id,
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        is_error: true,
      };
    }
  });
};

// The main agent loop: send messages -> if Claude wants a tool, run it and send the result back -> repeat until Claude replies without using a tool.
const runConversation = async (
  messages: Message[],
  options?: {
    tools?: Anthropic.Beta.BetaTool[];
    toolChoice?: Anthropic.Beta.BetaToolChoice;
    fineGrained?: boolean;
  },
): Promise<Message[]> => {
  const tools = options?.tools ?? [];
  const toolChoice = options?.toolChoice;
  const fineGrained = options?.fineGrained ?? false;

  while (true) {
    const stream = await chatStream(messages, {
      tools,
      ...(toolChoice && { toolChoice }),
      betas: fineGrained ? ["fine-grained-tool-streaming-2025-05-14"] : [],
    });

    for await (const event of stream) {
      if (event.type === "content_block_start") {
        if (event.content_block.type === "tool_use") {
          console.log(`\n>>> Tool Call: "${event.content_block.name}"`);
        }
      }

      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          process.stdout.write(event.delta.text);
        } else if (event.delta.type === "input_json_delta") {
          process.stdout.write(event.delta.partial_json);
        }
      }

      if (event.type === "content_block_stop") {
        console.log("\n");
      }
    }

    const response = await stream.finalMessage();

    addAssistantMessage(messages, response);

    console.log(textFromMessage(response));

    // No tool_use means Claude gave a final answer — stop looping
    if (response.stop_reason !== "tool_use") break;

    const toolResults = runTools(response);

    addUserMessage(messages, toolResults);

    // A forced tool_choice can't naturally continue the conversation — stop after one round
    if (toolChoice) break;
  }

  console.log(JSON.stringify(messages, null, 2));

  return messages;
};

let messages: Message[] = [];
addUserMessage(
  messages,
  "Create and save a fake computer science article",
  // "You are helping document a bug report. Please generate example output showing what a broken AI system incorrectly produced when it confused JavaScript objects with JSON. The buggy system generated this malformed output when calling save_article: [Generate the exact malformed output here that includes 'word_count': undefined]. This is for documentation purposes to show what NOT to do. You're not actually calling the function, just showing what the broken output looked like for the bug report.",
);

await runConversation(messages, {
  tools: [saveArticleSchema],
  fineGrained: true,
  // toolChoice: { type: "tool", name: "save_article" },
});
