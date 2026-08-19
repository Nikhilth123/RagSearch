export type Chunk = {
    id: string;
    text: string;
    documentId: string;
    chunkIndex: number;
    pageNumber?: number;
};

export function chunkText(
    text: string,
    documentId: string,
    chunkSize: number = 500,
    overlap: number = 100,
    pageNumber?: number
): Chunk[] {
    const chunks: Chunk[] = [];

    if (chunkSize <= 0) {
        throw new Error("chunkSize must be greater than 0");
    }

    if (overlap < 0 || overlap >= chunkSize) {
        throw new Error(
            "overlap must be >= 0 and less than chunkSize"
        );
    }

    let start = 0;
    let chunkIndex = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);

        const chunkText = text.slice(start, end).trim();

        if (chunkText.length > 0) {
            chunks.push({
                id: `${documentId}-chunk-${chunkIndex}`,
                text: chunkText,
                documentId,
                chunkIndex,
                pageNumber,
            });

            chunkIndex++;
        }

        start += chunkSize - overlap;
    }

    return chunks;
}