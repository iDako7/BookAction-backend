import { PrismaClient } from "@prisma/client";
import type {
  Prisma,
  Theme,
  Concept,
  Tutorial,
  Quiz,
  Summary,
  Reflection,
} from "@prisma/client";
const prisma = new PrismaClient();

// return the data for Learning homepage
async function getLearnHomepage(userId: number = 1) {
  try {
    const module = await prisma.module.findFirst({
      orderBy: { order_index: "asc" },
      include: {
        theme: true,
        concepts: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    if (!module) {
      return { modules: [] };
    }

    return {
      modules: [
        {
          id: module.id,
          title: module.title,
          theme: module.theme
            ? {
                title: module.theme.title,
                context: module.theme.context,
                mediaUrl: module.theme.media_url,
                mediaType: module.theme.media_type,
                question: module.theme.question,
              }
            : null,
          progress: 0,
          concepts: module.concepts.map((c) => ({
            id: c.id,
            title: c.title,
            completed: false, // placeholder until user progress is implemented
          })),
        },
      ],
    };
  } catch (e) {
    console.log(e);
    throw e;
  }
}

type Resource =
  | Theme
  | (Concept & { tutorial: Tutorial | null })
  | Quiz[]
  | Summary
  | Reflection;

async function getResource(
  type: string,
  id: number,
  user_id = 1
): Promise<Resource | null> {
  switch (type) {
    case "theme":
      return prisma.theme.findFirst({ where: { module_id: id } });
    case "concept":
      return prisma.concept.findUnique({
        where: { id },
        include: { tutorial: true },
      });
    case "quiz":
      return prisma.quiz.findMany({
        where: { concept_id: id },
        orderBy: { order_index: "asc" },
      });
    case "summary":
      return prisma.summary.findFirst({ where: { concept_id: id } });
    case "reflection":
      return prisma.reflection.findFirst({
        where: { module_id: id, user_id },
      });
    default:
      return null;
  }
}

export { getLearnHomepage, getResource };
