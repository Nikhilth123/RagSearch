import { Request, Response } from "express";
import { PDFParse } from "pdf-parse";
import fs from "fs";
import { chunkText } from "../rag/chunker";
import { generateEmbedding } from "../rag/embedder";
import { chroma } from "../rag/chroma";

export const uploadfile = async (req: Request, res: Response) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        // Read uploaded PDF
        const buffer = fs.readFileSync(file.path);

        // Parse PDF
        const parser = new PDFParse({
            data: new Uint8Array(buffer),
        });

        const result = await parser.getText();
        await parser.destroy();

        // Chunk the extracted text
        const chunks = chunkText(result.text);

        // Get or create collection
        const collection = await chroma.getOrCreateCollection({
            name: "documents",
        });

        // Generate embeddings and store them
        for (let i = 0; i < chunks.length; i++) {
            const embedding = await generateEmbedding(chunks[i]);

            await collection.add({
                ids: [`${file.filename}-${i}`],
                documents: [chunks[i]],
                embeddings: [embedding],
                metadatas: [
                    {
                        filename: file.originalname,
                        chunkIndex: i,
                    },
                ],
            });
        }

        return res.status(200).json({
            success: true,
            message: "Document indexed successfully.",
            chunksIndexed: chunks.length,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to process document.",
        });
    }
};