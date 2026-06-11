function validatePhone(phone) {
  const digits = String(phone).replace(/\D/g, "");
  return /^01[016789]\d{7,8}$/.test(digits);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

async function saveToSupabase(entry) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase 환경 변수(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)가 설정되지 않았습니다.");
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/signups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      name: entry.name,
      phone: entry.phone,
      email: entry.email,
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const err = await response.json();
      detail = err.message || err.error || JSON.stringify(err);
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || `Supabase 저장 실패 (${response.status})`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, phone, email } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "이름을 입력해 주세요." });
  }
  if (!validatePhone(phone)) {
    return res.status(400).json({ error: "올바른 전화번호를 입력해 주세요." });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: "올바른 이메일을 입력해 주세요." });
  }

  const entry = {
    name: String(name).trim(),
    phone: String(phone).replace(/\D/g, ""),
    email: String(email).trim().toLowerCase(),
  };

  try {
    await saveToSupabase(entry);
    return res.status(200).json({ ok: true, message: "가입이 완료되었습니다." });
  } catch (err) {
    console.error("[signup]", err.message);
    return res.status(500).json({ error: err.message || "가입 처리 중 오류가 발생했습니다." });
  }
};
