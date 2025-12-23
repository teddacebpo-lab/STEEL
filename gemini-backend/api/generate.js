export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing in environment variables"
    });
  }

  if (!req.body || !req.body.contents) {
    return res.status(400).json({
      error: "Invalid request body. 'contents' is required."
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
        signal: controller.signal
      }
    );

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: "Invalid response from Gemini",
        raw: text
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Gemini API error",
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({ error: "Gemini request timed out" });
    }

    return res.status(500).json({
      error: "Gemini request failed",
      details: error.message
    });
  } finally {
    clearTimeout(timeout);
  }
}
