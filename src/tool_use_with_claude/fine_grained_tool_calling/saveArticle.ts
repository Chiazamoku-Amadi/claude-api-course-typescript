import type Anthropic from "@anthropic-ai/sdk";

// Matches the shape the tool will hand back via tool_use.input.
interface SavedArticleInterface {
  abstract: string;
  meta: {
    word_count: number;
    review: string;
  };
}

const saveArticle = (_input: SavedArticleInterface): string => {
  return "Article saved!";
};

const saveArticleSchema: Anthropic.Tool = {
  name: "save_article",
  description: "Saves a scholarly journal article",
  input_schema: {
    type: "object",
    properties: {
      abstract: {
        type: "string",
        description: "Abstract of the article. One short sentence max",
      },
      meta: {
        type: "object",
        properties: {
          word_count: {
            type: "integer",
            description: "Word count",
          },
          review: {
            type: "string",
            description: "Eight sentence review of the paper",
          },
        },
        required: ["word_count", "review"],
      },
    },
    required: ["abstract", "meta"],
  },
};

const saveShortArticleSchema: Anthropic.Tool = {
  name: "save_article",
  description: "Saves a scholarly journal article",
  input_schema: {
    type: "object",
    properties: {
      abstract: {
        type: "string",
        description: "Abstract of the article. One short sentence max",
      },
      meta: {
        type: "object",
        properties: {
          word_count: {
            type: "integer",
            description: "Word count",
          },
          review: {
            type: "string",
            description: "Review of paper. One short sentence max",
          },
        },
        required: ["word_count", "review"],
      },
    },
    required: ["abstract", "meta"],
  },
};

export { saveArticle, saveArticleSchema, saveShortArticleSchema };
export type { SavedArticleInterface };
