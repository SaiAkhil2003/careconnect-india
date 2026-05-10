import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env.local");
const requiredVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
];

const optionalVariables = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_STANDARD_PRICE_ID",
  "STRIPE_PREMIUM_PRICE_ID",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "PLATFORM_ADMIN_EMAIL",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_FROM",
  "NEXT_PUBLIC_APP_URL",
];

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return new Map();
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  const variables = new Map();

  for (const line of lines) {
    if (!line || line.startsWith("#") || line.startsWith(" ")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1).trim();

    variables.set(name, value);
  }

  return variables;
}

const variables = parseEnvFile(envPath);
let hasMissingVariable = false;

if (!existsSync(envPath)) {
  console.log(".env.local MISSING");
}

for (const variableName of requiredVariables) {
  const value = variables.get(variableName);
  const status = value ? "FOUND" : "MISSING";

  if (status === "MISSING") {
    hasMissingVariable = true;
  }

  console.log(`${variableName} ${status}`);
}

for (const variableName of optionalVariables) {
  const value = variables.get(variableName);
  const status = value ? "FOUND" : "MISSING";

  console.log(`${variableName} ${status}`);
}

process.exit(hasMissingVariable ? 1 : 0);
