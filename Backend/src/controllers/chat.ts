import { Request, Response } from "express";
import { retrieveRelevantChunks } from "../rag/retriever";
import { generateAnswer } from "../rag/generator";

export const chat = async (req: Request, res: Response) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                message: "Question is required",
            });
        }

        const context = await retrieveRelevantChunks(question);

        const answer = await generateAnswer(
            context,
            question
        );

        return res.json({
            success: true,
            answer,
            context,
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};