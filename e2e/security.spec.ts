import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { PRIVATE_PROVIDER_FIELDS } from "../src/lib/providers/public";
import { expect, test } from "./fixtures/test";

const rootDir = path.resolve(__dirname, "..");
const ignoredDirs = new Set([
  ".git",
  ".next",
  "node_modules",
  "playwright-report",
  "test-results",
]);

function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = path.join(directory, entry);
    const relativePath = path.relative(rootDir, absolutePath);

    if (statSync(absolutePath).isDirectory()) {
      return ignoredDirs.has(entry) ? [] : listFiles(absolutePath);
    }

    return [relativePath];
  });
}

test.describe("security checks", () => {
  test("service role key is not referenced from client components", () => {
    const clientFilesWithServiceRole = listFiles(path.join(rootDir, "src"))
      .filter((filePath) => /\.(ts|tsx)$/.test(filePath))
      .filter((filePath) => {
        const source = readFileSync(path.join(rootDir, filePath), "utf8");
        const firstLines = source.split("\n").slice(0, 5).join("\n");

        return (
          firstLines.includes('"use client"') &&
          (source.includes("SUPABASE_SERVICE_ROLE_KEY") ||
            source.includes("createSupabaseServerClient"))
        );
      });

    expect(clientFilesWithServiceRole).toEqual([]);
  });

  test("service role key is not exposed through NEXT_PUBLIC variables", () => {
    const filesWithPublicServiceRole = listFiles(rootDir)
      .filter((filePath) => /\.(ts|tsx|js|mjs|json|example)$/.test(filePath))
      .filter((filePath) => {
        const source = readFileSync(path.join(rootDir, filePath), "utf8");

        return /NEXT_PUBLIC_[A-Z0-9_]*SERVICE_ROLE/.test(source);
      });

    expect(filesWithPublicServiceRole).toEqual([]);
  });

  test(".env files other than .env.example are not committed", () => {
    test.skip(!existsSync(path.join(rootDir, ".git")), "Git metadata not available.");

    const trackedFiles = execFileSync("git", ["ls-files"], {
      cwd: rootDir,
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);
    const committedEnvFiles = trackedFiles.filter(
      (filePath) => /^\.env($|\.)/.test(filePath) && filePath !== ".env.example",
    );

    expect(committedEnvFiles).toEqual([]);
  });

  test("public provider APIs do not leak private provider fields", async ({
    request,
  }) => {
    const searchResponse = await request.get("/api/providers?city=visakhapatnam");
    expect(searchResponse.ok()).toBe(true);

    const searchBody = await searchResponse.json();
    expect(searchBody.success).toBe(true);

    for (const provider of searchBody.data.providers as Record<string, unknown>[]) {
      for (const field of PRIVATE_PROVIDER_FIELDS) {
        expect(provider).not.toHaveProperty(field);
      }
    }

    const profileResponse = await request.get("/api/providers/seaside-elder-care");
    expect(profileResponse.ok()).toBe(true);

    const profileBody = await profileResponse.json();
    expect(profileBody.success).toBe(true);

    for (const field of PRIVATE_PROVIDER_FIELDS) {
      expect(profileBody.data.provider).not.toHaveProperty(field);
    }
  });

  test("built client bundle does not contain service role key references", () => {
    const clientStaticDir = path.join(rootDir, ".next", "static");
    test.skip(
      !existsSync(clientStaticDir),
      "Client bundle not found. Run npm run build before this check.",
    );

    const staticFiles = listFiles(clientStaticDir).filter((filePath) =>
      /\.(js|mjs|map)$/.test(filePath),
    );
    const filesWithServiceRole = staticFiles.filter((filePath) => {
      const source = readFileSync(path.join(rootDir, filePath), "utf8");

      return source.includes("SUPABASE_SERVICE_ROLE_KEY");
    });

    expect(filesWithServiceRole).toEqual([]);
  });
});
