import type Anthropic from "@anthropic-ai/sdk";

type DurationUnit =
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | "weeks"
  | "months"
  | "years";

type FieldKey = "Y" | "m" | "d" | "H" | "M" | "S";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

// index 0 = Jan, ..., index 11 = Dec.
// Feb is hardcoded to 28 here. isLeapYear() + daysInMonth() below correct it to 29 when needed.
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// true if "year" has Feb 29 (standard leap year rule)
const isLeapYear = (year: number): boolean => {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
};

// Returns the number of days in a month
const daysInMonth = (month1Indexed: number, year: number): number => {
  if (month1Indexed === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  const days = DAYS_IN_MONTH[month1Indexed - 1];
  if (days === undefined) {
    throw new Error(`Invalid month: ${month1Indexed}`);
  }

  return days;
};

// Reading the text the user typed in
// Turns a date string + a strptime-style format (e.g. "%Y-%m-%d") into a real Date.
// Only supports the directives used by this tool: %Y %m %d %H %M %S.
const parseDateTime = (dateTimeStr: string, inputFormat: string): Date => {
  const fieldOrder: FieldKey[] = []; // remembers which capture group is which field, in order
  let patternStr = ""; // regex built from inputFormat, e.g. "(\d{4})-(\d{1,2})-(\d{1,2})"

  for (let i = 0; i < inputFormat.length; i++) {
    const char = inputFormat[i];
    if (char === undefined) continue;

    if (char === "%" && i + 1 < inputFormat.length) {
      const directive = inputFormat[i + 1];
      i++;

      switch (directive) {
        case "Y":
          fieldOrder.push("Y");
          patternStr += "(\\d{4})"; // means "4 digits go here"
          break;

        case "m":
        case "d":
        case "H":
        case "M":
        case "S":
          fieldOrder.push(directive as FieldKey);
          patternStr += "(\\d{1,2})"; // means "1 or 2 digits go here"
          break;

        default:
          throw new Error(`Unsupported format directive: %${directive}`);
      }
    } else {
      // literal separator character (e.g. "-", " ", ":") — escape it in case it's also a regex special character, then copy it through as-is
      patternStr += char?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }

  const match = dateTimeStr.match(new RegExp(`^${patternStr}$`)); // does dateTimeStr fit the pattern "patternStr" exactly? Returns an array
  if (!match) {
    throw new Error(
      `time data '${dateTimeStr}' does not match format '${inputFormat}'`,
    );
  }

  // defaults cover any field the format didn't include (e.g. no time -> midnight)
  const fields: Record<FieldKey, number> = {
    Y: 1970,
    m: 1,
    d: 1,
    H: 0,
    M: 0,
    S: 0,
  };

  // fill in the fields we actually parsed, using fieldOrder to match each capture group (match[1], match[2], ...) back to its field name
  fieldOrder.forEach((field, index) => {
    const value = match[index + 1];
    if (value === undefined) {
      throw new Error(`Missing capture group for field '${field}'`);
    }

    fields[field] = parseInt(value, 10);
  });

  // fields.m - 1: JS Date months are 0-indexed (Jan = 0), our parsed value is 1-indexed
  return new Date(
    fields.Y,
    fields.m - 1,
    fields.d,
    fields.H,
    fields.M,
    fields.S,
  );
};

// Turns a Date into "Weekday, Month DD, YYYY HH:MM:SS AM/PM"
const formatDateTime = (date: Date): string => {
  const dayName = DAY_NAMES[date.getDay()];
  const monthName = MONTH_NAMES[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  // convert 24h -> 12h, with 0 (midnight/noon) displayed as 12
  let hour12 = date.getHours() % 12;
  if (hour12 === 0) hour12 = 12;
  const hours = String(hour12).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const meridiem = date.getHours() < 12 ? "AM" : "PM";

  return `${dayName}, ${monthName} ${day}, ${year} ${hours}:${minutes}:${seconds} ${meridiem}`;
};

// Main entry point: parse -> add duration -> format back to a string
const addDurationToDateTime = (
  dateTimeStr: string,
  duration: number = 0,
  unit: DurationUnit = "days",
  inputFormat: string = "%Y-%m-%d",
): string => {
  const date = parseDateTime(dateTimeStr, inputFormat);
  let newDate: Date;

  // seconds/minutes/hours/days/weeks: fixed-length units, so just add milliseconds directly — no calendar math needed
  switch (unit) {
    case "seconds":
      newDate = new Date(date.getTime() + duration * 1000);
      break;

    case "minutes":
      newDate = new Date(date.getTime() + duration * 60 * 1000);
      break;

    case "hours":
      newDate = new Date(date.getTime() + duration * 60 * 60 * 1000);
      break;

    case "days":
      newDate = new Date(date.getTime() + duration * 24 * 60 * 60 * 1000);
      break;

    case "weeks":
      newDate = new Date(date.getTime() + duration * 7 * 24 * 60 * 60 * 1000);
      break;

    // months: variable-length unit, needs real calendar math
    case "months": {
      const month = date.getMonth() + 1 + duration; // 1-indexed month + duration
      let year = date.getFullYear() + Math.floor(month / 12); // floor division, handles negative duration correctly
      let newMonth = ((month % 12) + 12) % 12; // keeps result in 0-11 even when month is negative

      if (newMonth === 0) {
        newMonth = 12;
        year -= 1;
      }

      // clamp the day if the target month is shorter (e.g. Jan 31 + 1 month -> Feb 28/29, not Feb 31)
      const day = Math.min(date.getDate(), daysInMonth(newMonth, year));
      newDate = new Date(
        year,
        newMonth - 1,
        day,
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
      );
      break;
    }

    // years: same day/month, just a different year
    case "years": {
      const targetYear = date.getFullYear() + duration;

      // clamp Feb 29 -> Feb 28 when the target year isn't a leap year, instead of producing an invalid date (same idea as the "months" clamp above)
      const day = Math.min(
        date.getDate(),
        daysInMonth(date.getMonth() + 1, targetYear),
      );

      newDate = new Date(
        targetYear,
        date.getMonth(),
        day,
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
      );
      break;
    }

    default: {
      // Exhaustiveness check: if DurationUnit ever grows a new member without a case above, this line fails to compile
      const _exhaustive: never = unit;
      throw new Error(`Unsupported time unit: ${unit as string}`);
    }
  }

  return formatDateTime(newDate);
};

const addDurationToDateTimeSchema: Anthropic.Tool = {
  name: "add_duration_to_datetime",
  description:
    "Adds a specified duration to a datetime string and returns the resulting datetime in a detailed format. This tool converts an input datetime string to a Python datetime object, adds the specified duration in the requested unit, and returns a formatted string of the resulting datetime. It handles various time units including seconds, minutes, hours, days, weeks, months, and years, with special handling for month and year calculations to account for varying month lengths and leap years. The output is always returned in a detailed format that includes the day of the week, month name, day, year, and time with AM/PM indicator (e.g., 'Thursday, April 03, 2025 10:30:00 AM').",
  input_schema: {
    type: "object",
    properties: {
      dateTimeStr: {
        type: "string",
        description:
          "The input datetime string to which the duration will be added. This should be formatted according to the input_format parameter.",
      },
      duration: {
        type: "number",
        description:
          "The amount of time to add to the datetime. Can be positive (for future dates) or negative (for past dates). Defaults to 0.",
      },
      unit: {
        type: "string",
        description:
          "The unit of time for the duration. Must be one of: 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', or 'years'. Defaults to 'days'.",
      },
      inputFormat: {
        type: "string",
        description:
          "The format string for parsing the input datetime_str, using Python's strptime format codes. For example, '%Y-%m-%d' for ISO format dates like '2025-04-03'. Defaults to '%Y-%m-%d'.",
      },
    },
    required: ["datetime_str"],
  },
};

export { addDurationToDateTime, addDurationToDateTimeSchema };
export type { DurationUnit };
