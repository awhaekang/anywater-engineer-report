const STORAGE_KEY = "visit-report-app-v2-anywater";
const DEPARTMENT_KEY = "visit-report-department-v1";
const LEGACY_ROLE_KEY = "visit-report-role-v1";
const SESSION_KEY = "visit-report-session-v1";

const departments = {
  tech: {
    label: "기술부",
    members: ["양석원", "신규철", "이승혁"],
    currentWorkspace: true,
  },
  cs: {
    label: "CS팀",
    members: ["주미경", "정선영"],
    currentWorkspace: false,
  },
  management: {
    label: "경영지원부",
    members: ["김기훈", "차성광", "이경희"],
    currentWorkspace: false,
  },
  rnd: {
    label: "연구개발팀",
    members: ["김해강"],
    currentWorkspace: false,
  },
  customer: {
    label: "고객관리팀",
    members: ["김동호", "이상진", "유재호"],
    currentWorkspace: true,
  },
};

const legacyRoleDepartments = {
  engineer: "tech",
  office: "customer",
  manager: "customer",
  executive: "customer",
};

const customerStatusLabels = {
  active: "관리중",
  terminated: "해지/회수",
  caution: "확인 필요",
  temporary: "임시 등록",
};

const orderTypeLabels = {
  install: "신규설치",
  remove: "철거",
  repair: "A/S",
  inspection: "정기점검",
  "filter-replace": "정기교체",
};

const monthlyRouteEngineers = {
  A: "양석원",
  B: "신규철",
  C: "이승혁",
};

const monthlyEngineerKeysByName = Object.fromEntries(
  Object.entries(monthlyRouteEngineers).map(([key, name]) => [name, key])
);

const monthlyEngineerOrder = ["A", "B", "C", "UNASSIGNED"];
const koreanNameCollator = new Intl.Collator("ko-KR", { numeric: true, sensitivity: "base" });
const TMAP_DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const TMAP_DEFAULT_ZOOM = 11;
const TMAP_MARKER_MIN_ZOOM = 11;
const SUPABASE_CONFIG_ENDPOINT = "/api/supabase-config";
const SUPABASE_TABLES = {
  customers: "customers",
  products: "products",
  serviceOrders: "service_orders",
  visitReports: "visit_reports",
};
const MAP_MARKER_COLORS = {
  pending: "#2563eb",
  complete: "#16a34a",
  hold: "#f59e0b",
};

const localSpecialOrderTypes = {
  install: "신규설치",
  remove: "철거",
  repair: "A/S",
};

const defaultVisitTypes = [
  {
    id: "filter-replace",
    name: "필터 교체",
    checks: ["렌탈 장비 모델 확인", "기존 필터 사용 기간 확인", "누수 여부 확인", "교체 후 수압 확인", "고객 확인"],
    photos: ["설치처 외관", "교체 전 필터", "새 필터 라벨", "교체 후 연결부", "출수 상태"],
  },
  {
    id: "inspection",
    name: "정기 점검",
    checks: ["수압 상태", "누수 흔적", "필터 하우징 상태", "배관 연결 상태", "다음 교체 예정 안내"],
    photos: ["설치처 외관", "장비 전체", "필터 하우징", "배관 연결부", "점검 후 상태"],
  },
  {
    id: "repair",
    name: "장애 처리",
    checks: ["고객 신고 증상 확인", "누수/수압/맛 이상 원인 확인", "조치 후 정상 출수", "재발 가능성 확인", "추가 방문 필요 여부"],
    photos: ["증상 위치", "문제 부위", "조치 중", "조치 후", "출수 확인"],
  },
  {
    id: "install",
    name: "신규 설치",
    checks: ["설치 위치 확인", "원수/배수 연결 확인", "전원 필요 여부 확인", "초기 플러싱 진행", "고객 사용 안내"],
    photos: ["설치처 외관", "설치 전 위치", "원수/배수 연결부", "설치 후 전체", "출수 테스트"],
  },
  {
    id: "remove",
    name: "철거",
    checks: ["철거 대상 장비 확인", "원상복구 상태", "회수 부품 확인", "고객 확인", "잔여 이슈 여부"],
    photos: ["철거 전 전체", "연결부 분리 전", "철거 후 자리", "회수 장비", "고객 확인"],
  },
];

const defaultStores = [
  {
    id: "store-001",
    name: "김밥천국 강남점",
    address: "서울 강남구 테헤란로 152",
    manager: "박민수",
    phone: "02-555-1001",
    lat: 37.5008,
    lng: 127.0364,
    equipment: ["AW-RO-500", "전처리 필터", "카본 필터"],
    products: ["AW-RO-500 / 주방 / 전처리 필터", "AW-RO-500 / 주방 / 카본 필터"],
    route: { serviceRegion: "강남", routeMonth: "5" },
    filterSchedule: { inspectionCycleMonths: "6", replacementCycleMonths: "12", nextInspectionDate: "2026-05-20", nextReplacementDate: "2026-05-20" },
    customerStatus: "active",
    source: "sample",
  },
  {
    id: "store-002",
    name: "카페라움 역삼점",
    address: "서울 강남구 논현로 508",
    manager: "이서연",
    phone: "02-555-1002",
    lat: 37.5023,
    lng: 127.0374,
    equipment: ["AW-UV-300", "스케일 방지 필터"],
    products: ["AW-UV-300 / 바 / 스케일 방지 필터"],
    route: { serviceRegion: "역삼", routeMonth: "5" },
    filterSchedule: { inspectionCycleMonths: "0", replacementCycleMonths: "12", cafePolicy: "new-12m", nextInspectionDate: "", nextReplacementDate: "2026-05-20" },
    customerStatus: "active",
    source: "sample",
  },
  {
    id: "store-003",
    name: "명가돈까스 선릉점",
    address: "서울 강남구 선릉로 428",
    manager: "정하준",
    phone: "02-555-1003",
    lat: 37.5045,
    lng: 127.0492,
    equipment: ["AW-RO-700", "침전 필터", "후카본 필터"],
    products: ["AW-RO-700 / 주방 / 침전 필터", "AW-RO-700 / 주방 / 후카본 필터"],
    route: { serviceRegion: "선릉", routeMonth: "5" },
    filterSchedule: { inspectionCycleMonths: "6", replacementCycleMonths: "12", nextInspectionDate: "2026-05-20", nextReplacementDate: "2026-11-20" },
    customerStatus: "active",
    source: "sample",
  },
  {
    id: "store-004",
    name: "푸드팩토리 성수공장",
    address: "서울 성동구 성수이로 88",
    manager: "최유진",
    phone: "02-555-1004",
    lat: 37.5446,
    lng: 127.0557,
    equipment: ["AW-IND-2000", "대용량 전처리", "RO 멤브레인"],
    products: ["AW-IND-2000 / 공장 라인 / 대용량 전처리", "AW-IND-2000 / 공장 라인 / RO 멤브레인"],
    route: { serviceRegion: "성수", routeMonth: "5" },
    filterSchedule: { inspectionCycleMonths: "6", replacementCycleMonths: "12", nextInspectionDate: "2026-06-20", nextReplacementDate: "2026-12-20" },
    customerStatus: "active",
    source: "sample",
  },
];

const defaultReports = [
  {
    id: "report-001",
    storeId: "store-001",
    engineer: "홍길동",
    visitTypeId: "filter-replace",
    date: "2026-05-06",
    arrivalTime: "10:20",
    finishTime: "11:05",
    checks: ["렌탈 장비 모델 확인", "기존 필터 사용 기간 확인", "누수 여부 확인", "교체 후 수압 확인"],
    photos: ["설치처 외관", "교체 전 필터", "새 필터 라벨", "교체 후 연결부"],
    issueCause: "정기 교체 주기 도래",
    actionTaken: "전처리 필터와 카본 필터 교체 완료. 출수 상태 정상 확인.",
    needRevisit: "아니오",
    customerConfirm: "확인 완료",
    status: "승인",
  },
  {
    id: "report-002",
    storeId: "store-003",
    engineer: "김도윤",
    visitTypeId: "repair",
    date: "2026-05-12",
    arrivalTime: "14:10",
    finishTime: "15:25",
    checks: ["고객 신고 증상 확인", "누수/수압/맛 이상 원인 확인", "조치 후 정상 출수", "재발 가능성 확인"],
    photos: ["증상 위치", "문제 부위", "조치 후", "출수 확인"],
    issueCause: "하우징 연결부 패킹 노후로 미세 누수 발생",
    actionTaken: "패킹 교체 후 누수 재확인. 출수 상태 정상.",
    needRevisit: "아니오",
    customerConfirm: "확인 완료",
    status: "승인",
  },
];

const defaultServiceOrders = [
  {
    id: "order-001",
    storeId: "store-001",
    type: "filter-replace",
    visitDate: "2026-05-20",
    assignedEngineer: "홍길동",
    priority: "보통",
    request: "정기 교체 주기 도래. 전처리 필터와 카본 필터 확인.",
    status: "scheduled",
    source: "periodic",
  },
  {
    id: "order-002",
    storeId: "store-003",
    type: "repair",
    visitDate: "2026-05-20",
    assignedEngineer: "",
    priority: "높음",
    request: "고객 신고: 하부 연결부 누수 의심.",
    status: "scheduled",
    source: "office",
  },
];

let state = loadState();
state.followUps ||= [];
state.serviceOrders ||= [];
let selectedStoreId = state.stores[0]?.id || null;
let currentPosition = null;
let currentDepartment = normalizeDepartmentId(
  localStorage.getItem(DEPARTMENT_KEY) || legacyRoleDepartments[localStorage.getItem(LEGACY_ROLE_KEY)] || "tech"
);
let isReportComposerOpen = false;
let currentSession = loadSession();
let activeOrderId = null;
let tmapState = {
  map: null,
  clusterer: null,
  markers: [],
  infoWindow: null,
  renderToken: 0,
};
let supabaseClient = null;
let supabaseState = {
  enabled: false,
  loaded: false,
  loading: false,
  error: "",
  monthlyItems: null,
  reports: null,
  serviceOrders: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    parsed.stores = parsed.stores.map((store) => ({
      ...store,
      customerStatus: store.customerStatus || "active",
      source: store.source || "legacy",
    }));
    parsed.followUps ||= [];
    parsed.serviceOrders ||= [];
    return parsed;
  }
  return {
    stores: defaultStores,
    visitTypes: defaultVisitTypes,
    reports: defaultReports,
    followUps: [],
    serviceOrders: defaultServiceOrders,
  };
}

function saveState() {
  const persistable = {
    ...state,
    stores: state.stores.filter((store) => !["encom", "supabase"].includes(store.source)),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
}

function normalizeDepartmentId(value) {
  return departments[value] ? value : "tech";
}

function departmentMembers(departmentId) {
  return departments[normalizeDepartmentId(departmentId)].members;
}

function departmentLabel(departmentId) {
  return departments[normalizeDepartmentId(departmentId)].label;
}

function hasCurrentWorkspace(departmentId) {
  return departments[normalizeDepartmentId(departmentId)].currentWorkspace;
}

function normalizeSession(session) {
  if (!session) return null;
  const isLegacySession = !session.department && session.role;
  const department = normalizeDepartmentId(
    session.department || legacyRoleDepartments[session.role] || currentDepartment
  );
  const members = departmentMembers(department);
  const name = isLegacySession && !members.includes(session.name) ? members[0] : session.name || members[0];
  return {
    ...session,
    department,
    name,
  };
}

function loadSession() {
  const saved = sessionStorage.getItem(SESSION_KEY);
  return saved ? normalizeSession(JSON.parse(saved)) : null;
}

function saveSession(session) {
  currentSession = normalizeSession(session);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
}

function getVisitType(id) {
  return state.visitTypes.find((type) => type.id === id) || state.visitTypes[0];
}

function getStore(id) {
  return state.stores.find((store) => sameDbId(store.id, id));
}

function isLocalAppHost() {
  return ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
}

function pickField(record, names, fallback = "") {
  if (!record) return fallback;
  for (const name of names) {
    const value = record[name];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function normalizeDbId(value) {
  return value === undefined || value === null ? "" : String(value);
}

function sameDbId(left, right) {
  return normalizeDbId(left) === normalizeDbId(right);
}

function normalizeDbNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeDbArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Plain text values are treated as a single checklist/product entry.
    }
    return [value];
  }
  return [value];
}

function normalizeNeedRevisit(value) {
  if (value === true) return "예";
  if (value === false) return "아니오";
  return value || "아니오";
}

function needRevisitToDb(value) {
  return value === true || String(value || "").trim() === "예";
}

function isLocalGeneratedId(value) {
  return /^(order|report|periodic|temp-store)-/.test(String(value || ""));
}

function upsertById(list, item) {
  return [item, ...(list || []).filter((entry) => !sameDbId(entry.id, item.id))];
}

function currentReports() {
  return supabaseState.reports || state.reports || [];
}

function currentServiceOrders() {
  return supabaseState.serviceOrders || state.serviceOrders || [];
}

async function initializeSupabaseClient() {
  try {
    const response = await fetch(SUPABASE_CONFIG_ENDPOINT, { cache: "no-store" });
    if (!response.ok) return;
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase?.createClient) {
      supabaseState.enabled = false;
      supabaseState.error = "Supabase config is incomplete";
      return;
    }
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    supabaseState.enabled = true;
    supabaseState.error = "";
  } catch (error) {
    supabaseState.enabled = false;
    supabaseState.error = error.message || "Failed to initialize Supabase";
    console.warn("Supabase 초기화 실패, localStorage fallback 사용:", error);
  }
}

function normalizeSupabaseStore(row) {
  const customer = row?.customers || row?.customer || row?.customer_data || row || {};
  const product = row || {};
  const customerId = pickField(customer, ["id", "customer_id", "store_id", "고객_id", "고객ID"], "");
  const fallbackId = pickField(product, ["customer_id", "store_id", "고객_id", "customerId", "id"], "");
  const id = normalizeDbId(customerId || fallbackId);
  const name = pickField(customer, ["name", "customer_name", "고객명", "상호", "설치처명"], pickField(product, ["고객명", "상호", "설치처명"], ""));
  const address = pickField(customer, ["address", "주소", "road_address", "도로명주소"], pickField(product, ["주소", "address"], ""));
  const manager = pickField(product, ["정기_담당_엔지니어", "assigned_engineer", "engineer"], pickField(customer, ["manager", "담당자"], ""));
  const visitMonth = pickField(product, ["방문_월1", "visit_month_1", "visitMonth1"], "");
  const managementNo = pickField(customer, ["management_no", "관리번호", "customer_code"], pickField(product, ["management_no", "관리번호"], ""));
  const productName = pickField(product, ["product_name", "제품명", "상품명", "name"], "");
  const lat = normalizeDbNumber(pickField(customer, ["lat", "latitude", "위도"], pickField(product, ["lat", "latitude", "위도"], null)));
  const lng = normalizeDbNumber(pickField(customer, ["lng", "longitude", "경도"], pickField(product, ["lng", "longitude", "경도"], null)));

  return {
    id,
    customerId: id,
    managementNo,
    name: name || "고객명 없음",
    ownerName: pickField(customer, ["owner_name", "계약자", "대표자", "성명", "법인명"], ""),
    address,
    addressMemo: pickField(customer, ["address_memo", "주소메모"], ""),
    manager,
    phone: pickField(customer, ["phone", "전화", "연락처", "연락처_유선"], ""),
    mobile: pickField(customer, ["mobile", "휴대폰", "핸드폰", "휴대폰_주"], ""),
    openTime: pickField(customer, ["open_time", "오픈시간"], ""),
    customerType: pickField(customer, ["customer_type", "고객유형", "업종", "업태"], ""),
    lat,
    lng,
    equipment: productName ? [productName] : [],
    products: productName ? [productName] : [],
    productItems: [product].filter(Boolean),
    customerStatus: "active",
    source: "supabase",
    route: {
      serviceRegion: manager,
      routeMonth: visitMonth,
    },
    contact: customer.contact || {},
    product,
    serviceOrder: {},
    serviceMemo: pickField(customer, ["service_memo", "메모"], ""),
  };
}

function normalizeSupabaseReport(row) {
  return {
    id: normalizeDbId(pickField(row, ["id"], `report-${Date.now()}`)),
    storeId: normalizeDbId(pickField(row, ["customer_id", "store_id", "고객_id"], "")),
    orderId: normalizeDbId(pickField(row, ["service_order_id", "order_id"], "")),
    engineer: pickField(row, ["engineer", "engineer_name", "created_by", "작성자"], "현장 엔지니어"),
    visitTypeId: pickField(row, ["visit_type_id", "visit_type", "방문유형"], "inspection"),
    date: pickField(row, ["visit_date", "date", "방문일"], today()),
    arrivalTime: pickField(row, ["arrival_time", "arrivalTime", "도착시간"], ""),
    finishTime: pickField(row, ["finish_time", "finishTime", "종료시간"], ""),
    checks: normalizeDbArray(pickField(row, ["checks", "checklist", "체크리스트"], [])),
    processedProducts: normalizeDbArray(pickField(row, ["processed_products", "processedProducts", "처리제품"], [])),
    photos: normalizeDbArray(pickField(row, ["photos", "사진"], [])),
    issueCause: pickField(row, ["issue_cause", "issueCause", "문제원인"], ""),
    actionTaken: pickField(row, ["action_taken", "actionTaken", "조치내용"], ""),
    needRevisit: normalizeNeedRevisit(pickField(row, ["need_revisit", "needRevisit", "재방문"], "아니오")),
    customerConfirm: pickField(row, ["customer_confirm", "customerConfirm", "고객확인"], "확인 완료"),
    status: pickField(row, ["status", "상태"], "검토 대기"),
    position: {
      lat: normalizeDbNumber(pickField(row, ["latitude", "lat", "위도"], null)),
      lng: normalizeDbNumber(pickField(row, ["longitude", "lng", "경도"], null)),
    },
    followUpText: pickField(row, ["follow_up_text", "followUpText", "재확인내용"], ""),
  };
}

function normalizeSupabaseOrder(row) {
  return {
    id: normalizeDbId(pickField(row, ["id"], `order-${Date.now()}`)),
    storeId: normalizeDbId(pickField(row, ["customer_id", "store_id", "고객_id"], "")),
    type: pickField(row, ["type", "order_type", "업무유형"], "inspection"),
    visitDate: pickField(row, ["visit_date", "visitDate", "방문예정일"], today()),
    assignedEngineer: pickField(row, ["assigned_engineer", "assigned_engineer_name", "정기_담당_엔지니어", "배정엔지니어"], ""),
    priority: pickField(row, ["priority", "긴급도"], "보통"),
    request: pickField(row, ["request", "요청내용", "접수내용"], ""),
    status: pickField(row, ["status", "상태"], "scheduled"),
    source: pickField(row, ["source", "출처"], "office"),
    createdAt: pickField(row, ["created_at", "createdAt"], ""),
    createdBy: pickField(row, ["created_by", "createdBy"], ""),
    completedAt: pickField(row, ["completed_at", "completedAt"], ""),
    completedReportId: normalizeDbId(pickField(row, ["completed_report_id", "completedReportId"], "")),
  };
}

function reportMatchesMonth(report, monthKey) {
  return String(report.date || "").startsWith(monthKey);
}

function reportsForStoreFromList(storeId, monthKey, reports) {
  return reports
    .filter((report) => sameDbId(report.storeId, storeId) && reportMatchesMonth(report, monthKey))
    .sort((a, b) => `${b.date} ${b.finishTime || b.arrivalTime || ""}`.localeCompare(`${a.date} ${a.finishTime || a.arrivalTime || ""}`));
}

function orderMatchesMonth(order, monthKey) {
  return String(order.visitDate || "").startsWith(monthKey);
}

function serviceOrdersForStoreFromList(storeId, monthKey, orders) {
  return orders
    .filter((order) => sameDbId(order.storeId, storeId))
    .filter((order) => !monthKey || orderMatchesMonth(order, monthKey));
}

function monthDateRange(monthInfo) {
  const start = `${monthInfo.year}-${String(monthInfo.month).padStart(2, "0")}-01`;
  const next = new Date(monthInfo.year, monthInfo.month, 1);
  const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
  return { start, end };
}

async function firstSuccessfulSupabaseRead(label, attempts) {
  let lastError = null;
  for (const attempt of attempts) {
    const { data, error } = await attempt();
    if (!error) return data || [];
    lastError = error;
    console.warn(`${label} 조회 시도 실패:`, error);
  }
  throw lastError || new Error(`${label} 조회 실패`);
}

async function firstSuccessfulSupabaseMutation(label, attempts) {
  let lastError = null;
  for (const attempt of attempts) {
    const { data, error } = await attempt();
    if (!error) return data;
    lastError = error;
    console.warn(`${label} 저장 시도 실패:`, error);
  }
  throw lastError || new Error(`${label} 저장 실패`);
}

function mergeSupabaseStore(existing, incoming) {
  const productItems = [...(existing.productItems || []), ...(incoming.productItems || [])].filter(Boolean);
  const products = [...new Set([...(existing.products || []), ...(incoming.products || [])].filter(Boolean))];
  const equipment = [...new Set([...(existing.equipment || []), ...(incoming.equipment || [])].filter(Boolean))];
  return {
    ...existing,
    ...Object.fromEntries(Object.entries(incoming).filter(([, value]) => value !== "" && value !== null && value !== undefined)),
    products,
    equipment,
    productItems,
  };
}

function isUsableStore(store) {
  return Boolean(store?.id && store.name && store.name !== "고객명 없음");
}

function mergeSupabaseStores(stores) {
  stores.filter(isUsableStore).forEach((store) => {
    const index = state.stores.findIndex((item) => sameDbId(item.id, store.id));
    if (index >= 0) {
      state.stores[index] = mergeSupabaseStore(state.stores[index], store);
    } else {
      state.stores.push(store);
    }
  });
}

function supabaseRowsToStores(rows) {
  return (rows || []).map(normalizeSupabaseStore).filter(isUsableStore);
}

function sortMonthlyItems(items) {
  return [...items].sort((a, b) => {
    const nameDiff = compareKoreanText(storeNameSortKey(a.store), storeNameSortKey(b.store));
    if (nameDiff) return nameDiff;
    const areaDiff = compareKoreanText(a.area, b.area);
    if (areaDiff) return areaDiff;
    const engineerDiff = engineerSortIndex(a.engineer.key) - engineerSortIndex(b.engineer.key);
    if (engineerDiff) return engineerDiff;
    return compareKoreanText(a.store.managementNo, b.store.managementNo);
  });
}

function buildSupabaseMonthlyItems(productRows, reports, orders, monthInfo) {
  const storesById = new Map();
  productRows.forEach((row) => {
    const store = normalizeSupabaseStore(row);
    if (!isUsableStore(store)) return;
    const existing = storesById.get(store.id);
    storesById.set(store.id, existing ? mergeSupabaseStore(existing, store) : store);
  });

  return sortMonthlyItems(
    [...storesById.values()].map((store) => {
      const storeReports = reportsForStoreFromList(store.id, monthInfo.key, reports);
      const storeOrders = serviceOrdersForStoreFromList(store.id, monthInfo.key, orders);
      const scopeKey = monthlyEngineerKeysByName[currentSession?.name || ""];
      const engineer = scopeKey
        ? { key: scopeKey, teamCode: scopeKey, name: currentSession.name }
        : monthlyEngineer(store);
      return {
        store,
        reports: storeReports,
        serviceOrders: storeOrders,
        completed: storeReports.length > 0,
        engineer,
        area: addressArea(store),
        specialOrders: storeOrders
          .filter((order) => !isHiddenSpecialOrderStatus(order.status))
          .map((order) => ({
            type: localSpecialOrderTypes[order.type] || orderTypeLabels[order.type] || order.type,
            status: statusLabel(order.status),
            source: "Supabase",
          })),
      };
    })
  );
}

async function fetchSupabaseMonthlyProductRows(monthInfo) {
  const month = monthInfo.month;
  const engineerName = currentSession?.name || "";

  // 서버사이드 API 우선 (RLS 우회, service role key 사용)
  try {
    const params = new URLSearchParams({ month: String(month) });
    if (engineerName) params.set("engineer", engineerName);
    const response = await fetch(`/api/monthly-route?${params}`, { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      return data.rows || [];
    }
    console.warn("monthly-route API 응답 실패:", response.status);
  } catch (err) {
    console.warn("monthly-route API 호출 실패, Supabase 직접 조회 시도:", err);
  }

  // Fallback: Supabase 클라이언트 직접 조회
  if (!supabaseClient) return [];

  let query = supabaseClient
    .from("products")
    .select("*")
    .or(`방문_월1.eq.${month},방문_월2.eq.${month}`);

  if (engineerName) {
    query = query.eq("정기_담당_엔지니어", engineerName);
  }

  const { data: productRows, error: productError } = await query;
  if (productError) {
    console.error("products 조회 실패:", productError);
    return [];
  }

  const customerIds = [...new Set((productRows || []).map((product) => product.customer_id).filter(Boolean))];
  if (customerIds.length === 0) return [];

  const { data: customerRows, error: customerError } = await supabaseClient
    .from("customers")
    .select("*")
    .in("id", customerIds);

  if (customerError) {
    console.error("customers 조회 실패:", customerError);
    return [];
  }

  const customerMap = Object.fromEntries((customerRows || []).map((customer) => [customer.id, customer]));
  return productRows.map((product) => ({
    ...product,
    customers: customerMap[product.customer_id] || null,
  }));
}

async function fetchSupabaseReportRows(monthInfo) {
  const { start, end } = monthDateRange(monthInfo);
  return firstSuccessfulSupabaseRead("방문 보고서", [
    () =>
      supabaseClient
        .from(SUPABASE_TABLES.visitReports)
        .select("*, customers(*)")
        .gte("visit_date", start)
        .lt("visit_date", end)
        .order("visit_date", { ascending: false }),
    () =>
      supabaseClient
        .from(SUPABASE_TABLES.visitReports)
        .select("*, customer:customers(*)")
        .gte("visit_date", start)
        .lt("visit_date", end)
        .order("visit_date", { ascending: false }),
    () =>
      supabaseClient
        .from(SUPABASE_TABLES.visitReports)
        .select("*")
        .gte("visit_date", start)
        .lt("visit_date", end)
        .order("visit_date", { ascending: false }),
    () => supabaseClient.from(SUPABASE_TABLES.visitReports).select("*").gte("date", start).lt("date", end),
    () => supabaseClient.from(SUPABASE_TABLES.visitReports).select("*"),
  ]);
}

async function fetchSupabaseServiceOrderRows(monthInfo) {
  const { start, end } = monthDateRange(monthInfo);
  return firstSuccessfulSupabaseRead("서비스 오더", [
    () =>
      supabaseClient
        .from(SUPABASE_TABLES.serviceOrders)
        .select("*, customers(*)")
        .gte("visit_date", start)
        .lt("visit_date", end)
        .order("visit_date", { ascending: false }),
    () =>
      supabaseClient
        .from(SUPABASE_TABLES.serviceOrders)
        .select("*, customer:customers(*)")
        .gte("visit_date", start)
        .lt("visit_date", end)
        .order("visit_date", { ascending: false }),
    () =>
      supabaseClient
        .from(SUPABASE_TABLES.serviceOrders)
        .select("*")
        .gte("visit_date", start)
        .lt("visit_date", end)
        .order("visit_date", { ascending: false }),
    () => supabaseClient.from(SUPABASE_TABLES.serviceOrders).select("*").gte("date", start).lt("date", end),
    () => supabaseClient.from(SUPABASE_TABLES.serviceOrders).select("*"),
  ]);
}

async function refreshSupabaseData({ force = false } = {}) {
  if (!supabaseClient || !supabaseState.enabled || !currentSession) return false;
  if (supabaseState.loading) return false;
  if (supabaseState.loaded && !force) return true;

  supabaseState.loading = true;
  try {
    const monthInfo = currentMonthInfo();
    const [productRows, reportRows, orderRows] = await Promise.all([
      fetchSupabaseMonthlyProductRows(monthInfo),
      fetchSupabaseReportRows(monthInfo),
      fetchSupabaseServiceOrderRows(monthInfo),
    ]);
    const reports = reportRows.map(normalizeSupabaseReport).filter((report) => reportMatchesMonth(report, monthInfo.key));
    const serviceOrders = orderRows.map(normalizeSupabaseOrder).filter((order) => !order.visitDate || orderMatchesMonth(order, monthInfo.key));
    const stores = [
      ...supabaseRowsToStores(productRows),
      ...supabaseRowsToStores(reportRows),
      ...supabaseRowsToStores(orderRows),
    ];

    mergeSupabaseStores(stores);
    supabaseState.reports = reports;
    supabaseState.serviceOrders = serviceOrders;
    supabaseState.monthlyItems = buildSupabaseMonthlyItems(productRows, reports, serviceOrders, monthInfo);
    supabaseState.loaded = true;
    supabaseState.error = "";
    if (!selectedStoreId && supabaseState.monthlyItems[0]) selectedStoreId = supabaseState.monthlyItems[0].store.id;
    return true;
  } catch (error) {
    supabaseState.error = error.message || "Supabase data load failed";
    supabaseState.monthlyItems = null;
    supabaseState.reports = null;
    supabaseState.serviceOrders = null;
    console.warn("Supabase 조회 실패, localStorage fallback 사용:", error);
    return false;
  } finally {
    supabaseState.loading = false;
  }
}

function serviceOrderPayloads(order) {
  const base = {
    visit_date: order.visitDate,
    priority: order.priority,
    request: order.request,
    status: order.status,
    source: order.source,
  };
  return [
    {
      ...base,
      customer_id: order.storeId,
      type: order.type,
      assigned_engineer: order.assignedEngineer,
      created_by: order.createdBy,
    },
    {
      ...base,
      customer_id: order.storeId,
      type: order.type,
      assigned_engineer: order.assignedEngineer,
    },
    {
      ...base,
      store_id: order.storeId,
      order_type: order.type,
      assigned_engineer_name: order.assignedEngineer,
    },
  ];
}

async function createServiceOrder(order) {
  if (!supabaseClient || !supabaseState.enabled) {
    state.serviceOrders.unshift(order);
    saveState();
    return order;
  }

  try {
    const row = await firstSuccessfulSupabaseMutation(
      "서비스 오더",
      serviceOrderPayloads(order).map((payload) => () =>
        supabaseClient.from(SUPABASE_TABLES.serviceOrders).insert(payload).select().single()
      )
    );
    const saved = normalizeSupabaseOrder(row || order);
    supabaseState.serviceOrders = upsertById(supabaseState.serviceOrders || [], saved);
    return saved;
  } catch (error) {
    console.warn("서비스 오더 Supabase 저장 실패, localStorage fallback 사용:", error);
    state.serviceOrders.unshift(order);
    saveState();
    return order;
  }
}

function visitReportPayloads(report) {
  const position = report.position || {};
  const base = {
    visit_date: report.date,
    arrival_time: report.arrivalTime,
    finish_time: report.finishTime,
    issue_cause: report.issueCause,
    action_taken: report.actionTaken,
    customer_confirm: report.customerConfirm,
    status: report.status,
    latitude: normalizeDbNumber(position.lat),
    longitude: normalizeDbNumber(position.lng),
    processed_products: report.processedProducts || [],
    follow_up_text: report.followUpText || "",
  };
  const serviceOrderId = report.orderId && !isLocalGeneratedId(report.orderId) ? report.orderId : null;
  return [
    {
      ...base,
      customer_id: report.storeId,
      service_order_id: serviceOrderId,
      engineer: report.engineer,
      visit_type: report.visitTypeId,
      checks: report.checks,
      photos: report.photos,
      need_revisit: report.needRevisit,
    },
    {
      ...base,
      customer_id: report.storeId,
      engineer: report.engineer,
      visit_type: report.visitTypeId,
      need_revisit: report.needRevisit,
    },
    {
      ...base,
      store_id: report.storeId,
      service_order_id: serviceOrderId,
      visit_type_id: report.visitTypeId,
      need_revisit: needRevisitToDb(report.needRevisit),
    },
  ].map((payload) => Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== undefined)));
}

async function createVisitReport(report) {
  if (!supabaseClient || !supabaseState.enabled) {
    state.reports.unshift(report);
    saveState();
    return report;
  }

  try {
    const row = await firstSuccessfulSupabaseMutation(
      "방문 보고서",
      visitReportPayloads(report).map((payload) => () =>
        supabaseClient.from(SUPABASE_TABLES.visitReports).insert(payload).select().single()
      )
    );
    const saved = normalizeSupabaseReport(row || report);
    supabaseState.reports = upsertById(supabaseState.reports || [], saved);
    return saved;
  } catch (error) {
    console.warn("방문 보고서 Supabase 저장 실패, localStorage fallback 사용:", error);
    state.reports.unshift(report);
    saveState();
    return report;
  }
}

async function updateServiceOrderStatus(order, status, reportId = "") {
  const localUpdate = () => {
    const localOrder = state.serviceOrders.find((item) => sameDbId(item.id, order.id));
    if (localOrder) {
      localOrder.status = status;
      localOrder.completedAt = new Date().toISOString();
      localOrder.completedReportId = reportId;
      saveState();
    }
    return localOrder || { ...order, status, completedAt: new Date().toISOString(), completedReportId: reportId };
  };

  if (!supabaseClient || !supabaseState.enabled) return localUpdate();

  try {
    const completedAt = new Date().toISOString();
    const updateWithReport = {
      status,
      completed_at: completedAt,
      ...(reportId && !isLocalGeneratedId(reportId) ? { completed_report_id: reportId } : {}),
    };
    const row = await firstSuccessfulSupabaseMutation("서비스 오더 상태", [
      () => supabaseClient.from(SUPABASE_TABLES.serviceOrders).update(updateWithReport).eq("id", order.id).select().single(),
      () => supabaseClient.from(SUPABASE_TABLES.serviceOrders).update({ status }).eq("id", order.id).select().single(),
    ]);
    const updated = normalizeSupabaseOrder(row || { ...order, status, completedAt, completedReportId: reportId });
    supabaseState.serviceOrders = upsertById(supabaseState.serviceOrders || [], updated);
    return updated;
  } catch (error) {
    console.warn("서비스 오더 상태 Supabase 변경 실패, localStorage fallback 사용:", error);
    return localUpdate();
  }
}

async function updateVisitReportStatus(report, status) {
  const localUpdate = () => {
    const localReport = state.reports.find((item) => sameDbId(item.id, report.id));
    if (localReport) {
      localReport.status = status;
      saveState();
    }
    return localReport || { ...report, status };
  };

  if (!supabaseClient || !supabaseState.enabled) return localUpdate();

  try {
    const row = await firstSuccessfulSupabaseMutation("방문 보고서 상태", [
      () => supabaseClient.from(SUPABASE_TABLES.visitReports).update({ status }).eq("id", report.id).select().single(),
      () => supabaseClient.from(SUPABASE_TABLES.visitReports).update({ 상태: status }).eq("id", report.id).select().single(),
    ]);
    const updated = normalizeSupabaseReport(row || { ...report, status });
    supabaseState.reports = upsertById(supabaseState.reports || [], updated);
    return updated;
  } catch (error) {
    console.warn("방문 보고서 상태 Supabase 변경 실패, localStorage fallback 사용:", error);
    return localUpdate();
  }
}

async function hydrateExternalCustomers() {
  const candidates = isLocalAppHost() ? ["./data/customers.local.json"] : ["/api/customers"];
  try {
    let payload = null;
    for (const url of candidates) {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) continue;
      payload = await response.json();
      break;
    }
    if (!payload) return;
    const localStores = state.stores.filter((store) => store.source !== "encom");
    const existingIds = new Set(localStores.map((store) => store.id));
    const importedStores = payload.stores
      .filter((store) => store.name && store.address && !existingIds.has(store.id))
      .map((store) => ({
        ...store,
        lat: store.lat ?? null,
        lng: store.lng ?? null,
        customerStatus: store.customerStatus || "caution",
        source: "encom",
      }));
    state.stores = [...localStores, ...importedStores];
  } catch {
    // Local customer data is optional during early prototype work.
  }
}

async function hydrateGeocodeResults() {
  try {
    const response = await fetch("./data/geocode-results.local.json", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    const coordinates = new Map(
      (payload.results || [])
        .filter((result) => result.status === "ok" && typeof result.lat === "number" && typeof result.lng === "number")
        .map((result) => [result.id, result])
    );
    if (!coordinates.size) return;

    state.stores = state.stores.map((store) => {
      const result = coordinates.get(store.id);
      if (!result) return store;
      return {
        ...store,
        lat: result.lat,
        lng: result.lng,
        needsGeocode: false,
        geocode: {
          provider: result.provider || "naver",
          roadAddress: result.roadAddress || "",
          jibunAddress: result.jibunAddress || "",
          geocodedAt: result.geocodedAt || "",
        },
      };
    });
  } catch {
    // Geocode results may not exist yet, or may be mid-write during a local batch.
  }
}

function valueOrBlank(selector) {
  return $(selector)?.value?.trim() || "";
}

function classifyCustomer(record) {
  if (record.deletedAt) return "terminated";
  if (record.contractEndedAt) return "terminated";
  if (record.productStatus === "계약해지") return "terminated";
  if (record.recoveredAt && record.managementStatus === "관리안함") return "terminated";
  if (record.managementStatus === "관리함" && record.productStatus === "설치완료") return "active";
  if (record.cmsStatus === "해지완료" || record.endedAt) return "caution";
  return "caution";
}

function statusClass(store) {
  return store.customerStatus || "active";
}

function formatProductItem(product) {
  if (typeof product === "string") return product;
  const filters = (product.filters || [])
    .slice(0, 2)
    .map((filter) => {
      const parts = [
        filter.name,
        filter.cycle ? `주기 ${filter.cycle}` : "",
        filter.nextDate ? `예정 ${filter.nextDate}` : "",
      ];
      return parts.filter(Boolean).join(" / ");
    })
    .filter(Boolean)
    .join(", ");
  const notes = [product.modelNote, product.connectionNote, product.referenceNote, product.productMemo]
    .filter(Boolean)
    .slice(0, 2)
    .join(" / ");
  const parts = [
    product.productName || "제품 확인 필요",
    product.installPlace || product.installPlaceNote || "",
    filters,
    notes ? `비고 ${notes}` : "",
  ];
  return parts.filter(Boolean).join(" / ");
}

function storeProductList(store) {
  if (!store) return [];
  if (store.productItems?.length) return store.productItems.map(formatProductItem);
  return [ ...(store.products || []), ...(store.products?.length ? [] : store.equipment || []) ];
}

function productCountLabel(store) {
  const count = store.activeProductCount || store.productCount || store.productItems?.length || store.equipment?.length || 0;
  return `${count}개 제품/필터`;
}

function storeDetailBlocks(store) {
  const filters = store.filterSchedule || {};
  const order = store.serviceOrder || {};
  const contract = store.contract || {};
  const product = store.product || {};
  const route = store.route || {};
  const products = storeProductList(store);
  return `
    <div class="detail-grid">
      <article class="detail-card">
        <h3>고객/계약</h3>
        <p>관리번호: ${store.managementNo || "-"}</p>
        <p>계약자: ${store.ownerName || "-"}</p>
        <p>고객 유형: ${store.customerType || "-"}</p>
        <p>계약일자: ${contract.contractDate || "-"}</p>
        <p>CMS 상태: ${contract.cmsStatus || "-"}</p>
      </article>
      <article class="detail-card">
        <h3>연락/방문</h3>
        <p>연락처: ${store.phone || "-"}</p>
        <p>휴대폰: ${store.mobile || "-"}</p>
        <p>오픈시간: ${store.openTime || "-"}</p>
        <p>주소 메모: ${store.addressMemo || "-"}</p>
      </article>
      <article class="detail-card">
        <h3>제품/관리</h3>
        <p>제품명: ${product.productName || "-"}</p>
        <p>모델/비고: ${product.modelName || "-"}</p>
        <p>설치장소: ${product.installPlace || "-"}</p>
        <p>제품상태: ${product.productStatus || "-"}</p>
        <p>관리여부: ${product.managementStatus || "-"}</p>
        <p>제품 수: ${productCountLabel(store)}</p>
      </article>
      <article class="detail-card">
        <h3>지역/주기</h3>
        <p>담당 지역: ${route.serviceRegion || "-"}</p>
        <p>정기 방문월: ${route.routeMonth ? `${route.routeMonth}월` : "-"}</p>
        <p>점검 주기: ${filters.inspectionCycleMonths ? `${filters.inspectionCycleMonths}개월` : "-"}</p>
        <p>교체 주기: ${filters.replacementCycleMonths ? `${filters.replacementCycleMonths}개월` : "-"}</p>
        <p>카페 정책: ${filters.cafePolicy || "-"}</p>
      </article>
      <article class="detail-card">
        <h3>일정/오더</h3>
        <p>최근 교체일: ${filters.lastFilterDate || "-"}</p>
        <p>다음 점검: ${filters.nextInspectionDate || "-"}</p>
        <p>다음 정기교체: ${filters.nextReplacementDate || "-"}</p>
        <p>방문예정일: ${order.visitScheduledAt || "-"}</p>
        <p>진행상태: ${order.progressStatus || "-"}</p>
      </article>
    </div>
    ${
      products.length
        ? `<div class="form-block"><h3>제품별 관리 목록</h3><ul>${products.map((item) => `<li>${item}</li>`).join("")}</ul></div>`
        : ""
    }
    ${store.serviceMemo ? `<div class="form-block"><h3>접수/처리 메모</h3><p>${store.serviceMemo}</p></div>` : ""}
  `;
}

function makeBandSummary(report) {
  const store = getStore(report.storeId);
  const type = getVisitType(report.visitTypeId);
  return [
    "[현장 방문 보고]",
    "",
    `설치처: ${store?.name || "-"}`,
    `방문일: ${report.date}`,
    `방문자: ${report.engineer}`,
    `방문 유형: ${type?.name || "-"}`,
    `주요 조치: ${report.actionTaken}`,
    `결과: ${report.needRevisit === "예" ? "재방문 필요" : "완료"}`,
    `고객 확인: ${report.customerConfirm}`,
    `특이사항: ${report.issueCause || "해당 없음"}`,
  ].join("\n");
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function distanceMeters(a, b) {
  if (!a || !b) return null;
  if (typeof b.lat !== "number" || typeof b.lng !== "number") return null;
  const toRad = (value) => (value * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function formatDistance(meters) {
  if (meters === null) return "거리 미확인";
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function isDue(dateText) {
  if (!dateText) return false;
  return dateText <= today();
}

function normalizeSearchText(value) {
  return String(value ?? "").toLowerCase().replaceAll("-", "");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function waitForTmapSdkReady() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 160;
    const readiness = () => ({
      hasTmapv2: Boolean(window.Tmapv2),
      hasMap: typeof window.Tmapv2?.Map === "function",
      hasLatLng: typeof window.Tmapv2?.LatLng === "function",
      hasMarker: typeof window.Tmapv2?.Marker === "function",
      hasInfoWindow: typeof window.Tmapv2?.InfoWindow === "function",
      hasMarkerClusterer: hasTmapMarkerClusterer(),
      scripts: [...document.scripts]
        .map((script) => script.src)
        .filter((src) => src.includes("tmap"))
        .map((src) => src.replace(/appKey=[^&]+/, "appKey=***")),
    });
    const check = () => {
      const state = readiness();
      if (state.hasMap && state.hasLatLng && state.hasMarker && state.hasInfoWindow) {
        resolve(window.Tmapv2);
        return;
      }
      attempts += 1;
      if (attempts > maxAttempts) {
        reject(new Error(`Tmap SDK did not initialize: ${JSON.stringify(state)}`));
        return;
      }
      window.setTimeout(check, 50);
    };
    check();
  });
}

function hasTmapMarkerClusterer() {
  return typeof window.Tmapv2?.extension?.MarkerClusterer === "function";
}

function hasStoreCoordinates(store) {
  return Number.isFinite(Number(store?.lat)) && Number.isFinite(Number(store?.lng));
}

function mapMarkerItemsFromMonthlyItems(items) {
  const seen = new Set();
  return items
    .filter((item) => hasStoreCoordinates(item.store))
    .filter((item) => {
      const store = item.store;
      const key = store.id || `${store.name}-${store.lat}-${store.lng}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function monthlyMarkerStatus(item) {
  const hasHoldOrder = [...(item.serviceOrders || []), ...(item.specialOrders || [])].some((order) =>
    ["hold", "보류"].includes(String(order.status || "").trim())
  );
  if (hasHoldOrder) return "hold";
  return item.completed ? "complete" : "pending";
}

function markerStatusLabel(status) {
  return {
    complete: "완료",
    pending: "미완료",
    hold: "보류",
  }[status] || "미완료";
}

function markerIconForStatus(status) {
  const fill = MAP_MARKER_COLORS[status] || MAP_MARKER_COLORS.pending;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 39s13-13.6 13-24A13 13 0 1 0 3 15c0 10.4 13 24 13 24Z" fill="${fill}"/>
      <circle cx="16" cy="15" r="5.5" fill="#fff"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function clearTmapMarkers() {
  if (tmapState.clusterer) {
    if (typeof tmapState.clusterer.clearMarkers === "function") {
      tmapState.clusterer.clearMarkers();
    } else if (typeof tmapState.clusterer.removeMarkers === "function") {
      tmapState.clusterer.removeMarkers(tmapState.markers);
    } else if (typeof tmapState.clusterer.setMap === "function") {
      tmapState.clusterer.setMap(null);
    }
    tmapState.clusterer = null;
  }
  tmapState.markers.forEach((marker) => {
    if (typeof marker.setMap === "function") marker.setMap(null);
  });
  tmapState.markers = [];
}

function closeTmapInfoWindow() {
  if (!tmapState.infoWindow) return;
  if (typeof tmapState.infoWindow.setMap === "function") {
    tmapState.infoWindow.setMap(null);
  } else if (typeof tmapState.infoWindow.close === "function") {
    tmapState.infoWindow.close();
  }
  tmapState.infoWindow = null;
}

function tmapRouteUrl(store) {
  const goalName = encodeURIComponent(store.name || "설치처");
  const goaly = encodeURIComponent(Number(store.lat));
  const goalx = encodeURIComponent(Number(store.lng));
  return `tmap://route?goalname=${goalName}&goaly=${goaly}&goalx=${goalx}`;
}

function tmapPopupHtml(item) {
  const store = item.store || item;
  const status = item.store ? markerStatusLabel(monthlyMarkerStatus(item)) : "";
  return `
    <div class="tmap-popup">
      <strong>${escapeHtml(store.name || "설치처")}</strong>
      ${status ? `<small>${escapeHtml(status)}</small>` : ""}
      <p>${escapeHtml(store.address || "주소 정보 없음")}</p>
      <a class="tmap-route-button" href="${escapeHtml(tmapRouteUrl(store))}" role="button">길안내</a>
    </div>
  `;
}

function addTmapListener(target, eventName, handler) {
  if (typeof target.addListener === "function") {
    target.addListener(eventName, handler);
    return;
  }
  if (window.Tmapv2?.Event?.addListener) {
    window.Tmapv2.Event.addListener(target, eventName, handler);
  }
}

function showTmapStorePopup(item, position) {
  closeTmapInfoWindow();
  if (typeof tmapState.map?.setCenter === "function") tmapState.map.setCenter(position);
  tmapState.infoWindow = new window.Tmapv2.InfoWindow({
    position,
    content: tmapPopupHtml(item),
    type: 2,
    map: tmapState.map,
  });
}

function createTmapStoreMarker(item) {
  const store = item.store || item;
  const status = item.store ? monthlyMarkerStatus(item) : "pending";
  const position = new window.Tmapv2.LatLng(Number(store.lat), Number(store.lng));
  const marker = new window.Tmapv2.Marker({
    position,
    map: null,
    title: store.name || "",
    icon: markerIconForStatus(status),
  });
  addTmapListener(marker, "click", () => showTmapStorePopup(item, position));
  return marker;
}

function addTmapClusteredMarkers(markerItems) {
  if (!hasTmapMarkerClusterer()) {
    throw new Error("Tmap MarkerClusterer is not available");
  }
  tmapState.clusterer = new window.Tmapv2.extension.MarkerClusterer({
    map: tmapState.map,
    gridSize: 60,
    minimumClusterSize: 2,
  });
  tmapState.markers = markerItems.map(createTmapStoreMarker);
  tmapState.clusterer.addMarkers(tmapState.markers);
}

function currentTmapZoom() {
  const map = tmapState.map;
  const zoom =
    typeof map?.getZoom === "function"
      ? map.getZoom()
      : typeof map?.getZoomLevel === "function"
        ? map.getZoomLevel()
        : map?.zoom;
  const numericZoom = Number(zoom);
  return Number.isFinite(numericZoom) ? numericZoom : TMAP_DEFAULT_ZOOM;
}

function setTmapMarkerVisibility(visible) {
  tmapState.markers.forEach((marker) => {
    if (typeof marker.setMap === "function") marker.setMap(visible ? tmapState.map : null);
  });
  if (!visible) closeTmapInfoWindow();
}

function addTmapZoomControlledMarkers(markerItems, status, summaryText) {
  tmapState.markers = markerItems.map(createTmapStoreMarker);
  const updateVisibility = () => {
    const zoom = currentTmapZoom();
    const visible = zoom >= TMAP_MARKER_MIN_ZOOM;
    setTmapMarkerVisibility(visible);
    status.textContent = visible
      ? `${summaryText} 줌 ${zoom}에서 마커를 표시 중입니다.`
      : `${summaryText} 줌 ${TMAP_MARKER_MIN_ZOOM} 이상으로 확대하면 마커가 표시됩니다.`;
  };

  updateVisibility();
  ["zoom_changed", "zoomend"].forEach((eventName) => addTmapListener(tmapState.map, eventName, updateVisibility));
}

async function initializeMonthlyMap(items, monthInfo) {
  const container = $("#monthlyTmap");
  const status = $("#monthlyMapStatus");
  if (!container || !status) return;

  const token = ++tmapState.renderToken;
  const markerItems = mapMarkerItemsFromMonthlyItems(items);
  status.textContent = "Tmap 지도를 준비하는 중입니다.";

  try {
    await waitForTmapSdkReady();
    if (token !== tmapState.renderToken || !container.isConnected) return;

    clearTmapMarkers();
    closeTmapInfoWindow();
    tmapState.map = new window.Tmapv2.Map(container, {
      center: new window.Tmapv2.LatLng(TMAP_DEFAULT_CENTER.lat, TMAP_DEFAULT_CENTER.lng),
      width: "100%",
      height: "100%",
      zoom: TMAP_DEFAULT_ZOOM,
    });

    const summaryText = markerItems.length
      ? `${monthInfo.label} 대상 ${items.length.toLocaleString()}건 중 좌표 있는 고객 ${markerItems.length.toLocaleString()}건.`
      : `${monthInfo.label} 대상 ${items.length.toLocaleString()}건 중 좌표가 있는 고객이 없습니다.`;
    if (hasTmapMarkerClusterer()) {
      addTmapClusteredMarkers(markerItems);
      status.textContent = `${summaryText} 클러스터링으로 표시 중입니다.`;
    } else {
      console.warn("Tmap MarkerClusterer가 없어 줌 레벨 기반 마커 표시로 대체합니다.");
      addTmapZoomControlledMarkers(markerItems, status, summaryText);
    }
  } catch (error) {
    console.error("Tmap 초기화 에러:", error);
    status.textContent = "Tmap 지도를 불러오지 못했습니다. 로컬 서버와 TMAP_APP_KEY를 확인하세요.";
  }
}

function currentMonthInfo(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return {
    year,
    month,
    key: `${year}-${String(month).padStart(2, "0")}`,
    label: `${year}년 ${month}월`,
    routeMonth: ((month - 1) % 6) + 1,
  };
}

function routeCode(store) {
  return String(store.route?.serviceRegion || store.manager || "").trim();
}

function routeCycleMonth(store) {
  const match = routeCode(store).match(/^([1-6])/);
  return match ? Number(match[1]) : null;
}

function routeTeamCode(store) {
  const match = routeCode(store).match(/^[1-6]\d*([A-Za-z])/);
  return match ? match[1].toUpperCase() : "";
}

function monthlyEngineer(store) {
  const teamCode = routeTeamCode(store);
  return {
    key: monthlyRouteEngineers[teamCode] ? teamCode : "UNASSIGNED",
    teamCode,
    name: monthlyRouteEngineers[teamCode] || "담당 미정",
  };
}

function currentMonthlyScope() {
  const key = monthlyEngineerKeysByName[currentSession?.name || ""];
  if (!key) return null;
  return {
    key,
    name: monthlyRouteEngineers[key],
  };
}

function engineerSortIndex(key) {
  const index = monthlyEngineerOrder.indexOf(key);
  return index === -1 ? monthlyEngineerOrder.length : index;
}

function compareKoreanText(a, b) {
  return koreanNameCollator.compare(String(a || ""), String(b || ""));
}

function storeNameSortKey(store) {
  return String(store.name || "")
    .trim()
    .replace(/^(?:\(주\)|㈜|주식회사)\s*/i, "")
    .trim();
}

function addressArea(store) {
  const parts = String(store.address || "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).join(" ") || "-";
}

function statusLabel(status) {
  const normalized = String(status || "").trim();
  return {
    scheduled: "예정",
    in_progress: "진행 중",
    hold: "보류",
    done: "완료",
    canceled: "취소",
    cancelled: "취소",
  }[normalized] || normalized || "접수";
}

function isHiddenSpecialOrderStatus(status) {
  return ["취소", "canceled", "cancelled"].includes(String(status || "").trim());
}

function normalizeSpecialRequestType(value) {
  const normalized = String(value || "").trim().replace(/\s+/g, "");
  if (!normalized) return "";
  if (/^A\/?S$/i.test(normalized)) return "A/S";
  if (normalized === "회수") return "회수";
  if (normalized === "철거") return "철거";
  if (normalized === "신규설치" || normalized === "설치") return "신규설치";
  return "";
}

function reportDateInMonth(report, monthKey) {
  return String(report.date || "").startsWith(monthKey);
}

function submittedReportsForStoreInMonth(storeId, monthKey) {
  return reportsForStoreFromList(storeId, monthKey, currentReports()).filter((report) => reportDateInMonth(report, monthKey));
}

function specialOrdersForStore(store, monthKey) {
  const orders = [];
  const importedOrder = store.serviceOrder || {};
  const importedType = normalizeSpecialRequestType(importedOrder.requestType);
  if (importedType && !isHiddenSpecialOrderStatus(importedOrder.progressStatus)) {
    orders.push({
      type: importedType,
      status: statusLabel(importedOrder.progressStatus),
      source: "엔콤",
    });
  }

  currentServiceOrders()
    .filter((order) => order.storeId === store.id)
    .forEach((order) => {
      const type = localSpecialOrderTypes[order.type];
      if (!type) return;
      if (!String(order.visitDate || "").startsWith(monthKey)) return;
      if (isHiddenSpecialOrderStatus(order.status)) return;
      orders.push({
        type,
        status: statusLabel(order.status),
        source: "로컬 오더",
      });
    });

  return orders;
}

function monthlyProgressItems(date = new Date(), scope = currentMonthlyScope()) {
  const monthInfo = currentMonthInfo(date);
  if (supabaseState.monthlyItems) {
    return sortMonthlyItems(
      supabaseState.monthlyItems.filter((item) => !scope?.key || item.engineer.key === scope.key)
    );
  }

  return sortMonthlyItems(state.stores
    .filter((store) => statusClass(store) === "active")
    .filter((store) => routeCycleMonth(store) === monthInfo.routeMonth)
    .map((store) => {
      const reports = submittedReportsForStoreInMonth(store.id, monthInfo.key);
      const serviceOrders = serviceOrdersForStoreFromList(store.id, monthInfo.key, currentServiceOrders());
      const engineer = monthlyEngineer(store);
      return {
        store,
        reports,
        serviceOrders,
        completed: reports.length > 0,
        engineer,
        area: addressArea(store),
        specialOrders: specialOrdersForStore(store, monthInfo.key),
      };
    })
    .filter((item) => !scope?.key || item.engineer.key === scope.key));
}

function setDefaultTimes() {
  $("#arrivalTime").value ||= nowTime();
  $("#finishTime").value ||= nowTime();
}

function renderLoginMembers() {
  const departmentSelect = $("#loginDepartment");
  const nameSelect = $("#loginName");
  if (!departmentSelect || !nameSelect) return;
  const previousName = nameSelect.value;
  const department = normalizeDepartmentId(departmentSelect.value);
  const members = departmentMembers(department);
  nameSelect.innerHTML = members.map((name) => `<option value="${name}">${name}</option>`).join("");
  if (members.includes(previousName)) {
    nameSelect.value = previousName;
  }
}

function renderNavigation() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.hidden) return;
      $$(".nav-item").forEach((item) => item.classList.remove("active"));
      $$(".view").forEach((view) => view.classList.remove("active"));
      button.classList.add("active");
      $(`#${button.dataset.view}`).classList.add("active");
      renderAll();
    });
  });
}

function bindMonthlyProgressTabs() {
  $$(".monthly-tab").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.monthlyView;
      $$(".monthly-tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.monthlyView === target);
      });
      $$(".monthly-progress-view").forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.monthlyPanel === target);
      });
      if (target === "map") renderMonthlyProgress();
    });
  });
}

function isDepartmentAllowed(button) {
  const allowedDepartments = (button.dataset.departments || "").split(" ").filter(Boolean);
  const allowedUsers = (button.dataset.users || "").split(" ").filter(Boolean);
  const departmentAllowed = allowedDepartments.includes(currentDepartment);
  const userAllowed = !allowedUsers.length || allowedUsers.includes(currentSession?.name || "");
  return departmentAllowed && userAllowed;
}

function renderDepartmentAccess() {
  $("#roleSelect").value = currentDepartment;
  $("#sessionUser").textContent = currentSession
    ? `${currentSession.name} · ${departmentLabel(currentDepartment)}`
    : departmentLabel(currentDepartment);
  $("#pendingDepartmentTitle").textContent = `${departmentLabel(currentDepartment)} 화면`;
  const navItems = $$(".nav-item");
  navItems.forEach((button) => {
    button.hidden = !isDepartmentAllowed(button);
  });

  const hasAllowedNav = navItems.some((button) => !button.hidden);
  $("#departmentPending").classList.toggle("active", !hasAllowedNav);
  if (!hasAllowedNav) {
    navItems.forEach((button) => button.classList.remove("active"));
    $$(".view").forEach((view) => {
      if (view.id !== "departmentPending") view.classList.remove("active");
    });
    return;
  }

  $("#departmentPending").classList.remove("active");
  const activeButton = $(".nav-item.active");
  if (!activeButton || activeButton.hidden) {
    activeButton?.classList.remove("active");
    $$(".view").forEach((view) => view.classList.remove("active"));
    const firstAllowed = navItems.find((button) => !button.hidden);
    firstAllowed?.classList.add("active");
    if (firstAllowed) $(`#${firstAllowed.dataset.view}`).classList.add("active");
  }
}

function showFieldView() {
  $$(".nav-item").forEach((item) => item.classList.remove("active"));
  $$(".view").forEach((view) => view.classList.remove("active"));
  const fieldButton = $('.nav-item[data-view="field"]');
  if (fieldButton && !fieldButton.hidden) {
    fieldButton.classList.add("active");
    $("#field").classList.add("active");
  }
}

function renderAuthState() {
  const isLoggedIn = Boolean(currentSession);
  $("#loginScreen").hidden = isLoggedIn;
  $("#appShell").hidden = !isLoggedIn;

  if (!isLoggedIn) {
    $("#loginDepartment").value = currentDepartment;
    renderLoginMembers();
    return;
  }

  currentDepartment = currentSession.department;
  localStorage.setItem(DEPARTMENT_KEY, currentDepartment);
  showFieldView();
  renderAll();
  if (hasCurrentWorkspace(currentDepartment)) requestLocation();
}

function renderStoreCards(target, stores, options = {}) {
  const container = $(target);
  container.innerHTML = "";
  const visibleStores = stores.slice(0, 80);

  if (!visibleStores.length) {
    container.innerHTML = `<div class="empty">조건에 맞는 설치처가 없습니다.</div>`;
    return;
  }

  visibleStores.forEach((store) => {
    const meters = distanceMeters(currentPosition, store);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `store-card ${selectedStoreId === store.id ? "selected" : ""}`;
    card.innerHTML = `
      <strong>${store.name}</strong>
      <span>${store.address}</span>
      <div class="store-meta">
        <span>${formatDistance(meters)}</span>
        <span>담당 ${store.manager}</span>
        <span>${productCountLabel(store)}</span>
        ${store.source === "encom" ? `<span>엔콤</span>` : ""}
        ${store.needsGeocode ? `<span>좌표 필요</span>` : ""}
        <span class="status-pill ${statusClass(store)}">${customerStatusLabels[statusClass(store)]}</span>
      </div>
    `;
    card.addEventListener("click", () => {
      selectedStoreId = store.id;
      activeOrderId = null;
      isReportComposerOpen = false;
      renderAll();
      if (options.activateHistory) {
        renderStoreHistoryDetail();
      }
    });
    container.appendChild(card);
  });

  if (stores.length > visibleStores.length) {
    const note = document.createElement("div");
    note.className = "empty";
    note.textContent = `${stores.length.toLocaleString()}건 중 ${visibleStores.length}건만 표시 중입니다. 설치처명, 주소, 관리번호로 검색하세요.`;
    container.appendChild(note);
  }
}

function openServiceOrders() {
  return currentServiceOrders().filter((order) => !["done", "cancelled", "canceled"].includes(String(order.status || "").trim()));
}

function periodicDueOrders() {
  return state.stores
    .filter((store) => statusClass(store) === "active")
    .flatMap((store) => {
      const schedule = store.filterSchedule || {};
      const due = [];
      if (isDue(schedule.nextInspectionDate)) {
        due.push({
          id: `periodic-inspection-${store.id}`,
          storeId: store.id,
          type: "inspection",
          visitDate: schedule.nextInspectionDate,
          assignedEngineer: "",
          priority: "보통",
          request: "6개월 정기점검 대상",
          status: "scheduled",
          source: "periodic",
          virtual: true,
        });
      }
      if (isDue(schedule.nextReplacementDate)) {
        due.push({
          id: `periodic-replace-${store.id}`,
          storeId: store.id,
          type: "filter-replace",
          visitDate: schedule.nextReplacementDate,
          assignedEngineer: "",
          priority: "보통",
          request: "정기교체 대상",
          status: "scheduled",
          source: "periodic",
          virtual: true,
        });
      }
      return due;
    });
}

function todayWorkItems() {
  const sessionName = currentSession?.name || "";
  return openServiceOrders()
    .filter((order) => order.visitDate === today())
    .filter((order) => !order.assignedEngineer || order.assignedEngineer === sessionName)
    .sort((a, b) => `${a.visitDate} ${a.priority}`.localeCompare(`${b.visitDate} ${b.priority}`));
}

function orderCardHtml(order, includeAction = false) {
  const store = getStore(order.storeId);
  if (!store) return "";
  return `
    <article class="order-card ${order.status === "done" ? "done" : ""}">
      <div class="panel-head">
        <div>
          <h3>${orderTypeLabels[order.type] || order.type} · ${store.name}</h3>
          <p>${order.request}</p>
        </div>
        <span class="status-pill ${order.priority === "긴급" ? "terminated" : order.priority === "높음" ? "caution" : "active"}">${order.priority}</span>
      </div>
      <div class="small-meta">
        <span>${order.visitDate}</span>
        <span>${store.address}</span>
        <span>${order.assignedEngineer || "미배정"}</span>
        <span>${order.source === "periodic" ? "정기관리" : "사무실 오더"}</span>
      </div>
      ${
        includeAction
          ? `<div class="card-actions"><button class="primary-btn start-order" type="button" data-store-id="${store.id}" data-order-id="${order.id}" data-type="${order.type}">방문 시작</button></div>`
          : ""
      }
    </article>
  `;
}

function renderTodayOrders() {
  const orders = todayWorkItems();
  $("#todayOrders").innerHTML = orders.length
    ? orders.map((order) => orderCardHtml(order, true)).join("")
    : `<div class="empty">오늘 배정된 오더가 없습니다. 근처 설치처를 선택해 이력을 확인할 수 있습니다.</div>`;

  $$(".start-order").forEach((button) => {
    button.addEventListener("click", () => {
      selectedStoreId = button.dataset.storeId;
      activeOrderId = button.dataset.orderId;
      isReportComposerOpen = true;
      renderAll();
      $("#visitTypeSelect").value = button.dataset.type;
      renderReportForm();
      $("#reportComposer").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function filteredStores(inputId) {
  const query = normalizeSearchText(($(inputId)?.value || "").trim());
  const stores = state.stores
    .filter((store) => inputId !== "#storeSearch" || statusClass(store) !== "terminated")
    .map((store) => ({ ...store, distance: distanceMeters(currentPosition, store) }))
    .filter((store) => inputId !== "#storeSearch" || !currentPosition || (typeof store.distance === "number" && store.distance <= 1000))
    .sort((a, b) => {
      const aHasDistance = typeof a.distance === "number";
      const bHasDistance = typeof b.distance === "number";
      if (aHasDistance !== bHasDistance) return aHasDistance ? -1 : 1;
      return (a.distance ?? 9999999) - (b.distance ?? 9999999);
    });
  if (!query) return stores;
  return stores.filter((store) =>
    normalizeSearchText(`${store.name} ${store.address} ${store.managementNo || ""} ${store.phone || ""} ${store.mobile || ""}`).includes(query)
  );
}

function renderNearbyStores() {
  renderStoreCards("#nearbyStores", filteredStores("#storeSearch"));
}

function renderVisitTypes() {
  const select = $("#visitTypeSelect");
  const selected = select.value || state.visitTypes[0]?.id;
  select.innerHTML = state.visitTypes
    .map((type) => `<option value="${type.id}">${type.name}</option>`)
    .join("");
  select.value = state.visitTypes.some((type) => type.id === selected) ? selected : state.visitTypes[0]?.id;
}

function renderReportForm() {
  const store = getStore(selectedStoreId);
  $("#selectedStoreName").textContent = store ? `${store.name} 방문 보고` : "설치처를 선택하세요";
  $("#selectedStoreBadge").textContent = store ? "작성 가능" : "대기";
  $("#selectedStoreBadge").classList.toggle("muted", !store);

  const products = storeProductList(store);
  $("#productChecklist").innerHTML = products.length
    ? products
        .map(
          (item) => `
          <label class="check-row">
            <span>${item}</span>
            <input type="checkbox" value="${item}" />
          </label>
        `
        )
        .join("")
    : `<div class="empty">등록된 제품/필터가 없습니다. 현장 확인 후 조치 내용에 남겨주세요.</div>`;

  const visitType = getVisitType($("#visitTypeSelect").value);
  $("#checklist").innerHTML = visitType.checks
    .map(
      (item) => `
        <label class="check-row">
          <span>${item}</span>
          <input type="checkbox" value="${item}" required />
        </label>
      `
    )
    .join("");

  $("#photoSteps").innerHTML = visitType.photos
    .map(
      (item, index) => `
        <label class="photo-row">
          <span>${index + 1}. ${item}</span>
          <input type="file" accept="image/*" capture="environment" data-photo="${item}" required />
          <span class="photo-preview">촬영 전</span>
        </label>
      `
    )
    .join("");

  $$("#photoSteps input").forEach((input) => {
    input.addEventListener("change", () => {
      const preview = input.closest(".photo-row").querySelector(".photo-preview");
      preview.textContent = input.files[0]?.name || "촬영 전";
    });
  });
}

function storeReports(storeId) {
  return currentReports()
    .filter((report) => sameDbId(report.storeId, storeId))
    .sort((a, b) => `${b.date} ${b.arrivalTime}`.localeCompare(`${a.date} ${a.arrivalTime}`));
}

function openFollowUps(storeId) {
  return (state.followUps || [])
    .filter((item) => item.storeId === storeId && item.status === "open")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function followUpsHtml(storeId) {
  const items = openFollowUps(storeId);
  if (!items.length) return "";
  return `
    <div class="form-block attention-block">
      <h3>다음 방문 재확인 항목</h3>
      ${items
        .map(
          (item) => `
          <label class="follow-up-row">
            <input type="checkbox" class="resolve-follow-up" value="${item.id}" />
            <span>
              <strong>${item.priority}</strong> ${item.text}
              <small>${item.createdAt.slice(0, 10)} · ${item.createdBy}</small>
            </span>
          </label>
        `
        )
        .join("")}
    </div>
  `;
}

function bindFollowUpResolution() {
  $$(".resolve-follow-up").forEach((input) => {
    input.addEventListener("change", () => {
      const item = state.followUps.find((followUp) => followUp.id === input.value);
      if (!item) return;
      item.status = "resolved";
      item.resolvedAt = new Date().toISOString();
      item.resolvedBy = currentSession?.name || "현장 엔지니어";
      saveState();
      renderAll();
    });
  });
}

function reportTimelineHtml(reports, limit = reports.length) {
  const visibleReports = reports.slice(0, limit);
  if (!visibleReports.length) {
    return `<div class="empty">아직 방문 이력이 없습니다.</div>`;
  }

  return `
    <div class="timeline">
      ${visibleReports
        .map(
          (report) => `
          <article class="timeline-item">
            <strong>${report.date} · ${getVisitType(report.visitTypeId).name}</strong>
            <p>${report.actionTaken}</p>
            <div class="small-meta">
              <span>${report.engineer}</span>
              <span>${report.arrivalTime}-${report.finishTime}</span>
              <span>${report.status}</span>
              <span>사진 ${report.photos.length}장</span>
            </div>
          </article>
        `
        )
        .join("")}
    </div>
  `;
}

function renderFieldHistoryDetail() {
  const store = getStore(selectedStoreId);
  const container = $("#fieldHistoryDetail");
  if (!store) {
    $("#fieldHistorySubtitle").textContent = "설치처를 선택하면 최근 이력을 먼저 보여줍니다";
    $("#fieldHistoryBadge").textContent = "대기";
    $("#fieldHistoryBadge").classList.add("muted");
    container.innerHTML = `<div class="empty">근처 설치처를 선택하세요.</div>`;
    $("#reportComposer").hidden = true;
    return;
  }

  const reports = storeReports(store.id);
  const lastReport = reports[0];
  const contact = store.contact || {};
  $("#fieldHistorySubtitle").textContent = `${store.name} 방문 전 확인`;
  $("#fieldHistoryBadge").textContent = reports.length ? `${reports.length}건 이력` : "신규";
  $("#fieldHistoryBadge").classList.toggle("muted", !reports.length);
  $("#reportComposer").hidden = !isReportComposerOpen;

  container.innerHTML = `
    <section class="store-basic-card">
      <div class="store-basic-head">
        <div>
          <p class="eyebrow">Customer Basics</p>
          <h2>${store.name}</h2>
        </div>
        <span class="status-pill ${statusClass(store)}">${customerStatusLabels[statusClass(store)]}</span>
      </div>
      <div class="basic-info-grid">
        <div><span>관리번호</span><strong>${store.managementNo || "-"}</strong></div>
        <div><span>계약일자</span><strong>${store.contract?.contractDate || "-"}</strong></div>
        <div><span>담당자(지역)</span><strong>${store.route?.serviceRegion || store.manager || "-"}</strong></div>
        <div><span>오픈시간</span><strong>${store.openTime || "-"}</strong></div>
        <div class="wide"><span>주소메모</span><strong>${store.addressMemo || "-"}</strong></div>
        <div><span>연락처1</span><strong>${contact.phone1 || store.phone || "-"}</strong></div>
        <div><span>연락처2</span><strong>${contact.phone2 || "-"}</strong></div>
        <div><span>휴대폰1</span><strong>${contact.mobile1 || store.mobile || "-"}</strong></div>
        <div><span>휴대폰1메모</span><strong>${contact.mobile1Memo || "-"}</strong></div>
        <div><span>휴대폰2</span><strong>${contact.mobile2 || "-"}</strong></div>
        <div><span>휴대폰2메모</span><strong>${contact.mobile2Memo || "-"}</strong></div>
      </div>
    </section>
    <div>
      <h2>${store.name}</h2>
      <p>${store.address}</p>
      <div class="small-meta">
        <span>${store.phone}</span>
        <span>담당 ${store.manager}</span>
        <span>${store.equipment.join(", ")}</span>
        <span class="status-pill ${statusClass(store)}">${customerStatusLabels[statusClass(store)]}</span>
      </div>
    </div>
    <div class="form-block">
      <h3>방문 전 요약</h3>
      ${
        lastReport
          ? `<p>${lastReport.date} ${getVisitType(lastReport.visitTypeId).name}: ${lastReport.actionTaken}</p>`
          : `<p>첫 방문이거나 등록된 이력이 없습니다.</p>`
      }
      ${store.memo ? `<p>현장 메모: ${store.memo}</p>` : ""}
    </div>
    ${storeDetailBlocks(store)}
    ${followUpsHtml(store.id)}
    ${reportTimelineHtml(reports)}
    <div class="history-actions">
      <p>이력을 확인한 뒤 현장 작업 내용을 남깁니다.</p>
      <button id="startReport" class="primary-btn full" type="button">이력 남기기</button>
    </div>
  `;

  $("#startReport").addEventListener("click", () => {
    isReportComposerOpen = true;
    renderAll();
    $("#reportComposer").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  bindFollowUpResolution();
}

function renderHistoryList() {
  renderStoreCards("#historyStoreList", filteredStores("#historySearch"), { activateHistory: true });
  renderStoreHistoryDetail();
}

function renderStoreHistoryDetail() {
  const store = getStore(selectedStoreId);
  const container = $("#storeHistoryDetail");
  if (!store) {
    container.innerHTML = `<div class="empty">설치처를 선택하세요.</div>`;
    return;
  }

  const reports = storeReports(store.id);

  container.innerHTML = `
    <div>
      <h2>${store.name}</h2>
      <p>${store.address}</p>
      <div class="small-meta">
        <span>${store.phone}</span>
        <span>담당 ${store.manager}</span>
        <span>${store.equipment.join(", ")}</span>
      </div>
    </div>
    <div class="form-block">
      <h3>최근 요약</h3>
      ${
        reports[0]
          ? `<p>${reports[0].date} ${getVisitType(reports[0].visitTypeId).name}: ${reports[0].actionTaken}</p>`
          : `<p>아직 방문 이력이 없습니다.</p>`
      }
    </div>
    ${storeDetailBlocks(store)}
    ${followUpsHtml(store.id)}
    ${reportTimelineHtml(reports)}
  `;
  bindFollowUpResolution();
}

function groupCounts(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item) || "미분류";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function countChipsHtml(counts, emptyText = "집계 없음") {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko-KR"));
  if (!entries.length) return `<p class="monthly-muted">${emptyText}</p>`;
  return `
    <div class="monthly-chip-row">
      ${entries.map(([label, count]) => `<span>${escapeHtml(label)} <strong>${count.toLocaleString()}</strong></span>`).join("")}
    </div>
  `;
}

function monthlySpecialOrdersHtml(orders) {
  if (!orders.length) return `<span class="monthly-muted">-</span>`;
  return orders
    .map((order) => {
      const statusClassName = order.status === "보류" ? "caution" : "active";
      return `
        <span class="monthly-special-order">
          ${escapeHtml(order.type)}
          <small class="status-pill ${statusClassName}">${escapeHtml(order.status)}</small>
        </span>
      `;
    })
    .join("");
}

function monthlySummaryHtml(items, monthInfo, scope) {
  const total = items.length;
  const completed = items.filter((item) => item.completed).length;
  const incomplete = total - completed;
  const completionRate = total ? (completed / total) * 100 : 0;
  const specialOrders = items.flatMap((item) => item.specialOrders);
  const onHold = specialOrders.filter((order) => order.status === "보류").length;
  const unassigned = items.filter((item) => item.engineer.key === "UNASSIGNED").length;
  const missingCoordinates = items.filter((item) => typeof item.store.lat !== "number" || typeof item.store.lng !== "number").length;
  const summaryKeys = scope?.key ? [scope.key] : monthlyEngineerOrder;
  const scopeCode = scope?.key ? `${monthInfo.routeMonth}1000${scope.key}` : "";
  const engineerRows = summaryKeys
    .map((key) => {
      const engineerItems = items.filter((item) => item.engineer.key === key);
      if (key === "UNASSIGNED" && !engineerItems.length) return "";
      const engineerCompleted = engineerItems.filter((item) => item.completed).length;
      const engineerTotal = engineerItems.length;
      const engineerRate = engineerTotal ? (engineerCompleted / engineerTotal) * 100 : 0;
      const label = key === "UNASSIGNED" ? "담당 미정" : monthlyRouteEngineers[key];
      const codeLabel = key === "UNASSIGNED" ? "규칙 확인 필요" : `${monthInfo.routeMonth}1000${key}`;
      return `
        <article class="monthly-engineer-row">
          <div class="monthly-engineer-main">
            <strong>${label}</strong>
            <span>${codeLabel}</span>
          </div>
          <div class="monthly-engineer-metrics">
            <span>대상 <strong>${engineerTotal.toLocaleString()}</strong></span>
            <span>완료 <strong>${engineerCompleted.toLocaleString()}</strong></span>
            <span>미완료 <strong>${(engineerTotal - engineerCompleted).toLocaleString()}</strong></span>
            <span>완료율 <strong>${formatPercent(engineerRate)}</strong></span>
          </div>
          <div class="progress-meter" aria-label="${label} 완료율 ${formatPercent(engineerRate)}">
            <span style="width: ${Math.min(engineerRate, 100)}%"></span>
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <div class="monthly-summary">
      <div class="monthly-callout">
        <div>
          <p class="eyebrow">Route ${monthInfo.routeMonth}</p>
          <h3>${scope ? `${scope.name} 담당 ${monthInfo.label} 정기방문` : `${monthInfo.label} 정기방문 기준`}</h3>
          <p>${
            scope
              ? `담당자(지역)이 ${scopeCode} 계열인 관리중 고객만 표시합니다. 방문 보고서가 제출되면 완료로 계산합니다.`
              : `담당자(지역)이 ${monthInfo.routeMonth}으로 시작하는 관리중 고객만 정기방문 대상으로 집계합니다. 방문 보고서가 제출되면 완료로 계산합니다.`
          }</p>
        </div>
        <span class="status-pill muted">취소 특수 오더 숨김</span>
      </div>
      <div class="monthly-stat-grid">
        <article class="monthly-stat"><span>정기방문 대상</span><strong>${total.toLocaleString()}</strong></article>
        <article class="monthly-stat"><span>보고 완료</span><strong>${completed.toLocaleString()}</strong></article>
        <article class="monthly-stat"><span>미완료</span><strong>${incomplete.toLocaleString()}</strong></article>
        <article class="monthly-stat"><span>완료율</span><strong>${formatPercent(completionRate)}</strong></article>
      </div>
      <section class="monthly-section">
        <h3>${scope ? "내 담당 진행률" : "담당자별 진행률"}</h3>
        <div class="monthly-engineer-list">${engineerRows}</div>
      </section>
      <div class="monthly-detail-grid">
        <section class="monthly-detail-block">
          <h3>업종별 대상</h3>
          ${countChipsHtml(groupCounts(items, (item) => item.store.customerType || "미분류"))}
        </section>
        <section class="monthly-detail-block">
          <h3>특수 오더</h3>
          ${countChipsHtml(groupCounts(specialOrders, (order) => order.type), "표시할 특수 오더 없음")}
          <p class="monthly-muted">정기방문과 별도로 A/S, 철거, 신규설치, 회수만 집계합니다.</p>
        </section>
        <section class="monthly-detail-block">
          <h3>주의 항목</h3>
          <div class="monthly-chip-row">
            <span>담당 미정 <strong>${unassigned.toLocaleString()}</strong></span>
            <span>보류 특수 오더 <strong>${onHold.toLocaleString()}</strong></span>
            <span>좌표 없음 <strong>${missingCoordinates.toLocaleString()}</strong></span>
          </div>
        </section>
      </div>
    </div>
  `;
}

function monthlyListHtml(items, totalCount, incompleteOnly) {
  if (!items.length) {
    return `<div class="empty">${incompleteOnly ? "미완료 설치처가 없습니다." : "이번달 대상 설치처가 없습니다."}</div>`;
  }

  return `
    <div class="monthly-table-wrap">
      <table class="monthly-table">
        <thead>
          <tr>
            <th>담당자</th>
            <th>권역</th>
            <th>관리번호</th>
            <th>설치처</th>
            <th>주소/메모</th>
            <th>연락/오픈</th>
            <th>방문 보고</th>
            <th>특수 오더</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map((item) => {
              const store = item.store;
              const latestReport = item.reports[0];
              const visitType = latestReport ? getVisitType(latestReport.visitTypeId).name : "";
              const contact = store.contact || {};
              const primaryContact = contact.mobile1 || store.mobile || contact.phone1 || store.phone || "-";
              const routeTeam = item.engineer.teamCode || "-";
              return `
                <tr>
                  <td>
                    <strong>${escapeHtml(item.engineer.name)}</strong>
                    <small>${escapeHtml(routeTeam)} · ${escapeHtml(routeCode(store) || "-")}</small>
                  </td>
                  <td>${escapeHtml(item.area)}</td>
                  <td>${escapeHtml(store.managementNo || "-")}</td>
                  <td>
                    <strong>${escapeHtml(store.name)}</strong>
                    <small>${escapeHtml(store.customerType || "-")}</small>
                  </td>
                  <td>
                    ${escapeHtml(store.address || "-")}
                    ${store.addressMemo ? `<small>${escapeHtml(store.addressMemo)}</small>` : ""}
                  </td>
                  <td>
                    ${escapeHtml(primaryContact)}
                    <small>${escapeHtml(store.openTime || "-")}</small>
                  </td>
                  <td>
                    <span class="status-pill ${item.completed ? "active" : "caution"}">${item.completed ? "완료" : "미완료"}</span>
                    <small>${latestReport ? `${escapeHtml(latestReport.date)} · ${escapeHtml(visitType)}` : "보고 없음"}</small>
                  </td>
                  <td>${monthlySpecialOrdersHtml(item.specialOrders)}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
    <p class="monthly-list-note">${totalCount.toLocaleString()}건 중 ${items.length.toLocaleString()}건 표시 중입니다.</p>
  `;
}

function monthlyMapHtml(items, monthInfo) {
  const geocoded = mapMarkerItemsFromMonthlyItems(items);
  return `
    <div id="monthlyTmap" class="tmap-map" aria-label="${escapeHtml(monthInfo.label)} 고객 위치 지도"></div>
    <div id="monthlyMapStatus" class="monthly-map-status">
      이번달 대상 ${items.length.toLocaleString()}건 중 좌표 있는 고객 ${geocoded.length.toLocaleString()}건
    </div>
  `;
}

function renderMonthlyProgress() {
  const summaryContainer = $("#monthlySummaryContent");
  const listContainer = $("#monthlyListContent");
  const mapContainer = $("#monthlyMapContent");
  if (!summaryContainer || !listContainer || !mapContainer) return;

  const monthInfo = currentMonthInfo();
  const scope = currentMonthlyScope();
  const items = monthlyProgressItems(new Date(), scope);
  const incompleteOnly = Boolean($("#monthlyIncompleteOnly")?.checked);
  const visibleItems = incompleteOnly ? items.filter((item) => !item.completed) : items;
  const scopeText = scope ? `${scope.name} 담당 ${monthInfo.routeMonth}1000${scope.key} 계열` : `${monthInfo.routeMonth}으로 시작하는 담당자(지역)`;

  summaryContainer.innerHTML = monthlySummaryHtml(items, monthInfo, scope);
  $("#monthlyListSubtitle").textContent = `${monthInfo.label} · ${scopeText} · 설치처명 순`;
  listContainer.innerHTML = monthlyListHtml(visibleItems, items.length, incompleteOnly);
  mapContainer.innerHTML = monthlyMapHtml(items, monthInfo);
  mapContainer.classList.add("has-map");
  if (mapContainer.closest(".monthly-progress-view")?.classList.contains("active")) {
    initializeMonthlyMap(items, monthInfo);
  }
}

function renderStats() {
  const reports = currentReports();
  const todayReports = reports.filter((report) => report.date === today()).length;
  const pending = reports.filter((report) => report.status === "검토 대기").length;
  const openOrders = openServiceOrders().length;
  const periodicDue = periodicDueOrders().length;
  const encomStores = state.stores.filter((store) => store.source === "encom" && statusClass(store) === "active");
  const geocodedStores = encomStores.filter((store) => typeof store.lat === "number" && typeof store.lng === "number").length;

  $("#stats").innerHTML = [
    ["오늘 방문", todayReports],
    ["검토 대기", pending],
    ["진행 오더", openOrders],
    ["정기관리 대상", periodicDue],
    ["관리중 좌표 완료", geocodedStores],
    ["관리중 좌표 필요", Math.max(encomStores.length - geocodedStores, 0)],
  ]
    .map(([label, value]) => `<article class="stat-card"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function renderOrderFormOptions() {
  $("#orderStoreSelect").innerHTML = state.stores
    .map((store) => `<option value="${store.id}">${store.name}</option>`)
    .join("");
}

function renderServiceOrderList() {
  const orders = [...currentServiceOrders()].sort((a, b) => `${b.visitDate}`.localeCompare(`${a.visitDate}`));
  $("#serviceOrderList").innerHTML = orders.length
    ? orders.map((order) => orderCardHtml(order, false)).join("")
    : `<div class="empty">등록된 오더가 없습니다.</div>`;
}

function renderReviewList() {
  const reports = currentReports()
    .filter((report) => report.status === "검토 대기")
    .sort((a, b) => `${b.date} ${b.arrivalTime}`.localeCompare(`${a.date} ${a.arrivalTime}`));

  if (!reports.length) {
    $("#reviewList").innerHTML = `<div class="empty">검토 대기 보고가 없습니다.</div>`;
    return;
  }

  $("#reviewList").innerHTML = reports
    .map((report) => {
      const store = getStore(report.storeId);
      const type = getVisitType(report.visitTypeId);
      return `
        <article class="report-card">
          <div class="panel-head">
            <div>
              <h3>${store?.name || "설치처 확인 필요"}</h3>
              <p>${type.name} · ${report.engineer} · ${report.date}</p>
            </div>
            <button class="primary-btn approve" data-id="${report.id}">승인</button>
          </div>
          <p>${report.actionTaken}</p>
          <div class="small-meta">
            <span>체크 ${report.checks.length}개</span>
            <span>제품 ${report.processedProducts?.length || 0}개</span>
            <span>사진 ${report.photos.length}장</span>
            <span>고객 ${report.customerConfirm}</span>
          </div>
          <div class="card-actions">
            <button class="ghost-btn copy-summary" data-id="${report.id}" type="button">밴드 요약 복사</button>
          </div>
        </article>
      `;
    })
    .join("");

  $$(".approve").forEach((button) => {
    button.addEventListener("click", async () => {
      const report = currentReports().find((item) => sameDbId(item.id, button.dataset.id));
      if (!report) return;
      await updateVisitReportStatus(report, "승인");
      await refreshSupabaseData({ force: true });
      renderAll();
    });
  });

  $$(".copy-summary").forEach((button) => {
    button.addEventListener("click", async () => {
      const report = currentReports().find((item) => sameDbId(item.id, button.dataset.id));
      if (!report) return;
      const summary = makeBandSummary(report);
      await navigator.clipboard.writeText(summary);
      button.textContent = "복사 완료";
    });
  });
}

function renderInsights() {
  const reports = currentReports();
  const byStore = reports.reduce((acc, report) => {
    acc[report.storeId] = (acc[report.storeId] || 0) + 1;
    return acc;
  }, {});
  const repeated = Object.entries(byStore)
    .filter(([, count]) => count >= 2)
    .map(([storeId, count]) => `${getStore(storeId)?.name || "설치처 확인 필요"}: 방문 ${count}회`);

  const repairStores = reports
    .filter((report) => report.visitTypeId === "repair")
    .map((report) => getStore(report.storeId)?.name || "설치처 확인 필요");

  const items = [
    repeated.length ? `반복 방문 설치처: ${repeated.join(", ")}` : "반복 방문 설치처는 아직 없습니다.",
    repairStores.length ? `최근 장애 처리 설치처: ${[...new Set(repairStores)].join(", ")}` : "장애 처리 누적이 없습니다.",
    reports.some((report) => report.customerConfirm !== "확인 완료")
      ? "고객 확인이 누락된 보고가 있습니다."
      : "고객 확인 누락은 없습니다.",
  ];

  $("#insights").innerHTML = items.map((text) => `<article class="insight-card">${text}</article>`).join("");
}

function renderTemplates() {
  $("#templateList").innerHTML = state.visitTypes
    .map(
      (type) => `
      <article class="template-card">
        <h2>${type.name}</h2>
        <h3>체크리스트</h3>
        <ul>${type.checks.map((item) => `<li>${item}</li>`).join("")}</ul>
        <h3>사진 단계</h3>
        <ul>${type.photos.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>
    `
    )
    .join("");
}

function renderAdminStores() {
  $("#adminStoreList").innerHTML = state.stores
    .map(
      (store) => `
        <article class="store-card">
          <strong>${store.name}</strong>
          <span>${store.address}</span>
          <div class="store-meta">
            <span>${store.phone}</span>
            <span>담당 ${store.manager}</span>
            <span>${store.lat}, ${store.lng}</span>
            <span class="status-pill ${statusClass(store)}">${customerStatusLabels[statusClass(store)]}</span>
          </div>
          <div class="small-meta">
            <span>${store.equipment.join(", ")}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderAll() {
  renderDepartmentAccess();
  renderMonthlyProgress();
  renderOrderFormOptions();
  renderTodayOrders();
  renderVisitTypes();
  renderNearbyStores();
  renderReportForm();
  renderFieldHistoryDetail();
  renderHistoryList();
  renderStats();
  renderReviewList();
  renderInsights();
  renderTemplates();
  renderAdminStores();
  renderServiceOrderList();
}

function setCurrentLocationText(text, variant = "normal") {
  const element = $("#currentLocationText");
  if (!element) return;
  element.textContent = text;
  element.classList.toggle("muted", variant === "muted");
  element.classList.toggle("warning", variant === "warning");
}

function formatCoordinate(value) {
  return Number(value).toFixed(5);
}

async function currentLocationLabel(position) {
  const lat = formatCoordinate(position.lat);
  const lng = formatCoordinate(position.lng);
  return `${lat}, ${lng}`;
}

function requestLocation() {
  $("#locationStatus").textContent = "위치를 확인하는 중";
  setCurrentLocationText("현재 위치 확인 중", "muted");
  if (!navigator.geolocation) {
    $("#locationStatus").textContent = "브라우저에서 위치 기능을 지원하지 않습니다.";
    currentPosition = { lat: 37.5008, lng: 127.0364 };
    setCurrentLocationText("샘플 위치: 37.50080, 127.03640", "warning");
    renderAll();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const accuracy = position.coords.accuracy ? ` / 정확도 ${Math.round(position.coords.accuracy)}m` : "";
      const locationLabel = await currentLocationLabel(currentPosition);
      const nearest = filteredStores("#storeSearch")[0];
      selectedStoreId = nearest?.id || selectedStoreId;
      $("#locationStatus").textContent = nearest
        ? `가장 가까운 설치처: ${nearest.name}`
        : "근처 설치처를 찾지 못했습니다.";
      setCurrentLocationText(`현재 위치: ${locationLabel}${accuracy}`);
      renderAll();
    },
    (error) => {
      currentPosition = { lat: 37.5008, lng: 127.0364 };
      const nearest = filteredStores("#storeSearch")[0];
      selectedStoreId = nearest?.id || selectedStoreId;
      const message =
        error.code === error.PERMISSION_DENIED
          ? "위치 권한이 거부되어 샘플 위치를 사용합니다."
          : error.code === error.TIMEOUT
            ? "위치 확인 시간이 초과되어 샘플 위치를 사용합니다."
            : "현재 위치를 가져오지 못해 샘플 위치를 사용합니다.";
      $("#locationStatus").textContent = message;
      setCurrentLocationText("샘플 위치: 37.50080, 127.03640", "warning");
      renderAll();
    },
    { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
  );
}

function bindEvents() {
  $("#refreshLocation").addEventListener("click", requestLocation);
  $("#storeSearch").addEventListener("input", renderNearbyStores);
  $("#historySearch").addEventListener("input", renderHistoryList);
  $("#visitTypeSelect").addEventListener("change", renderReportForm);
  $("#loginDepartment").addEventListener("change", renderLoginMembers);
  $("#loginDepartment").addEventListener("input", renderLoginMembers);
  $("#monthlyIncompleteOnly")?.addEventListener("change", renderMonthlyProgress);

  $("#orderForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const order = {
      id: `order-${Date.now()}`,
      storeId: $("#orderStoreSelect").value,
      type: $("#orderType").value,
      visitDate: $("#orderVisitDate").value,
      assignedEngineer: $("#orderEngineer").value.trim(),
      priority: $("#orderPriority").value,
      request: $("#orderRequest").value.trim(),
      status: "scheduled",
      source: ["inspection", "filter-replace"].includes($("#orderType").value) ? "periodic" : "office",
      createdAt: new Date().toISOString(),
      createdBy: currentSession?.name || "사무실",
    };
    await createServiceOrder(order);
    await refreshSupabaseData({ force: true });
    event.target.reset();
    renderAll();
  });

  $("#toggleQuickAdd").addEventListener("click", () => {
    $("#quickStoreForm").hidden = !$("#quickStoreForm").hidden;
  });

  $("#quickStoreForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const position = currentPosition || { lat: 37.5008, lng: 127.0364 };
    const store = {
      id: `temp-store-${Date.now()}`,
      name: $("#quickStoreName").value.trim(),
      address: $("#quickStoreAddress").value.trim(),
      manager: currentSession?.name || "현장 엔지니어",
      phone: $("#quickStorePhone").value.trim() || "미확인",
      lat: position.lat,
      lng: position.lng,
      equipment: ["현장 확인 필요"],
      customerStatus: "temporary",
      source: "field",
      memo: $("#quickStoreMemo").value.trim(),
      createdBy: currentSession?.name || "현장 엔지니어",
      createdAt: new Date().toISOString(),
    };
    state.stores.unshift(store);
    selectedStoreId = store.id;
    isReportComposerOpen = false;
    saveState();
    event.target.reset();
    $("#quickStoreForm").hidden = true;
    renderAll();
  });

  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    selectedStoreId = null;
    isReportComposerOpen = false;
    currentDepartment = normalizeDepartmentId($("#loginDepartment").value);
    saveSession({
      name: $("#loginName").value.trim(),
      department: currentDepartment,
      signedInAt: new Date().toISOString(),
    });
    await refreshSupabaseData({ force: true });
    renderAuthState();
  });

  $("#logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    currentSession = null;
    supabaseState.loaded = false;
    supabaseState.monthlyItems = null;
    supabaseState.reports = null;
    supabaseState.serviceOrders = null;
    selectedStoreId = null;
    isReportComposerOpen = false;
    $("#loginForm").reset();
    $("#loginDepartment").value = currentDepartment;
    renderLoginMembers();
    $("#appShell").hidden = true;
    $("#loginScreen").hidden = false;
  });

  $("#reportForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const store = getStore(selectedStoreId);
    if (!store) {
      alert("설치처를 먼저 선택하세요.");
      return;
    }

    const checks = $$("#checklist input:checked").map((input) => input.value);
    const processedProducts = $$("#productChecklist input:checked").map((input) => input.value);
    const photos = $$("#photoSteps input").map((input) => input.dataset.photo);
    const shouldCreateFollowUp = $("#createFollowUp").checked && $("#followUpText").value.trim();
    const report = {
      id: `report-${Date.now()}`,
      storeId: store.id,
      orderId: activeOrderId,
      engineer: currentSession?.name || "현장 엔지니어",
      visitTypeId: $("#visitTypeSelect").value,
      date: today(),
      arrivalTime: $("#arrivalTime").value,
      finishTime: $("#finishTime").value,
      checks,
      processedProducts,
      photos,
      issueCause: $("#issueCause").value.trim() || "해당 없음",
      actionTaken: $("#actionTaken").value.trim(),
      needRevisit: $("#needRevisit").value,
      customerConfirm: $("#customerConfirm").value,
      status: "검토 대기",
      position: currentPosition,
      followUpText: shouldCreateFollowUp ? $("#followUpText").value.trim() : "",
    };

    const savedReport = await createVisitReport(report);
    const linkedOrder = currentServiceOrders().find((order) => sameDbId(order.id, activeOrderId));
    if (linkedOrder) {
      await updateServiceOrderStatus(linkedOrder, "done", savedReport.id);
    }
    if (shouldCreateFollowUp) {
      state.followUps.unshift({
        id: `follow-up-${Date.now()}`,
        storeId: store.id,
        reportId: savedReport.id,
        text: $("#followUpText").value.trim(),
        priority: $("#followUpPriority").value,
        status: "open",
        createdAt: new Date().toISOString(),
        createdBy: currentSession?.name || "현장 엔지니어",
      });
      saveState();
    }
    await refreshSupabaseData({ force: true });
    isReportComposerOpen = false;
    activeOrderId = null;
    event.target.reset();
    setDefaultTimes();
    renderAll();
    alert("보고서가 제출되었습니다.");
  });

  $("#resetDemo").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    supabaseState.loaded = false;
    supabaseState.monthlyItems = null;
    supabaseState.reports = null;
    supabaseState.serviceOrders = null;
    selectedStoreId = state.stores[0]?.id || null;
    isReportComposerOpen = false;
    setDefaultTimes();
    renderAll();
  });

  $("#exportReports").addEventListener("click", () => {
    const headers = [
      "보고서ID",
      "설치처",
      "주소",
      "방문일",
      "방문자",
      "방문유형",
      "처리제품",
      "도착",
      "종료",
      "체크항목",
      "사진단계",
      "문제원인",
      "조치내용",
      "재방문",
      "고객확인",
      "상태",
    ];
    const rows = currentReports().map((report) => {
      const store = getStore(report.storeId);
      const type = getVisitType(report.visitTypeId);
      return [
        report.id,
        store?.name,
        store?.address,
        report.date,
        report.engineer,
        type?.name,
        (report.processedProducts || []).join(" / "),
        report.arrivalTime,
        report.finishTime,
        report.checks.join(" / "),
        report.photos.join(" / "),
        report.issueCause,
        report.actionTaken,
        report.needRevisit,
        report.customerConfirm,
        report.status,
      ].map(csvEscape);
    });
    const csv = [headers.map(csvEscape), ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `visit-reports-${today()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });

  $("#storeForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const equipment = $("#newStoreEquipment").value.split(",").map((item) => item.trim()).filter(Boolean);
    const productStatus = valueOrBlank("#newStoreProductStatus");
    const managementStatus = valueOrBlank("#newStoreManagementStatus");
    const customerStatus = valueOrBlank("#newStoreCustomerStatus") || classifyCustomer({
      contractEndedAt: valueOrBlank("#newStoreContractEndedAt"),
      recoveredAt: valueOrBlank("#newStoreRecoveredAt"),
      productStatus,
      managementStatus,
      cmsStatus: valueOrBlank("#newStoreCmsStatus"),
    });
    const store = {
      id: `store-${Date.now()}`,
      managementNo: valueOrBlank("#newStoreManagementNo"),
      name: $("#newStoreName").value.trim(),
      ownerName: valueOrBlank("#newStoreOwnerName"),
      address: $("#newStoreAddress").value.trim(),
      addressMemo: valueOrBlank("#newStoreAddressMemo"),
      manager: $("#newStoreManager").value.trim(),
      phone: $("#newStorePhone").value.trim(),
      mobile: valueOrBlank("#newStoreMobile"),
      openTime: valueOrBlank("#newStoreOpenTime"),
      customerType: valueOrBlank("#newStoreCustomerType"),
      route: {
        serviceRegion: valueOrBlank("#newStoreServiceRegion"),
        routeMonth: valueOrBlank("#newStoreRouteMonth"),
      },
      lat: Number($("#newStoreLat").value),
      lng: Number($("#newStoreLng").value),
      equipment,
      products: valueOrBlank("#newStoreProductList").split("\n").map((item) => item.trim()).filter(Boolean),
      customerStatus,
      source: "admin",
      contract: {
        contractDate: valueOrBlank("#newStoreContractDate"),
        cmsStatus: valueOrBlank("#newStoreCmsStatus"),
        contractEndedAt: valueOrBlank("#newStoreContractEndedAt"),
        recoveredAt: valueOrBlank("#newStoreRecoveredAt"),
      },
      product: {
        productName: valueOrBlank("#newStoreProductName"),
        modelName: valueOrBlank("#newStoreModelName"),
        installPlace: valueOrBlank("#newStoreInstallPlace"),
        productStatus,
        managementStatus,
        installedAt: valueOrBlank("#newStoreInstalledAt"),
      },
      filterSchedule: {
        lastFilterDate: valueOrBlank("#newStoreLastFilterDate"),
        nextInspectionDate: valueOrBlank("#newStoreNextInspectionDate"),
        nextReplacementDate: valueOrBlank("#newStoreNextReplacementDate"),
        remainingDays: valueOrBlank("#newStoreRemainingDays"),
        inspectionCycleMonths: valueOrBlank("#newStoreInspectionCycle"),
        replacementCycleMonths: valueOrBlank("#newStoreReplacementCycle"),
        cafePolicy: valueOrBlank("#newStoreCafePolicy"),
      },
      serviceOrder: {
        visitScheduledAt: valueOrBlank("#newStoreVisitScheduledAt"),
        asReceivedAt: valueOrBlank("#newStoreAsReceivedAt"),
        progressStatus: valueOrBlank("#newStoreProgressStatus"),
      },
      serviceMemo: valueOrBlank("#newStoreServiceMemo"),
    };
    state.stores.push(store);
    selectedStoreId = store.id;
    isReportComposerOpen = false;
    saveState();
    event.target.reset();
    renderAll();
  });

  $("#roleSelect").addEventListener("change", async () => {
    currentDepartment = normalizeDepartmentId($("#roleSelect").value);
    localStorage.setItem(DEPARTMENT_KEY, currentDepartment);
    if (currentSession) {
      saveSession({ ...currentSession, department: currentDepartment });
      await refreshSupabaseData({ force: true });
    }
    renderAll();
    if (hasCurrentWorkspace(currentDepartment)) requestLocation();
  });

  $("#addVisitType").addEventListener("click", () => {
    const template = $("#visitTypeDialog").content.cloneNode(true);
    document.body.appendChild(template);
    const dialog = $("dialog.modal");
    dialog.showModal();

    $("#cancelTemplate").addEventListener("click", () => {
      dialog.close();
      dialog.remove();
    });

    $("#templateForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = $("#newTypeName").value.trim();
      const checks = $("#newTypeChecks").value.split("\n").map((item) => item.trim()).filter(Boolean);
      const photos = $("#newTypePhotos").value.split("\n").map((item) => item.trim()).filter(Boolean);
      state.visitTypes.push({
        id: `type-${Date.now()}`,
        name,
        checks,
        photos,
      });
      saveState();
      dialog.close();
      dialog.remove();
      renderAll();
    });
  });
}

async function initializeApp() {
  // 로그인 화면을 먼저 즉시 표시하고 나머지는 백그라운드에서 로드
  renderNavigation();
  bindMonthlyProgressTabs();
  bindEvents();
  setDefaultTimes();
  renderAuthState();

  await Promise.all([hydrateExternalCustomers(), hydrateGeocodeResults(), initializeSupabaseClient()]);
  if (currentSession) await refreshSupabaseData({ force: true });
}

initializeApp();
