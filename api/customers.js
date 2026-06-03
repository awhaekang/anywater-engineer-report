const PAGE_SIZE = 1000;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function productFromRow(row) {
  return {
    managementNo: row.management_no || "",
    productName: row.product_name || "",
    modelNote: row.model_note || "",
    installPlace: row.install_place || "",
    installPlaceNote: row.install_place_note || "",
    connectionNote: row.connection_note || "",
    referenceNote: row.reference_note || "",
    productMemo: row.product_memo || "",
    productStatus: row.product_status || "",
    managementStatus: row.management_status || "",
    installedAt: row.installed_at || "",
    productType: row.product_type || "",
    faucetType: row.faucet_type || "",
    filters: row.filters || [],
    sortOrder: row.sort_order || 0,
    active: Boolean(row.active),
  };
}

function storeFromRow(row, productsByStoreId) {
  const productItems = productsByStoreId.get(row.id) || [];
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
    productItems,
    productCount: row.product_count ?? productItems.length,
    activeProductCount: row.active_product_count ?? productItems.filter((product) => product.active).length,
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

async function fetchProductsPage(supabaseUrl, serviceRoleKey, from, to) {
  const url = new URL("/rest/v1/store_products", supabaseUrl);
  url.searchParams.set(
    "select",
    "store_id,management_no,product_name,model_note,install_place,install_place_note,connection_note,reference_note,product_memo,product_status,management_status,installed_at,product_type,faucet_type,filters,sort_order,active"
  );
  url.searchParams.set("order", "store_id.asc,sort_order.asc");
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Range: `${from}-${to}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase store products request failed: ${response.status} ${body.slice(0, 300)}`);
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
    const storeRows = [];
    const productRows = [];

    for (let from = 0; ; from += PAGE_SIZE) {
      const page = await fetchStoresPage(supabaseUrl, serviceRoleKey, from, from + PAGE_SIZE - 1);
      storeRows.push(...page);
      if (page.length < PAGE_SIZE) break;
    }

    for (let from = 0; ; from += PAGE_SIZE) {
      const page = await fetchProductsPage(supabaseUrl, serviceRoleKey, from, from + PAGE_SIZE - 1);
      productRows.push(...page);
      if (page.length < PAGE_SIZE) break;
    }

    const productsByStoreId = new Map();
    for (const row of productRows) {
      const product = productFromRow(row);
      const products = productsByStoreId.get(row.store_id) || [];
      products.push(product);
      productsByStoreId.set(row.store_id, products);
    }

    const stores = storeRows.map((row) => storeFromRow(row, productsByStoreId));

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
