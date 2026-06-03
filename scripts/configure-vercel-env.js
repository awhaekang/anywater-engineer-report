const fs = require("fs");
const { spawnSync } = require("child_process");

const ENV_FILES = [".env.supabase.local", ".env.local"];
const TARGETS = ["production"];
const REQUIRED = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

function loadLocalEnv() {
  const values = {};
  for (const file of ENV_FILES) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([^#=]+)=(.*)$/);
      if (!match) continue;
      const key = match[1].trim();
      values[key] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
    }
  }
  return values;
}

function redact(output, secrets) {
  return secrets.reduce((text, secret) => text.replaceAll(secret, "[redacted]"), output);
}

function main() {
  const env = loadLocalEnv();
  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length) {
    throw new Error(`Missing local env values: ${missing.join(", ")}`);
  }

  const secretValues = REQUIRED.map((name) => env[name]).filter(Boolean);
  for (const name of REQUIRED) {
    for (const target of TARGETS) {
      const result = spawnSync("vercel", ["env", "add", name, target, "--value", env[name], "--yes", "--force"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      const output = redact(`${result.stdout || ""}${result.stderr || ""}`, secretValues);
      process.stdout.write(`\n[${name} ${target}] exit=${result.status}\n${output}`);
      if (result.status !== 0) process.exit(result.status || 1);
    }
  }
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
