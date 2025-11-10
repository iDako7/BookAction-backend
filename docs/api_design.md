# API 设计

## **#1 Learning Homepage**

![CleanShot 2025-11-08 at 12.19.18@2x.png](API%20%E8%AE%BE%E8%AE%A1/CleanShot_2025-11-08_at_12.19.182x.png)

```tsx
GET /api/users/{userId}/learning_homepage

Response: {
  modules: [{
    id: number,
    title: string,
    theme: string,
    progress: number, // percentage
    ~~currentStage: string,~~
    concepts: [{
      id: number,le
      title: string,
      completed: boolean
    }]
  }]
}
```

## **#2 Module Theme (Story Stage)**

page description: display context, image or animation to tell a small story to users to let them feel the situation of following concepts

```tsx
GET /api/modules/{moduleId}/theme

Response: {
  title: string,
  context: string,
  mediaUrl: string,
  mediaType: string,
  question: string
}
```

## **#3.1 concept-intro**

![CleanShot 2025-11-08 at 12.21.57@2x.png](API%20%E8%AE%BE%E8%AE%A1/CleanShot_2025-11-08_at_12.21.572x.png)

page description: using context, image/animation to teach students the one concept

```tsx
GET /api/concepts/{conceptId}

Response: {
  title: string,
  definition: string,
  whyItWorks: string,
  tutorial: {
    goodExample: { story: string, mediaUrl: string },
    badExample: { story: string, mediaUrl: string }
  }
}
```

## **#3.2 concept-practice**

查询 practice 内容，保存用户提交的内容

```tsx
GET /api/concepts/{conceptId}/quiz
Response: {
  questions: [{
    id: number,
    question: string,
    type: string,
    options: any[], // JSONB
    mediaUrl: string
  }]
}

POST /api/quiz/{quizId}/submit
Request: { userId: number, answer: string }
Response: { 
  isCorrect: boolean, 
  explanation: string,
  conceptProgress: {...}
}
```

## **#3.2 concept-summary**

Page description: what student have learned(very short), intro to next concept(if there is one)

```tsx
GET /api/concepts/{conceptId}/summary
Response: {
  summaryContent: string,
  nextConceptIntro: string | null
}
```

## **4 module-Reflection**

Page description: - summary: what user have learned, area to improve: based on question that user didn't give the suggested answer

```tsx
GET /api/modules/{moduleId}/reflection
Response: {
  type: string,
  prompt: string,
  mediaUrl: string
}

POST /api/modules/{moduleId}/reflection/submit
Request: { userId: number, response: string }
Response: { 
  feedback: string,
  moduleComplete: boolean
}
```