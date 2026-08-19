import { GoogleGenAI } from "@google/genai";
import { RetrievedChunk } from "./retriever";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

export async function generateAnswer(
    context: RetrievedChunk[],
    question: string
) {

    const formattedContext =
        context
            .map((chunk, index) => {
                return `
[Source ${index + 1}]
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
provided context, reply exactly:
"I don't know."

4. When making a factual claim, cite the
supporting source using [1], [2], etc.

5. Only use citation numbers that exist
in the provided context.

6. Do not invent source numbers.

7. Keep the answer clear and concise.

DOCUMENT CONTEXT:

${formattedContext}

USER QUESTION:

${question}
`;

    const response =
        await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
        });

    return (
        response.text ??
        "I don't know."
    );
}