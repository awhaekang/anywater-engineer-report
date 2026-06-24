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

  const month = parseInt(req.query.month, 10);
  const engineer = req.query.engineer || "";

  if (!month || month < 1 || month > 12) {
    return res.status(400).json({ error: "Invalid month" });
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    // Step 1: products 조회 - 방문_월1=month OR 방문_월2=month
    // or 필터 대신 두 쿼리를 병렬 실행 후 합산 (PostgREST or 인코딩 문제 우회)
    const buildProductsUrl = (monthCol) => {
      const params = new URLSearchParams({ select: "*" });
      params.set(monthCol, `eq.${month}`);
      if (engineer) params.set("정기_담당_엔지니어", `eq.${engineer}`);
      return `${supabaseUrl}/rest/v1/products?${params}`;
    };

    const [res1, res2] = await Promise.all([
      fetch(buildProductsUrl("방문_월1"), { headers }),
      fetch(buildProductsUrl("방문_월2"), { headers }),
    ]);

    if (!res1.ok) {
      const body = await res1.text();
      return res.status(500).json({ error: `products 조회 실패(월1): ${body.slice(0, 300)}` });
    }
    if (!res2.ok) {
      const body = await res2.text();
      return res.status(500).json({ error: `products 조회 실패(월2): ${body.slice(0, 300)}` });
    }

    const [rows1, rows2] = await Promise.all([res1.json(), res2.json()]);
    const seen = new Set();
    const productRows = [...rows1, ...rows2].filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // Step 2: 고유 customer_id 추출
    const customerIds = [...new Set(
      productRows.map((p) => p.customer_id).filter(Boolean)
    )];

    if (customerIds.length === 0) {
      return res.status(200).json({ rows: [] });
    }

    // Step 3: customers 조회
    const customersParams = new URLSearchParams({
      select: "*",
      id: `in.(${customerIds.join(",")})`,
    });

    const customersRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?${customersParams}`,
      { headers }
    );

    if (!customersRes.ok) {
      const body = await customersRes.text();
      return res.status(500).json({ error: `customers 조회 실패: ${body.slice(0, 300)}` });
    }

    const customerRows = await customersRes.json();
    const customerMap = Object.fromEntries(customerRows.map((c) => [c.id, c]));

    const rows = productRows.map((product) => ({
      ...product,
      customers: customerMap[product.customer_id] || null,
    }));

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ rows });
  } catch (err) {
    res.status(500).json({ error: err.message || "서버 오류" });
  }
};
