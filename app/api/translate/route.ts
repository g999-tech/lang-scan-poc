import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error (no API key)" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const targetLang = (formData.get("targetLang") as string) || "en";
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert image to base64 for inlineData
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    // Call Gemini 2.0 Flash
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are a translation assistant.

1. Extract all clearly legible text from the image of a printed magazine page.
2. Keep the original text exactly as it appears (including line breaks where sensible).
3. Translate that text into the target language: "${targetLang}".

Return ONLY valid JSON in this exact shape:

{
  "originalText": "full original text here",
  "translatedText": "full translated text here"
}
                  `.trim(),
                },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            // Ask Gemini to respond as JSON text so we can parse it
            response_mime_type: "application/json",
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errorText);
      return NextResponse.json(
        { error: "Gemini API error", details: errorText },
        { status: 500 }
      );
    }

    const geminiJson = await geminiRes.json();

    // Gemini response format: candidates[0].content.parts[].text
    const candidates = geminiJson.candidates || [];
    if (!candidates.length) {
      console.error("No candidates in Gemini response", geminiJson);
      return NextResponse.json(
        { error: "No response from Gemini" },
        { status: 500 }
      );
    }

    const parts = candidates[0].content?.parts || [];
    const textPart = parts.find((p: any) => p.text);
    if (!textPart) {
      console.error("No text part in Gemini response", geminiJson);
      return NextResponse.json(
        { error: "Unexpected Gemini response format" },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(textPart.text);
    } catch (e) {
      console.error("Failed to parse Gemini JSON text:", textPart.text);
      return NextResponse.json(
        { error: "Failed to parse Gemini JSON response" },
        { status: 500 }
      );
    }

    const originalText = parsed.originalText || "";
    const translatedText = parsed.translatedText || "";

    return NextResponse.json(
      { originalText, translatedText },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected error in /api/translate:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
