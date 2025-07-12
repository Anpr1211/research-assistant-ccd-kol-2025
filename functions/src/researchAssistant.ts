import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { Pool } from "pg";
import { onInit } from "firebase-functions";
import { dbPort, dbName, dbUser, dbPassword, dbHost } from "./index";

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model("gemini-2.5-flash"),
});
const embedder = googleAI.embedder("text-embedding-004");

let DB_HOST: string;
let DB_PORT: number;
let DB_NAME: string;
let DB_USER: string;
let DB_PASSWORD: string;

onInit(() => {
  DB_HOST = dbHost.value();
  DB_PORT = parseInt(dbPort.value(), 10);
  DB_NAME = dbName.value();
  DB_USER = dbUser.value();
  DB_PASSWORD = dbPassword.value();
});

export const researchFlow = ai.defineFlow(
  {
    name: "researchFlow",
    inputSchema: z.object({
      query: z.string().describe("The research question or topic."),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // 🔍 Step 1: Embed the research query using ai.embed() and passing the embedder reference
    const embedResponse = await ai.embed({
      embedder: embedder, // Pass the embedder reference
      content: input.query, // 'content' for single text embedding
      options: {
        // 'taskType' and other embedder-specific options go here
        taskType: "RETRIEVAL_QUERY",
      },
    });

    // The 'embed' method returns a single embedding for 'content'
    const queryEmbedding = embedResponse[0]?.embedding;

    console.log("Query embedding: ", queryEmbedding);

    if (!queryEmbedding) {
      console.error("Embedding not generated");
      return "Could not generate embedding for the query.";
    }

    // 🔍 Step 2: Use vector similarity search in SQL
    const sqlQuery = `
      SELECT
        id, title, abstract, authors, publication_year AS "publicationYear",
        journal_name AS "journalName", doi, url
      FROM paper
      ORDER BY abstract_embedding <=> $1
      LIMIT $2;
    `;
    const params = [`[${queryEmbedding.join(",")}]`, 5];

    console.log("Connecting to DB with:", {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      db: DB_NAME,
      passwordLength: DB_PASSWORD?.length,
    });

    console.log("Creating pool");
    const pool = new Pool({
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
      ssl: false, // SSL handled by the proxy
    });

    console.log("POOL: ", pool);

    let rows = [];
    try {
      const client = await pool.connect();
      const response = await client.query(sqlQuery, params);
      rows = response.rows;
      client.release();
    } catch (err) {
      console.error("Database query error:", err);
      return "There was an error retrieving relevant papers.";
    }

    if (rows.length === 0) {
      return "No relevant papers found. Try rephrasing your query.";
    }

    // 🧠 Step 3: Format paper info into context
    const context = rows
      .map(
        (p) =>
          `Title: ${p.title}\nAbstract: ${p.abstract}\nDOI: ${
            p.doi || "N/A"
          }\nURL: ${p.url || "N/A"}\n---`
      )
      .join("\n\n");

    const prompt = `You are an expert academic research assistant specializing in providing factual answers derived from provided scientific literature.
Your primary directive is to answer the "User Query" **strictly and solely** based on the information found within the "<papers>" section below.
Do not use any external knowledge.
If the provided papers do not contain sufficient information to fully answer the query, clearly state that and explain what information is missing.

For every factual statement you make, you **must** cite the source by including the exact "Title" of the paper (e.g., [Title of the Paper]) at the end of the paragraph where the information is used.
After your main answer, provide a comprehensive "References" section listing all cited papers by their full titles, journal they were published in, doi and year of publication.

<papers>
${context}
</papers>

User Query: ${input.query}

---

Answer:
`;

    console.log("Prompt sent to Gemini:\n", prompt);

    // 🤖 Step 4: Generate answer using ai.generate() and passing the model reference
    const response = await ai.generate({
      prompt: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: 5000,
      },
    });

    console.log("Raw Gemini response:", response);

    return response.text || "No response from Gemini."; // Use .text() to get the string output
  }
);
