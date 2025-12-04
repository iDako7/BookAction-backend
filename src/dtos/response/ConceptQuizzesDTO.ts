interface QuizDTO {
  id: number;
  orderIndex: number;
  question: string;
  questionType: string;
  mediaUrl: string;
  options: string[];
  correctOptionIndex: number[];
  explanation: string;
}

export interface ConceptQuizzesDTO {
  questions: QuizDTO[];
}
