import { GoogleGenAI } from "@google/genai";
import { RetrievedChunk } from "./retriever";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

export type GeneratedAnswer = {
    answer: string;
    citations: number[];
};

export async function generateAnswer(
    context: RetrievedChunk[],
    question: string
): Promise<GeneratedAnswer> {

    const formattedContext =
        context
            .map((chunk, index) => {
                return `
SOURCE_ID: ${index + 1}

Filename: ${chunk.filename}

Page: ${chunk.pageNumber ?? "Unknown"}

Content:
${chunk.text}
`;
            })
            .join("\n\n");

    const prompt = `
You are a document question-answering assistant.

Answer the user's question using ONLY the
provided document context.

Rules:

1. Do not use outside knowledge.

2. Do not invent facts.

3. If the answer cannot be found in the
provided context, return exactly:

{
  "answer": "I don't know.",
  "citations": []
}

4. Every factual claim must be supported
by at least one SOURCE_ID.

5. Only use SOURCE_ID values that exist
in the provided context.

6. Never invent SOURCE_ID values.

7. Return ONLY valid JSON.

8. Do not wrap the JSON in markdown
code fences.

9. The "answer" field must NOT contain
citation markers such as [1], [2], etc.

10. The "citations" field must contain
only integer SOURCE_ID values.

11. If multiple sources directly support
the answer, include all relevant SOURCE_IDs.

Expected format:

{
  "answer": "The TCS NQT test has two parts.",
  "citations": [1, 2]
}

DOCUMENT CONTEXT:

${formattedContext}

USER QUESTION:

${question}
`;

    try {

        const response =
            await ai.models.generateContent({
                model: "gemini-3.6-flash",

                contents: prompt,

                config: {
                    responseMimeType:
                        "application/json",
                },
            });

        const text =
            response.text?.trim() ?? "";

        console.log(
            "Gemini structured response:",
            text
        );

        // --------------------------------
        // Remove markdown fences if Gemini
        // still returns them
        // --------------------------------

        const cleanedText =
            text
                .replace(
                    /^```json\s*/i,
                    ""
                )
                .replace(
                    /^```\s*/i,
                    ""
                )
                .replace(
                    /\s*```$/i,
                    ""
                )
                .trim();

        // --------------------------------
        // Parse JSON
        // --------------------------------

        const parsed: unknown =
            JSON.parse(cleanedText);

        // --------------------------------
        // Validate object
        // --------------------------------

        if (
            typeof parsed !== "object" ||
            parsed === null
        ) {
            throw new Error(
                "Invalid Gemini response"
            );
        }

        const data =
            parsed as {
                answer?: unknown;
                citations?: unknown;
            };

        // --------------------------------
        // Validate answer
        // --------------------------------

        const answer =
            typeof data.answer === "string"
                ? data.answer
                : "I don't know.";

        // --------------------------------
        // Validate citations
        // --------------------------------

        const citations =
            Array.isArray(data.citations)
                ? data.citations.filter(
                      (
                          citation
                      ): citation is number =>
                          typeof citation ===
                              "number" &&
                          Number.isInteger(
                              citation
                          )
                  )
                : [];

        return {
            answer,
            citations,
        };

    } catch (error) {

        console.error(
            "Generator error:",
            error
        );

        return {
            answer: "I don't know.",
            citations: [],
        };
    }
}