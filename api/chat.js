const SYSTEM_PROMPT = `당신은 한국 로또 6/45 운세 번호 상담 AI입니다.
친근하고 따뜻한 한국어로 대화하세요.

상담 흐름:
1. 이름을 물어본다
2. 생년월일을 물어본다 (띠·별자리 등 운세에 활용)
3. 오늘 기분을 물어본다
4. 행운의 키워드·숫자·색 등을 물어본다
5. 충분한 정보가 모이면 운세 해석과 함께 로또 번호 6개 + 보너스 1개를 추천한다

규칙:
- 한 번에 하나씩 자연스럽게 질문한다
- 번호는 1~45, main 6개(중복 없음, 오름차순) + bonus 1개(main에 없음)
- 재미·참고용이며 당첨을 보장하지 않는다고 가끔 언급해도 된다
- 번호를 추천할 때만, 답변 맨 마지막 줄에 정확히 다음 형식을 추가한다:
LOTTO_JSON:{"main":[1,2,3,4,5,6],"bonus":7}
- 번호 추천 전에는 LOTTO_JSON을 절대 출력하지 않는다`;

const MODEL = "gemini-2.0-flash";

function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

function parseNumbers(text) {
  const match = text.match(/LOTTO_JSON:(\{"main":\[[^\]]+\],"bonus":\d+\})/);
  if (!match) return { text, numbers: null };

  try {
    const numbers = JSON.parse(match[1]);
    const main = numbers.main;
    const bonus = numbers.bonus;
    if (
      !Array.isArray(main) ||
      main.length !== 6 ||
      main.some((n) => n < 1 || n > 45 || !Number.isInteger(n)) ||
      new Set(main).size !== 6 ||
      bonus < 1 ||
      bonus > 45 ||
      !Number.isInteger(bonus) ||
      main.includes(bonus)
    ) {
      return { text: text.replace(/LOTTO_JSON:\{.*?\}/, "").trim(), numbers: null };
    }
    const clean = text.replace(/LOTTO_JSON:\{.*?\}/, "").trim();
    return { text: clean, numbers: { main: [...main].sort((a, b) => a - b), bonus } };
  } catch {
    return { text: text.replace(/LOTTO_JSON:\{.*?\}/, "").trim(), numbers: null };
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." });
  }

  const { messages = [], start = false } = req.body || {};

  let contents = toGeminiContents(messages);

  if (start && messages.length === 0) {
    contents = [{ role: "user", parts: [{ text: "로또 운세 번호 상담을 시작합니다. 인사하고 이름을 물어봐 주세요." }] }];
  }

  if (contents.length === 0) {
    return res.status(400).json({ error: "메시지가 없습니다." });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const msg = data.error?.message || "Gemini API 오류";
      return res.status(response.status).json({ error: msg });
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      return res.status(502).json({ error: "AI 응답을 받지 못했습니다." });
    }

    const { text, numbers } = parseNumbers(raw.trim());
    return res.status(200).json({ reply: text, numbers });
  } catch (err) {
    return res.status(500).json({ error: err.message || "서버 오류" });
  }
};
