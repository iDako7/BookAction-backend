# BookAction — Technical Design Document

**Document Type:** System Architecture & Technical Design**
\*\***Version:** 4.1 (Post-Refactor — Trimmed Scope)** \***\*Author:** Dako

---

## Executive Summary

**BookAction is a full-stack learning platform that delivers British Columbia's PHE (Physical Health Education) curriculum through a structured, gamified, and AI-personalized experience. The system serves two user roles: \*\***students** progress through gated modules with tutorials, quizzes, and reflections, earning performance-based medals; **teachers\*\* manage courses, monitor student progress, and generate new curriculum content via an AI-powered course pipeline.

**The platform addresses a core gap identified in BC education: \***there are no standard resources that can reach all students in British Columbia in the PHE curriculum.\* BookAction solves this by combining structured content delivery, adaptive AI practice tailored to individual learning styles, and teacher tools for creating and publishing new course material at scale.

---

## 1. System Architecture Overview

```
┌────────────────────┐       ┌──────────────────────────────┐
│     Vercel          │       │       Fly.io                 │
│   Next.js 16        │──────▶│   ┌──────────────────────┐   │
│   (App Router)      │       │   │   Express Instance    │   │
│                     │       │   │   (Single)            │   │
│  Student Portal     │       │   └──────────┬───────────┘   │
│  Teacher Portal     │       │              │               │
└────────────────────┘       └──────────────┼───────────────┘
                                     ┌──────┴──────┐
                        ┌────────────┴─┐   ┌──┴───────────────┐
                        │  Render      │   │  Redis            │
                        │ PostgreSQL   │   │  (Upstash)        │
                        │              │   │  Cache + Rate     │
                        └──────────────┘   └──────────────────┘
                                     │
                              ┌──────┴────────────────┐
                              │   AI Provider          │
                              │   (OpenAI /            │
                              │    Anthropic)          │
                              └───────────────────────┘
```

### Architecture Principles

| **Principle**                     | **Implementation**                                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Service/Repository layering**   | **Business logic in services, data access in repositories, thin controllers**                              |
| **Explicit dependency injection** | **All dependencies wired in** `app.ts`— no hidden singletons                                               |
| **Provider abstraction for AI**   | **Factory pattern returns OpenAI or Anthropic provider; services are model-agnostic**                      |
| **Role-based access control**     | **JWT auth +**`requireRole()`middleware guards teacher/admin endpoints                                     |
| **Typed contracts end-to-end**    | **Zod validation on input, DTOs on output, TypeScript interfaces on frontend**                             |
| **Atomic data operations**        | **Prisma** `$transaction`for multi-table writes (course publishing, medal updates)                         |
| **Stateless application design**  | **No instance-local state; architecture supports horizontal scaling without code changes**                 |
| **Externalized shared state**     | **Redis for caching and rate limiting; PostgreSQL for persistent data — nothing stored in-process memory** |

---

## 2. Tech Stack

### Backend

| **Layer**                   | **Technology**                             | **Purpose**                                                   |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| **Runtime**                 | **Node.js + TypeScript**                   | **Type-safe server logic**                                    |
| **Framework**               | **Express 5**                              | **HTTP routing, middleware pipeline**                         |
| **ORM**                     | **Prisma (with** `@prisma/adapter-pg`)     | **Type-safe database access, migrations**                     |
| **Database**                | **PostgreSQL**                             | **Relational storage for content, users, progress, AI cache** |
| **Auth**                    | **JWT (access + refresh tokens) + bcrypt** | **Stateless auth with secure token rotation**                 |
| **Validation**              | **Zod**                                    | **Request body validation at controller boundary**            |
| **AI**                      | **OpenAI SDK + Anthropic SDK**             | **Practice generation, course structuring**                   |
| **File parsing**            | **Mammoth**                                | **.docx → markdown conversion for course upload**             |
| **Upload handling**         | **Multer (memory storage)**                | **Multipart file upload parsing**                             |
| **Caching & Rate Limiting** | **Redis (ioredis)**                        | **Distributed cache for teacher reports, AI rate limiting**   |

### Frontend

| **Layer**        | **Technology**                          | **Purpose**                                            |
| ---------------- | --------------------------------------- | ------------------------------------------------------ |
| **Framework**    | **Next.js 16 (App Router)**             | **File-based routing, SSR, code splitting**            |
| **Language**     | **TypeScript**                          | **Typed components and API contracts**                 |
| **UI**           | **Tailwind CSS v4 + shadcn/ui (Radix)** | **Consistent design primitives**                       |
| **Server state** | **TanStack React Query**                | **Caching, loading states, cache invalidation**        |
| **Client state** | **Zustand + persist**                   | **Auth session and learning progress in localStorage** |
| **Networking**   | **Axios**                               | **Centralized API client with token refresh queueing** |
| **Forms**        | **React Hook Form + Zod**               | **Lightweight validated forms**                        |
| **Feedback**     | **Sonner**                              | **Toast-based notifications**                          |
| **Testing**      | **Vitest + Testing Library + JSDOM**    | **Unit and integration tests**                         |

---

## 3. Backend Layer Architecture

<pre class="md-fences md-end-block md-diagram md-fences-advanced ty-contain-cm" spellcheck="false" lang="mermaid" cid="n131" mdtype="fences" mermaid-type="flowchart-v2"><div class="md-diagram-panel md-fences-adv-panel"><div class="md-diagram-panel-header md-fences-adv-panel-header"></div><div class="md-diagram-panel-preview md-fences-adv-panel-preview"><svg id="mermaidChart0" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart mermaid-svg" viewBox="-8 -8 3741.5390625 1146.533203125" role="graphics-document document" aria-roledescription="flowchart-v2"><g><marker id="mermaidChart0_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath"></path></marker><marker id="mermaidChart0_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath"></path></marker><marker id="mermaidChart0_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath"></circle></marker><marker id="mermaidChart0_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath"></circle></marker><marker id="mermaidChart0_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath"></path></marker><marker id="mermaidChart0_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath"></path></marker><g class="root"><g class="clusters"><g class="cluster " id="subGraph6" data-look="classic"><rect x="184.28515625" y="694" width="129.90625" height="113.29304122924805"></rect><g class="cluster-label " transform="translate(201.87890625, 694)"><foreignObject width="94.71875" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="cluster " id="Database" data-look="classic"><rect x="411.56640625" y="857.293041229248" width="2667.03515625" height="273.24015045166016"></rect><g class="cluster-label " transform="translate(1708.833984375, 857.293041229248)"><foreignObject width="72.5" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="cluster " id="subGraph4" data-look="classic"><rect x="334.19140625" y="694" width="2845.640625" height="113.29304122924805"></rect><g class="cluster-label " transform="translate(1694.53515625, 694)"><foreignObject width="124.953125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="cluster " id="subGraph3" data-look="classic"><rect x="3199.83203125" y="694" width="496.48828125" height="288.0901679992676"></rect><g class="cluster-label " transform="translate(3416.279296875, 694)"><foreignObject width="63.59375" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="cluster " id="subGraph2" data-look="classic"><rect x="8" y="540" width="3717.5390625" height="104"></rect><g class="cluster-label " transform="translate(1815.85546875, 540)"><foreignObject width="101.828125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="cluster " id="subGraph1" data-look="classic"><rect x="98.18359375" y="386" width="3599.33984375" height="104"></rect><g class="cluster-label " transform="translate(1838.939453125, 386)"><foreignObject width="117.828125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="cluster " id="subGraph0" data-look="classic"><rect x="113.82421875" y="8" width="3543.97265625" height="328"></rect><g class="cluster-label " transform="translate(1840.826171875, 8)"><foreignObject width="89.96875" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g></g><g class="edgePaths"><path d="M1835.035,159L1835.035,184L1835.035,205" id="L_Routes_MW_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1705.035,266.104L216.324,336L216.324,361L216.324,386L216.324,407" id="L_MW_AuthC_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1705.035,267.785L565.996,336L565.996,361L565.996,386L565.996,407" id="L_MW_ModuleC_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1831.842,311L1830.277,336L1830.277,361L1830.277,386L1830.277,407" id="L_MW_ConceptC_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1965.035,279.279L2347.504,336L2347.504,361L2347.504,386L2347.504,407" id="L_MW_MedalC_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1705.035,275.905L1213.836,336L1213.836,361L1213.836,386L1213.836,407" id="L_MW_TeacherC_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1965.035,265.694L3570.055,336L3570.055,361L3570.055,386L3570.055,407" id="L_MW_CourseC_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1965.035,272.889L2601.566,336L2601.566,361L2601.566,386L2601.566,407" id="L_MW_PracticeC_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1965.035,266.804L3287.211,336L3287.211,361L3287.211,386L3287.211,407" id="L_MW_StyleC_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1705.035,301.758L1598.434,336L1598.434,361L1598.434,386L1598.434,407" id="L_MW_SeedC_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M216.324,465L216.324,490L216.324,515L216.324,540L216.324,561" id="L_AuthC_AuthS_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M565.996,465L565.996,490L565.996,515L565.996,540L565.996,561" id="L_ModuleC_ModuleS_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1830.277,465L1830.277,490L1830.277,515L1830.277,540L1830.277,561" id="L_ConceptC_ConceptS_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M2347.504,465L2347.504,490L2347.504,515L2347.504,540L2347.504,561" id="L_MedalC_MedalS_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1213.836,465L1213.836,490L1213.836,515L1213.836,540L1213.836,561" id="L_TeacherC_TeacherS_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M3570.055,465L3570.055,490L3570.055,515L3570.055,540L3570.055,561" id="L_CourseC_CourseGenS_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M2601.566,465L2601.566,490L2601.566,515L2601.566,540L2601.566,561" id="L_PracticeC_PracticeS_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M3287.211,465L3287.211,490L3287.211,515L3287.211,540L3287.211,561" id="L_StyleC_StyleS_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1598.434,465L1598.434,490L1598.434,515L1598.434,540L1598.434,561" id="L_SeedC_SeedS_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M291.457,611.639L415.258,644L415.258,669L415.258,694L434.403,720.408" id="L_AuthS_UserR_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M291.457,599.865L713.059,644L713.059,669L713.059,694L713.059,719.647" id="L_AuthS_RefreshR_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M650.91,607.221L856.098,644L856.098,669L856.098,694L916.858,721.974" id="L_ModuleS_ModuleR_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1741.801,599.518L1218.316,644L1218.316,669L1218.316,694L1222.855,719.707" id="L_ConceptS_ConceptR_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1990.316,601.317L1497.496,644L1497.496,669L1497.496,694L1497.496,719.647" id="L_ProgressS_ProgressR_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M2267.035,599.106L1758.668,644L1758.668,669L1758.668,694L1758.668,719.647" id="L_MedalS_MedalR_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1300.977,597.768L1999.402,644L1999.402,669L1999.402,694L1999.402,719.647" id="L_TeacherS_TeacherR_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M3449.57,597.538L2438.824,644L2438.824,669L2438.824,694L2438.824,719.647" id="L_CourseGenS_DraftR_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M2725.16,607.266L3022.566,644L3022.566,669L3022.566,694L3022.566,719.647" id="L_PracticeS_CacheR_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M3179.609,601.974L2726.246,644L2726.246,669L2726.246,694L2726.246,719.647" id="L_StyleS_ProfileR_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1521.074,595.929L574.691,644L574.691,669L574.691,694L516.351,721.92" id="L_SeedS_UserR_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1521.074,599.949L1092.395,644L1092.395,669L1092.395,694L1036.697,721.857" id="L_SeedS_ModuleR_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1521.074,608.384L1352.906,644L1352.906,669L1352.906,694L1291.342,721.991" id="L_SeedS_ConceptR_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M2725.16,601.399L3285.344,644L3285.344,669L3285.344,694L3465.353,730.424" id="L_PracticeS_Factory_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M3570.055,619L3570.055,644L3570.055,669L3570.055,694L3567.899,719.661" id="L_CourseGenS_Factory_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M3469.273,773.502L3327.305,807.293L3327.305,832.293L3327.305,857.293L3327.305,888.692" id="L_Factory_OpenAI_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M3565.297,777.647L3565.297,807.293L3565.297,832.293L3565.297,857.293L3565.297,888.692" id="L_Factory_Anthropic_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M456.324,777.647L456.324,807.293L456.324,832.293L456.324,857.293L2232.979,917.618" id="L_UserR_Prisma_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M713.059,777.647L713.059,807.293L713.059,832.293L713.059,857.293L2232.98,917.281" id="L_RefreshR_Prisma_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M979.137,777.647L979.137,807.293L979.137,832.293L979.137,857.293L2232.981,916.794" id="L_ModuleR_Prisma_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1228.316,777.647L1228.316,807.293L1228.316,832.293L1228.316,857.293L2232.983,916.116" id="L_ConceptR_Prisma_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1497.496,777.647L1497.496,807.293L1497.496,832.293L1497.496,857.293L2232.989,914.909" id="L_ProgressR_Prisma_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1758.668,777.647L1758.668,807.293L1758.668,832.293L1758.668,857.293L2233.003,912.577" id="L_MedalR_Prisma_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1999.402,777.647L1999.402,807.293L1999.402,832.293L1999.402,857.293L2233.063,906.777" id="L_TeacherR_Prisma_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M2438.824,777.647L2438.824,807.293L2438.824,832.293L2438.824,857.293L2354.791,893.511" id="L_DraftR_Prisma_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M2726.246,777.647L2726.246,807.293L2726.246,832.293L2726.246,857.293L2355.076,910.881" id="L_ProfileR_Prisma_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M3022.566,777.647L3022.566,807.293L3022.566,832.293L3022.566,857.293L2355.103,914.462" id="L_CacheR_Prisma_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M2294.047,957.09L2294.047,982.09L2294.047,1007.09L2294.047,1028.09" id="L_Prisma_DB_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M1126.695,596.649L239.238,644L239.238,669L239.238,694L242.96,715.202" id="L_TeacherS_Redis_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path><path d="M2477.973,594.758L271.715,644L271.715,669L271.715,694L263.233,716.014" id="L_PracticeS_Redis_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" marker-end="url(#mermaidChart0_flowchart-v2-pointEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg"><span class="edgeLabel "></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default  " id="flowchart-Routes-0" transform="translate(1835.03515625, 96)"><rect class="basic label-container" x="-130" y="-63" width="260" height="126"></rect><g class="label" transform="translate(-100, -48)"><rect></rect><foreignObject width="200" height="96"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-MW-1" transform="translate(1835.03515625, 260)"><rect class="basic label-container" x="-130" y="-51" width="260" height="102"></rect><g class="label" transform="translate(-100, -36)"><rect></rect><foreignObject width="200" height="72"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-AuthC-2" transform="translate(216.32421875, 438)"><rect class="basic label-container" x="-83.140625" y="-27" width="166.28125" height="54"></rect><g class="label" transform="translate(-53.140625, -12)"><rect></rect><foreignObject width="106.28125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-ModuleC-3" transform="translate(565.99609375, 438)"><rect class="basic label-container" x="-92.921875" y="-27" width="185.84375" height="54"></rect><g class="label" transform="translate(-62.921875, -12)"><rect></rect><foreignObject width="125.84375" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-ConceptC-4" transform="translate(1830.27734375, 438)"><rect class="basic label-container" x="-96.4765625" y="-27" width="192.953125" height="54"></rect><g class="label" transform="translate(-66.4765625, -12)"><rect></rect><foreignObject width="132.953125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-MedalC-5" transform="translate(2347.50390625, 438)"><rect class="basic label-container" x="-88.46875" y="-27" width="176.9375" height="54"></rect><g class="label" transform="translate(-58.46875, -12)"><rect></rect><foreignObject width="116.9375" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-TeacherC-6" transform="translate(1213.8359375, 438)"><rect class="basic label-container" x="-95.140625" y="-27" width="190.28125" height="54"></rect><g class="label" transform="translate(-65.140625, -12)"><rect></rect><foreignObject width="130.28125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-CourseC-7" transform="translate(3570.0546875, 438)"><rect class="basic label-container" x="-92.46875" y="-27" width="184.9375" height="54"></rect><g class="label" transform="translate(-62.46875, -12)"><rect></rect><foreignObject width="124.9375" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-PracticeC-8" transform="translate(2601.56640625, 438)"><rect class="basic label-container" x="-95.578125" y="-27" width="191.15625" height="54"></rect><g class="label" transform="translate(-65.578125, -12)"><rect></rect><foreignObject width="131.15625" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-StyleC-9" transform="translate(3287.2109375, 438)"><rect class="basic label-container" x="-115.6015625" y="-27" width="231.203125" height="54"></rect><g class="label" transform="translate(-85.6015625, -12)"><rect></rect><foreignObject width="171.203125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-SeedC-10" transform="translate(1598.43359375, 438)"><rect class="basic label-container" x="-85.3671875" y="-27" width="170.734375" height="54"></rect><g class="label" transform="translate(-55.3671875, -12)"><rect></rect><foreignObject width="110.734375" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-AuthS-11" transform="translate(216.32421875, 592)"><rect class="basic label-container" x="-75.1328125" y="-27" width="150.265625" height="54"></rect><g class="label" transform="translate(-45.1328125, -12)"><rect></rect><foreignObject width="90.265625" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-ModuleS-12" transform="translate(565.99609375, 592)"><rect class="basic label-container" x="-84.9140625" y="-27" width="169.828125" height="54"></rect><g class="label" transform="translate(-54.9140625, -12)"><rect></rect><foreignObject width="109.828125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-ConceptS-13" transform="translate(1830.27734375, 592)"><rect class="basic label-container" x="-88.4765625" y="-27" width="176.953125" height="54"></rect><g class="label" transform="translate(-58.4765625, -12)"><rect></rect><foreignObject width="116.953125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-ProgressS-14" transform="translate(2097.89453125, 592)"><rect class="basic label-container" x="-107.578125" y="-27" width="215.15625" height="54"></rect><g class="label" transform="translate(-77.578125, -12)"><rect></rect><foreignObject width="155.15625" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-MedalS-15" transform="translate(2347.50390625, 592)"><rect class="basic label-container" x="-80.46875" y="-27" width="160.9375" height="54"></rect><g class="label" transform="translate(-50.46875, -12)"><rect></rect><foreignObject width="100.9375" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-TeacherS-16" transform="translate(1213.8359375, 592)"><rect class="basic label-container" x="-87.140625" y="-27" width="174.28125" height="54"></rect><g class="label" transform="translate(-57.140625, -12)"><rect></rect><foreignObject width="114.28125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-CourseGenS-17" transform="translate(3570.0546875, 592)"><rect class="basic label-container" x="-120.484375" y="-27" width="240.96875" height="54"></rect><g class="label" transform="translate(-90.484375, -12)"><rect></rect><foreignObject width="180.96875" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-PracticeS-18" transform="translate(2601.56640625, 592)"><rect class="basic label-container" x="-123.59375" y="-27" width="247.1875" height="54"></rect><g class="label" transform="translate(-93.59375, -12)"><rect></rect><foreignObject width="187.1875" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-StyleS-19" transform="translate(3287.2109375, 592)"><rect class="basic label-container" x="-107.6015625" y="-27" width="215.203125" height="54"></rect><g class="label" transform="translate(-77.6015625, -12)"><rect></rect><foreignObject width="155.203125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-SeedS-20" transform="translate(1598.43359375, 592)"><rect class="basic label-container" x="-77.359375" y="-27" width="154.71875" height="54"></rect><g class="label" transform="translate(-47.359375, -12)"><rect></rect><foreignObject width="94.71875" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-Factory-21" transform="translate(3565.296875, 750.646520614624)"><rect class="basic label-container" x="-96.0234375" y="-27" width="192.046875" height="54"></rect><g class="label" transform="translate(-66.0234375, -12)"><rect></rect><foreignObject width="132.046875" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-OpenAI-22" transform="translate(3327.3046875, 919.6916046142578)"><rect class="basic label-container" x="-88.921875" y="-27" width="177.84375" height="54"></rect><g class="label" transform="translate(-58.921875, -12)"><rect></rect><foreignObject width="117.84375" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-Anthropic-23" transform="translate(3565.296875, 919.6916046142578)"><rect class="basic label-container" x="-95.5859375" y="-27" width="191.171875" height="54"></rect><g class="label" transform="translate(-65.5859375, -12)"><rect></rect><foreignObject width="131.171875" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-UserR-24" transform="translate(456.32421875, 750.646520614624)"><rect class="basic label-container" x="-87.1328125" y="-27" width="174.265625" height="54"></rect><g class="label" transform="translate(-57.1328125, -12)"><rect></rect><foreignObject width="114.265625" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-RefreshR-25" transform="translate(713.05859375, 750.646520614624)"><rect class="basic label-container" x="-119.6015625" y="-27" width="239.203125" height="54"></rect><g class="label" transform="translate(-89.6015625, -12)"><rect></rect><foreignObject width="179.203125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-ModuleR-26" transform="translate(979.13671875, 750.646520614624)"><rect class="basic label-container" x="-96.4765625" y="-27" width="192.953125" height="54"></rect><g class="label" transform="translate(-66.4765625, -12)"><rect></rect><foreignObject width="132.953125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-ConceptR-27" transform="translate(1228.31640625, 750.646520614624)"><rect class="basic label-container" x="-100.0390625" y="-27" width="200.078125" height="54"></rect><g class="label" transform="translate(-70.0390625, -12)"><rect></rect><foreignObject width="140.078125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-ProgressR-28" transform="translate(1497.49609375, 750.646520614624)"><rect class="basic label-container" x="-119.140625" y="-27" width="238.28125" height="54"></rect><g class="label" transform="translate(-89.140625, -12)"><rect></rect><foreignObject width="178.28125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-MedalR-29" transform="translate(1758.66796875, 750.646520614624)"><rect class="basic label-container" x="-92.03125" y="-27" width="184.0625" height="54"></rect><g class="label" transform="translate(-62.03125, -12)"><rect></rect><foreignObject width="124.0625" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-TeacherR-30" transform="translate(1999.40234375, 750.646520614624)"><rect class="basic label-container" x="-98.703125" y="-27" width="197.40625" height="54"></rect><g class="label" transform="translate(-68.703125, -12)"><rect></rect><foreignObject width="137.40625" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-DraftR-31" transform="translate(2438.82421875, 750.646520614624)"><rect class="basic label-container" x="-113.3671875" y="-27" width="226.734375" height="54"></rect><g class="label" transform="translate(-83.3671875, -12)"><rect></rect><foreignObject width="166.734375" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-ProfileR-32" transform="translate(2726.24609375, 750.646520614624)"><rect class="basic label-container" x="-124.0546875" y="-27" width="248.109375" height="54"></rect><g class="label" transform="translate(-94.0546875, -12)"><rect></rect><foreignObject width="188.109375" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-CacheR-33" transform="translate(3022.56640625, 750.646520614624)"><rect class="basic label-container" x="-122.265625" y="-27" width="244.53125" height="54"></rect><g class="label" transform="translate(-92.265625, -12)"><rect></rect><foreignObject width="184.53125" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-Prisma-34" transform="translate(2294.046875, 919.6916046142578)"><path d="M0,11.932375040836327 a57.0703125,11.932375040836327 0,0,0 114.140625,0 a57.0703125,11.932375040836327 0,0,0 -114.140625,0 l0,50.93237504083633 a57.0703125,11.932375040836327 0,0,0 114.140625,0 l0,-50.93237504083633" class="basic label-container" label-offset-y="11.932375040836327" transform="translate(-57.0703125, -37.398562561254494)"></path><g class="label" transform="translate(-49.5703125, -2)"><rect></rect><foreignObject width="99.140625" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-DB-35" transform="translate(2294.046875, 1068.811679840088)"><path d="M0,11.481005813167501 a53.078125,11.481005813167501 0,0,0 106.15625,0 a53.078125,11.481005813167501 0,0,0 -106.15625,0 l0,50.4810058131675 a53.078125,11.481005813167501 0,0,0 106.15625,0 l0,-50.4810058131675" class="basic label-container" label-offset-y="11.481005813167501" transform="translate(-53.078125, -36.72150871975125)"></path><g class="label" transform="translate(-45.578125, -2)"><rect></rect><foreignObject width="91.15625" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g><g class="node default  " id="flowchart-Redis-36" transform="translate(249.23828125, 750.646520614624)"><path d="M0,8.099543687679567 a29.953125,8.099543687679567 0,0,0 59.90625,0 a29.953125,8.099543687679567 0,0,0 -59.90625,0 l0,47.09954368767957 a29.953125,8.099543687679567 0,0,0 59.90625,0 l0,-47.09954368767957" class="basic label-container" label-offset-y="8.099543687679567" transform="translate(-29.953125, -31.649315531519353)"></path><g class="label" transform="translate(-22.453125, -2)"><rect></rect><foreignObject width="44.90625" height="24"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel "></span></div></foreignObject></g></g></g></g></g></svg></div><div class="md-diagram-panel-error md-fences-adv-panel-error"></div></div></pre>

### Key Service Responsibilities

| **Service**                  | **Responsibility**                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **AuthService**              | **Password hashing, JWT issuance/verification, refresh token rotation, logout**                                     |
| **ModuleService**            | **Module overview with user progress, theme retrieval, reflections CRUD**                                           |
| **ConceptService**           | **Tutorial/quiz/summary retrieval, quiz scoring, triggers medal calculation on submission**                         |
| **MedalService**             | **Calculates concept/module medals from quiz accuracy, upserts medal records**                                      |
| **UserProgressService**      | **Upserts concept completion and time tracking**                                                                    |
| **TeacherService**           | **Student list (paginated, sortable), individual reports, class overview, module analytics, CSV export**            |
| **LearningStyleService**     | **Evaluates learning style quiz responses, scores styles (Visual/Verbal/Scenario), persists profile**               |
| **PracticeGeneratorService** | **Generates AI-personalized practice questions per concept + learning style, with DB-backed cache (1hr TTL)**       |
| **CourseGeneratorService**   | **Parses uploaded .docx/markdown, sends to AI for structuring, publishes draft to live modules via** `$transaction` |
| **SeedService**              | **Runs Prisma seed script for initial content loading**                                                             |

---

## 4. Domain Model

### Entity Relationship Summary

```
User (STUDENT | TEACHER | ADMIN)
  ├── RefreshToken[]              (auth sessions)
  ├── User_concept_progress[]     (completion per concept)
  ├── User_response[]             (quiz answers, reflection text)
  ├── User_concept_medal[]        (Bronze/Silver/Gold per concept)
  ├── User_module_medal[]         (Bronze/Silver/Gold per module)
  ├── User_learning_profile       (primary style + scores)
  ├── Reflection[]                (module reflections)
  └── Course_draft[]              (teacher's uploaded courses)

Module
  ├── Theme                       (1:1 — intro context + media)
  ├── Concept[]                   (ordered learning units)
  │     ├── Tutorial              (1:1 — good/bad stories + media)
  │     ├── Quiz[]                (MCQ with options, correct index, explanation)
  │     ├── Summary               (1:1 — concept wrap-up)
  │     ├── User_concept_progress[]
  │     └── User_concept_medal[]
  ├── Reflection[]                (per-user module reflections)
  └── User_module_medal[]

AI_practice_cache               (concept × learning style → cached questions, TTL)
Course_draft                    (DRAFT → REVIEW → PUBLISHED → ARCHIVED pipeline)
```

### Key Enums

| **Enum**        | **Values**                             | **Purpose**                                  |
| --------------- | -------------------------------------- | -------------------------------------------- |
| `UserRole`      | **STUDENT, TEACHER, ADMIN**            | **Role-based access control**                |
| `MedalTier`     | **NONE, BRONZE, SILVER, GOLD**         | **Quiz accuracy thresholds (50%, 70%, 90%)** |
| `LearningStyle` | **VISUAL, VERBAL, SCENARIO**           | **AI practice personalization**              |
| `CourseStatus`  | **DRAFT, REVIEW, PUBLISHED, ARCHIVED** | **Course pipeline lifecycle**                |

---

## 5. API Surface

### Authentication (`/api/auth`)

| **Method** | **Endpoint** | **Auth**     | **Description**                  |
| ---------- | ------------ | ------------ | -------------------------------- |
| **POST**   | `/register`  | **Public**   | **Create account, issue tokens** |
| **POST**   | `/login`     | **Public**   | **Authenticate, issue tokens**   |
| **POST**   | `/refresh`   | **Cookie**   | **Rotate access token**          |
| **POST**   | `/logout`    | **Required** | **Revoke refresh token**         |
| **GET**    | `/me`        | **Required** | **Current user profile**         |

### Learning Content (`/api/modules`, `/api/concepts`)

| **Method** | **Endpoint**               | **Auth**     | **Description**                               |
| ---------- | -------------------------- | ------------ | --------------------------------------------- |
| **GET**    | `/modules/overview`        | **Required** | **All modules with user progress summary**    |
| **GET**    | `/modules/:id/theme`       | **Required** | **Module intro (context, media, question)**   |
| **GET**    | `/modules/:id/reflections` | **Required** | **User's reflections for module**             |
| **POST**   | `/modules/:id/reflections` | **Required** | **Submit module reflection**                  |
| **GET**    | `/concepts/:id/tutorial`   | **Required** | **Tutorial stories + media**                  |
| **GET**    | `/concepts/:id/quizzes`    | **Required** | **Quiz questions for concept**                |
| **POST**   | `/concepts/:id/quizzes`    | **Required** | **Submit quiz answers (triggers medal calc)** |
| **GET**    | `/concepts/:id/summary`    | **Required** | **Concept summary**                           |
| **PUT**    | `/concepts/:id/progress`   | **Required** | **Update completion / time spent**            |

### Medal System (`/api/medals`)

| **Method** | **Endpoint** | **Auth**     | **Description**                              |
| ---------- | ------------ | ------------ | -------------------------------------------- |
| **GET**    | `/medals`    | **Required** | **All user medals (concept + module level)** |

### Learning Style & AI Practice (`/api/learning-style`, `/api/practice`)

| **Method** | **Endpoint**                | **Auth**     | **Description**                              |
| ---------- | --------------------------- | ------------ | -------------------------------------------- |
| **GET**    | `/learning-style/questions` | **Required** | **Learning style quiz questions**            |
| **POST**   | `/learning-style/submit`    | **Required** | **Submit quiz, get style profile**           |
| **GET**    | `/learning-style/profile`   | **Required** | **Retrieve saved profile**                   |
| **POST**   | `/practice/generate`        | **Required** | **AI-generate practice for concept × style** |
| **POST**   | `/practice/check`           | **Required** | **Check AI practice answers**                |

### Teacher Portal (`/api/teacher`) — Requires TEACHER or ADMIN role

| **Method** | **Endpoint**          | **Description**                                 |
| ---------- | --------------------- | ----------------------------------------------- |
| **GET**    | `/students`           | **Paginated student list with progress counts** |
| **GET**    | `/students/:id`       | **Individual student detailed report**          |
| **GET**    | `/overview`           | **Class-level aggregate stats**                 |
| **GET**    | `/modules/:id/report` | **Module-level analytics**                      |
| **GET**    | `/reports/export`     | **CSV download of class report**                |

### Course Pipeline (`/api/courses`) — Requires TEACHER or ADMIN role

| **Method** | **Endpoint**         | **Description**                          |
| ---------- | -------------------- | ---------------------------------------- |
| **POST**   | `/upload`            | **Upload .docx/.md, create draft**       |
| **POST**   | `/:draftId/generate` | **Trigger AI structuring**               |
| **GET**    | `/drafts`            | **List teacher's drafts**                |
| **GET**    | `/:draftId`          | **Draft detail with generated JSON**     |
| **PUT**    | `/:draftId`          | **Save teacher edits**                   |
| **POST**   | `/:draftId/publish`  | **Publish draft → live module (atomic)** |
| **DELETE** | `/:draftId`          | **Delete draft**                         |

### Health (`/api/health`)

| **Method** | **Endpoint** | **Auth**   | **Description**                                          |
| ---------- | ------------ | ---------- | -------------------------------------------------------- |
| **GET**    | `/health`    | **Public** | **Server status + DB connectivity + Redis connectivity** |

---

## 6. Frontend Architecture

### Route Structure

```
app/
  layout.tsx                    → QueryProvider, AuthGuard, Header, Toaster
  login/page.tsx                → Login form
  register/page.tsx             → Registration form
  learn/page.tsx                → Module overview grid
  profile/page.tsx              → User profile + MedalCollection
  learning-style/page.tsx       → Learning style quiz (multi-step)

  module/[moduleId]/
    theme/page.tsx              → Module intro
    reflections/page.tsx        → Module reflection
    concept/[conceptId]/
      tutorial/page.tsx         → Tutorial stories
      practice/question/page.tsx → Quiz questions
      practice/ai/page.tsx      → AI-personalized practice
      summary/page.tsx          → Concept summary

  teacher/
    layout.tsx                  → TeacherSidebar nav
    page.tsx                    → Dashboard (ClassOverviewCards)
    students/page.tsx           → Searchable student table
    students/[id]/page.tsx      → Individual student report
    courses/page.tsx            → Course list (drafts + published)
    courses/new/page.tsx        → Upload form
    courses/[draftId]/page.tsx  → Draft overview
    courses/[draftId]/edit/page.tsx    → Course editor
    courses/[draftId]/preview/page.tsx → Student-view preview
    reports/page.tsx            → Class report + CSV export
```

### State Management

| **Store**                | **Scope**  | **Persistence**  | **Key State**                                                |
| ------------------------ | ---------- | ---------------- | ------------------------------------------------------------ |
| `authStore`(Zustand)     | **Client** | **localStorage** | **User identity, access token, role**                        |
| `progressStore`(Zustand) | **Client** | **localStorage** | **Concept/module completion for gating**                     |
| **React Query cache**    | **Client** | **Memory**       | **All server data (modules, quizzes, medals, teacher data)** |

### Data Flow

<pre class="md-fences md-end-block md-diagram md-fences-advanced ty-contain-cm" spellcheck="false" lang="mermaid" cid="n422" mdtype="fences" mermaid-type="sequence"><div class="md-diagram-panel md-fences-adv-panel"><div class="md-diagram-panel-header md-fences-adv-panel-header"></div><div class="md-diagram-panel-preview md-fences-adv-panel-preview"><svg id="mermaidChart1" width="1672" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="1132" viewBox="-8 -8 1672 1132" role="graphics-document document" aria-roledescription="sequence" class="mermaid-svg"><g><rect x="1506" y="1050" fill="#eaeaea" stroke="#666" width="150" height="65" name="DB" rx="3" ry="3" class="actor actor-bottom"></rect><text x="1581" y="1082.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box"><tspan x="1581" dy="0">PostgreSQL</tspan></text></g><g><rect x="1306" y="1050" fill="#eaeaea" stroke="#666" width="150" height="65" name="AI" rx="3" ry="3" class="actor actor-bottom"></rect><text x="1381" y="1082.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box"><tspan x="1381" dy="0">AI Provider</tspan></text></g><g><rect x="1001" y="1050" fill="#eaeaea" stroke="#666" width="150" height="65" name="BE" rx="3" ry="3" class="actor actor-bottom"></rect><text x="1076" y="1082.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box"><tspan x="1076" dy="0">Express API</tspan></text></g><g><rect x="762" y="1050" fill="#eaeaea" stroke="#666" width="150" height="65" name="API" rx="3" ry="3" class="actor actor-bottom"></rect><text x="837" y="1082.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box"><tspan x="837" dy="0">Axios Client</tspan></text></g><g><rect x="494" y="1050" fill="#eaeaea" stroke="#666" width="152" height="65" name="RQ" rx="3" ry="3" class="actor actor-bottom"></rect><text x="570" y="1082.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box"><tspan x="570" dy="0">React Query Hook</tspan></text></g><g><rect x="210" y="1050" fill="#eaeaea" stroke="#666" width="150" height="65" name="Page" rx="3" ry="3" class="actor actor-bottom"></rect><text x="285" y="1082.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box"><tspan x="285" dy="0">App Page</tspan></text></g><g></g><g><line id="actor6" x1="1581" y1="65" x2="1581" y2="1050" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="DB"></line><g id="root-6"><rect x="1506" y="0" fill="#eaeaea" stroke="#666" width="150" height="65" name="DB" rx="3" ry="3" class="actor actor-top"></rect><text x="1581" y="32.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box"><tspan x="1581" dy="0">PostgreSQL</tspan></text></g></g><g><line id="actor5" x1="1381" y1="65" x2="1381" y2="1050" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="AI"></line><g id="root-5"><rect x="1306" y="0" fill="#eaeaea" stroke="#666" width="150" height="65" name="AI" rx="3" ry="3" class="actor actor-top"></rect><text x="1381" y="32.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box"><tspan x="1381" dy="0">AI Provider</tspan></text></g></g><g><line id="actor4" x1="1076" y1="65" x2="1076" y2="1050" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="BE"></line><g id="root-4"><rect x="1001" y="0" fill="#eaeaea" stroke="#666" width="150" height="65" name="BE" rx="3" ry="3" class="actor actor-top"></rect><text x="1076" y="32.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box"><tspan x="1076" dy="0">Express API</tspan></text></g></g><g><line id="actor3" x1="837" y1="65" x2="837" y2="1050" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="API"></line><g id="root-3"><rect x="762" y="0" fill="#eaeaea" stroke="#666" width="150" height="65" name="API" rx="3" ry="3" class="actor actor-top"></rect><text x="837" y="32.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box"><tspan x="837" dy="0">Axios Client</tspan></text></g></g><g><line id="actor2" x1="570" y1="65" x2="570" y2="1050" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="RQ"></line><g id="root-2"><rect x="494" y="0" fill="#eaeaea" stroke="#666" width="152" height="65" name="RQ" rx="3" ry="3" class="actor actor-top"></rect><text x="570" y="32.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box"><tspan x="570" dy="0">React Query Hook</tspan></text></g></g><g><line id="actor1" x1="285" y1="65" x2="285" y2="1050" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="Page"></line><g id="root-1"><rect x="210" y="0" fill="#eaeaea" stroke="#666" width="150" height="65" name="Page" rx="3" ry="3" class="actor actor-top"></rect><text x="285" y="32.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box"><tspan x="285" dy="0">App Page</tspan></text></g></g><g><line id="actor0" x1="75" y1="80" x2="75" y2="1050" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="Student"></line></g><g></g><defs><symbol id="computer" width="24" height="24"><path transform="scale(.5)" d="M2 2v13h20v-13h-20zm18 11h-16v-9h16v9zm-10.228 6l.466-1h3.524l.467 1h-4.457zm14.228 3h-24l2-6h2.104l-1.33 4h18.45l-1.297-4h2.073l2 6zm-5-10h-14v-7h14v7z"></path></symbol></defs><defs><symbol id="database" fill-rule="evenodd" clip-rule="evenodd"><path transform="scale(.5)" d="M12.258.001l.256.004.255.005.253.008.251.01.249.012.247.015.246.016.242.019.241.02.239.023.236.024.233.027.231.028.229.031.225.032.223.034.22.036.217.038.214.04.211.041.208.043.205.045.201.046.198.048.194.05.191.051.187.053.183.054.18.056.175.057.172.059.168.06.163.061.16.063.155.064.15.066.074.033.073.033.071.034.07.034.069.035.068.035.067.035.066.035.064.036.064.036.062.036.06.036.06.037.058.037.058.037.055.038.055.038.053.038.052.038.051.039.05.039.048.039.047.039.045.04.044.04.043.04.041.04.04.041.039.041.037.041.036.041.034.041.033.042.032.042.03.042.029.042.027.042.026.043.024.043.023.043.021.043.02.043.018.044.017.043.015.044.013.044.012.044.011.045.009.044.007.045.006.045.004.045.002.045.001.045v17l-.001.045-.002.045-.004.045-.006.045-.007.045-.009.044-.011.045-.012.044-.013.044-.015.044-.017.043-.018.044-.02.043-.021.043-.023.043-.024.043-.026.043-.027.042-.029.042-.03.042-.032.042-.033.042-.034.041-.036.041-.037.041-.039.041-.04.041-.041.04-.043.04-.044.04-.045.04-.047.039-.048.039-.05.039-.051.039-.052.038-.053.038-.055.038-.055.038-.058.037-.058.037-.06.037-.06.036-.062.036-.064.036-.064.036-.066.035-.067.035-.068.035-.069.035-.07.034-.071.034-.073.033-.074.033-.15.066-.155.064-.16.063-.163.061-.168.06-.172.059-.175.057-.18.056-.183.054-.187.053-.191.051-.194.05-.198.048-.201.046-.205.045-.208.043-.211.041-.214.04-.217.038-.22.036-.223.034-.225.032-.229.031-.231.028-.233.027-.236.024-.239.023-.241.02-.242.019-.246.016-.247.015-.249.012-.251.01-.253.008-.255.005-.256.004-.258.001-.258-.001-.256-.004-.255-.005-.253-.008-.251-.01-.249-.012-.247-.015-.245-.016-.243-.019-.241-.02-.238-.023-.236-.024-.234-.027-.231-.028-.228-.031-.226-.032-.223-.034-.22-.036-.217-.038-.214-.04-.211-.041-.208-.043-.204-.045-.201-.046-.198-.048-.195-.05-.19-.051-.187-.053-.184-.054-.179-.056-.176-.057-.172-.059-.167-.06-.164-.061-.159-.063-.155-.064-.151-.066-.074-.033-.072-.033-.072-.034-.07-.034-.069-.035-.068-.035-.067-.035-.066-.035-.064-.036-.063-.036-.062-.036-.061-.036-.06-.037-.058-.037-.057-.037-.056-.038-.055-.038-.053-.038-.052-.038-.051-.039-.049-.039-.049-.039-.046-.039-.046-.04-.044-.04-.043-.04-.041-.04-.04-.041-.039-.041-.037-.041-.036-.041-.034-.041-.033-.042-.032-.042-.03-.042-.029-.042-.027-.042-.026-.043-.024-.043-.023-.043-.021-.043-.02-.043-.018-.044-.017-.043-.015-.044-.013-.044-.012-.044-.011-.045-.009-.044-.007-.045-.006-.045-.004-.045-.002-.045-.001-.045v-17l.001-.045.002-.045.004-.045.006-.045.007-.045.009-.044.011-.045.012-.044.013-.044.015-.044.017-.043.018-.044.02-.043.021-.043.023-.043.024-.043.026-.043.027-.042.029-.042.03-.042.032-.042.033-.042.034-.041.036-.041.037-.041.039-.041.04-.041.041-.04.043-.04.044-.04.046-.04.046-.039.049-.039.049-.039.051-.039.052-.038.053-.038.055-.038.056-.038.057-.037.058-.037.06-.037.061-.036.062-.036.063-.036.064-.036.066-.035.067-.035.068-.035.069-.035.07-.034.072-.034.072-.033.074-.033.151-.066.155-.064.159-.063.164-.061.167-.06.172-.059.176-.057.179-.056.184-.054.187-.053.19-.051.195-.05.198-.048.201-.046.204-.045.208-.043.211-.041.214-.04.217-.038.22-.036.223-.034.226-.032.228-.031.231-.028.234-.027.236-.024.238-.023.241-.02.243-.019.245-.016.247-.015.249-.012.251-.01.253-.008.255-.005.256-.004.258-.001.258.001zm-9.258 20.499v.01l.001.021.003.021.004.022.005.021.006.022.007.022.009.023.01.022.011.023.012.023.013.023.015.023.016.024.017.023.018.024.019.024.021.024.022.025.023.024.024.025.052.049.056.05.061.051.066.051.07.051.075.051.079.052.084.052.088.052.092.052.097.052.102.051.105.052.11.052.114.051.119.051.123.051.127.05.131.05.135.05.139.048.144.049.147.047.152.047.155.047.16.045.163.045.167.043.171.043.176.041.178.041.183.039.187.039.19.037.194.035.197.035.202.033.204.031.209.03.212.029.216.027.219.025.222.024.226.021.23.02.233.018.236.016.24.015.243.012.246.01.249.008.253.005.256.004.259.001.26-.001.257-.004.254-.005.25-.008.247-.011.244-.012.241-.014.237-.016.233-.018.231-.021.226-.021.224-.024.22-.026.216-.027.212-.028.21-.031.205-.031.202-.034.198-.034.194-.036.191-.037.187-.039.183-.04.179-.04.175-.042.172-.043.168-.044.163-.045.16-.046.155-.046.152-.047.148-.048.143-.049.139-.049.136-.05.131-.05.126-.05.123-.051.118-.052.114-.051.11-.052.106-.052.101-.052.096-.052.092-.052.088-.053.083-.051.079-.052.074-.052.07-.051.065-.051.06-.051.056-.05.051-.05.023-.024.023-.025.021-.024.02-.024.019-.024.018-.024.017-.024.015-.023.014-.024.013-.023.012-.023.01-.023.01-.022.008-.022.006-.022.006-.022.004-.022.004-.021.001-.021.001-.021v-4.127l-.077.055-.08.053-.083.054-.085.053-.087.052-.09.052-.093.051-.095.05-.097.05-.1.049-.102.049-.105.048-.106.047-.109.047-.111.046-.114.045-.115.045-.118.044-.12.043-.122.042-.124.042-.126.041-.128.04-.13.04-.132.038-.134.038-.135.037-.138.037-.139.035-.142.035-.143.034-.144.033-.147.032-.148.031-.15.03-.151.03-.153.029-.154.027-.156.027-.158.026-.159.025-.161.024-.162.023-.163.022-.165.021-.166.02-.167.019-.169.018-.169.017-.171.016-.173.015-.173.014-.175.013-.175.012-.177.011-.178.01-.179.008-.179.008-.181.006-.182.005-.182.004-.184.003-.184.002h-.37l-.184-.002-.184-.003-.182-.004-.182-.005-.181-.006-.179-.008-.179-.008-.178-.01-.176-.011-.176-.012-.175-.013-.173-.014-.172-.015-.171-.016-.17-.017-.169-.018-.167-.019-.166-.02-.165-.021-.163-.022-.162-.023-.161-.024-.159-.025-.157-.026-.156-.027-.155-.027-.153-.029-.151-.03-.15-.03-.148-.031-.146-.032-.145-.033-.143-.034-.141-.035-.14-.035-.137-.037-.136-.037-.134-.038-.132-.038-.13-.04-.128-.04-.126-.041-.124-.042-.122-.042-.12-.044-.117-.043-.116-.045-.113-.045-.112-.046-.109-.047-.106-.047-.105-.048-.102-.049-.1-.049-.097-.05-.095-.05-.093-.052-.09-.051-.087-.052-.085-.053-.083-.054-.08-.054-.077-.054v4.127zm0-5.654v.011l.001.021.003.021.004.021.005.022.006.022.007.022.009.022.01.022.011.023.012.023.013.023.015.024.016.023.017.024.018.024.019.024.021.024.022.024.023.025.024.024.052.05.056.05.061.05.066.051.07.051.075.052.079.051.084.052.088.052.092.052.097.052.102.052.105.052.11.051.114.051.119.052.123.05.127.051.131.05.135.049.139.049.144.048.147.048.152.047.155.046.16.045.163.045.167.044.171.042.176.042.178.04.183.04.187.038.19.037.194.036.197.034.202.033.204.032.209.03.212.028.216.027.219.025.222.024.226.022.23.02.233.018.236.016.24.014.243.012.246.01.249.008.253.006.256.003.259.001.26-.001.257-.003.254-.006.25-.008.247-.01.244-.012.241-.015.237-.016.233-.018.231-.02.226-.022.224-.024.22-.025.216-.027.212-.029.21-.03.205-.032.202-.033.198-.035.194-.036.191-.037.187-.039.183-.039.179-.041.175-.042.172-.043.168-.044.163-.045.16-.045.155-.047.152-.047.148-.048.143-.048.139-.05.136-.049.131-.05.126-.051.123-.051.118-.051.114-.052.11-.052.106-.052.101-.052.096-.052.092-.052.088-.052.083-.052.079-.052.074-.051.07-.052.065-.051.06-.05.056-.051.051-.049.023-.025.023-.024.021-.025.02-.024.019-.024.018-.024.017-.024.015-.023.014-.023.013-.024.012-.022.01-.023.01-.023.008-.022.006-.022.006-.022.004-.021.004-.022.001-.021.001-.021v-4.139l-.077.054-.08.054-.083.054-.085.052-.087.053-.09.051-.093.051-.095.051-.097.05-.1.049-.102.049-.105.048-.106.047-.109.047-.111.046-.114.045-.115.044-.118.044-.12.044-.122.042-.124.042-.126.041-.128.04-.13.039-.132.039-.134.038-.135.037-.138.036-.139.036-.142.035-.143.033-.144.033-.147.033-.148.031-.15.03-.151.03-.153.028-.154.028-.156.027-.158.026-.159.025-.161.024-.162.023-.163.022-.165.021-.166.02-.167.019-.169.018-.169.017-.171.016-.173.015-.173.014-.175.013-.175.012-.177.011-.178.009-.179.009-.179.007-.181.007-.182.005-.182.004-.184.003-.184.002h-.37l-.184-.002-.184-.003-.182-.004-.182-.005-.181-.007-.179-.007-.179-.009-.178-.009-.176-.011-.176-.012-.175-.013-.173-.014-.172-.015-.171-.016-.17-.017-.169-.018-.167-.019-.166-.02-.165-.021-.163-.022-.162-.023-.161-.024-.159-.025-.157-.026-.156-.027-.155-.028-.153-.028-.151-.03-.15-.03-.148-.031-.146-.033-.145-.033-.143-.033-.141-.035-.14-.036-.137-.036-.136-.037-.134-.038-.132-.039-.13-.039-.128-.04-.126-.041-.124-.042-.122-.043-.12-.043-.117-.044-.116-.044-.113-.046-.112-.046-.109-.046-.106-.047-.105-.048-.102-.049-.1-.049-.097-.05-.095-.051-.093-.051-.09-.051-.087-.053-.085-.052-.083-.054-.08-.054-.077-.054v4.139zm0-5.666v.011l.001.02.003.022.004.021.005.022.006.021.007.022.009.023.01.022.011.023.012.023.013.023.015.023.016.024.017.024.018.023.019.024.021.025.022.024.023.024.024.025.052.05.056.05.061.05.066.051.07.051.075.052.079.051.084.052.088.052.092.052.097.052.102.052.105.051.11.052.114.051.119.051.123.051.127.05.131.05.135.05.139.049.144.048.147.048.152.047.155.046.16.045.163.045.167.043.171.043.176.042.178.04.183.04.187.038.19.037.194.036.197.034.202.033.204.032.209.03.212.028.216.027.219.025.222.024.226.021.23.02.233.018.236.017.24.014.243.012.246.01.249.008.253.006.256.003.259.001.26-.001.257-.003.254-.006.25-.008.247-.01.244-.013.241-.014.237-.016.233-.018.231-.02.226-.022.224-.024.22-.025.216-.027.212-.029.21-.03.205-.032.202-.033.198-.035.194-.036.191-.037.187-.039.183-.039.179-.041.175-.042.172-.043.168-.044.163-.045.16-.045.155-.047.152-.047.148-.048.143-.049.139-.049.136-.049.131-.051.126-.05.123-.051.118-.052.114-.051.11-.052.106-.052.101-.052.096-.052.092-.052.088-.052.083-.052.079-.052.074-.052.07-.051.065-.051.06-.051.056-.05.051-.049.023-.025.023-.025.021-.024.02-.024.019-.024.018-.024.017-.024.015-.023.014-.024.013-.023.012-.023.01-.022.01-.023.008-.022.006-.022.006-.022.004-.022.004-.021.001-.021.001-.021v-4.153l-.077.054-.08.054-.083.053-.085.053-.087.053-.09.051-.093.051-.095.051-.097.05-.1.049-.102.048-.105.048-.106.048-.109.046-.111.046-.114.046-.115.044-.118.044-.12.043-.122.043-.124.042-.126.041-.128.04-.13.039-.132.039-.134.038-.135.037-.138.036-.139.036-.142.034-.143.034-.144.033-.147.032-.148.032-.15.03-.151.03-.153.028-.154.028-.156.027-.158.026-.159.024-.161.024-.162.023-.163.023-.165.021-.166.02-.167.019-.169.018-.169.017-.171.016-.173.015-.173.014-.175.013-.175.012-.177.01-.178.01-.179.009-.179.007-.181.006-.182.006-.182.004-.184.003-.184.001-.185.001-.185-.001-.184-.001-.184-.003-.182-.004-.182-.006-.181-.006-.179-.007-.179-.009-.178-.01-.176-.01-.176-.012-.175-.013-.173-.014-.172-.015-.171-.016-.17-.017-.169-.018-.167-.019-.166-.02-.165-.021-.163-.023-.162-.023-.161-.024-.159-.024-.157-.026-.156-.027-.155-.028-.153-.028-.151-.03-.15-.03-.148-.032-.146-.032-.145-.033-.143-.034-.141-.034-.14-.036-.137-.036-.136-.037-.134-.038-.132-.039-.13-.039-.128-.041-.126-.041-.124-.041-.122-.043-.12-.043-.117-.044-.116-.044-.113-.046-.112-.046-.109-.046-.106-.048-.105-.048-.102-.048-.1-.05-.097-.049-.095-.051-.093-.051-.09-.052-.087-.052-.085-.053-.083-.053-.08-.054-.077-.054v4.153zm8.74-8.179l-.257.004-.254.005-.25.008-.247.011-.244.012-.241.014-.237.016-.233.018-.231.021-.226.022-.224.023-.22.026-.216.027-.212.028-.21.031-.205.032-.202.033-.198.034-.194.036-.191.038-.187.038-.183.04-.179.041-.175.042-.172.043-.168.043-.163.045-.16.046-.155.046-.152.048-.148.048-.143.048-.139.049-.136.05-.131.05-.126.051-.123.051-.118.051-.114.052-.11.052-.106.052-.101.052-.096.052-.092.052-.088.052-.083.052-.079.052-.074.051-.07.052-.065.051-.06.05-.056.05-.051.05-.023.025-.023.024-.021.024-.02.025-.019.024-.018.024-.017.023-.015.024-.014.023-.013.023-.012.023-.01.023-.01.022-.008.022-.006.023-.006.021-.004.022-.004.021-.001.021-.001.021.001.021.001.021.004.021.004.022.006.021.006.023.008.022.01.022.01.023.012.023.013.023.014.023.015.024.017.023.018.024.019.024.02.025.021.024.023.024.023.025.051.05.056.05.06.05.065.051.07.052.074.051.079.052.083.052.088.052.092.052.096.052.101.052.106.052.11.052.114.052.118.051.123.051.126.051.131.05.136.05.139.049.143.048.148.048.152.048.155.046.16.046.163.045.168.043.172.043.175.042.179.041.183.04.187.038.191.038.194.036.198.034.202.033.205.032.21.031.212.028.216.027.22.026.224.023.226.022.231.021.233.018.237.016.241.014.244.012.247.011.25.008.254.005.257.004.26.001.26-.001.257-.004.254-.005.25-.008.247-.011.244-.012.241-.014.237-.016.233-.018.231-.021.226-.022.224-.023.22-.026.216-.027.212-.028.21-.031.205-.032.202-.033.198-.034.194-.036.191-.038.187-.038.183-.04.179-.041.175-.042.172-.043.168-.043.163-.045.16-.046.155-.046.152-.048.148-.048.143-.048.139-.049.136-.05.131-.05.126-.051.123-.051.118-.051.114-.052.11-.052.106-.052.101-.052.096-.052.092-.052.088-.052.083-.052.079-.052.074-.051.07-.052.065-.051.06-.05.056-.05.051-.05.023-.025.023-.024.021-.024.02-.025.019-.024.018-.024.017-.023.015-.024.014-.023.013-.023.012-.023.01-.023.01-.022.008-.022.006-.023.006-.021.004-.022.004-.021.001-.021.001-.021-.001-.021-.001-.021-.004-.021-.004-.022-.006-.021-.006-.023-.008-.022-.01-.022-.01-.023-.012-.023-.013-.023-.014-.023-.015-.024-.017-.023-.018-.024-.019-.024-.02-.025-.021-.024-.023-.024-.023-.025-.051-.05-.056-.05-.06-.05-.065-.051-.07-.052-.074-.051-.079-.052-.083-.052-.088-.052-.092-.052-.096-.052-.101-.052-.106-.052-.11-.052-.114-.052-.118-.051-.123-.051-.126-.051-.131-.05-.136-.05-.139-.049-.143-.048-.148-.048-.152-.048-.155-.046-.16-.046-.163-.045-.168-.043-.172-.043-.175-.042-.179-.041-.183-.04-.187-.038-.191-.038-.194-.036-.198-.034-.202-.033-.205-.032-.21-.031-.212-.028-.216-.027-.22-.026-.224-.023-.226-.022-.231-.021-.233-.018-.237-.016-.241-.014-.244-.012-.247-.011-.25-.008-.254-.005-.257-.004-.26-.001-.26.001z"></path></symbol></defs><defs><symbol id="clock" width="24" height="24"><path transform="scale(.5)" d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.848 12.459c.202.038.202.333.001.372-1.907.361-6.045 1.111-6.547 1.111-.719 0-1.301-.582-1.301-1.301 0-.512.77-5.447 1.125-7.445.034-.192.312-.181.343.014l.985 6.238 5.394 1.011z"></path></symbol></defs><defs><marker id="arrowhead" refX="7.9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M -1 0 L 10 5 L 0 10 z"></path></marker></defs><defs><marker id="crosshead" markerWidth="15" markerHeight="8" orient="auto" refX="4" refY="4.5"><path fill="none" stroke="#000000" stroke-width="1pt" d="M 1,2 L 6,7 M 6,2 L 1,7"></path></marker></defs><defs><marker id="filled-head" refX="15.5" refY="7" markerWidth="20" markerHeight="28" orient="auto"><path d="M 18,7 L9,13 L14,7 L9,1 Z"></path></marker></defs><defs><marker id="sequencenumber" refX="15" refY="15" markerWidth="60" markerHeight="40" orient="auto"><circle cx="15" cy="15" r="6"></circle></marker></defs><g><line x1="1067" y1="717" x2="1590" y2="717" class="loopLine"></line><line x1="1590" y1="717" x2="1590" y2="942" class="loopLine"></line><line x1="1067" y1="942" x2="1590" y2="942" class="loopLine"></line><line x1="1067" y1="717" x2="1067" y2="942" class="loopLine"></line><polygon points="1067,717 1117,717 1117,730 1108.6,737 1067,737" class="labelBox"></polygon><text x="1092" y="730" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="labelText">alt</text><text x="1353.5" y="733" text-anchor="middle" class="loopText"><tspan x="1353.5">[Cache miss]</tspan></text></g><g class="actor-man actor-top" name="Student"><line id="actor-man-torso0" x1="75" y1="25" x2="75" y2="45"></line><line id="actor-man-arms0" x1="57" y1="33" x2="93" y2="33"></line><line x1="57" y1="60" x2="75" y2="45"></line><line x1="75" y1="45" x2="91" y2="60"></line><circle cx="75" cy="10" r="15" width="150" height="65"></circle><text x="75" y="67.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-man"><tspan x="75" dy="0">Student</tspan></text></g><text x="179" y="80" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">Complete quiz</text><line x1="76" y1="111" x2="281" y2="111" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="426" y="126" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">useSubmitQuiz()</text><line x1="286" y1="157" x2="566" y2="157" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="702" y="172" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">POST /concepts/:id/quizzes</text><line x1="571" y1="203" x2="833" y2="203" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="955" y="218" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">Bearer token + answers</text><line x1="838" y1="249" x2="1072" y2="249" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="1327" y="264" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">Save User_response</text><line x1="1077" y1="295" x2="1577" y2="295" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="1327" y="310" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">Calculate accuracy → upsert medal</text><line x1="1077" y1="341" x2="1577" y2="341" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="958" y="356" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">{ score, medal }</text><line x1="1075" y1="387" x2="841" y2="387" class="messageLine1" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="705" y="402" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">Invalidate ["medals"] cache</text><line x1="836" y1="433" x2="574" y2="433" class="messageLine1" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="429" y="448" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">Updated score + medal badge</text><line x1="569" y1="479" x2="289" y2="479" class="messageLine1" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="179" y="494" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">Request AI practice</text><line x1="76" y1="525" x2="281" y2="525" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="426" y="540" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">useGeneratePractice()</text><line x1="286" y1="571" x2="566" y2="571" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="702" y="586" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">POST /practice/generate</text><line x1="571" y1="617" x2="833" y2="617" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="955" y="632" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">{ conceptId }</text><line x1="838" y1="663" x2="1072" y2="663" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="1327" y="678" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">Check AI_practice_cache</text><line x1="1077" y1="709" x2="1577" y2="709" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="1327" y="765" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">Fetch concept + user learning profile</text><line x1="1077" y1="796" x2="1577" y2="796" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="1227" y="811" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">Generate personalized questions</text><line x1="1077" y1="842" x2="1377" y2="842" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="1230" y="857" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">Structured JSON</text><line x1="1380" y1="888" x2="1080" y2="888" class="messageLine1" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="1327" y="903" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">Cache result (1hr TTL)</text><line x1="1077" y1="934" x2="1577" y2="934" class="messageLine0" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="958" y="957" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">AI-generated questions</text><line x1="1075" y1="988" x2="841" y2="988" class="messageLine1" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><text x="429" y="1003" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em">Render practice UI</text><line x1="569" y1="1034" x2="289" y2="1034" class="messageLine1" stroke-width="2" stroke="none" marker-end="url(#arrowhead)"></line><g class="actor-man actor-bottom" name="Student"><line id="actor-man-torso6" x1="75" y1="1075" x2="75" y2="1095"></line><line id="actor-man-arms6" x1="57" y1="1083" x2="93" y2="1083"></line><line x1="57" y1="1110" x2="75" y2="1095"></line><line x1="75" y1="1095" x2="91" y2="1110"></line><circle cx="75" cy="1060" r="15" width="150" height="65"></circle><text x="75" y="1117.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-man"><tspan x="75" dy="0">Student</tspan></text></g></svg></div><div class="md-diagram-panel-error md-fences-adv-panel-error"></div></div></pre>

---

## 7. AI Integration

### Provider Abstraction

```
src/services/ai/
  AIProvider.ts           → Interface: complete(messages), completeJSON<T>(messages)
  OpenAIProvider.ts       → OpenAI SDK implementation
  AnthropicProvider.ts    → Anthropic SDK implementation
  AIProviderFactory.ts    → Factory reads AI_PROVIDER env, returns provider instance
```

**All AI-consuming services receive the provider via constructor injection from **`app.ts`. No service directly imports vendor SDKs.

### AI Use Cases

| **Use Case**            | **Model**                       | **Input**                                | **Output**                                                            |
| ----------------------- | ------------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| **Practice generation** | **gpt-4o-mini (fast, cheap)**   | **Concept definition + learning style**  | **3 personalized MCQ questions**                                      |
| **Course structuring**  | **gpt-4o (stronger reasoning)** | **Raw curriculum text + format example** | **Full module JSON (theme, concepts, tutorials, quizzes, summaries)** |

### Cost Control

| **Strategy**          | **Mechanism**                                                                       |
| --------------------- | ----------------------------------------------------------------------------------- |
| **DB-backed cache**   | `AI_practice_cache`table keyed by concept × learning style, 1hr TTL                 |
| **Model tiering**     | **Cheap model for practice, strong model for course generation**                    |
| **Rate limiting**     | **Max 10 AI calls/user/hour (Redis-based distributed counter via** `INCR`+`EXPIRE`) |
| **Graceful fallback** | **On AI failure, serve existing (non-personalized) quiz questions**                 |

### Learning Style System

**Students take an 8-10 question multiple choice quiz. Each answer maps to a style category (Visual, Verbal, Scenario). The highest-scoring category becomes the primary style, stored in **`User_learning_profile`. AI practice prompts are adapted per style:

- **Visual**: Vivid imagery, scene descriptions, diagram references
- **Verbal**: Clear definitions, logical reasoning, textual explanations
- **Scenario**: Realistic situations, "what would you do" framing

---

## 8. Authentication & Authorization

### Token Model

| **Token**         | **Mechanism**                            | **Expiry** | **Storage**                         |
| ----------------- | ---------------------------------------- | ---------- | ----------------------------------- |
| **Access token**  | **JWT in** `Authorization: Bearer`header | **15 min** | **Frontend Zustand store**          |
| **Refresh token** | **JWT in httpOnly cookie + DB record**   | **7 days** | **Server-side** `RefreshToken`table |

### Role-Based Access

| **Role**    | **Permissions**                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------- |
| **STUDENT** | **Learning content, quiz submission, progress tracking, medals, AI practice, learning style quiz** |
| **TEACHER** | **All student permissions + teacher portal, student reports, course upload/publish**               |
| **ADMIN**   | **All teacher permissions + seed endpoints**                                                       |

**Enforcement: **`authMiddleware` validates JWT on all protected routes. `requireRole(...roles)` middleware factory guards teacher/admin-only route groups.

### Token Refresh Flow

**On 401, the Axios client queues pending requests, calls **`POST /auth/refresh`, updates the stored token, and retries all queued requests. On refresh failure, the client clears auth state and redirects to login. Progress store resets on logout to prevent cross-user data leakage.

---

## 9. Course Generation Pipeline

```
Teacher uploads .docx/markdown
        │
        ▼
   PARSE (Mammoth / raw text)
        │
        ▼
   Store raw text in Course_draft.source_content
        │
        ▼
   AI GENERATE → structured JSON (module + theme + concepts + tutorials + quizzes + summaries)
        │
        ▼
   Store in Course_draft.generated_json — status: REVIEW
        │
        ▼
   TEACHER REVIEW/EDIT via course editor UI
        │
        ▼
   PUBLISH → Prisma $transaction inserts Module + all child records atomically
        │
        ▼
   Students see new module in /learn
```

**Course drafts track lifecycle via **`CourseStatus` enum: DRAFT → REVIEW → PUBLISHED → ARCHIVED.

**Publishing reuses the same **`seedModuleFromJSON()` utility as the seed script, ensuring consistent data structure.

---

## 10. Medal System

### Calculation

- **Per concept**: Latest quiz response accuracy across all quizzes → threshold → tier
- **Per module**: Average of all concept medal accuracies (requires all concepts attempted)

| **Tier**   | **Accuracy Threshold** |
| ---------- | ---------------------- |
| **Gold**   | **>= 90%**             |
| **Silver** | **>= 70%**             |
| **Bronze** | **>= 50%**             |
| **None**   | **< 50%**              |

**Medals are recalculated on every quiz submission via **`MedalService.awardConceptMedal()` and checked for module completion. Stored in `User_concept_medal` and `User_module_medal` with upsert semantics. Medals never downgrade — if a student retakes a quiz and scores lower, the previous (higher) medal is preserved.

---

## 11. Deployment & Infrastructure

| **Component** | **Platform**           | **Plan**                                                                            |
| ------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| **Frontend**  | **Vercel**             | **Free (Hobby) — auto-deploy from** `main`                                          |
| **Backend**   | **Fly.io**             | **Single instance ($3-5/mo) — scalable to multiple instances without code changes** |
| **Database**  | **Render PostgreSQL**  | **Standard ($20/mo, 4GB)**                                                          |
| **Cache**     | **Redis (Upstash)**    | **Pro (~$10/mo) — distributed caching, rate limiting**                              |
| **AI APIs**   | **OpenAI + Anthropic** | **Pay-as-you-go (~$5-10/mo for 500 users)**                                         |

### Deployment

```
Manual deployment:
  ├── Backend: fly deploy (single instance on Fly.io)
  └── Frontend: Vercel auto-deploys on push to main
```

### Performance Targets

| **Metric**                | **Target**  |
| ------------------------- | ----------- |
| **CRUD API (p95)**        | **< 200ms** |
| **Teacher reports (p95)** | **< 1s**    |
| **AI generation (p95)**   | **< 15s**   |
| **Frontend TTI**          | **< 2s**    |

### Horizontal Scaling Design (architecture-ready, not deployed)

**The application is designed for horizontal scaling, though the initial deployment uses a single instance:**

- **Stateless instances**: No instance holds unique state — any request can be served by any instance.
- **Shared state via Redis**: Teacher report caches and AI rate limiting counters are stored in Redis, accessible by all instances.
- **Health checks**: `GET /api/health` reports server status, DB connectivity, and Redis connectivity.
- **Scaling path**: Add instances on Fly.io without code changes. Fly.io's built-in load balancer distributes traffic automatically.

---

## 12. Performance Design

### Database

- **Prisma **`select` over `include` to fetch only needed fields
- `groupBy` + `_count`/`_avg` for teacher report aggregation (avoids N+1)
- **Composite indexes on **`User_response(quiz_id, user_id, created_at)` for fast medal lookup
- **Pagination on all list endpoints (**`page`, `limit`, `total`, `totalPages`)
- **Teacher queries designed with future **`class_id` filter column in mind

### Caching

| **Layer**    | **Target**                | **TTL**                   | **Mechanism**                                   |
| ------------ | ------------------------- | ------------------------- | ----------------------------------------------- |
| **Backend**  | **AI practice questions** | **1 hour**                | **PostgreSQL** `AI_practice_cache`table         |
| **Backend**  | **Teacher reports**       | **5 min**                 | **Redis with TTL (**`SET key value EX 300`)     |
| **Backend**  | **AI rate limiting**      | **1 hour window**         | **Redis distributed counter (**`INCR`+`EXPIRE`) |
| **Frontend** | **Teacher overview**      | **5 min**                 | **React Query** `staleTime`                     |
| **Frontend** | **Medals**                | **Until quiz submission** | **React Query invalidation**                    |

### Frontend

- **Dynamic imports for teacher portal and AI practice (students never load teacher code)**
- **Optimistic UI updates for quiz submissions via React Query **`onMutate`
- **Medal query prefetch on login**

---

## 13. Project Structure

### Backend

```
src/
  app.ts                        # Express setup + full DI wiring
  server.ts                     # Server bootstrap
  lib/prisma.ts                 # Prisma client with pg adapter
  lib/redis.ts                  # Redis client singleton (ioredis)
  lib/cache.ts                  # Redis-backed cache utility (get/set with TTL, distributed rate limiter)

  controller/
    AuthController.ts
    ModuleController.ts
    ConceptController.ts
    MedalController.ts
    TeacherController.ts
    CourseController.ts
    PracticeController.ts
    LearningStyleController.ts
    SeedController.ts

  services/
    AuthService.ts
    ModuleService.ts
    ConceptService.ts
    UserProgressService.ts
    MedalService.ts
    TeacherService.ts
    CourseGeneratorService.ts
    PracticeGeneratorService.ts
    LearningStyleService.ts
    SeedService.ts
    ai/
      AIProvider.ts             # Interface
      OpenAIProvider.ts
      AnthropicProvider.ts
      AIProviderFactory.ts

  repositories/
    UserRepository.ts
    RefreshTokenRepository.ts
    ModuleRepository.ts
    ConceptRepository.ts
    UserProgressRepository.ts
    MedalRepository.ts
    TeacherRepository.ts
    CourseDraftRepository.ts
    LearningProfileRepository.ts
    PracticeCacheRepository.ts

  routes/
    auth.routes.ts
    module.routes.ts
    concept.routes.ts
    medal.routes.ts
    teacher.routes.ts
    course.routes.ts
    practice.routes.ts
    learningStyle.routes.ts
    seed.routes.ts

  middleware/
    authMiddleware.ts           # JWT validation + requireRole() factory
    errorHandler.ts             # Global error handler

  dtos/
    request/                    # Zod-validated input shapes
    response/                   # Typed output contracts

  constants/
    medalThresholds.ts          # Medal tier calculation
    responseTypes.ts
    userRoleTypes.ts

  validation/
    authValidation.ts
    courseValidation.ts         # Zod schema for course JSON structure

  utils/
    errors.ts                  # AppError base class + subclasses
    courseSeeder.ts             # Shared Module-from-JSON insertion (used by seed + publish)

prisma/
  schema.prisma                # Full PostgreSQL schema
  seed/                        # Seed data and scripts
```

### Frontend

```
app/
  layout.tsx                   # Providers, AuthGuard, Header, Toaster
  login/ register/             # Auth pages
  learn/                       # Module overview
  profile/                     # User profile + medals
  learning-style/              # Learning style quiz
  module/[moduleId]/           # Theme, reflections, concept flow, AI practice
  teacher/                     # Dashboard, students, courses, reports

components/
  auth/                        # Login/register forms
  learn/                       # Module cards, concept flow UI
  medal/                       # MedalBadge, MedalCollection
  practice/                    # LearningStyleQuiz, AIPracticeQuestion
  teacher/                     # Sidebar, StudentTable, ClassOverviewCards, CourseEditor
  guards/                      # AuthGuard (role-aware routing)
  layout/                      # Header (role-aware nav)
  ui/                          # shadcn primitives

lib/
  api/client.ts                # Axios config, token refresh, typed API methods
  hooks/useApi.ts              # React Query hooks (student endpoints)
  hooks/useTeacherApi.ts       # React Query hooks (teacher endpoints)
  state/authStore.ts           # Zustand — identity, token, role
  state/progressStore.ts       # Zustand — learning progress, gating
  types/api.ts                 # API contracts (shared)
  types/teacher.ts             # Teacher-specific types
  providers/QueryProvider.tsx  # React Query setup
```
