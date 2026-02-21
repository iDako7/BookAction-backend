import type { AIMessage, AIProvider } from "./AIProvider.js";
import { OpenAIProvider } from "./OpenAIProvider.js";
import { AnthropicProvider } from "./AnthropicProvider.js";

const MOCK_PRACTICE_QUESTIONS = [
  {
    question: "What does a visual learner prefer?",
    options: ["Diagrams and charts", "Listening to explanations", "Hands-on activities"],
    correct_option_index: 0,
    explanation: "Visual learners prefer diagrams and charts to understand information.",
  },
  {
    question: "Which study method best suits verbal learners?",
    options: ["Reading summaries", "Drawing mind maps", "Role-playing scenarios"],
    correct_option_index: 1,
    explanation: "Reading summaries leverages verbal learning strengths.",
  },
  {
    question: "Scenario-based learners learn best through?",
    options: ["Watching videos", "Reading textbooks", "Real-world case studies"],
    correct_option_index: 2,
    explanation: "Scenario-based learners excel with real-world case studies.",
  },
];

class MockProvider implements AIProvider {
  async complete(_messages: AIMessage[]): Promise<string> {
    return JSON.stringify(MOCK_PRACTICE_QUESTIONS);
  }

  async completeJSON<T>(_messages: AIMessage[]): Promise<T> {
    return MOCK_PRACTICE_QUESTIONS as unknown as T;
  }
}

class MockFailingProvider implements AIProvider {
  async complete(_messages: AIMessage[]): Promise<string> {
    throw new Error("AI provider unavailable");
  }

  async completeJSON<T>(_messages: AIMessage[]): Promise<T> {
    throw new Error("AI provider unavailable");
  }
}

export class AIProviderFactory {
  /**
   * Creates a provider instance. Reads AI_PROVIDER env var on each call
   * so that tests can change it at runtime.
   */
  static create(): AIProvider {
    const provider = process.env.AI_PROVIDER ?? "openai";

    switch (provider) {
      case "mock":
        return new MockProvider();
      case "mock-failing":
        return new MockFailingProvider();
      case "anthropic":
        return new AnthropicProvider();
      case "openai":
      default:
        return new OpenAIProvider();
    }
  }
}
