import { Request, Response } from "express";

import { retrieveRelevantChunks } from "../rag/retriever";
import { generateAnswer } from "../rag/generator";
import { rerankChunks } from "../rag/reranker";

export const chat = async (
    req: Request,
    res: Response
) => {
    try {
        // --------------------------------
        // 1. Get question + documentId
        // --------------------------------

        const {
            question,
            documentId,
        } = req.body;

        // --------------------------------
        // 2. Validate question
        // --------------------------------

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
        // 3. Validate documentId
        // --------------------------------

        if (
            !documentId ||
            typeof documentId !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "documentId is required",
            });
        }

        // --------------------------------
        // 4. Retrieve candidate chunks
        // --------------------------------

        const candidates =
            await retrieveRelevantChunks(
                question,
                documentId,
                8,
            );

        // --------------------------------
        // 5. No relevant chunks
        // --------------------------------

        if (candidates.length === 0) {
            return res.status(200).json({
                success: true,
                answer: "I don't know.",
                sources: [],
            });
        }

        // --------------------------------
        // 6. Rerank candidates
        // --------------------------------

        const context =
            await rerankChunks(
                question,
                candidates,
                3
            );

        // --------------------------------
        // 7. Generate answer + citations
        // --------------------------------

        const result =
            await generateAnswer(
                context,
                question
            );

        // --------------------------------
        // 8. Validate citations
        // --------------------------------

        const validCitations =
            result.citations.filter(
                (citation) =>
                    Number.isInteger(citation) &&
                    citation >= 1 &&
                    citation <= context.length
            );

        // --------------------------------
        // 9. Build actual source metadata
        // --------------------------------

        const sources =
            validCitations.map(
                (citation) => {
                    const chunk =
                        context[citation - 1];

                    return {
                        citation:
                            `[${citation}]`,

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
                    };
                }
            );

        // --------------------------------
        // 10. Final response
        // --------------------------------

        return res.status(200).json({
            success: true,

            answer:
                result.answer,

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