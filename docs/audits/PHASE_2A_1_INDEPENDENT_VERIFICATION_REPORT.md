# Decision Tools — Phase 2A.1: Independent Verification & Validation Hardening Report

**Document Status:** Verification Complete With Environment Blocker (Commit-Level Git Baseline Unreachable in Container)  
**Production Website:** `https://decision-tools.org/`  
**Target Parent Commit (Pre-Phase-2):** `01afd59c4ece8db2a9e13c213d3916bc150feedb`  
**Target Phase 2 Commit:** `16608e357120179f37e77a75c622f282121158db`  
**Phase 3 Boundary:** Strictly respected — no `apps/mobile`, Capacitor, iOS/Android, AdMob, UMP, SQLite, or website redesign introduced.

---

## 1. Exact Commit References & Environment Git State

- **Expected Pre-Phase-2 Parent Commit:** `01afd59c4ece8db2a9e13c213d3916bc150feedb`
- **Expected Phase 2 Commit:** `16608e357120179f37e77a75c622f282121158db`
- **Verified Sandbox Git State (`/app/applet`):**
  Running `git status` inside `/app/applet` returns:
  `fatal: not a git repository (or any of the parent directories): .git`
  The AI Studio runtime filesystem snapshot contains the working tree files without the `.git` object database. Consequently, `01afd59c4ece8db2a9e13c213d3916bc150feedb` and `16608e357120179f37e77a75c622f282121158db` cannot be checked out, diffed, or executed inside `/app/applet`.

---

## 2. Original-Engine Baseline Verification Methodology

### Verified Blocker in `/app/applet`
Because `.git` is not mounted in `/app/applet`, retrieving the original unmodified `src/lib/decisions/*.ts` files from parent commit `01afd59c4ece8db2a9e13c213d3916bc150feedb` is **impossible within this container**. In accordance with Phase 2A.1 honesty rules, no fabricated comparison against `01afd59c4ece8db2a9e13c213d3916bc150feedb` is claimed.

### Reproducible Verification Script for Full Git Clone
To complete the commit-level baseline proof on any environment holding the Git history (`01afd59c4ece8db2a9e13c213d3916bc150feedb` and `16608e357120179f37e77a75c622f282121158db`), run the following Bun/Node verification procedure from the repository root:

```bash
# 1. Create a temporary worktree of the pre-Phase-2 commit
git worktree add /tmp/dt-pre-phase2 01afd59c4ece8db2a9e13c213d3916bc150feedb

# 2. Execute each engine from /tmp/dt-pre-phase2/src/lib/decisions/*.ts against
#    packages/decision-core/tests/fixtures/*.json and diff against:
#    (a) committed fixture `expected` objects, and
#    (b) extracted engines in packages/decision-core/src/calculators/*.ts
bun -e '
import fs from "node:fs";
import path from "node:path";
const map = [
  ["rent-vs-buy.json", "rentVsBuy.ts", "calculateRentVsBuy", "single"],
  ["job-offer.json", "jobOffer.ts", "compareJobOffers", "job"],
  ["lease-vs-buy.json", "leaseVsBuy.ts", "calculateLeaseVsBuy", "single"],
  ["gas-vs-ev.json", "gasVsEv.ts", "calculateGasVsEv", "single"],
  ["buy-vs-repair.json", "buyVsRepair.ts", "calculateBuyVsRepair", "single"],
  ["diy-vs-hire.json", "diyVsHire.ts", "calculateDiyVsHire", "single"],
  ["debt-vs-invest.json", "debtVsInvest.ts", "calculateDebtVsInvest", "single"],
  ["buy-vs-subscribe.json", "buyVsSubscribe.ts", "calculateBuyVsSubscribe", "single"],
  ["new-vs-used.json", "newVsUsed.ts", "calculateNewVsUsed", "single"],
  ["bulk-buy.json", "bulkBuy.ts", "calculateBulkBuy", "single"],
];
for (const [fixFile, modFile, fnName, mode] of map) {
  const fixture = JSON.parse(fs.readFileSync(path.join("packages/decision-core/tests/fixtures", fixFile), "utf8"));
  const origMod = await import(path.resolve("/tmp/dt-pre-phase2/src/lib/decisions", modFile));
  const extMod = await import(path.resolve("packages/decision-core/src/calculators", modFile));
  let mismatches = 0;
  for (const s of fixture.scenarios) {
    const origOut = mode === "job" ? origMod[fnName](s.input.offerA, s.input.offerB) : origMod[fnName](s.input);
    const extOut = mode === "job" ? extMod[fnName](s.input.offerA, s.input.offerB) : extMod[fnName](s.input);
    if (JSON.stringify(origOut) !== JSON.stringify(s.expected) || JSON.stringify(origOut) !== JSON.stringify(extOut)) {
      mismatches++;
      console.error("Mismatch:", fixFile, s.id);
    }
  }
  console.log(fixFile, fixture.scenarios.length, "scenarios, mismatches:", mismatches);
}
'

# 3. Clean up temporary worktree
git worktree remove /tmp/dt-pre-phase2
```

### What Was Independently Verified in `/app/applet`
Inside this container, we verified:
1. All 10 extracted calculation engines (`packages/decision-core/src/calculators/*.ts`) against all 69 scenarios in `packages/decision-core/tests/fixtures/*.json` via `vitest` (`golden-master.test.ts`).
2. Comparator precision behavior, negative-zero handling, missing/unexpected field detection, and nested breakdown object verification.
3. Initial SSR HTML rendering on all 10 production Astro pages against default outputs of the extracted engines (10/10 exact match).

---

## 3. Golden-Master Fixture & Precision Results (69 Scenarios)

### Comparator Precision Specification (`packages/decision-core/tests/golden-master.test.ts`)
Previously, the Phase 2 report loosely described `assertMatchesFixture` as "exact deep equality (`toEqual`)". In reality, `assertMatchesFixture` applies:
- **Exact `Object.is` equality (`.toBe`)** for all integers (`Number.isInteger(expected)`), strings (`summaryText`, labels, enums), booleans, and `null`. Note: `Object.is` rejects `-0` where `0` is expected, rejects off-by-1 integers, and rejects non-integer floats where integers are expected.
- **6-decimal floating-point tolerance (`.toBeCloseTo(expected, 6)`)** for non-integer numeric outputs (absolute delta `< 5e-7`). Four calculators (`rent-vs-buy`, `lease-vs-buy`, `buy-vs-subscribe`, `new-vs-used`) produce 100% integer numeric outputs; the remaining 6 produce rounded decimal metrics (`gasFuelCostPerMile`, `evElectricityCostPerMile`, `breakEvenHourlyRate`, `annualCommuteHours`, `repairRatioPercent`, `fixedInterestRate`, `bulk-buy` unit rates/percentages).
- **Strict key-set equality (`Object.keys(actualObj).sort()` == `Object.keys(expectedObj).sort()`)** catching both missing and unexpected properties recursively.
- **Recursive array checks** verifying exact breakdown array lengths and nested objects.

Six explicit comparator and precision tests were added in `Golden-Master Comparator & Precision Verification` covering exact integer equality, 6-decimal tolerance boundaries, missing/unexpected keys, nested breakdown arrays, `-0` normalization across formatters and all 10 engine summaries, and deterministic `en-US` formatting.

### 69-Scenario Verification Table

| Calculator | Scenarios | Original (`01afd59c`) vs. Fixture | Original (`01afd59c`) vs. Extracted | Extracted vs. Fixture (`golden-master.test.ts`) | Numeric Mismatches (Ext. vs. Fix.) | Summary Text Mismatches (Ext. vs. Fix.) | Final Status |
|---|---:|---|---|---|---|---|---|
| Rent vs. Buy | 9 | Unverifiable in sandbox (no `.git`) | Unverifiable in sandbox (no `.git`) | 9/9 Pass (all integer + breakdown[]) | 0 | 0 | **Blocked (No `.git`) / Extracted-vs-Fixture Pass** |
| Job Offer | 7 | Unverifiable in sandbox (no `.git`) | Unverifiable in sandbox (no `.git`) | 7/7 Pass (float `toBeCloseTo(..., 6)` on hrs) | 0 | 0 | **Blocked (No `.git`) / Extracted-vs-Fixture Pass** |
| Lease vs. Buy | 8 | Unverifiable in sandbox (no `.git`) | Unverifiable in sandbox (no `.git`) | 8/8 Pass (all integer + 6-mo breakdown[]) | 0 | 0 | **Blocked (No `.git`) / Extracted-vs-Fixture Pass** |
| Gas vs. EV | 7 | Unverifiable in sandbox (no `.git`) | Unverifiable in sandbox (no `.git`) | 7/7 Pass (float `toBeCloseTo(..., 6)` on `/mi`) | 0 | 0 | **Blocked (No `.git`) / Extracted-vs-Fixture Pass** |
| Buy vs. Repair | 7 | Unverifiable in sandbox (no `.git`) | Unverifiable in sandbox (no `.git`) | 7/7 Pass (float `toBeCloseTo(..., 6)` on ratio) | 0 | 0 | **Blocked (No `.git`) / Extracted-vs-Fixture Pass** |
| DIY vs. Hire | 6 | Unverifiable in sandbox (no `.git`) | Unverifiable in sandbox (no `.git`) | 6/6 Pass (float `toBeCloseTo(..., 6)` on rate) | 0 | 0 | **Blocked (No `.git`) / Extracted-vs-Fixture Pass** |
| Debt vs. Invest | 7 | Unverifiable in sandbox (no `.git`) | Unverifiable in sandbox (no `.git`) | 7/7 Pass (all integer except rates) | 0 | 0 | **Blocked (No `.git`) / Extracted-vs-Fixture Pass** |
| Buy vs. Subscribe | 7 | Unverifiable in sandbox (no `.git`) | Unverifiable in sandbox (no `.git`) | 7/7 Pass (all integer + yearlyBreakdown[]) | 0 | 0 | **Blocked (No `.git`) / Extracted-vs-Fixture Pass** |
| New vs. Used | 6 | Unverifiable in sandbox (no `.git`) | Unverifiable in sandbox (no `.git`) | 6/6 Pass (all integer metrics) | 0 | 0 | **Blocked (No `.git`) / Extracted-vs-Fixture Pass** |
| Bulk Buy | 6 | Unverifiable in sandbox (no `.git`) | Unverifiable in sandbox (no `.git`) | 6/6 Pass (float `toBeCloseTo(..., 6)` on unit/%) | 0 | 0 | **Blocked (No `.git`) / Extracted-vs-Fixture Pass** |
| **Total** | **69** | **Blocked in Sandbox** | **Blocked in Sandbox** | **69/69 Pass** | **0** | **0** | **Commit Baseline Blocked / Extracted Tests Pass** |

---

## 4. Formula Parity Findings Across All 10 Calculators

Code audit of `packages/decision-core/src/calculators/*.ts` and `packages/decision-core/src/formatters/index.ts` verified:
- **Deterministic Locale Formatting:** Every extracted engine replaces implicit `.toLocaleString()` calls with `formatSummaryDollar`, `formatNumber`, or `formatFixedDecimal` pinned to `DEFAULT_LOCALE = 'en-US'` and normalizing `-0` -> `0`. Legacy `'$' + Math.round(-n)` formatting inside `summaryText` (e.g., `'$-23,000'`) is preserved intentionally via `formatSummaryDollar` for fixture compatibility, while `formatCurrency` offers standard `'-$23,000'` formatting for future UI display.
- **No Formula Rewrites Applied:** All mortgage amortization, yearly rent escalation, EV `1.1` charging-loss factor, repair risk adjustment, DIY break-even wage, monthly debt-vs-invest compounding, subscription proration, vehicle depreciation, and bulk spoilage formulas remain intact.
- **Minor Edge Observations Documented (Formulas Preserved):**
  - `calculateBuyVsSubscribe` internally clamps `horizonYears` to `Math.min(20, ...)` even though `validateBuyVsSubscribeInput` permits up to `25`.
  - `calculateRentVsBuyCostCategoryTotals` is an additive helper providing exact tax, insurance, and maintenance category totals without modifying `RentVsBuyResult`.

---

## 5. Numeric Validation Hardening & Test Matrix

### Validator Hardening (`packages/validation/src/calculators.ts`)
Phase 2A.1 inspected all 10 validator functions in `packages/validation/src/calculators.ts` and corrected three concrete validation defects without weakening any rule:
1. **Accurate `ValidationErrorCode` Classification:** Replaced blanket `'BELOW_MIN'` / `'NEGATIVE_NOT_ALLOWED'` codes with exact codes matching each violated rule (`REQUIRED` for `undefined`/`null`, `INVALID_NUMBER` for `NaN`/`±Infinity`, `NEGATIVE_NOT_ALLOWED`, `MUST_BE_POSITIVE`, `BELOW_MIN`, `ABOVE_MAX`, `MUST_BE_INTEGER`, `CROSS_FIELD_CONSTRAINT`).
2. **Integer Enforcement on Whole-Period / Pack-Count Fields:** Added `MUST_BE_INTEGER` checks to fields driving integer loop iterations or discrete pack counts (`rentVsBuy.loanTermYears`, `rentVsBuy.horizonYears`, `leaseVsBuy.analysisTermMonths`, `leaseVsBuy.loanTermMonths`, `gasVsEv.horizonYears`, `debtVsInvest.horizonYears`, `newVsUsed.horizonYears`, `newOption.loanTermMonths`, `usedOption.loanTermMonths`, `bulkBuy.normalQuantity`, `bulkBuy.bulkQuantity`). Fractional years remain allowed where designed (`buyVsRepair.expectedLifespanAfterRepairYears`, `buyVsSubscribe.horizonYears`).
3. **Bulk Buy Minimum Quantity Alignment:** Fixed `normalQuantity` and `bulkQuantity` bounds from `<= 0` to `< 1` (`BELOW_MIN`), matching both the existing error message (`"...must be at least 1."`) and `calculateBulkBuy`'s `Math.max(1, ...)` floor so values like `0.5` are rejected rather than silently clamped.

### Validation Test Matrix (`packages/validation/tests/validation.test.ts` — 23 Test Cases)

| Module / Calculator | Defaults & Valid Zeros | Empty / `REQUIRED` | `NaN` / `±Infinity` / Invalid | Negatives / `< Min` | `> Max` (`ABOVE_MAX`) | Decimal Where Integer Required | Cross-Field Constraint(s) Verified |
|---|---|---|---|---|---|---|---|
| `numeric.ts` (`parseNumericInput`, `validateNumericField`, `parseAndValidateFields`) | Tested (`0`, `'0'`, `'0.00'`, `-0 -> 0`) | Tested (`''`, `'   '`, `null`, `undefined`) | Tested (`'abc'`, `'12px'`, `{}`, `NaN`, `±Infinity`) | Tested (`NEGATIVE_NOT_ALLOWED`, `BELOW_MIN`, `MUST_BE_POSITIVE`) | Tested (`ABOVE_MAX`) | Tested (`MUST_BE_INTEGER`) | Field map preserves `0` alongside partial errors |
| 1. Rent vs. Buy | Tested (incl. `-15%` apprec.) | Tested (`REQUIRED`) | Tested (`NaN`, `Infinity`) | Tested (all min/positive rules) | Tested (`20%`, `25%`, `50yr`, `10%`) | Tested (`loanTermYears`, `horizonYears`) | `downPayment > homePrice` |
| 2. Job Offer | Tested (incl. `$0/mi`, 5d remote) | Tested (`REQUIRED`) | Tested (`NaN`) | Tested | Tested (`100%`, `100d`, `300mi`, `7d`, `$10/mi`) | N/A (hybrid fractional days allowed) | `commuteDaysPerWeek + remoteDaysPerWeek > 7` |
| 3. Lease vs. Buy | Tested (`0%` APR/tax, `0` down) | Covered by rule helper | Covered by rule helper | Tested (`MUST_BE_POSITIVE`, negatives) | Tested (`84mo`, `35%`, `96mo`, `25%`, `100%`) | Tested (`analysisTermMonths`, `loanTermMonths`) | `purchaseDownPayment > purchasePrice` |
| 4. Gas vs. EV | Tested (`$0/kWh`, `$0` gas/credit) | Covered by rule helper | Covered by rule helper | Tested (`<500 mi`, `0` MPG/efficiency, `<0`) | Tested (`20yr`, `100%` resale) | Tested (`horizonYears`) | N/A (no cross-field rule) |
| 5. Buy vs. Repair | Tested (`$0` quote, `0.25yr` fractional) | Covered by rule helper | Tested (`NaN`) | Tested (`0` lifespan/price, `<0`) | Tested (`100%` risk) | Fractional years intentionally valid | N/A |
| 6. DIY vs. Hire | Tested (`$0/hr`, `0h`, `$0` tools) | Covered by rule helper | Covered by rule helper | Tested (`0` quote, negatives) | Tested (`100%` risk) | Fractional hours valid | N/A |
| 7. Debt vs. Invest | Tested (`0%` APR, `-50%` return) | Covered by rule helper | Covered by rule helper | Tested (`<-50%`, `0` min pay, negatives) | Tested (`100%` APR/return/tax, `30yr`) | Tested (`horizonYears`) | N/A |
| 8. Buy vs. Subscribe | Tested (`0.5yr` fractional, annual cycle) | Covered by rule helper | Covered by rule helper | Tested (`horizon <= 0`, negatives) | Tested (`25yr` max) | Fractional years valid | `estimatedResaleValue > purchasePrice + setup` |
| 9. New vs. Used | Tested (`0%` APR, `$0` down/resale) | Tested (missing `newOption`/`usedOption`) | Covered by rule helper | Tested (`0` price/term, negatives) | Tested (`20yr` max) | Tested (`horizonYears`, `*LoanTermMonths`) | `downPayment > purchasePrice` (New & Used) |
| 10. Bulk Buy | Tested (`$0` storage, `0%` waste) | Covered by rule helper | Covered by rule helper | Tested (`0.5` qty, `0` usage/price, `<0`) | Tested (`>=100%` waste) | Tested (`normalQuantity`, `bulkQuantity`) | `bulkQuantity < normalQuantity` |

**Measured Coverage (`bun run test:coverage`):**
- `packages/validation/src`: **99.57% Stmts | 91.97% Branch | 100% Funcs | 99.57% Lines**
- `packages/validation/src/calculators.ts`: **100% Stmts | 94.68% Branch | 100% Funcs | 100% Lines**
- `packages/validation/src/numeric.ts`: **98.21% Stmts | 88.23% Branch | 100% Funcs | 98.21% Lines**

---

## 6. Website Input-to-Calculation Flow Verification Matrix

All 10 Astro calculator pages (`src/pages/decisions/*.astro`) and `src/layouts/DecisionLayout.astro` were inspected directly and verified against built HTML in `dist/decisions/*/index.html`:

| Calculator Page | Zero-Safe `parseNumericFieldOrNaN` (0 Fallbacks) | Shared `validate*` Before `calculate*` | Inline `.validation-error` Spans (HTML = JS) | Invalid Input Skips Calculation & Preserves Valid State | Valid `0` Values Accepted | GA4 `calculator_complete` Blocked on Errors | Initial SSR Defaults Match Engine |
|---|---|---|---|---|---|---|---|
| `rent-vs-buy.astro` | Pass | `validateRentVsBuyInput` | 12 / 12 matched | Pass (`return;`) | Pass (`0` rent/down/APR/tax/ins/maint) | Pass (`DecisionLayout` checks `.validation-error`) | Pass |
| `job-offer.astro` | Pass | `validateJobOfferInput` | 19 / 19 matched | Pass (`return;`) | Pass (`$0/mi`, `0` bonus/days/salary) | Pass | Pass |
| `lease-vs-buy.astro` | Pass | `validateLeaseVsBuyInput` | 14 / 14 matched | Pass (`return;`) | Pass (`0%` APR/tax, `0` down/fees/resale) | Pass | Pass |
| `gas-vs-ev.astro` | Pass | `validateGasVsEvInput` | 16 / 16 matched | Pass (`return;`) | Pass (`$0/kWh`, `$0` gas/credit/charger) | Pass | Pass |
| `buy-vs-repair.astro` | Pass | `validateBuyVsRepairInput` | 9 / 9 matched | Pass (`return;`) | Pass (`$0` quote/energy/risk) | Pass | Pass |
| `diy-vs-hire.astro` | Pass | `validateDiyVsHireInput` | 7 / 7 matched | Pass (`return;`) | Pass (`0h`, `$0/hr`, `$0` tools/risk) | Pass | Pass |
| `debt-vs-invest.astro` | Pass | `validateDebtVsInvestInput` | 7 / 7 matched | Pass (`return;`) | Pass (`$0` cash/balance, `0%` APR/tax) | Pass | Pass |
| `buy-vs-subscribe.astro` | Pass | `validateBuyVsSubscribeInput` | 9 / 9 matched | Pass (`return;`) | Pass (`$0` price/setup/maint/sub) | Pass | Pass |
| `new-vs-used.astro` | Pass | `validateNewVsUsedInput` | 17 / 17 matched | Pass (`return;`) | Pass (`0%` APR, `$0` down/resale) | Pass | Pass |
| `bulk-buy.astro` | Pass | `validateBulkBuyInput` | 7 / 7 matched | Pass (`return;`) | Pass (`$0` storage, `0%` waste) | Pass | Pass |

**Behavior Note on Invalid Input Display:** When a user enters invalid input, `recalculate()` populates the relevant `#err-*` `.validation-error` span and exits before calling `calculate*()`, preventing misleading calculated outputs and suppressing GA4 `calculator_complete`. Previously displayed valid summary metrics remain visible until corrected so users can fix typos without destructive layout flicker.

---

## 7. Shared Package Independence Findings

All four packages (`@decision-tools/shared-types`, `@decision-tools/validation`, `@decision-tools/decision-core`, `@decision-tools/shared-data`) were audited:
- **Zero framework or runtime leaks:** No imports of `astro`, `react`, `@capacitor/*`, `@vercel/*`, `node:*`, `express`, `window.*`, `document.*`, `localStorage`, or `sessionStorage` exist anywhere in `packages/*/src/`.
- **Verified programmatically:** Both `formatting-and-compat.test.ts` (source regex guardrail) and `bunx tsc -p packages/<pkg>/tsconfig.json --noEmit` (with strict mode and zero DOM/Node `types`) pass cleanly.
- **Workspace exports verified:** Root `package.json` declares `"workspaces": ["packages/*"]` and all four `@decision-tools/*: "workspace:*"` dependencies; compatibility re-exports in `src/types.ts`, `src/data/*.ts`, and `src/lib/decisions/*.ts` match package exports by strict identity (`===`).

---

## 8. Build, Package Manager, Deployment, Sitemap, SEO, AdSense & GA4 Verification

### Package Manager & Vercel Deployment Compatibility Findings
- **Intended Package Manager:** **Bun** (`bun.lock` is the sole lockfile in the repository; Bun `v1.4.4` is installed).
- **Hygiene Change Applied:** Renamed root `package.json` `"name"` from `"react-example"` to `"decision-tools"` and refreshed `bun.lock` via `bun install`. No starter files were deleted and no public website behavior changed.
- **Vercel Build Compatibility Caveat (Honest Assessment):**
  - A successful local `bun run build` does **not** automatically guarantee Vercel deployment success if Vercel's project configuration overrides Install Command to `npm install` or `npm ci`.
  - Root `package.json` uses `"workspace:*"` specifiers (`"@decision-tools/decision-core": "workspace:*"`), which **Bun supports natively** via `bun.lock`, whereas **`npm` rejects `"workspace:*"` with `EUNSUPPORTEDPROTOCOL`**.
  - There is currently no `vercel.json` in the repository; Vercel deployment relies on automatic `bun.lock` framework/package-manager detection (`bun install` + `bun run build`). Before deploying, confirm Vercel project settings use Bun (not an overridden `npm` install command).

### Command & Static Output Verification
- `bun install --frozen-lockfile`: Passed (`Checked 396 installs across 547 packages`, `0` lockfile drift).
- `bun run test`: **3 test files, 109 / 109 tests passed** (`golden-master.test.ts`: 79, `formatting-and-compat.test.ts`: 7, `validation.test.ts`: 23).
- `bun run test:coverage`: **98.73% Stmts | 88.36% Branch | 86.66% Funcs | 99.22% Lines**.
- `bun run lint` (`tsc --noEmit`): Passed (0 errors).
- `bunx tsc -p packages/*/tsconfig.json --noEmit` (all 4 packages): Passed (0 errors).
- `bun run build` (`astro build`): Passed, building **33 static HTML pages**.
- **Built `dist/` Integrity Checks:**
  - **Routes & Sitemap:** `33` HTML files built; `dist/sitemap-0.xml` contains all **33** `https://decision-tools.org/...` URLs; `dist/sitemap-index.xml` and `dist/sitemap.xml` present.
  - **Canonical URLs:** All 33 pages contain `<link rel="canonical" href="https://decision-tools.org...">` (Note: pre-existing `BaseLayout.astro` omits trailing slashes on non-root canonical paths whereas `@astrojs/sitemap` emits trailing slashes; preserved intentionally).
  - **`robots.txt` & `ads.txt`:** Intact in `dist/robots.txt` (`Allow: /`, `Sitemap: https://decision-tools.org/sitemap.xml`) and `dist/ads.txt` (`google.com, pub-1850854173653124, DIRECT, f08c47fec0942fa0`).
  - **AdSense:** Publisher ID `ca-pub-1850854173653124` verified present in **33 / 33** built HTML pages.
  - **GA4:** `PUBLIC_GA_MEASUREMENT_ID` conditional `<script>` and `window.trackDecisionEvent` safety shim verified present in **33 / 33** built HTML pages; `DecisionLayout.astro` (`calculator_start`, `calculator_complete`, `calculator_reset`, `calculator_to_guide_click`) and guide tracking hooks remain intact.
  - **Client Bundles:** Zero unresolved `@decision-tools` specifiers in `dist/`.

---

## 9. Remaining Known Limitations

1. **Git History Unavailable in `/app/applet`:** Pre-Phase-2 commit `01afd59c4ece8db2a9e13c213d3916bc150feedb` and Phase 2 commit `16608e357120179f37e77a75c622f282121158db` do not exist inside the runtime container, preventing direct execution of original commit `01afd59c...` sources here.
2. **Vercel `npm` vs. Bun `workspace:*`:** Vercel builds must run with Bun (`bun.lock` auto-detection or explicit `bun install`); running `npm install` against `"workspace:*"` will fail.
3. **Canonical vs. Sitemap Trailing Slash (Pre-Existing):** `BaseLayout.astro` omits trailing slashes on non-root canonical links while `@astrojs/sitemap` includes trailing slashes.
4. **Buy vs. Subscribe Upper Horizon Cap:** `validateBuyVsSubscribeInput` allows `horizonYears` up to `25`, whereas `calculateBuyVsSubscribe` caps at `Math.min(20, ...)` internally.
5. **Rent vs. Buy Web Breakdown Heuristic & Client Number Formatting:** `rent-vs-buy.astro` retains its `0.65 / 0.35` table display heuristic and `.astro` metric cards use browser `.toLocaleString()` (while `summaryText` uses deterministic `en-US`).

---

## 10. Explicit Acceptance Criteria Evaluation

| Acceptance Criterion | Status | Evidence / Rationale |
|---|---|---|
| 1. All 69 fixtures are independently verified against the original engines (`01afd59c...`) | **FAIL / BLOCKED IN SANDBOX** | `.git` is absent in `/app/applet` (`fatal: not a git repository`), so `01afd59c4ece8db2a9e13c213d3916bc150feedb` cannot be retrieved or executed here. Extracted engines pass 69/69 scenarios against committed fixtures; commit-level comparison script provided in Section 2 for execution in a full Git clone. |
| 2. All 10 extracted engines preserve the original mathematical behavior | **CONDITIONAL PASS (Verified vs. Fixtures & Formula Audit; Pending `01afd59c` Run)** | 69/69 golden-master scenarios + 10/10 SSR default page checks + line-by-line formula inspection show zero mathematical changes; final `01afd59c` binary cross-check requires full Git clone. |
| 3. Validation rules have adequate field-level and boundary tests | **PASS** | `validation.ts` hardened with accurate error codes & integer checks; 23 focused test groups/cases cover all 10 calculators (**99.57% Stmts / 91.97% Branch** on `packages/validation/src`, **100% Stmts / 94.68% Branch** on `calculators.ts`). |
| 4. Invalid inputs cannot silently produce misleading results | **PASS** | Zero `\|\| DEFAULT` fallbacks across all 10 `.astro` scripts; `parseNumericFieldOrNaN` + `validate*` gate `calculate*` and populate inline `.validation-error` spans before exiting; GA4 `calculator_complete` blocked when errors exist. |
| 5. Valid zero values are preserved | **PASS** | Verified in `numeric.ts`, all 10 validators, all 10 `.astro` scripts, and dedicated zero-value tests in both `validation.test.ts` and `golden-master.test.ts`. |
| 6. Shared packages remain framework-independent | **PASS** | Zero Astro/React/DOM/Capacitor/Vercel/server imports across all 4 packages verified via static test guardrail and per-package strict `tsc --noEmit`. |
| 7. Existing website builds successfully | **PASS** | `bun run lint`, strict package `tsc`, and `bun run build` pass cleanly (**33 pages built**). |
| 8. Existing public URLs, SEO, AdSense, and GA4 remain intact | **PASS** | All 33 routes, 33 sitemap URLs, canonicals, `robots.txt`, `ads.txt`, AdSense (`ca-pub-1850854173653124`), and `trackDecisionEvent` / `PUBLIC_GA_MEASUREMENT_ID` verified in `dist/`. |

**Overall Phase 2A.1 Verdict:** **INCOMPLETE / HELD AT GATE 1 DUE TO SANDBOX `.git` ABSENCE.**  
All code hardening, precision test corrections, validation test expansion, website input-flow checks, package independence checks, root package rename (`decision-tools`), and Astro static build checks pass inside `/app/applet`. However, Criterion 1 (**reproducing all 69 golden-master fixtures directly from pre-Phase-2 commit `01afd59c4ece8db2a9e13c213d3916bc150feedb`**) cannot be executed without `.git` history and must be run in the full Git repository before final Phase 2A.1 sign-off and before starting Phase 3.
