interface TutorialExampleDTO {
  story: string;
  mediaUrl: string;
}

interface TutorialDTO {
  goodExample: TutorialExampleDTO;
  badExample: TutorialExampleDTO;
}

export interface ConceptTutorialDTO {
  title: string;
  definition: string;
  whyItWorks: string;
  tutorial: TutorialDTO;
}
