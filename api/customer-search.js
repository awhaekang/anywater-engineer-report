module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const q = (req.query.q || "").trim();
  if (!q) return res.status(200).json({ customers: [] });

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    // 관리번호, 상호, 연락처_유선, 휴대폰_주 컬럼에서 검색 (ilike)
    const filters = [
      `관리번호.ilike.*${q}*`,
      `상호.ilike.*${q}*`,
      `연락처_유선.ilike.*${q}*`,
      `휴대폰_주.ilike.*${q}*`,
    ];

    // 각 필터로 병렬 검색 후 합산 (or 필터 인코딩 문제 우회)
    const results = await Promise.all(
      filters.map(async (filter) => {
        const params = new URLSearchParams({ select: "*", limit: "20" });
        const [col, op, val] = filter.split(".");
        params.set(col, `${op}.${val}`);
        const r = await fetch(`${supabaseUrl}/rest/v1/customers?${params}`, { headers });
        if (!r.ok) return [];
        return r.json();
      })
    );

    // 중복 제거
    const seen = new Set();
    const customers = results.flat().filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    }).slice(0, 30);

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ customers });
  } catch (err) {
    res.status(500).json({ error: err.message || "서버 오류" });
  }
};
