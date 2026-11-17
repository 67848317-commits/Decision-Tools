# Decision Tools — Phase 2: Shared Calculation Engine Extraction & Golden-Master Test Suite Report

**Document Status:** Phase 2 Complete  
**Production Website:** `https://decision-tools.org/`  
**Scope:** Shared Workspace Packages (`packages/*`), Golden-Master & Validation Test Suite, Website Zero-Value/Validation Fixes, Compatibility Re-Exports  
**Phase 3 Boundary:** No mobile wrapper (`apps/mobile`, React SPA, Capacitor, iOS/Android projects, AdMob, UMP, or SQLite) was created in this phase.

---

## A. Executive Summary

Phase 2 extracted all 10 pure TypeScript decision-calculation engines, shared domain/catalog/guide datasets, consolidated type contracts, and zero-preserving validation utilities into four framework-agnostic workspace packages under `packages/*`, while keeping the existing Astro 7.3.3 SSG website (`src/`) intact and operational at `https://decision-tools.org/`.

Key verified outcomes:
- **4 pure TypeScript workspace packages created:** `@decision-tools/shared-types`, `@decision-tools/validation`, `@decision-tools/decision-core`, and `@decision-tools/shared-data`, wired via Bun workspaces in `package.json` with `bun.lock` updated cleanly.
- **Zero mathematical formula changes:** All 10 calculators match golden-master fixtures captured from the pre-extraction production engines across **69 scenario fixtures** (default inputs, realistic variants, boundary zeros, and high-value stress cases), plus **4 supplementary engine helper tests** (`calculateMonthlyMortgage`, `calculateRentVsBuyCostCategoryTotals`, `calculateSingleJobOffer`).
- **Deterministic locale formatting (`en-US`):** Replaced locale-sensitive `.toLocaleString()` calls in `summaryText` generation across all 10 engines with deterministic `Intl.NumberFormat('en-US')`-backed helpers (`formatSummaryDollar`, `formatNumber`, `formatCurrency`, `formatFixedDecimal`), normalizing `-0` to `0` while keeping optional display-symbol overrides separate from currency conversion.
- **All 10 website calculator `.astro` pages hardened:** Fixed `Number(...) || DEFAULT` and `parseFloat(...) || ...` falsy-zero bugs using `parseNumericFieldOrNaN`, wired all 10 `validate*` functions in client `<script>` blocks, corrected overly restrictive HTML `min`/`max` attributes (`0` APR, `$0/kWh`, `$0` extra cash, `$0` vehicle cost per mile, `$0` repair quote, `0` DIY hours, `-50%` investment return), and ensured inline `.validation-error` feedback spans exist for all 117 rendered error slots across the 10 pages.
- **Full regression & build pass:** **86/86 Vitest tests passed** (`3` test files), strict `tsc --noEmit` passed across root and all 4 packages, `npm run lint` passed, and `astro build` produced all **33 static HTML routes** and all **33 canonical `<loc>` URLs** in `dist/sitemap-0.xml`.

---

## B. Workspace & Package Architecture Created

Root workspace configuration was added in `package.json` (`"workspaces": ["packages/*"]`) with shared strict TypeScript settings in `tsconfig.base.json`.

| Package | Workspace Name | Key Source Files | Purpose & Dependencies |
|---|---|---|---|
| `packages/shared-types` | `@decision-tools/shared-types` | `package.json`, `tsconfig.json`, `src/index.ts` | Canonical TypeScript interfaces/unions for all 10 calculator inputs/outputs, reconciled `GuideItem` and `PlannedGuideTopic`, catalog models (`DecisionCategory`, `DecisionItem`, `CategoryInfo`), `ValidationResult` / `ValidationIssue`, and future-ready `SavedDecisionScenario` contract. Zero dependencies. |
| `packages/validation` | `@decision-tools/validation` | `package.json`, `tsconfig.json`, `src/numeric.ts`, `src/calculators.ts`, `src/index.ts` | Zero-preserving numeric parsing (`parseNumericInput`, `parseNumericFieldOrNaN`, `validateNumericField`, `parseAndValidateFields`) distinguishing valid `0`/`-0`, empty string/`null`/`undefined`, and malformed strings (`"12px"`, `"abc"`, `NaN`, `Infinity`), plus all 10 `validate*` functions. Depends only on `@decision-tools/shared-types`. |
| `packages/decision-core` | `@decision-tools/decision-core` | `package.json`, `tsconfig.json`, `src/formatters/index.ts`, `src/calculators/*.ts` (10 engines), `src/index.ts` | Pure TypeScript engines for all 10 calculators, deterministic `en-US` formatting utilities (`DEFAULT_LOCALE = 'en-US'`), `calculateMonthlyMortgage`, and additive `calculateRentVsBuyCostCategoryTotals`. Depends on `@decision-tools/shared-types` and `@decision-tools/validation`. |
| `packages/shared-data` | `@decision-tools/shared-data` | `package.json`, `tsconfig.json`, `src/decisions.ts`, `src/guides.ts`, `src/index.ts` | Shared `CATEGORIES` (5), `DECISIONS` (10), `PLANNED_GUIDES` (20 planned topics: 16 published, 4 unpublished), `GUIDES` (16 published articles), and catalog/guide relationship helpers. Depends only on `@decision-tools/shared-types`. |

### Architectural Purity Verification
Automated guardrails in `packages/decision-core/tests/formatting-and-compat.test.ts` scan every `.ts` file inside `packages/*/src/` and assert zero occurrences of:
- `react`, `astro`, or `@capacitor` imports
- Browser globals (`window.*` / `window[...]`, `document.*` / `document[...]`, `localStorage`, `sessionStorage`)
- Locale-unspecified `.toLocaleString(` calls

In addition, each package's `tsconfig.json` compiles `src/**/*.ts` with `"strict": true` (via `tsconfig.base.json`) and no Node/DOM ambient types, verifying platform independence at the compiler level. `bun.lock` was updated cleanly via `bun add -d` and `bun install`.

---

## C. Golden-Master Baseline Capture & Verification Results

Before rewriting imports or formatting helpers, baseline golden-master fixtures were captured directly from the original unmodified calculation engines in `src/lib/decisions/*.ts` into `packages/decision-core/tests/fixtures/*.json`.

| Calculator Fixture File | Scenarios Captured | Scenario Coverage | Status |
|---|---:|---|---|
| `rent-vs-buy.json` | 8 | Defaults, 0% mortgage APR, $0 monthly rent, high price/low down payment, 1-yr short horizon, 30-yr long horizon, 0% maintenance/insurance, 0% appreciation | **8/8 Exact Match** |
| `job-offer.json` | 7 | Defaults, identical offers tie, $0/mi transit commute, 5-day remote (0 commute days), 0% employer match, zero bonus/health, high salary + match variance | **7/7 Exact Match** |
| `lease-vs-buy.json` | 7 | Defaults, 0% purchase APR + 0% sales tax, 0% money factor, $0 down payment, high annual mileage excess fees, short 24-month horizon, high residual luxury lease | **7/7 Exact Match** |
| `gas-vs-ev.json` | 7 | Defaults, $0/kWh free charging, $0 federal EV credit + $0 home charger, high annual mileage, 1-yr short horizon, low gas price parity, zero EV resale | **7/7 Exact Match** |
| `buy-vs-repair.json` | 6 | Defaults, $0 repair quote, replacement cheaper than repair, 0% efficiency gain, high reliability risk, short lifespan | **6/6 Exact Match** |
| `diy-vs-hire.json` | 6 | Defaults, 0 DIY hours (supplies only), $0/hr opportunity cost, 0% rework risk, zero coordination hours, high-risk complex contractor job | **6/6 Exact Match** |
| `debt-vs-invest.json` | 7 | Defaults, 0% debt APR, $0 extra monthly cash, 0% expected investment return, negative investment return (-5%), high APR credit card vs invest, 30-yr horizon | **7/7 Exact Match** |
| `buy-vs-subscribe.json` | 7 | Defaults, annual billing cycle, monthly billing cycle, $0 maintenance + $0 resale, high upgrade frequency, immediate break-even, long never-break-even subscription | **7/7 Exact Match** |
| `new-vs-used.json` | 7 | Defaults, 0% APR + 0% tax on both, low new APR vs high used APR, $0 maintenance/insurance diff, short 2-yr horizon, long 10-yr horizon, tie-like baseline | **7/7 Exact Match** |
| `bulk-buy.json` | 7 | Defaults, 0% spoilage/waste, $0 storage/capital cost, exact break-even tie, bulk worse due to high spoilage, high monthly usage, low shelf-life risk | **7/7 Exact Match** |
| **Total Golden-Master Fixtures** | **69** | Plus 4 helper unit tests (`calculateMonthlyMortgage`, `calculateRentVsBuyCostCategoryTotals`, `calculateSingleJobOffer`) | **73/73 Passed** |

Every fixture assertion in `packages/decision-core/tests/golden-master.test.ts` checks **exact deep equality** (`toEqual`) on numeric fields, booleans, enums, nested breakdown arrays, and formatted `summaryText` strings.

---

## D. Calculator Engine Extraction & Locale Determinism Details

1. **Deterministic Formatters (`packages/decision-core/src/formatters/index.ts`):**
   - `DEFAULT_LOCALE = 'en-US'`
   - `normalizeZero(value)` maps `-0` (and values rounded to `-0`) to `0` so outputs never emit `"$-0"` or `"-0"`.
   - `formatNumber(value, { locale, minimumFractionDigits, maximumFractionDigits })` uses `Intl.NumberFormat('en-US')`.
   - `formatSummaryDollar(value, locale = DEFAULT_LOCALE)` reproduces legacy `'$' + Math.round(n).toLocaleString()` behavior deterministically across host locales (including negative-signed values like `'$-23,000'` where golden-master parity requires exact string equality inside existing `summaryText` outputs).
   - `formatCurrency(value, options)` and `formatFixedDecimal(value, fractionDigits, locale)` provide clean standard currency formatting (`-$23,000`, `€1,500`, `£1,500`) for UI display layers without currency conversion.
2. **Non-Breaking Exact Breakdown Helper (`calculateRentVsBuyCostCategoryTotals`):**
   - Added alongside `calculateRentVsBuy` in `packages/decision-core/src/calculators/rentVsBuy.ts` so future clients (including mobile) can display exact cumulative property taxes, home insurance, and maintenance totals without changing the existing `RentVsBuyResult` contract or altering the live website's SSR table values.
3. **Contract Preservation:**
   - All `*_DEFAULTS` constants, `validate*` functions, and calculation signatures remain compatible with pre-extraction `src/lib/decisions/*.ts` APIs.
   - `DebtVsInvestResult` preserves existing `guaranteedInterestRate` alongside `fixedInterestRate` and `contractualInterestRate` for full contract parity while allowing UI layers to avoid promissory framing.

---

## E. Zero-Value & Validation Bug Fixes Across All 10 Website Calculator Pages

All 10 Astro calculator pages (`src/pages/decisions/*.astro`) were updated surgically to remove falsy `||` zero-clobbering coercions, attach `parseNumericFieldOrNaN` from `@decision-tools/validation`, wire the shared `validate*` functions, align HTML `min`/`max` bounds with domain rules, and display inline `.validation-error` messages (without altering page layout, design, GA4 tags, or calculation math).

| Calculator Page | Fixes Implemented | Built `.validation-error` Spans |
|---|---|---:|
| `rent-vs-buy.astro` | Replaced `parseFloat(...) \|\| ...` in `getInputsFromDOM()` with `parseNumericFieldOrNaN` (preserving `$0` rent, `$0` down payment, `0%` APR, `$0` insurance, `0%` maintenance); added `err-horizonYears` span and wiring. | 12 |
| `job-offer.astro` | Lowered `input-vehicle-cost-per-mile` `min` from `0.10` to `0`; replaced `parseFloat(...) \|\| 0` and vehicle-cost fallback with `parseNumericFieldOrNaN`; wired `err-a-other`, `err-b-other`, `err-a-remote-days`, `err-b-remote-days` in `updateJobResults()`. | 19 |
| `lease-vs-buy.astro` | Replaced `Number(...) \|\| DEFAULT` (which previously blocked `0%` APR and `0%` sales tax); added `.validation-error` CSS + all 14 error spans; wired `validateLeaseVsBuyInput` (mapping `purchasePrice` errors to `err-vehicleMSRP`). | 14 |
| `gas-vs-ev.astro` | Replaced `Number(...) \|\| DEFAULT` (which blocked `$0/kWh` charging, `$0` tax credit, `$0` charger cost); set `min="0"` on gas/electricity/resale inputs, `min="500"` on annual miles, `max="20"` on horizon; added `.validation-error` CSS + 16 spans; wired `validateGasVsEvInput`. | 16 |
| `buy-vs-repair.astro` | Replaced `Number(...) \|\| DEFAULT` with `parseNumericFieldOrNaN`; set `min="0"` on repair quote; added `.validation-error` CSS + 9 spans; wired `validateBuyVsRepairInput`. | 9 |
| `diy-vs-hire.astro` | Replaced `Number(...) \|\| DEFAULT` with `parseNumericFieldOrNaN`; set `min="0"` on DIY hours; added `.validation-error` CSS + 7 spans; wired `validateDiyVsHireInput`. | 7 |
| `debt-vs-invest.astro` | Replaced `Number(...) \|\| DEFAULT` (which blocked `$0` extra cash and `0%` APR); set `min="0"` on cash/balance/rate, `min="-50"` on invest return, `max="30"` on horizon; added `.validation-error` CSS + 7 spans; wired `validateDebtVsInvestInput`. | 7 |
| `buy-vs-subscribe.astro` | Replaced `Number(...) \|\| DEFAULT` with `parseNumericFieldOrNaN`; added `err-horizon-years` (9 spans total); wired `validateBuyVsSubscribeInput`. | 9 |
| `new-vs-used.astro` | Replaced `Number(...) \|\| DEFAULT` with `parseNumericFieldOrNaN`; added `err-horizon-years` (17 spans total); wired `validateNewVsUsedInput` covering all 17 numeric fields. | 17 |
| `bulk-buy.astro` | Replaced `Math.max(..., Number(...) \|\| ...)` clamping with `parseNumericFieldOrNaN`; added `err-monthly-usage` and `err-storage-cost` (7 spans total); wired `validateBulkBuyInput`. | 7 |
| **Total** | **10/10 calculator pages validated + zero-safe** | **117** |

Note: `DecisionLayout.astro` already inspects `.validation-error` `textContent` before dispatching GA4 `calculator_complete` events, so inline validation prevents invalid/empty states from emitting false completion analytics without modifying GA4 configuration.

---

## F. Website Compatibility & Build/Sitemap Verification

1. **Thin Compatibility Re-Exports:**
   - `src/types.ts` re-exports from `@decision-tools/shared-types`.
   - `src/data/decisions.ts` and `src/data/guides.ts` re-export from `@decision-tools/shared-data/decisions` and `@decision-tools/shared-data/guides`.
   - All 10 `src/lib/decisions/*.ts` files re-export their functions, validators, defaults, and types from `@decision-tools/decision-core/*`.
   - Identity equality (`===`) between every `src/lib/decisions/*` / `src/data/*` export and `@decision-tools/*` is enforced in `formatting-and-compat.test.ts`.
2. **Production Astro Build & Static Verification (`npm run build`):**
   - `astro build` completed cleanly with **33 static HTML pages built**.
   - `dist/sitemap-index.xml`, `dist/sitemap-0.xml` (**33 `<loc>` URLs** under `https://decision-tools.org/...`), and `dist/sitemap.xml` alias are all generated and verified.
   - `dist/ads.txt` (`google.com, pub-1850854173653124, DIRECT, f08c47fec0942fa0`), `dist/robots.txt` (`Sitemap: https://decision-tools.org/sitemap.xml`), AdSense script (`ca-pub-1850854173653124`), and `window.trackDecisionEvent` analytics shim remain intact across built HTML.
   - Client Vite bundles in `dist/_astro/*.js` resolved `@decision-tools/validation` and `@decision-tools/decision-core` cleanly with zero unresolved package specifiers in `dist/`.

---

## G. Test Coverage Summary

Configured in `/vitest.config.ts` with `v8` coverage across `packages/decision-core/src/**/*.ts`, `packages/validation/src/**/*.ts`, and `packages/shared-data/src/decisions.ts`:

- **Test Execution (`npm test`):** **3 test files, 86 tests, 86 passed, 0 failed**
  - `packages/decision-core/tests/golden-master.test.ts`: **73 passed** (69 golden-master scenarios + 4 helper tests)
  - `packages/decision-core/tests/formatting-and-compat.test.ts`: **7 passed** (deterministic `en-US` formatting, `-0` normalization, symbol overrides, re-export identity checks, catalog/guide count assertions, and package-purity source scan)
  - `packages/validation/tests/validation.test.ts`: **6 passed** (zero-preserving parsing, empty vs invalid numeric distinction, `validateNumericField`, `parseAndValidateFields`, boundary & cross-field rules across all 10 calculators)

- **Coverage (`npm run test:coverage`):**
  - Overall tracked scope: **85.78% Stmts | 79.13% Branch | 86.36% Funcs | 86.00% Lines**
  - `packages/decision-core/src/calculators`: **99.05% Stmts | 83.56% Branch | 100% Funcs | 99.22% Lines** (including 100% Stmts/Funcs/Lines on `bulkBuy.ts`, `buyVsRepair.ts`, `diyVsHire.ts`, `gasVsEv.ts`, `jobOffer.ts`, `leaseVsBuy.ts`, `newVsUsed.ts`)
  - `packages/decision-core/src/formatters`: **100% Stmts | 100% Branch | 100% Funcs | 100% Lines**
  - `packages/validation/src/numeric.ts`: **87.50% Stmts | 73.52% Branch | 100% Funcs | 87.50% Lines**
  - `packages/validation/src/calculators.ts`: **59.45% Stmts | 76.89% Branch | 100% Funcs | 59.45% Lines** (remaining untested individual negative/max branches are candidates for additional granular per-field error-message assertions if desired)

---

## H. Remaining Technical Debt & Deferred Items for Phase 3+

1. **Rent-vs-Buy Web Table Heuristic Retained Deliberately:** `src/pages/decisions/rent-vs-buy.astro` still uses its `0.65 / 0.35` Tax+Insurance vs. Maintenance display split inside SSR frontmatter and client script table updates so live web numbers remain untouched. Future mobile views (and an optional web follow-up) can call `calculateRentVsBuyCostCategoryTotals` directly.
2. **Static Breakdown Tables on 8/10 Web Calculators:** Preserved intentionally in Phase 2 so only input validation and zero-handling changed on the website; full dynamic comparison tables/charts belong to the reactive mobile UI (Phase 3/4) or a dedicated web UX pass.
3. **Pre-existing Starter Boilerplate in Root:** Residual Vite/React starter files (`index.html`, `vite.config.ts`, `src/App.tsx`, `src/main.tsx`, `src/index.css`) remain untouched per Phase 1 audit guidance and are unused by `astro build`.
4. **Data Helper Test Coverage:** `packages/shared-data/src/decisions.ts` lookup helpers (`getDecisionBySlug`, etc.) and `packages/shared-data/src/guides.ts` relationship helpers are validated at build time across all 33 Astro routes and partially via dataset counts; dedicated unit tests for those helpers can be added in Phase 3 alongside mobile catalog navigation.

---

## I. Explicit Phase 2 Acceptance Checklist Verification

- [x] Shared packages created under `packages/{shared-types,validation,decision-core,shared-data}` without moving `src/` to `apps/web`.
- [x] Zero browser/DOM/Astro/React/Capacitor imports in `packages/*`, enforced via Vitest architectural guardrail and per-package strict `tsc --noEmit`.
- [x] All 10 calculation engines extracted with untouched formulas and verified against 69 golden-master baseline fixtures.
- [x] Deterministic `en-US` formatting utilities introduced (`DEFAULT_LOCALE = 'en-US'`, `-0` normalization, no implicit `.toLocaleString()`).
- [x] Zero-preserving numeric parsing & shared `validate*` logic implemented and wired into all 10 calculator `.astro` pages.
- [x] Thin compatibility re-exports verified in `src/types.ts`, `src/data/*`, and `src/lib/decisions/*`.
- [x] `npx tsc --noEmit`, package `tsconfig.json` checks, `npm run lint`, `npm test`, `npm run test:coverage`, and `npm run build` all pass cleanly.
- [x] All 33 static HTML pages, 33 sitemap URLs, `ads.txt`, `robots.txt`, AdSense ID, and GA4 hooks verified intact.
- [x] Zero Phase 3 mobile artifacts (`apps/mobile`, Capacitor, iOS/Android, AdMob, SQLite) introduced.

---

## J. Readiness Statement for Phase 3 (Mobile Shell Initialization)

**Decision Tools is ready to proceed to Phase 3 (Mobile Shell Initialization).**  
All domain types, validation utilities, pure calculation engines, and decision/guide datasets are now cleanly isolated into tested workspace packages (`@decision-tools/*`) with 100% golden-master parity, verified `en-US` determinism, and zero coupling to Astro or DOM APIs. A React 19 + Vite + Capacitor mobile workspace (`apps/mobile`) can consume these exact packages directly from `workspace:*` without duplicating calculation logic or risking divergence from `https://decision-tools.org/`.
