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
    // Step 1: products 조회 (방문_월1 또는 방문_월2 가 해당 월인 것)
    const productsParams = new URLSearchParams({
      select: "*",
      or: `방문_월1.eq.${month},방문_월2.eq.${month}`,
    });
    if (engineer) {
      productsParams.set("정기_담당_엔지니어", `eq.${engineer}`);
    }

    const productsRes = await fetch(
      `${supabaseUrl}/rest/v1/products?${productsParams}`,
      { headers }
    );

    if (!productsRes.ok) {
      const body = await productsRes.text();
      return res.status(500).json({ error: `products 조회 실패: ${body.slice(0, 300)}` });
    }

    const productRows = await productsRes.json();

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
