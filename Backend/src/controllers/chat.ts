import { Request, Response } from "express";
import { retrieveRelevantChunks } from "../rag/retriever";
import { generateAnswer } from "../rag/generator";

export const chat = async (
    req: Request,
    res: Response
) => {
    try {
        // --------------------------------
        // 1. Get question
        // --------------------------------

        const { question } = req.body;

        if (
            !question ||
            typeof question !== "string" ||
            !question.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Question is required",
            });
        }

        // --------------------------------
        // 2. Retrieve relevant chunks
        // --------------------------------

        const context =
            await retrieveRelevantChunks(
                question,
                5
            );

        // --------------------------------
        // 3. Generate answer using context
        // --------------------------------

        const answer =
            await generateAnswer(
                context,
                question
            );

        // --------------------------------
        // 4. Extract source information
        // --------------------------------

        const sources = context.map(
            (chunk) => ({
                filename: chunk.filename,
                documentId: chunk.documentId,
                pageNumber: chunk.pageNumber,
                chunkIndex: chunk.chunkIndex,
            })
        );

        // --------------------------------
        // 5. Return response
        // --------------------------------

        return res.status(200).json({
            success: true,
            answer,
            sources,
        });

    } catch (error) {
        console.error(
            "RAG query error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};