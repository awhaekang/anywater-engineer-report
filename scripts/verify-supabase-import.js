const fs = require("fs");

const ENV_FILES = [".env.supabase.local", ".env.local"];
const PAGE_SIZE = 1000;

function loadEnvFiles() {
  for (const file of ENV_FILES) {
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([^#=]+)=(.*)$/);
      if (!match) continue;
      const key = match[1].trim();
      const value = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function parseExactCount(contentRange) {
  const match = String(contentRange || "").match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

async function rest(path, params = {}, options = {}) {
  const url = new URL(`/rest/v1/${path}`, options.supabaseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const headers = {
    apikey: options.serviceRoleKey,
    Authorization: `Bearer ${options.serviceRoleKey}`,
  };
  if (options.range) headers.Range = options.range;
  if (options.count) headers.Prefer = "count=exact";

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase ${path} request failed: ${response.status} ${body.slice(0, 300)}`);
  }

  return {
    rows: await response.json(),
    count: parseExactCount(response.headers.get("content-range")),
  };
}

async function fetchAll(path, params, options) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = await rest(path, params, {
      ...options,
      range: `${from}-${from + PAGE_SIZE - 1}`,
    });
    rows.push(...page.rows);
    if (page.rows.length < PAGE_SIZE) break;
  }
  return rows;
}

function increment(target, key) {
  target[key] = (target[key] || 0) + 1;
}

async function main() {
  loadEnvFiles();
  const options = {
    supabaseUrl: requireEnv("SUPABASE_URL"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };

  const storeCount = (
    await rest("stores", { select: "id", source: "eq.encom" }, { ...options, range: "0-0", count: true })
  ).count;
  const productCount = (
    await rest("store_products", { select: "id", source: "eq.encom" }, { ...options, range: "0-0", count: true })
  ).count;

  const stores = await fetchAll(
    "stores",
    {
      select: "customer_status,active,active_product_count,product_count,route,manager,source",
      source: "eq.encom",
      order: "external_id.asc",
    },
    options
  );
  const products = await fetchAll(
    "store_products",
    {
      select: "product_name,active,install_place,model_note,management_status,product_status",
      source: "eq.encom",
      order: "external_id.asc",
    },
    options
  );

  const byStatus = {};
  const juneByEngineerCode = {};
  const juneActiveByEngineerCode = {};
  const byProduct = {};

  for (const store of stores) {
    increment(byStatus, store.customer_status || "unknown");
    const serviceRegion = String(store.route?.serviceRegion || store.manager || "").trim();
    if (serviceRegion.startsWith("6")) {
      const code = (serviceRegion.match(/[ABC]/i) || ["미지정"])[0].toUpperCase();
      increment(juneByEngineerCode, code);
      if (store.customer_status === "active") {
        increment(juneActiveByEngineerCode, code);
      }
    }
  }

  for (const product of products) {
    increment(byProduct, product.product_name || "unknown");
  }

  const topProducts = Object.entries(byProduct)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 12);

  console.log(
    JSON.stringify(
      {
        storeCount,
        productCount,
        activeStores: stores.filter((store) => store.customer_status === "active").length,
        activeProducts: products.filter((product) => product.active).length,
        byStatus,
        juneByEngineerCode,
        juneActiveByEngineerCode,
        multiProductStores: stores.filter((store) => Number(store.product_count || 0) > 1).length,
        activeMultiProductStores: stores.filter((store) => Number(store.active_product_count || 0) > 1).length,
        productRowsWithInstallPlace: products.filter((product) => product.install_place).length,
        productRowsWithModelNote: products.filter((product) => product.model_note).length,
        topProducts,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
