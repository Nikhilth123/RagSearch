import { GoogleGenAI } from "@google/genai";
import { RetrievedChunk } from "./retriever";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

export async function rerankChunks(
    question: string,
    chunks: RetrievedChunk[],
    topK: number = 3
): Promise<RetrievedChunk[]> {

    if (chunks.length <= topK) {
        return chunks;
    }

    const candidates = chunks
        .map((chunk, index) => {
            return `
[Candidate ${index}]

Page: ${chunk.pageNumber ?? "Unknown"}
Chunk: ${chunk.chunkIndex}

Content:
${chunk.text}
`;
        })
        .join("\n\n");

    const prompt = `
You are a relevance ranking system.

Given a user question and candidate document
chunks, rank the candidates by how useful they
are for answering the question.

Question:
${question}

Candidates:
${candidates}

Return ONLY the candidate numbers in order
from most relevant to least relevant.

Example:
2,0,4

Do not include explanations.
Do not include any other text.
`;

    const response =
        await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
        });

    const text =
        response.text?.trim() ?? "";

    const indexes = text
        .split(",")
        .map((value) => Number(value.trim()))
        .filter(
            (index) =>
                Number.isInteger(index) &&
                index >= 0 &&
                index < chunks.length
        );

    const uniqueIndexes = [
        ...new Set(indexes),
    ];

    return uniqueIndexes
        .slice(0, topK)
        .map(
            (index) => chunks[index]
        );
}