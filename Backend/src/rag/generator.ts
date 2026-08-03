import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

export async function generateAnswer(
    context: string[],
    question: string
) {
    const prompt = `
You are a helpful AI assistant.

Answer ONLY using the provided context.

If the answer is not present in the context,
reply with "I don't know."

Context:
${context.join("\n\n")}

Question:
${question}
`;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
    });

    return response.text;
}