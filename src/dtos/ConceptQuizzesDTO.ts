interface QuizDTO {
  orderIndex: number;
  question: string;
  questionType: string;
  mediaUrl: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ConceptQuizzesDTO {
  questions: QuizDTO[];
}
