import Anthropic from "@anthropic-ai/sdk";

// One formatter function per supported strftime token
const strftimeTokens: Record<string, (d: Date) => string> = {
  "%Y": (d) => String(d.getFullYear()),
  "%m": (d) => String(d.getMonth() + 1).padStart(2, "0"), // +1: JS months are 0-indexed
  "%d": (d) => String(d.getDate()).padStart(2, "0"),
  "%H": (d) => String(d.getHours()).padStart(2, "0"),
  "%M": (d) => String(d.getMinutes()).padStart(2, "0"),
  "%S": (d) => String(d.getSeconds()).padStart(2, "0"),
};

// Formats the current date/time using strftime-style tokens (%Y, %m, etc.)
const getCurrentDateTime = (
  dateFormat: string = "%Y-%m-%d %H:%M:%S",
): string => {
  if (!dateFormat) {
    throw new Error("dateFormat cannot be empty");
  }

  const now = new Date();

  // Replace every known token in dateFormat with its formatted value.
  // Any characters that aren't a recognized token are left untouched
  return Object.entries(strftimeTokens).reduce(
    (result, [token, formatter]) => result.replaceAll(token, formatter(now)),
    dateFormat,
  );
};

const getCurrentDateTimeSchema: Anthropic.Tool = {
  name: "get_current_datetime",
  description:
    "Get the current date and time, formatted as a string using strftime-style tokens. Use this whenever the user asks what the current date, time, or day it is, or when a response needs to reference 'now' (e.g. timestamping a note, calculating a relative date, or answering 'what time is it'). Do not use this to parse, validate, or reformat a date the user provides — it only returns the current system time, never an arbitrary date. Only six format tokens are supported: %Y (4-digit year), %m (2-digit month, 01-12), %d (2-digit day, 01-31), %H (2-digit hour, 00-23), %M (2-digit minute, 00-59), and %S (2-digit second, 00-59). Any other characters in the format string, including unsupported tokens like %A or %B, are returned as-is rather than substituted. The returned time is in the server's local timezone, not UTC and not the user's timezone — if timezone matters, ask the user to clarify or account for the offset separately.",
  input_schema: {
    type: "object",
    properties: {
      dateFormat: {
        type: "string",
        description:
          "The output format, using strftime-style tokens (%Y, %m, %d, %H, %M, %S) mixed with any literal separators. For example '%Y-%m-%d' returns just the date (e.g. '2026-09-15'), and '%H:%M' returns just the time (e.g. '14:30'). Must not be an empty string. Defaults to '%Y-%m-%d %H:%M:%S' if omitted.",
        default: "%Y-%m-%d %H:%M:%S",
      },
    },
  },
  input_examples: [
    {},
    { dateFormat: "%Y-%m-%d" },
    { dateFormat: "%H:%M" },
    { dateFormat: "%d/%m/%Y %H:%M:%S" },
  ],
};

export { getCurrentDateTime, getCurrentDateTimeSchema };
