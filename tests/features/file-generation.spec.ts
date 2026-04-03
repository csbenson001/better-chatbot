/**
 * File Generation E2E Tests — Jordan Bell (Financial Analyst) Persona
 *
 * Proof standard: real user persona → realistic request → AI generates file →
 * Artifacts panel download button → file downloaded → file size > threshold (non-corrupt).
 *
 * Signs in directly (bypasses broken storageState setup).
 */

import { test, expect } from "@playwright/test";
import { TEST_USERS } from "../constants/test-users";
import * as fs from "fs";
import * as path from "path";

const DOWNLOAD_DIR = "/tmp/e2e-file-gen-tests";

async function signIn(page: any) {
  await page.goto("/sign-in");
  await page.locator("#email").fill(TEST_USERS.regular.email);
  await page.locator("#password").fill(TEST_USERS.regular.password);
  await page.getByTestId("signin-submit-button").click();
  await page.waitForURL((url: URL) => !url.toString().includes("/sign-in"), {
    timeout: 60_000,
  });
}

async function sendChatMessage(page: any, message: string) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const input = page.locator('[contenteditable="true"]').first();
  await input.click();
  await input.fill(message);
  await input.press("Enter");
}

async function waitForFileReady(page: any, filename: string) {
  // Wait for the "File ready: <filename>" text in the tool card
  await expect(page.locator(`text=File ready: ${filename}`)).toBeVisible({
    timeout: 120_000,
  });
}

async function openArtifactsPanelAndDownload(
  page: any,
): Promise<{ filename: string; filePath: string; sizeBytes: number }> {
  // Click "View Results" to open Artifacts panel (use last in case of multiple tool cards)
  await page
    .getByRole("button", { name: /view results/i })
    .last()
    .click();

  // Verify Artifacts panel opened — look for download button (anchor with download attr)
  const downloadBtn = page.locator("a[download]").first();
  await expect(downloadBtn).toBeVisible({ timeout: 20_000 });

  // Trigger download and save
  const downloadPromise = page.waitForEvent("download");
  await downloadBtn.click();
  const download = await downloadPromise;

  const filename = download.suggestedFilename();
  const filePath = path.join(DOWNLOAD_DIR, filename);
  await download.saveAs(filePath);
  const { size } = fs.statSync(filePath);
  return { filename, filePath, sizeBytes: size };
}

test.describe("File Generation E2E — Jordan Bell (Financial Analyst)", () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  });

  test("PPTX — Innophos board cost reduction deck (VP Strategy)", async ({
    page,
  }) => {
    await signIn(page);
    await sendChatMessage(
      page,
      "I'm the VP of Strategy at Innophos Holdings. Create a 6-slide board-ready PowerPoint " +
        "on our 2025 Cost Reduction Initiative. Slides: (1) Title — 'Innophos 2025 Cost Reduction Initiative, " +
        "Board Meeting April 2026, Confidential'; (2) Executive Summary — $45M total savings target, 3 workstreams; " +
        "(3) Workstream table — Manufacturing Efficiency $20M (COO, Q2), Supply Chain Optimization $15M (CPO, Q3), " +
        "SG&A Reduction $10M (CFO, Q4); (4) Q1-Q4 implementation roadmap with milestones; " +
        "(5) EBITDA impact: current 18% → target 22% with bridge chart; (6) Next steps and board approvals needed. " +
        "Use dark blue #003366 background and gold #CC9900 accents. " +
        "Save as innophos_cost_reduction_board.pptx and print DOWNLOAD_FILE:/home/user/innophos_cost_reduction_board.pptx",
    );

    await waitForFileReady(page, "innophos_cost_reduction_board.pptx");

    const { filename, sizeBytes } = await openArtifactsPanelAndDownload(page);

    // Proof: correct file type
    expect(filename).toMatch(/\.pptx$/i);
    // Proof: file has real content — a 6-slide PPTX must be > 15KB
    expect(sizeBytes).toBeGreaterThan(15_000);

    console.log(`\n✅ PPTX VERIFIED`);
    console.log(`   File: ${filename}`);
    console.log(`   Size: ${sizeBytes.toLocaleString()} bytes`);
    console.log(`   Saved to: ${DOWNLOAD_DIR}/${filename}`);
    console.log(
      `   Proof: file downloaded, ${sizeBytes > 15000 ? "non-corrupt (>15KB)" : "WARNING: suspiciously small"}`,
    );
  });

  test("DOCX — Innophos supply chain risk report (Procurement Director)", async ({
    page,
  }) => {
    await signIn(page);
    await sendChatMessage(
      page,
      "I'm the Director of Procurement at Innophos. Write a Word document for our Q1 2026 " +
        "Supply Chain Risk Assessment Report. Include: (1) Executive Summary paragraph; " +
        "(2) Risk Matrix table with 5 risks — each with Risk Name, Category, Likelihood (H/M/L), " +
        "Impact (H/M/L), Risk Score, and Mitigation; key risks: Supplier X concentration >40%, " +
        "phosphate rock price volatility, logistics disruption, quality compliance, geopolitical; " +
        "(3) Top 3 critical suppliers — OCP Morocco, Mosaic Co, ICL Group — with risk profile paragraphs; " +
        "(4) Action plan table (action, owner, due date, status); " +
        "(5) 30-60-90 day mitigation roadmap. Use professional headings and table formatting. " +
        "Save as innophos_supply_chain_risk_Q1_2026.docx and print DOWNLOAD_FILE:/home/user/innophos_supply_chain_risk_Q1_2026.docx",
    );

    await waitForFileReady(page, "innophos_supply_chain_risk_Q1_2026.docx");

    const { filename, sizeBytes } = await openArtifactsPanelAndDownload(page);

    expect(filename).toMatch(/\.docx$/i);
    // A real DOCX with tables and paragraphs must be > 8KB
    expect(sizeBytes).toBeGreaterThan(8_000);

    console.log(`\n✅ DOCX VERIFIED`);
    console.log(`   File: ${filename}`);
    console.log(`   Size: ${sizeBytes.toLocaleString()} bytes`);
    console.log(`   Saved to: ${DOWNLOAD_DIR}/${filename}`);
  });

  test("PDF — Innophos Nashville EHS Q4 2025 safety report (EHS Manager)", async ({
    page,
  }) => {
    await signIn(page);
    await sendChatMessage(
      page,
      "I'm the EHS Manager at Innophos Nashville. Generate a PDF safety performance report for Q4 2025. " +
        "Include: (1) Title page — 'Innophos Nashville EHS Performance Report Q4 2025'; " +
        "(2) Executive summary with overall safety grade (A-) and year highlights; " +
        "(3) Quarterly metrics table — Q1/Q2/Q3/Q4 for: Near-misses (12/8/6/4), " +
        "Recordable Injuries (3/2/1/1), Lost-Time Incidents (1/0/0/0), Training Hours (240/280/310/350); " +
        "(4) Year-over-year comparison paragraph — incidents down 67% vs 2024; " +
        "(5) Top 5 safety achievements with descriptions; (6) 6 strategic recommendations for 2026. " +
        "Use professional layout with colored section headers, footer with page numbers and 'Confidential'. " +
        "Save as innophos_nashville_ehs_Q4_2025.pdf and print DOWNLOAD_FILE:/home/user/innophos_nashville_ehs_Q4_2025.pdf",
    );

    await waitForFileReady(page, "innophos_nashville_ehs_Q4_2025.pdf");

    const { filename, sizeBytes } = await openArtifactsPanelAndDownload(page);

    expect(filename).toMatch(/\.pdf$/i);
    // A real PDF with tables and content must be > 5KB; PDFs start with %PDF
    expect(sizeBytes).toBeGreaterThan(5_000);

    // Verify it's actually a PDF (magic bytes)
    const fileBuffer = fs.readFileSync(path.join(DOWNLOAD_DIR, filename));
    const header = fileBuffer.toString("utf8", 0, 4);
    expect(header).toBe("%PDF");

    console.log(`\n✅ PDF VERIFIED`);
    console.log(`   File: ${filename}`);
    console.log(`   Size: ${sizeBytes.toLocaleString()} bytes`);
    console.log(`   Magic bytes: ${header} ✓`);
    console.log(`   Saved to: ${DOWNLOAD_DIR}/${filename}`);
  });

  test("XLSX — Innophos Specialty Phosphates 3-year financial model (CFO)", async ({
    page,
  }) => {
    await signIn(page);
    await sendChatMessage(
      page,
      "I'm the CFO at Innophos. Build a 3-year financial model Excel workbook for our Specialty Phosphates division. " +
        "Sheet 1 (Summary): Key metrics table — Revenue $185M/$205M/$228M, EBITDA $33M/$41M/$50M, " +
        "EBITDA margin 17.8%/20.0%/21.9%, Headcount 420/435/450; include YoY growth % formulas. " +
        "Sheet 2 (P&L): Monthly detail for 2026 — Revenue by product (Food Grade $8M, Industrial $5M, Pharma $2M per month), " +
        "COGS formula (65% of revenue), Gross Profit formula, OpEx $2.5M/mo, EBITDA formula; bold headers, " +
        "currency format, alternating row shading. " +
        "Sheet 3 (Products): Bar chart of revenue by product line (Food Grade 50%, Industrial 33%, Pharma 17%). " +
        "Sheet 4 (Cash Flow): 12-month cash flow — Operating CF, CapEx ($2M/mo), Free CF, Running Balance (start $45M); " +
        "running balance formula =previous+freeCF. " +
        "Professional formatting throughout with borders. " +
        "Save as innophos_specialty_phosphates_model_2026.xlsx and print DOWNLOAD_FILE:/home/user/innophos_specialty_phosphates_model_2026.xlsx",
    );

    await waitForFileReady(
      page,
      "innophos_specialty_phosphates_model_2026.xlsx",
    );

    const { filename, sizeBytes } = await openArtifactsPanelAndDownload(page);

    expect(filename).toMatch(/\.xlsx$/i);
    // A real multi-sheet XLSX with charts must be > 15KB; XLSX is a ZIP (PK header)
    expect(sizeBytes).toBeGreaterThan(15_000);

    // Verify it's actually a ZIP/XLSX (magic bytes PK\x03\x04)
    const fileBuffer = fs.readFileSync(path.join(DOWNLOAD_DIR, filename));
    expect(fileBuffer[0]).toBe(0x50); // P
    expect(fileBuffer[1]).toBe(0x4b); // K

    console.log(`\n✅ XLSX VERIFIED`);
    console.log(`   File: ${filename}`);
    console.log(`   Size: ${sizeBytes.toLocaleString()} bytes`);
    console.log(`   ZIP magic bytes: PK ✓`);
    console.log(`   Saved to: ${DOWNLOAD_DIR}/${filename}`);
  });
});
