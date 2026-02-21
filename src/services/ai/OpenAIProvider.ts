import OpenAI from "openai";
import type { AIMessage, AIProvider } from "./AIProvider.js";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async complete(messages: AIMessage[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async completeJSON<T>(messages: AIMessage[]): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
    });
    const text = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(text) as T;
  }
}
