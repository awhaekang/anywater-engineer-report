const PAGE_SIZE = 1000;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function storeFromRow(row) {
  return {
    id: row.external_id || row.id,
    managementNo: row.management_no || "",
    name: row.name || "",
    ownerName: row.owner_name || "",
    address: row.address || "",
    addressMemo: row.address_memo || "",
    manager: row.manager || "",
    phone: row.phone || "",
    mobile: row.mobile || "",
    openTime: row.open_time || "",
    contact: row.contact || {},
    customerType: row.customer_type || "",
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    equipment: row.equipment || [],
    products: row.products || [],
    customerStatus: row.customer_status || "caution",
    source: row.source || "supabase",
    route: row.route || {},
    contract: row.contract || {},
    product: row.product || {},
    filterSchedule: row.filter_schedule || {},
    serviceOrder: row.service_order_snapshot || {},
    serviceMemo: row.service_memo || "",
    needsGeocode: Boolean(row.needs_geocode),
  };
}

async function fetchStoresPage(supabaseUrl, serviceRoleKey, from, to) {
  const url = new URL("/rest/v1/stores", supabaseUrl);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "management_no.desc.nullslast");
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Range: `${from}-${to}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase stores request failed: ${response.status} ${body.slice(0, 300)}`);
  }

  return response.json();
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const stores = [];

    for (let from = 0; ; from += PAGE_SIZE) {
      const page = await fetchStoresPage(supabaseUrl, serviceRoleKey, from, from + PAGE_SIZE - 1);
      stores.push(...page.map(storeFromRow));
      if (page.length < PAGE_SIZE) break;
    }

    response.setHeader("Cache-Control", "no-store");
    response.status(200).json({
      source: "supabase",
      generatedAt: new Date().toISOString(),
      stores,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: error.message || "Failed to load customers",
    });
  }
};
