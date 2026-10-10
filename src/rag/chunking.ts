import fs from "node:fs";
import "dotenv/config";
import { VoyageAIClient } from "voyageai";
import { VectorIndex } from "./vectorIndex.ts";

type InputType = "query" | "document";

const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

// Chunk by a set number of characters
const chunkByChar = (text: string, chunkSize = 150, chunkOverlap = 20) => {
  let chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);

    const chunkText = text.slice(startIndex, endIndex);
    chunks.push(chunkText);

    if (endIndex < text.length) {
      startIndex = endIndex - chunkOverlap;
    } else {
      startIndex = text.length;
    }
  }

  return chunks;
};

// Chunk by sentence
const chunkBySentence = (
  text: string,
  maxSentencesPerChunk = 5,
  overlapSentences = 1,
) => {
  // Divide the text into sentences (separate by punctuation marks like .?!)
  const sentences = text.split(/(?<=[.!?])\s+/);

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < sentences.length) {
    const endIndex = Math.min(
      startIndex + maxSentencesPerChunk,
      sentences.length,
    );

    let currentChunk = sentences.slice(startIndex, endIndex);
    chunks.push(currentChunk.join(" "));

    startIndex += maxSentencesPerChunk - overlapSentences;

    if (startIndex < 0) {
      startIndex = 0;
    }
  }

  return chunks;
};

// Chunk by section
const chunkBySection = (documentText: string): string[] => {
  return documentText.split(/\n## /);
};

const generateEmbedding = async (
  chunks: string | string[],
  model = "voyage-3-large",
  inputType: InputType = "query",
): Promise<number[] | number[][]> => {
  const isList = Array.isArray(chunks);
  const input = isList ? chunks : [chunks];

  const result = await client.embed({
    input,
    model,
    inputType,
  });

  const embeddings = result.data?.map((item) => item.embedding ?? []) ?? [];

  return isList ? embeddings : (embeddings[0] ?? []);
};

const text = fs.readFileSync("./report.md", "utf-8");

// const chunks = chunkByChar(text, 500, 150);
// const chunks = chunkBySentence(text);

// chunks.forEach((chunk) => console.log(chunk + "\n----\n"));

// 1. Chunk the text by section
const chunks = chunkBySection(text);

// Generate embeddings for each chunk
const embeddings = (await generateEmbedding(chunks)) as number[][];

// 3. Create a vector store and add each embedding to it
// Note: Converted to a bulk operation to avoid rate limiting errors from VoyageAI
const store = new VectorIndex();

for (let i = 0; i < embeddings.length; i++) {
  store.addVector(embeddings[i]!, { content: chunks[i]! });
}

// 4. Some time later, a user will ask a question. Generate an embedding for it
const userEmbedding = (await generateEmbedding(
  "What did the software engineering dept do last year?",
  "voyage-3-large",
  "query",
)) as number[];

// 5. Search the store with the embedding, find the 2 most relevant chunks
const results = await store.search(userEmbedding, 2);

for (const [doc, distance] of results) {
  console.log(distance, "\n", doc["content"].slice(0, 200), "\n");
}
