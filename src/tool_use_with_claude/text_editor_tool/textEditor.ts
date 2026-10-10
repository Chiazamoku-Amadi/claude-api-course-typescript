import type Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";

export const textEditorSchema: Anthropic.ToolTextEditor20250728 = {
  type: "text_editor_20250728",
  name: "str_replace_based_edit_tool",
};

export type TextEditorCommand =
  | "view"
  | "str_replace"
  | "create"
  | "insert"
  | "undo_edit";

export interface TextEditorToolInput {
  command: TextEditorCommand;
  path: string;
  view_range?: [number, number];
  old_str?: string;
  new_str?: string;
  file_text?: string;
  insert_line?: number;
  insert_text?: string;
}

export class TextEditorTool {
  private baseDir: string;
  private backupDir: string;

  private backupCounter = 0;

  constructor(baseDir?: string, backupDir?: string) {
    this.baseDir = path.resolve(baseDir || process.cwd());
    this.backupDir = backupDir
      ? path.resolve(backupDir)
      : path.join(this.baseDir, ".backups");
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  private validatePath(filePath: string) {
    const absPath = path.resolve(this.baseDir, filePath);
    const relative = path.relative(this.baseDir, absPath);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error(
        `Access denied: Path '${filePath}' is outside the allowed directory`,
      );
    }

    return absPath;
  }

  private backupFile(absPath: string): string {
    if (!fs.existsSync(absPath)) return "";

    const fileName = path.basename(absPath);
    const backupPath = path.join(
      this.backupDir,
      `${fileName}.${Date.now()}.${this.backupCounter++}`,
    );
    fs.copyFileSync(absPath, backupPath);

    return backupPath;
  }

  private restoreBackup(absPath: string): string {
    const fileName = path.basename(absPath);
    const backups = fs
      .readdirSync(this.backupDir)
      .filter((f) => f.startsWith(`${fileName}`));

    if (backups.length === 0) {
      throw new Error(`No backups found for ${absPath}`);
    }

    const sorted = backups.sort().reverse();
    const latestBackup = sorted[0];

    if (!latestBackup) {
      throw new Error(`No backups found for ${absPath}`);
    }

    const backupPath = path.join(this.backupDir, latestBackup);

    fs.copyFileSync(backupPath, absPath);

    return `Successfully restored ${absPath} from backup`;
  }

  private countMatches(content: string, old_str: string): number {
    if (old_str === "") return 0;
    return content.split(old_str).length - 1;
  }

  view(filePath: string, view_range?: [number, number]): string {
    const absPath = this.validatePath(filePath);

    if (!fs.existsSync(absPath)) {
      throw new Error("File not found");
    }

    if (fs.statSync(absPath).isDirectory()) {
      try {
        return fs.readdirSync(absPath).join("\n");
      } catch {
        throw new Error("Permission denied. Cannot list directory contents.");
      }
    }

    let content: string;
    try {
      content = fs.readFileSync(absPath, "utf-8");
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "EACCES"
      ) {
        throw new Error("Permission denied. Cannot access file.");
      }
      throw new Error(
        "File contains non-text content and cannot be displayed.",
      );
    }

    const lines = content.split("\n");

    if (view_range) {
      let [start, end] = view_range;
      if (end === -1) end = lines.length;

      const selectedLines = lines.slice(start - 1, end);
      return selectedLines.map((line, i) => `${start + i}: ${line}`).join("\n");
    }

    return lines.map((line, i) => `${i + 1}: ${line}`).join("\n");
  }

  strReplace(filePath: string, old_str: string, new_str: string): string {
    const absPath = this.validatePath(filePath);

    if (!fs.existsSync(absPath)) {
      throw new Error("File not found");
    }

    const content = fs.readFileSync(absPath, "utf-8");
    const matchCount = this.countMatches(content, old_str);

    if (matchCount === 0) {
      throw new Error(
        "No match found for replacement. Please check your text and try again.",
      );
    } else if (matchCount > 1) {
      throw new Error(
        `Found ${matchCount} matches for replacement text. Please provide more context to make a unique match.`,
      );
    }

    this.backupFile(absPath);

    const newContent = content.split(old_str).join(new_str);
    fs.writeFileSync(absPath, newContent, "utf-8");

    return "Successfully replaced text at exactly one location.";
  }

  create(filePath: string, file_text: string): string {
    const absPath = this.validatePath(filePath);

    if (fs.existsSync(absPath)) {
      throw new Error("File already exists. Use str_replace to modify it.");
    }

    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, file_text, "utf-8");

    return `Successfully created ${filePath}`;
  }

  insert(filePath: string, insert_line: number, new_str: string): string {
    const absPath = this.validatePath(filePath);

    if (!fs.existsSync(absPath)) {
      throw new Error("File not found");
    }

    this.backupFile(absPath);

    const raw = fs.readFileSync(absPath, "utf-8");

    // Mirrors Python's f.readlines(): split into chunks that each keep their
    // trailing "\n" (except possibly the final chunk), rather than a plain
    // split("\n") which would discard the newlines entirely.
    let lines = raw.length > 0 ? raw.split(/(?<=\n)/) : [];
    let textToInsert = new_str;

    const lastLine = lines[lines.length - 1];

    if (lastLine !== undefined && !lastLine.endsWith("\n")) {
      textToInsert = "\n" + textToInsert;
    }

    if (insert_line === 0) {
      lines.splice(0, 0, textToInsert + "\n");
    } else if (insert_line > 0 && insert_line <= lines.length) {
      lines.splice(insert_line, 0, textToInsert + "\n");
    } else {
      throw new Error(
        `Line number ${insert_line} is out of range. File has ${lines.length} lines.`,
      );
    }

    fs.writeFileSync(absPath, lines.join(""), "utf-8");

    return `Successfully inserted text after line ${insert_line}`;
  }

  // Kept for parity with the Python original and for manual/programmatic use.
  // Not reachable via Claude tool_use under text_editor_20250728 — see the note
  // above textEditorToolSchema.
  undoEdit(filePath: string): string {
    const absPath = this.validatePath(filePath);

    if (!fs.existsSync(absPath)) {
      throw new Error("File not found");
    }

    try {
      return this.restoreBackup(absPath);
    } catch {
      throw new Error("No previous edits to undo");
    }
  }
}

export const textEditor = new TextEditorTool();

// Single entry point that dispatches a text-editor tool_use input to the right
// method, mirroring the pattern of runTool()/runTools() in the main agent file.
export const runTextEditorTool = (input: TextEditorToolInput): string => {
  switch (input.command) {
    case "view":
      return textEditor.view(input.path, input.view_range);

    case "str_replace":
      if (input.old_str === undefined) {
        throw new Error("old_str is required for the str_replace command.");
      }
      return textEditor.strReplace(
        input.path,
        input.old_str,
        input.new_str ?? "",
      );

    case "create":
      if (input.file_text === undefined) {
        throw new Error("file_text is required for the create command.");
      }
      return textEditor.create(input.path, input.file_text);

    case "insert":
      if (input.insert_line === undefined || input.insert_text === undefined) {
        throw new Error(
          "insert_line and insert_text are required for the insert command.",
        );
      }
      return textEditor.insert(
        input.path,
        input.insert_line,
        input.insert_text,
      );

    case "undo_edit":
      return textEditor.undoEdit(input.path);

    default:
      throw new Error(`Unknown text editor command: ${input.command}`);
  }
};
