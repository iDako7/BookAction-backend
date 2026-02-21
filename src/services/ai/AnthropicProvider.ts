import Anthropic from "@anthropic-ai/sdk";
import type { AIMessage, AIProvider } from "./AIProvider.js";

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async complete(messages: AIMessage[]): Promise<string> {
    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");

    const response = await this.client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemMessage?.content,
      messages: userMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const block = response.content[0];
    return block?.type === "text" ? block.text : "";
  }

  async completeJSON<T>(messages: AIMessage[]): Promise<T> {
    const text = await this.complete(messages);
    return JSON.parse(text) as T;
  }
}
