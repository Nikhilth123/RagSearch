import { chroma } from "./chroma";
import { generateEmbedding } from "./embedder";

export type RetrievedChunk = {
    text: string;
    filename: string;
    documentId: string;
    chunkIndex: number;
    pageNumber: number | null;
};

export async function retrieveRelevantChunks(
    query: string,
    nResults: number = 5
): Promise<RetrievedChunk[]> {

    // 1. Convert user query into embedding
    const embedding = await generateEmbedding(query);

    // 2. Get Chroma collection
    const collection =
        await chroma.getOrCreateCollection({
            name: "documents",
        });

    // 3. Search for similar chunks
    const results = await collection.query({
        queryEmbeddings: [embedding],
        nResults,
        include: [
            "documents",
            "metadatas",
            "distances",
        ],
    });

    const documents = results.documents?.[0] ?? [];
    const metadatas = results.metadatas?.[0] ?? [];

    const retrievedChunks: RetrievedChunk[] = [];

    // 4. Combine document + metadata
    for (let i = 0; i < documents.length; i++) {

        const document = documents[i];
        const metadata = metadatas[i];

        if (
            document === null ||
            metadata === null
        ) {
            continue;
        }

        retrievedChunks.push({
            text: document,

            filename:
                String(metadata.filename ?? ""),

            documentId:
                String(metadata.documentId ?? ""),

            chunkIndex:
                Number(metadata.chunkIndex ?? 0),

            pageNumber:
                metadata.pageNumber !== null &&
                metadata.pageNumber !== undefined
                    ? Number(metadata.pageNumber)
                    : null,
        });
    }

    return retrievedChunks;
}