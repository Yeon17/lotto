function validatePhone(phone) {
  const digits = String(phone).replace(/\D/g, "");
  return /^01[016789]\d{7,8}$/.test(digits);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
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
    createdAt: new Date().toISOString(),
  };

  // TODO: DB·이메일 연동 시 여기서 저장/알림 처리
  console.log("[signup]", JSON.stringify(entry));

  return res.status(200).json({ ok: true, message: "가입이 완료되었습니다." });
};
