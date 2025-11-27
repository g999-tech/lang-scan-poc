"use client";

import React, { useState } from "react";

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState("en");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setOriginalText(null);
    setTranslatedText(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      setError("Please take or upload a photo first.");
      return;
    }

    setLoading(true);
    setError(null);
    setOriginalText(null);
    setTranslatedText(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("targetLang", targetLang);

      const res = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Server error");
      }

      const data = await res.json();
      setOriginalText(data.originalText);
      setTranslatedText(data.translatedText);
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong. This is where the real translation will go later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Magazine Snap → Translate (PoC)</h1>
          <p className="text-sm text-slate-300">
            Take a photo of a magazine page, then we&apos;ll send it to a backend
            (later: OpenAI/Gemini) to extract and translate the text.
          </p>
        </header>

        <section className="space-y-3">
          <label className="block text-sm font-medium">
            Target language
          </label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
          >
            <option value="en">English</option>
            <option value="de">German</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
            <option value="it">Italian</option>
          </select>
        </section>

        <section className="space-y-3">
          <label className="block text-sm font-medium">
            Take a photo or upload an image
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="w-full text-sm"
          />
          {imagePreview && (
            <div className="mt-3">
              <p className="text-xs text-slate-300 mb-2">Preview</p>
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full rounded-lg border border-slate-800"
              />
            </div>
          )}
        </section>

        <button
          onClick={handleSubmit}
          disabled={loading || !imageFile}
          className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-slate-900 transition"
        >
          {loading ? "Processing…" : "Extract & Translate (dummy for now)"}
        </button>

        {error && (
          <p className="text-sm text-red-400">
            {error}
          </p>
        )}

        {(originalText || translatedText) && (
          <section className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-200">
                Original text
              </h2>
              <div className="text-xs bg-slate-900 border border-slate-800 rounded-lg p-3 whitespace-pre-wrap">
                {originalText || "Dummy original text from backend."}
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-200">
                Translated text
              </h2>
              <div className="text-xs bg-slate-900 border border-slate-800 rounded-lg p-3 whitespace-pre-wrap">
                {translatedText || "Dummy translated text will appear here."}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
