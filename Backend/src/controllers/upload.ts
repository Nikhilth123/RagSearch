import { Request, Response } from "express";
import { PDFParse } from "pdf-parse";
import fs from "fs";

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

        // Create parser
        const parser = new PDFParse({
            data: new Uint8Array(buffer),
        });

        // Extract text
        const result = await parser.getText();

        // Clean up parser resources
        await parser.destroy();

        return res.status(200).json({
            success: true,
            text: result.text,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to parse PDF",
        });
    }
};