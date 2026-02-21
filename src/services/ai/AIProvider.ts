export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIProvider {
  complete(messages: AIMessage[]): Promise<string>;
  completeJSON<T>(messages: AIMessage[]): Promise<T>;
}
