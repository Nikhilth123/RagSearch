import { GoogleGenAI } from "@google/genai";
import { RetrievedChunk } from "./retriever";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

export async function generateAnswer(
    context: RetrievedChunk[],
    question: string
) {
    const formattedContext = context
        .map((chunk, index) => {
            return `
[Source ${index + 1}]
Filename: ${chunk.filename}
Page: ${chunk.pageNumber ?? "Unknown"}
Chunk: ${chunk.chunkIndex}

Content:
${chunk.text}
`;
        })
        .join("\n\n");

    const prompt = `
You are a document question-answering assistant.

Your job is to answer the user's question using ONLY
the provided document context.

Rules:
1. Do not use outside knowledge.
2. Do not invent facts.
3. If the answer cannot be found in the provided
   context, reply exactly:
   "I don't know."
4. Give a clear and concise answer.
5. Do not invent or modify source information.

DOCUMENT CONTEXT:
${formattedContext}

USER QUESTION:
${question}
`;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
    });

    return response.text ?? "I don't know.";
}