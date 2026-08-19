import { Request, Response } from "express";
import { PDFParse } from "pdf-parse";
import fs from "fs";

import { chunkText, Chunk } from "../rag/chunker";
import { generateEmbeddings } from "../rag/embedder";
import { chroma } from "../rag/chroma";

export const uploadfile = async (
    req: Request,
    res: Response
) => {
    try {
        // --------------------------------
        // 1. Check uploaded file
        // --------------------------------

        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        // --------------------------------
        // 2. Read uploaded PDF
        // --------------------------------

        const buffer = fs.readFileSync(
            file.path
        );

        // --------------------------------
        // 3. Create PDF parser
        // --------------------------------

        const parser = new PDFParse({
            data: new Uint8Array(buffer),
        });

        // --------------------------------
        // 4. Extract text page-by-page
        // --------------------------------

        const result =
            await parser.getText();

        await parser.destroy();

        console.log(
            `PDF contains ${result.pages.length} pages`
        );

        // --------------------------------
        // 5. Create chunks page-by-page
        // --------------------------------

        const allChunks: Chunk[] = [];

        let globalChunkIndex = 0;

        for (const page of result.pages) {

            // Ignore empty pages
            if (!page.text.trim()) {
                continue;
            }

            const pageChunks =
                chunkText(
                    page.text,
                    file.filename,
                    500,
                    100,
                    page.num
                );

            // Give every chunk a global index
            for (const chunk of pageChunks) {

                chunk.chunkIndex =
                    globalChunkIndex;

                chunk.id =
                    `${file.filename}-chunk-${globalChunkIndex}`;

                allChunks.push(chunk);

                globalChunkIndex++;
            }
        }

        console.log(
            `Created ${allChunks.length} chunks`
        );

        // --------------------------------
        // 6. Check if PDF contains text
        // --------------------------------

        if (allChunks.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "No text found in PDF",
            });
        }

        // --------------------------------
        // 7. Get Chroma collection
        // --------------------------------

        const collection =
            await chroma.getOrCreateCollection({
                name: "documents",
            });

        // --------------------------------
        // 8. Process chunks in batches
        // --------------------------------

        const BATCH_SIZE = 50;

        for (
            let i = 0;
            i < allChunks.length;
            i += BATCH_SIZE
        ) {

            const batch =
                allChunks.slice(
                    i,
                    i + BATCH_SIZE
                );

            console.log(
                `Processing chunks ${
                    i + 1
                } - ${
                    i + batch.length
                } of ${
                    allChunks.length
                }`
            );

            // --------------------------------
            // 9. Generate embeddings
            // --------------------------------

            const embeddings =
                await generateEmbeddings(
                    batch.map(
                        (chunk) =>
                            chunk.text
                    )
                );

            // --------------------------------
            // 10. Validate embeddings
            // --------------------------------

            if (
                embeddings.length !==
                batch.length
            ) {
                throw new Error(
                    `Embedding count mismatch. ` +
                    `Expected ${batch.length}, ` +
                    `received ${embeddings.length}`
                );
            }

            // --------------------------------
            // 11. Store batch in Chroma
            // --------------------------------

            await collection.add({

                ids: batch.map(
                    (chunk) =>
                        chunk.id
                ),

                documents: batch.map(
                    (chunk) =>
                        chunk.text
                ),

                embeddings,

                metadatas:
                    batch.map(
                        (chunk) => ({
                            filename:
                                file.originalname,

                            documentId:
                                chunk.documentId,

                            chunkIndex:
                                chunk.chunkIndex,

                            pageNumber:
                                chunk.pageNumber ??
                                null,
                        })
                    ),
            });
        }

        // --------------------------------
        // 12. Success response
        // --------------------------------

       return res.status(200).json({
    success: true,

    message: "Document indexed successfully.",

    documentId: file.filename,

    filename: file.originalname,

    pagesProcessed: result.pages.length,

    chunksIndexed: allChunks.length,
});

    } catch (error) {

        console.error(
            "PDF ingestion error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to process document.",
        });
    }
};