import { chroma } from "./chroma";
import { generateEmbedding } from "./embedder";

export async function retrieveRelevantChunks(
    query: string,
    nResults: number = 5
): Promise<string[]> {
    const embedding = await generateEmbedding(query);

    const collection = await chroma.getOrCreateCollection({
        name: "documents",
    });

    const results = await collection.query({
        queryEmbeddings: [embedding],
        nResults,
    });

    const documents = results.documents?.[0] ?? [];

    return documents.filter(
        (doc): doc is string => doc !== null
    );
}