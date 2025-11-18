interface QuizDTO {
  orderIndex: number;
  question: string;
  questionType: string;
  mediaUrl: string;
  options: string[];
  correctAnswer: string;
  correctOptionIndex: number | null;
  explanation: string;
}

export interface ConceptQuizzesDTO {
  questions: QuizDTO[];
}
