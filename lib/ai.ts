import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const aiProvider = createOpenAICompatible({
  name: "openai",
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
});
