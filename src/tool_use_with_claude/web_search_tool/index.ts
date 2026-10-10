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
import { webSearchSchema } from "./webSearch.ts";

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
  message: string | Anthropic.ContentBlockParam[],
) => {
  const assistantMessage: Message = {
    role: "assistant",
    content: message,
  };

  messages.push(assistantMessage);
};

// Sends the entire conversation history to Claude
export const chat = async (
  messages: Message[],
  options?: {
    systemPrompt?: string;
    temperature?: number;
    stopSequences?: string[];
    tools?: Anthropic.ToolUnion[];
  },
) => {
  return await client.messages.create({
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
  });
};

// Concatenates just the text parts of Claude's response into one string (ignores tool_use blocks, images, etc. — useful for printing/logging)
const textFromMessage = (message: Anthropic.Message): string => {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
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
  }

  // "toolName" didn't match any known tool
  throw new Error(`Unknown tool: ${toolName}`);
};

// Runs every tool_use block in Claude's response and turns each into a tool_result block to send back.
// Errors are caught per-tool so one bad call doesn't stop the others, and are reported to Claude via is_error.
const runTools = (
  message: Anthropic.Message,
): Anthropic.ToolResultBlockParam[] => {
  const toolRequests = message.content.filter(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );

  let toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];

  for (const toolRequest of toolRequests) {
    try {
      let toolOutput = runTool(toolRequest.name, toolRequest.input);

      toolResultBlocks.push({
        type: "tool_result",
        tool_use_id: toolRequest.id,
        content: toolOutput,
        is_error: false,
      });
    } catch (error) {
      toolResultBlocks.push({
        type: "tool_result",
        tool_use_id: toolRequest.id,
        content: String(error),
        is_error: true,
      });
    }
  }

  return toolResultBlocks;
};

// The main agent loop: send messages -> if Claude wants a tool, run it and send the result back -> repeat until Claude replies without using a tool.
const runConversation = async (messages: Message[]) => {
  while (true) {
    const response = await chat(messages, {
      tools: [
        getCurrentDateTimeSchema,
        addDurationToDateTimeSchema,
        setReminderSchema,
        webSearchSchema,
      ],
    });

    addAssistantMessage(messages, response.content);

    console.log(textFromMessage(response));

    // No tool_use means Claude gave a final answer — stop looping
    if (response.stop_reason !== "tool_use") break;

    const toolResults = runTools(response);

    addUserMessage(messages, toolResults);
  }

  console.log(JSON.stringify(messages, null, 2));
  return messages;
};

let messages: Message[] = [];
addUserMessage(messages, "What's the best exercise for gaining leg muscle?");

runConversation(messages);
