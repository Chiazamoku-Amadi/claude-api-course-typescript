# Claude API Course in TypeScript

TypeScript versions of the exercises from Anthropic's _Building with the Claude API_ course. The course examples are written in Python, so this repo ports them to TypeScript and runs them with the Anthropic SDK.

> **Status:** work in progress, updated as I complete each part of the course. This is a personal learning project and is not affiliated with or endorsed by Anthropic.

This repo is part of a larger AI engineering roadmap. The hands-on challenges for each phase live in [ai-engineering-roadmap-challenges](https://github.com/Chiazamoku-Amadi/ai-engineering-roadmap-challenges).

## What's inside

| Folder                               | Topic                          | What you'll find                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/accessing_claude_with_the_api/` | API basics                     | A first request, multi-turn conversations with typed message helpers, a command-line chatbot, system prompts (a math tutor), temperature, two streaming examples, and structured output using assistant prefill with stop sequences                                                                                                            |
| `src/prompt_evaluation/`             | Evaluating prompts             | Generating test datasets with Claude, running an evaluation, model-based grading, and code-based grading (JSON, JavaScript syntax, and regex validators)                                                                                                                                                                                       |
| `src/prompt_engineering/`            | Prompt engineering             | A reusable `PromptEvaluator` class that generates test cases, runs prompts with a concurrency limit (`mapWithConcurrencyLimit`), grades the output with a model, and writes an HTML report. It is applied across six lessons: prompting basics, being clear and direct, being specific, XML tags, providing examples, and a prompting exercise |
| `src/tool_use_with_claude/`          | Tool use                       | An introduction with a tool-calling loop (date/time and reminder tools), fine-grained tool calling with streaming and `tool_choice`, the text editor tool (file commands implemented locally), and the web search tool (limited to one allowed domain)                                                                                         |
| `src/rag/`                           | Retrieval-augmented generation | Text chunking by character, sentence, and section; embeddings with Voyage AI; and a `VectorIndex` class with cosine and Euclidean distance                                                                                                                                                                                                     |

Every example uses the `claude-haiku-4-5` model. Each lesson folder in `prompt_engineering/` contains its own copy of the evaluator, so any lesson can be run on its own.

## Tech stack

TypeScript (strict mode), Node.js, the Anthropic SDK (`@anthropic-ai/sdk`), the Voyage AI SDK (`voyageai`), and `dotenv`.

## Getting started

### Prerequisites

- Node.js 22 or newer (tested on 22.22)
- An [Anthropic API key](https://console.anthropic.com/)
- A [Voyage AI API key](https://www.voyageai.com/) (only needed for the RAG examples)

### Install

```bash
git clone https://github.com/Chiazamoku-Amadi/claude-api-course-typescript.git
cd claude-api-course-typescript
npm install
cp .env.example .env
```

Open `.env` and add your keys:

```env
ANTHROPIC_API_KEY=your-anthropic-key
VOYAGE_API_KEY=your-voyage-key
```

### Run an example

Run files from the repo root, because some read files by relative path:

```bash
npx tsx src/accessing_claude_with_the_api/01_first_request.ts
```

Recent versions of Node can also run the files directly:

```bash
node src/accessing_claude_with_the_api/01_first_request.ts
```

Each run calls the API and uses a small amount of credit. Some examples (the evaluators and the tool-use loops) make several calls.

### Good places to start

| Example                                     | Command                                                                    |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| First request                               | `npx tsx src/accessing_claude_with_the_api/01_first_request.ts`            |
| Command-line chatbot                        | `npx tsx src/accessing_claude_with_the_api/03_chatbot.ts`                  |
| Generate an eval dataset                    | `npx tsx src/prompt_evaluation/01_generating_datasets.ts`                  |
| Run a prompt evaluation with an HTML report | `npx tsx src/prompt_engineering/01_prompting/prompt_evaluator_instance.ts` |
| Tool-calling loop                           | `npx tsx src/tool_use_with_claude/tool_use_introduction/index.ts`          |
| Chunking and embeddings                     | `npx tsx src/rag/chunking.ts`                                              |

### Typecheck

```bash
npm run typecheck
```

## Generated and sample files

A few files in the repo are produced by the lessons themselves:

- `main.ts`, `test.ts`, and `.backups/` at the repo root are created by the text editor tool lesson, where Claude writes and edits files.
- `report.md` is the sample document used by the chunking example in `src/rag/chunking.ts`.
- `dataset.json`, `output.json`, and `output.html` inside lesson folders are generated when you run an evaluation.

## Project structure

```
.
├── src/
│   ├── accessing_claude_with_the_api/   # API basics, streaming, structured data
│   ├── prompt_evaluation/               # Datasets and grading
│   ├── prompt_engineering/              # PromptEvaluator and six lesson folders
│   ├── tool_use_with_claude/            # Four tool-use examples
│   └── rag/                             # Chunking, embeddings, vector index
├── report.md                            # Sample document for the chunking example
├── .env.example
├── package.json
└── tsconfig.json
```

## Author

**Chiazamoku Amadi** · [GitHub](https://github.com/Chiazamoku-Amadi) · [LinkedIn](https://www.linkedin.com/in/chiazamoku-amadi) · [Portfolio](https://chiazamoku-portfolio.netlify.app)
