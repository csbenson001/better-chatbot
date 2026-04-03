import { config } from "dotenv";

config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  PromptCategoryTable,
  PromptItemTable,
} from "../src/lib/db/pg/schema.pg";
import { count } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL!,
});
const db = drizzle(pool);

const SEED_DATA = [
  {
    label: "Write",
    icon: "PenLine",
    sequence: 1,
    items: [
      {
        label: "Improve my essay",
        prompt:
          "I'd like help improving my essay. Please review it for clarity, structure, and style, then suggest specific improvements.",
        sequence: 1,
      },
      {
        label: "Send a professional email",
        prompt:
          "Help me write a professional email. I'll describe the situation and recipient, and you'll draft a clear, polite message.",
        sequence: 2,
      },
      {
        label: "Summarize a document",
        prompt:
          "Please summarize the following document. Provide key points, main arguments, and any important conclusions.",
        sequence: 3,
      },
      {
        label: "Brainstorm ideas",
        prompt:
          "Help me brainstorm ideas for the following topic. Give me a diverse range of creative and practical suggestions.",
        sequence: 4,
      },
      {
        label: "Write a blog post",
        prompt:
          "Help me write a blog post. I'll share the topic and audience, and you'll draft an engaging, well-structured post.",
        sequence: 5,
      },
      {
        label: "Create a cover letter",
        prompt:
          "Help me write a cover letter for a job application. I'll share the role and my background, and you'll craft a compelling letter.",
        sequence: 6,
      },
    ],
  },
  {
    label: "Learn",
    icon: "GraduationCap",
    sequence: 2,
    items: [
      {
        label: "Summarize my academic papers",
        prompt:
          "Please summarize the following academic paper. Highlight the research question, methodology, key findings, and implications.",
        sequence: 1,
      },
      {
        label: "Help me make sense of these ideas",
        prompt:
          "I'm trying to understand some complex ideas. Can you explain them clearly, using analogies where helpful?",
        sequence: 2,
      },
      {
        label: "Find the best books on a subject",
        prompt:
          "Recommend the best books on the following subject. Include a mix of introductory and advanced texts with brief descriptions of each.",
        sequence: 3,
      },
      {
        label: "Develop research methodologies",
        prompt:
          "Help me develop a research methodology for my project. I'll describe my research question and you'll suggest appropriate methods.",
        sequence: 4,
      },
      {
        label: "Create learning timelines",
        prompt:
          "Create a structured learning timeline for mastering the following subject. Include milestones, resources, and estimated time for each phase.",
        sequence: 5,
      },
    ],
  },
  {
    label: "Code",
    icon: "Code2",
    sequence: 3,
    items: [
      {
        label: "Review my code",
        prompt:
          "Please review the following code. Look for bugs, performance issues, security vulnerabilities, and style improvements.",
        sequence: 1,
      },
      {
        label: "Debug this error",
        prompt:
          "Help me debug this error. I'll share the error message and relevant code, and you'll help identify and fix the issue.",
        sequence: 2,
      },
      {
        label: "Write unit tests",
        prompt:
          "Write unit tests for the following code. Cover the main functionality, edge cases, and error scenarios.",
        sequence: 3,
      },
      {
        label: "Explain this code",
        prompt:
          "Explain what the following code does. Walk through it step by step, explaining the logic and any important concepts.",
        sequence: 4,
      },
      {
        label: "Suggest optimizations",
        prompt:
          "Suggest optimizations for the following code. Focus on performance, readability, and maintainability improvements.",
        sequence: 5,
      },
    ],
  },
  {
    label: "Life stuff",
    icon: "Smile",
    sequence: 4,
    items: [
      {
        label: "Plan a trip",
        prompt:
          "Help me plan a trip. I'll share my destination, dates, budget, and interests, and you'll create a detailed itinerary.",
        sequence: 1,
      },
      {
        label: "Create a workout plan",
        prompt:
          "Create a workout plan tailored to my goals and fitness level. I'll share my current routine and objectives.",
        sequence: 2,
      },
      {
        label: "Write a recipe",
        prompt:
          "Help me write or adapt a recipe. I'll describe the dish and any dietary restrictions, and you'll provide a clear, step-by-step recipe.",
        sequence: 3,
      },
      {
        label: "Help me make a decision",
        prompt:
          "Help me think through an important decision. I'll explain the options and context, and you'll help me weigh the pros and cons.",
        sequence: 4,
      },
      {
        label: "Plan a budget",
        prompt:
          "Help me create a personal budget. I'll share my income and expenses, and you'll help me build a practical plan to meet my financial goals.",
        sequence: 5,
      },
    ],
  },
];

async function seed() {
  const [{ total }] = await db
    .select({ total: count() })
    .from(PromptCategoryTable);

  if (total > 0) {
    console.log(
      `Skipping seed — prompt_category table already has ${total} rows.`,
    );
    await pool.end();
    process.exit(0);
  }

  console.log("Seeding prompt categories and items...");

  for (const category of SEED_DATA) {
    const [inserted] = await db
      .insert(PromptCategoryTable)
      .values({
        label: category.label,
        icon: category.icon,
        sequence: category.sequence,
        enabled: true,
      })
      .returning();

    await db.insert(PromptItemTable).values(
      category.items.map((item) => ({
        categoryId: inserted.id,
        label: item.label,
        prompt: item.prompt,
        sequence: item.sequence,
        enabled: true,
      })),
    );

    console.log(`  ✓ ${category.label} (${category.items.length} items)`);
  }

  console.log("Seed complete.");
  await pool.end();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
