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
                message:
                    "Question is required",
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
        // 3. No relevant context
        // --------------------------------

        if (context.length === 0) {

            return res.status(200).json({
                success: true,

                answer:
                    "I don't know.",

                sources: [],
            });
        }

        // --------------------------------
        // 4. Generate answer
        // --------------------------------

        const answer =
            await generateAnswer(
                context,
                question
            );

        // --------------------------------
        // 5. Prepare citations
        // --------------------------------

        const sources =
            context.map(
                (chunk, index) => ({
                    citation: `[${index + 1}]`,

                    filename:
                        chunk.filename,

                    documentId:
                        chunk.documentId,

                    pageNumber:
                        chunk.pageNumber,

                    chunkIndex:
                        chunk.chunkIndex,

                    distance:
                        chunk.distance,
                })
            );

        // --------------------------------
        // 6. Return response
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
            message:
                "Internal Server Error",
        });
    }
};