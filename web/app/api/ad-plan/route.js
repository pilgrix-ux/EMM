export const runtime = "nodejs";
export const maxDuration = 45;

const MAX_TEXT = 5000;

function json(data, status = 200) {
  return Response.json(data, { status });
}

function text(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanPlan(raw, brief) {
  const hooks = Array.isArray(raw?.hooks)
    ? raw.hooks.map((item) => text(item, 280)).filter(Boolean).slice(0, 3)
    : [];
  const scenes = Array.isArray(raw?.scenes)
    ? raw.scenes.slice(0, 6).map((scene) => ({
        time: text(scene?.time, 40),
        visualDirection: text(scene?.visualDirection, 700),
        voiceover: text(scene?.voiceover, 700),
        onScreenText: text(scene?.onScreenText, 220),
      }))
    : [];

  if (hooks.length < 2 || scenes.length < 2) {
    throw new Error("The AI returned an incomplete plan. Please try generating it again.");
  }

  return {
    projectTitle: text(raw.projectTitle, 120) || brief.productName,
    hooks,
    selectedHook: text(raw.selectedHook, 280) || hooks[0],
    script: text(raw.script, 5000),
    scenes,
    callToAction: text(raw.callToAction, 240),
    captionText: text(raw.captionText, 1200),
    editNotes: text(raw.editNotes, 1000),
  };
}

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({
      error: "AI planning is not configured yet. Add GEMINI_API_KEY to the EMM project in Vercel, then redeploy.",
    }, 503);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const authorization = request.headers.get("authorization");
  if (!supabaseUrl || !supabaseKey || !authorization?.startsWith("Bearer ")) {
    return json({ error: "Sign in to your EMM workspace before generating an ad plan." }, 401);
  }

  try {
    const authResponse = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: authorization,
      },
      cache: "no-store",
    });
    if (!authResponse.ok) {
      return json({ error: "Your EMM session is not valid. Sign in again to continue." }, 401);
    }

    const body = await request.json();
    const brief = body?.brief || {};
    const productName = text(brief.productName, 120);
    const benefit = text(brief.benefit, 500);
    if (!productName || !benefit) {
      return json({ error: "Add a product name and its main benefit before generating an ad plan." }, 400);
    }

    const safeBrief = {
      productName,
      benefit,
      audience: text(brief.audience, 180) || "Not specified",
      goal: text(brief.goal, 120) || "Build awareness",
      platform: text(brief.platform, 80) || "Instagram Reels",
      aspectRatio: text(brief.aspectRatio, 12) || "9:16",
      targetDuration: Number.isFinite(Number(brief.targetDuration))
        ? Math.min(60, Math.max(15, Number(brief.targetDuration)))
        : 30,
      language: text(brief.language, 60) || "English",
      visualStyle: text(brief.visualStyle, 80) || "Premium and polished",
      captions: text(brief.captions, 60) || "Clean subtitles",
      voiceover: text(brief.voiceover, 80) || "No voiceover",
      music: text(brief.music, 80) || "Keep original audio",
    };
    const sourceVideoName = text(body?.sourceVideoName, 180) || "Selected source video";

    const prompt = `
You are the creative strategist for EMM Ads Studio. Create a practical, truthful short-form advertising plan using only the facts in the user brief below.

IMPORTANT:
- You have NOT received or watched the source video. Do not claim to have analysed its frames or describe objects, people, actions, locations, or scenes as if you saw them.
- Give adaptable footage guidance that the editor can match to the supplied clip. Never invent product features, prices, discounts, testimonials, results, guarantees, certifications, or business details.
- If information is missing, do not invent it. Write a general but useful line, or mark it as something the user should supply.
- Write all consumer-facing text in the requested language.
- Match the requested platform, aspect ratio, duration, goal, and creative direction.
- Keep the script concise enough for the requested run time and make the opening hook immediate.
- Return JSON only, with exactly these fields and types:
{
  "projectTitle": "string",
  "hooks": ["string", "string", "string"],
  "selectedHook": "string",
  "script": "string",
  "scenes": [
    {
      "time": "string",
      "visualDirection": "string",
      "voiceover": "string",
      "onScreenText": "string"
    }
  ],
  "callToAction": "string",
  "captionText": "string",
  "editNotes": "string"
}
- Produce 3 alternative hooks and 3 to 6 scenes with timings that fit the target duration. The voiceover should be blank or an empty string when voiceover is off.
- Make on-screen text brief and readable on a phone. Do not put unverified claims in it.

USER BRIEF
Product or service: ${safeBrief.productName}
Main benefit and facts supplied: ${safeBrief.benefit}
Intended audience: ${safeBrief.audience}
Campaign goal: ${safeBrief.goal}
Platform: ${safeBrief.platform}
Aspect ratio: ${safeBrief.aspectRatio}
Target duration: ${safeBrief.targetDuration} seconds
Language: ${safeBrief.language}
Visual style: ${safeBrief.visualStyle}
Captions: ${safeBrief.captions}
Voiceover setting: ${safeBrief.voiceover}
Audio setting: ${safeBrief.music}
Selected source video filename (name only; not the actual video): ${sourceVideoName}
`;

    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.65,
          },
        }),
        cache: "no-store",
      }
    );

    const aiBody = await aiResponse.json().catch(() => ({}));
    if (!aiResponse.ok) {
      const detail = text(aiBody?.error?.message, 280);
      return json({
        error: detail
          ? `The AI planning service returned an error: ${detail}`
          : "The AI planning service could not complete the request. Check your Gemini API configuration and try again.",
      }, aiResponse.status === 429 ? 429 : 502);
    }

    const generated = aiBody?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();
    if (!generated || generated.length > MAX_TEXT) {
      return json({ error: "The AI returned an empty or oversized ad plan. Please try again." }, 502);
    }

    let parsed;
    try {
      parsed = JSON.parse(generated.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
    } catch {
      return json({ error: "The AI response was not valid ad-plan data. Please try again." }, 502);
    }

    const plan = cleanPlan(parsed, safeBrief);
    return json({ plan });
  } catch (error) {
    return json({
      error: text(error?.message, 300) || "An unexpected error interrupted ad planning. Please try again.",
    }, 500);
  }
}
