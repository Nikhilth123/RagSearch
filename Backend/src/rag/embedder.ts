import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

// Single embedding
export async function generateEmbedding(text: string) {
    const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
    });

    return response.embeddings?.[0]?.values ?? [];
}

// Multiple embeddings
export async function generateEmbeddings(texts: string[]) {
    if (texts.length === 0) {
        return [];
    }

    const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: texts,
    });

    return (
        response.embeddings?.map(
            (embedding) => embedding.values ?? []
        ) ?? []
    );
}