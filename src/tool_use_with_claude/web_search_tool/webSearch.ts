import type Anthropic from "@anthropic-ai/sdk";

const webSearchSchema: Anthropic.WebSearchTool20250305 = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 5,
  allowed_domains: ["nih.gov"],
};

export { webSearchSchema };
