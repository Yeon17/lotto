function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_KEY ||
    ""
  ).trim();
  return { url, key };
}

module.exports = async function handler(req, res) {
  const { url, key } = getSupabaseConfig();
  const gemini = !!(process.env.GEMINI_API_KEY || "").trim();

  return res.status(200).json({
    supabase_url: !!url,
    supabase_service_role_key: !!key,
    gemini_api_key: gemini,
    ready: !!url && !!key,
    hint: !url || !key
      ? "Vercel Environment Variables 추가 후 Redeploy 필요"
      : "환경 변수는 정상입니다",
  });
};
