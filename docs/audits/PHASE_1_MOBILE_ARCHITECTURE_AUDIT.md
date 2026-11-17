# Decision Tools — Phase 1: Mobile App Architecture & Existing Codebase Audit

**Document Status:** Phase 1 Read-Only Audit & Architecture Blueprint  
**Target Website:** `https://decision-tools.org/`  
**Scope:** iOS & Android Cross-Platform Expansion via Capacitor (Audit Only — Zero Code Modifications)  
**Target Markets:** United States (primary), United Kingdom, Canada, Australia, English-speaking European markets

---

## 1. Executive Summary

### Purpose of This Audit
This document evaluates the existing **Decision Tools** codebase and establishes a concrete, technically grounded architecture for expanding Decision Tools into dedicated **iOS** and **Android** mobile applications while preserving the existing production website (`https://decision-tools.org/`) on Vercel.

### Key Verified Findings from the Codebase
1. **Production Web Architecture Is Pure Astro SSG + Vanilla Client Scripts:**  
   Although `package.json` contains React 19 (`react`, `react-dom`), `@vitejs/plugin-react`, `@tailwindcss/vite`, `express`, `@google/genai`, `lucide-react`, and `motion` alongside residual Vite entry files (`index.html`, `src/App.tsx`, `src/main.tsx`, `vite.config.ts`), **the live Decision Tools site does not use React, Tailwind CSS, Express, or Gemini at runtime**. `astro.config.mjs` runs Astro `^7.3.3` in static output mode with `@astrojs/sitemap`, rendering `.astro` layouts/components, custom CSS tokens in `src/styles/global.css`, and vanilla DOM `<script>` blocks per calculator page.
2. **All 10 Calculation Engines Are Already Pure TypeScript:**  
   Every calculator module in `src/lib/decisions/*.ts` (`rentVsBuy.ts`, `jobOffer.ts`, `leaseVsBuy.ts`, `gasVsEv.ts`, `buyVsRepair.ts`, `diyVsHire.ts`, `debtVsInvest.ts`, `buyVsSubscribe.ts`, `newVsUsed.ts`, `bulkBuy.ts`) is **100% free of browser APIs, DOM calls, Astro imports, and React dependencies**. Each exports typed inputs, defaults (`*_DEFAULTS`), calculation functions, typed results, and a `validate*` function.
3. **Important Web UI Integration Gaps Discovered:**  
   - **Validation Gap:** Only 2 of 10 calculator pages (`rent-vs-buy.astro` and `job-offer.astro`) call their `validate*` functions in the client `<script>`; the other 8 bypass validation and use fallback coercions (`Number(el.value) || DEFAULT`), which silently overwrite valid `0` entries (e.g., `0%` APR in `debt-vs-invest.astro`, `0%` sales tax or `0%` APR in `lease-vs-buy.astro`, `$0/kWh` in `gas-vs-ev.astro`).
   - **Static Breakdown Tables in 8/10 Web Calculators:** Only `rent-vs-buy.astro` and `job-offer.astro` dynamically update `ComparisonTable` and `CostBreakdown` rows on user input; the remaining 8 only update top summary KPIs in the DOM. Furthermore, `rent-vs-buy.astro` computes a `0.65` / `0.35` heuristic split in the DOM script for Tax & Insurance vs. Maintenance instead of pulling exact yearly subtotals from `rentVsBuy.ts`.
   - **Locale-Dependent Formatting in `summaryText`:** All 10 calculators generate `summaryText` inside the calculation engine using `.toLocaleString()` without an explicit locale argument, which can yield minor formatting differences across Node/iOS/Android/browser locales (e.g., US vs. UK/EU).
   - **Zero Automated Test Coverage:** No unit, regression, or integration test suite currently exists in the repository (`npm run lint` only runs `tsc --noEmit`).

### Strategic Architecture Recommendation
- **Recommended Mobile Frontend Architecture:** **Option B — Dedicated Vite + React 19 + TypeScript SPA inside Capacitor** (`apps/mobile`), while keeping **Astro SSG** (`apps/web`) untouched for the website and sharing all calculation logic, validation, types, and reference content via internal workspace packages (`packages/decision-core`, `packages/validation`, `packages/shared-types`, `packages/shared-data`).
- **Why This Fits Confirmed Direction:** The website stays on Astro (preserving SEO, SSG, Vercel deployment, GA4, and AdSense), Capacitor serves as the native iOS/Android runtime, and React + TypeScript provides native-feeling SPA navigation, reactive comparison tables/charts, Saved Decisions, Side-by-Side Scenario Comparison, Decision History, and offline storage—all powered by the identical `decision-core` calculation engine.
- **Recommended Local Storage Architecture:** **Capacitor Preferences** for lightweight settings/consent metadata + **`@capacitor-community/sqlite`** (SQLite) for structured relational storage of Saved Decisions, Scenario Comparisons, and Decision History offline.
- **Recommended Advertising Architecture:** Keep Google AdSense (`pub-1850854173653124`, `public/ads.txt`) strictly on `apps/web`. Implement Google AdMob via the native Google Mobile Ads SDK for iOS and Android (through `@capacitor-community/admob` audited/pinned or a minimal native Capacitor plugin wrapper), paired with Google UMP SDK (`ConsentInformation` / `ConsentForm`) for GDPR (UK/EEA) and US state privacy compliance.

---

## 2. Existing Project Architecture

### Verified Facts from Source Inspection
- **Framework & Build:**
  - `package.json`: `"astro": "^7.3.3"`, `"typescript": "^7.0.2"`, `"@astrojs/sitemap": "^3.7.4"`, `"tsx": "^4.21.0"`, `"vite": "^8.3.0"`.
  - Scripts: `"dev": "astro dev --port=3000 --host=0.0.0.0"`, `"build": "astro build"`, `"preview": "astro preview --port=3000 --host=0.0.0.0"`, `"lint": "tsc --noEmit"`.
  - `astro.config.mjs`: Configures `site: 'https://decision-tools.org'`, `@astrojs/sitemap`, and a custom `sitemap-alias` `astro:build:done` hook copying `sitemap-index.xml` to `sitemap.xml`. No `@astrojs/react` or Tailwind integration is registered in Astro.
  - `tsconfig.json`: Targets `ES2022`, `module: "ESNext"`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `noEmit: true`, `allowImportingTsExtensions: true`, path alias `@/* -> ./*`.
- **Unused Boilerplate Artifacts in Repo:**
  - `index.html`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, and dependencies (`react`, `react-dom`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `tailwindcss`, `express`, `@google/genai`, `lucide-react`, `motion`) originate from the workspace starter template and are **not executed** by `astro build` or `astro dev`.
- **Routing Architecture (33 Public Static Routes):**
  - Core pages: `src/pages/index.astro` (`/`), `src/pages/about.astro` (`/about`), `src/pages/contact.astro` (`/contact`), `src/pages/privacy.astro` (`/privacy`), `src/pages/terms.astro` (`/terms`).
  - Decision directory + 10 calculator pages: `src/pages/decisions/index.astro` (`/decisions`) and 10 explicit `.astro` routes (`rent-vs-buy.astro`, `job-offer.astro`, `lease-vs-buy.astro`, `gas-vs-ev.astro`, `buy-vs-repair.astro`, `diy-vs-hire.astro`, `debt-vs-invest.astro`, `buy-vs-subscribe.astro`, `new-vs-used.astro`, `bulk-buy.astro`).
  - Guide directory + 16 dynamic guide routes: `src/pages/guides/index.astro` (`/guides`) and `src/pages/guides/[slug].astro` (`/guides/[slug]` driven by `GUIDES` in `src/data/guides.ts`).
- **Layouts, Design System & Shared UI Components:**
  - `src/layouts/BaseLayout.astro`: Global `<head>`, canonical URL (`https://decision-tools.org`), Open Graph/Twitter tags, Schema.org JSON-LD (`Organization`, `WebSite`, page-specific schema), Google AdSense loader (`ca-pub-1850854173653124`), conditional GA4 (`import.meta.env.PUBLIC_GA_MEASUREMENT_ID`), and `window.trackDecisionEvent` safety shim.
  - `src/layouts/DecisionLayout.astro`: Standard 10-section analytical wrapper (`header-summary`, `framework`, `inputs`, `results`, `sensitivity`, `assumptions`, `limitations`, `methodology`, `worked-example`, `FAQ`, `RelatedDecisions`, `RelatedGuides`) plus client-side GA4 milestone tracking (`calculator_start`, `calculator_complete`, `calculator_reset`, `calculator_to_guide_click`).
  - 13 `.astro` components in `src/components/`: `AssumptionBox.astro`, `Breadcrumbs.astro`, `ComparisonTable.astro`, `CostBreakdown.astro`, `DecisionCard.astro`, `FAQ.astro`, `FeaturedGuides.astro`, `Footer.astro`, `Header.astro`, `OptionPanel.astro`, `RelatedCalculator.astro`, `RelatedDecisions.astro`, `RelatedGuides.astro`.
  - `src/styles/global.css`: Pure CSS custom properties (`--color-bg: #f8fafc`, `--color-surface: #ffffff`, `--color-brand: #0f172a`, `--color-brand-accent: #2563eb`, Option A blue `#1d4ed8` / `#eff6ff`, Option B green `#15803d` / `#f0fdf4`, spacing/radius/font scales).
- **Data Models & Content:**
  - `src/types.ts`: Defines `DecisionCategory`, `CategoryInfo`, `DecisionItem`, and a simplified `GuideItem` interface.
  - `src/data/decisions.ts`: Exports `CATEGORIES` (5 categories), `DECISIONS` (10 items with slugs, FAQs, related slugs, keywords), and helper lookup functions. Note: `relatedGuides` in `DECISIONS` lists 4 unpublished `PLANNED_GUIDES` slugs (`lease-vs-buy`, `buy-vs-subscribe`, `new-vs-used`, `bulk-buying`).
  - `src/data/guides.ts`: Defines a richer `GuideItem` interface (diverging from `src/types.ts`), `PlannedGuideTopic`, `PLANNED_GUIDES` (20 planned topics: 16 published, 4 unpublished), `GUIDES` (16 full analytical guides), and relationship resolvers (`getRelatedGuidesForDecision`, `getRelatedGuidesForGuide`).
- **Existing Test Infrastructure:**
  - Verified fact: **None.** Zero unit, integration, or E2E test files exist in the repository.

### Current System Architecture Diagram

```text
+-----------------------------------------------------------------------------------+
|                        EXISTING REPOSITORY (Astro 7.3.3 SSG)                      |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [src/data/*]                              [src/lib/decisions/*.ts]               |
|  - decisions.ts (10 catalog items)         - 10 pure TypeScript engines           |
|  - guides.ts (16 published guides)         - Inputs, Defaults, Calculate,         |
|  - types.ts                                  Validate, Result types               |
|         |                                           |                             |
|         v                                           v                             |
|  [Astro Build-Time SSR]                    [Client <script> per Calculator]       |
|  - BaseLayout.astro (AdSense, GA4, SEO)    - Imperative DOM getElementById()      |
|  - DecisionLayout.astro (10 slots + GA4)   - 2/10 call validate*(), 8/10 skip     |
|  - 13 .astro components                    - 2/10 update tables, 8/10 summary only|
|  - src/styles/global.css (CSS variables)                                          |
|         |                                                                         |
|         v                                                                         |
|  [dist/] -> 33 Static HTML Files + sitemap.xml + robots.txt + ads.txt -> Vercel   |
+-----------------------------------------------------------------------------------+
```

### Component Reuse Classification
- **Directly Reusable (Zero Rewrite Needed / Extractable):**
  - All 10 modules in `src/lib/decisions/*.ts` (calculation formulas, defaults, types, validators).
  - `src/data/decisions.ts` and `src/data/guides.ts` (content datasets and relationship resolvers, after reconciling the `GuideItem` type divergence).
  - Design tokens (`--color-*`, spacing, typography) from `src/styles/global.css` as CSS tokens/theme definitions for mobile.
- **Website-Specific (Keep in `apps/web` Only):**
  - `BaseLayout.astro`, `DecisionLayout.astro`, `Header.astro`, `Footer.astro`, `Breadcrumbs.astro`, JSON-LD generators, `@astrojs/sitemap`, `public/ads.txt`, `public/robots.txt`, AdSense scripts, GA4 web tag, and `/privacy` / `/terms` / `/contact` web pages.
  - Note: Web `<script>` DOM bindings in `src/pages/decisions/*.astro` are website-specific, though future web fixes (separate from mobile Phase 1) could align validation and breakdown table updates.

---

## 3. Calculator Engine Reusability Matrix

All 10 calculator files under `src/lib/decisions/` were audited individually. **Verified Fact:** Every single `.ts` calculation module has **zero** imports of React, Astro, DOM (`window`, `document`), storage, or network APIs.

| # | Calculator | Engine File (`src/lib/decisions/`) | Exported Functions & Defaults | Input Fields / UI Parity | Validation Function & Web Usage | Output Model & Breakdowns | Extraction Readiness & Refactoring Notes |
|---|---|---|---|---|---|---|---|
| 1 | **Rent vs. Buy** | `rentVsBuy.ts` | `calculateMonthlyMortgage`, `validateRentVsBuyInput`, `calculateRentVsBuy`, `RENT_VS_BUY_DEFAULTS` | 12 inputs / All 12 exposed in `rent-vs-buy.astro` | `validateRentVsBuyInput(Partial)` — **Used in web UI** | `RentVsBuyResult` + `YearRentBuyBreakdown[]` + `summaryText` | **High.** Refactoring needed: `rent-vs-buy.astro` computes a `0.65` / `0.35` heuristic split for Tax+Insurance vs. Maintenance in DOM JS. Add explicit `propertyTaxAnnual`, `insuranceAnnual`, `maintenanceAnnual` totals to `RentVsBuyResult` (additive, non-breaking). |
| 2 | **Job Offer** | `jobOffer.ts` | `validateJobOfferInput`, `calculateSingleJobOffer`, `compareJobOffers`, `JOB_OFFER_DEFAULTS_A/B` | 15 fields/offer (30 total) / 21 HTML inputs in `job-offer.astro` (`employeeContributionForMatchPercent`, `averageCommuteSpeedMph`=35, `annualWorkWeeks`=50 defaulted in page script) | `validateJobOfferInput(Partial, label)` — **Used in web UI** | `JobOfferComparisonResult` (`optionA`, `optionB`, deltas, `summaryText`) | **High.** Clean separation of `calculateSingleJobOffer` and `compareJobOffers`. Ensure mobile exposes or clearly documents the 3 fixed defaults (`annualWorkWeeks=50`, `averageCommuteSpeedMph=35`, match capture). |
| 3 | **Lease vs. Buy** | `leaseVsBuy.ts` | `LEASE_VS_BUY_DEFAULTS`, `calculateLeaseVsBuy`, `validateLeaseVsBuyInput` | 15 inputs / 14 HTML inputs (`purchasePrice` shares `input-vehicle-msrp` in `lease-vs-buy.astro`) | `validateLeaseVsBuyInput(LeaseVsBuyInput)` — **NOT called in web UI**; web uses `\|\| DEFAULT` coercions (blocks `0%` APR & `0%` sales tax!) | `LeaseVsBuyResult` + 6-month `MonthLeaseBuyBreakdown[]` + `summaryText` | **Medium-High.** Needs validator updated to accept `Partial<LeaseVsBuyInput>` and cover negative numbers (`downPayment < 0`, `loanTermMonths <= 0`). Fix `0` falsy coercion when migrating inputs cleanly. |
| 4 | **Gas vs. EV** | `gasVsEv.ts` | `GAS_VS_EV_DEFAULTS`, `calculateGasVsEv`, `validateGasVsEvInput` | 16 inputs / All 16 exposed in `gas-vs-ev.astro` | `validateGasVsEvInput(GasVsEvInput)` — **NOT called in web UI**; web uses `\|\| DEFAULT` (blocks `$0/kWh` free charging!) | `GasVsEvResult` + `YearGasEvBreakdown[]` + `summaryText` | **High.** Includes 10% AC-to-DC charging loss multiplier (`* 1.1`) inside engine. Expand validator checks for negative maintenance/insurance/tax credit/charger costs. |
| 5 | **Buy vs. Repair** | `buyVsRepair.ts` | `BUY_VS_REPAIR_DEFAULTS`, `calculateBuyVsRepair`, `validateBuyVsRepairInput` | 11 inputs / 9 HTML inputs (`itemName` hardcoded `'Household Item'`, `warrantyYears` hardcoded `2` in `buy-vs-repair.astro`) | `validateBuyVsRepairInput(BuyVsRepairInput)` — **NOT called in web UI** | `BuyVsRepairResult` + 5-yr `YearBuyRepairBreakdown[]` + `summaryText` | **High.** Note: `warrantyYears` is in `BuyVsRepairInput` and `BUY_VS_REPAIR_DEFAULTS` but is currently unused in `calculateBuyVsRepair` math (informational only). Keep signature intact for consistency. |
| 6 | **DIY vs. Hire** | `diyVsHire.ts` | `DIY_VS_HIRE_DEFAULTS`, `calculateDiyVsHire`, `validateDiyVsHireInput` | 8 inputs / 7 HTML inputs (`projectName` hardcoded in `diy-vs-hire.astro`) | `validateDiyVsHireInput(DiyVsHireInput)` — **NOT called in web UI** | `DiyVsHireResult` + `breakEvenHourlyRate` + `summaryText` | **High.** Very clean pure module. Add missing validator bounds (`diyToolsEquipmentCost < 0`, `diyReworkRiskPercent < 0 || > 100`, `homeownerCoordinationHours < 0`). |
| 7 | **Debt vs. Invest** | `debtVsInvest.ts` | `DEBT_VS_INVEST_DEFAULTS`, `calculateDebtVsInvest`, `validateDebtVsInvestInput` | 7 inputs / All 7 exposed in `debt-vs-invest.astro` | `validateDebtVsInvestInput(DebtVsInvestInput)` — **NOT called in web UI**; web uses `\|\| DEFAULT` (blocks `0%` APR & `$0` extra cash!) | `DebtVsInvestResult` + `YearDebtInvestBreakdown[]` + `summaryText` | **High.** Note: `DebtVsInvestResult` still retains `guaranteedInterestRate` alongside `fixedInterestRate` and `contractualInterestRate` (all equal `debtInterestRatePercent`). Keep for backward compatibility or deprecate safely; never expose "guaranteed" in investment UI copy. |
| 8 | **Buy vs. Subscribe** | `buyVsSubscribe.ts` | `BUY_VS_SUBSCRIBE_DEFAULTS`, `calculateBuyVsSubscribe`, `validateBuyVsSubscribeInput` | 11 inputs / 10 HTML inputs (`itemName` defaulted in `buy-vs-subscribe.astro`) | `validateBuyVsSubscribeInput(BuyVsSubscribeInput)` — **NOT called in web UI** | `BuyVsSubscribeResult` + `yearlyBreakdown[]` + `breakEvenMonths` + `summaryText` | **High.** Clean billing cycle toggle (`'monthly' \| 'annual'`), horizon-aware resale proration, and explicit null-safe `breakEvenMonths`. |
| 9 | **New vs. Used** | `newVsUsed.ts` | `NEW_VS_USED_DEFAULTS`, `calculateNewVsUsed`, `validateNewVsUsedInput` | 19 fields / 17 HTML inputs (`newOption.label` and `usedOption.label` defaulted) | `validateNewVsUsedInput(NewVsUsedInput)` — **NOT called in web UI** | `NewVsUsedResult` (`newMetrics`, `usedMetrics`, component deltas, `summaryText`) | **High.** Note: unlike `rentVsBuy`, `newVsUsed` returns all component totals (`totalInsurance`, `totalMaintenance`, `totalOperatingCost`, `totalInterestOverHorizon`, `estimatedDepreciation`) directly inside `OptionOwnershipMetrics`. |
| 10 | **Bulk Buy** | `bulkBuy.ts` | `BULK_BUY_DEFAULTS`, `calculateBulkBuy`, `validateBulkBuyInput` | 8 inputs / 7 HTML inputs (`itemName` defaulted in `bulk-buy.astro`) | `validateBulkBuyInput(BulkBuyInput)` — **NOT called in web UI** | `BulkBuyResult` + `breakEvenUnits` + `breakEvenWastePercent` + `summaryText` | **High.** Clean unit economics and waste-adjusted break-even math. |

### Cross-Cutting Extraction Findings & Refactoring Rules
1. **Locale Independence (`toLocaleString()`):**  
   *Verified Fact:* All 10 files call `.toLocaleString()` inside `summaryText` template strings.  
   *Risk:* Under UK (`en-GB`), Canadian (`en-CA`), Australian (`en-AU`), or European device locales, `toLocaleString()` can emit different grouping or decimal separators, causing golden-master `summaryText` snapshot tests to fail across environments and mixing `$` prefixes with non-US formatting.  
   *Recommendation:* Introduce a deterministic formatter utility in `packages/decision-core/src/formatters/` (e.g., `Intl.NumberFormat('en-US')` as default with optional currency/locale configuration) for `summaryText` and UI display, keeping US dollar defaults identical to current web output.
2. **Input Parsing & Falsy-Zero Coercion:**  
   *Verified Fact:* Eight web pages use `Number(val) || fallback` in DOM scripts, which turns `0` into the default constant.  
   *Recommendation:* Build a shared `parseNumericInput(raw: string | number, fallback: number)` helper in `packages/validation/` using `Number.isFinite()` checks rather than `||` falsy coercion so mobile inputs accurately handle `0%` APR, `$0` tax credit, or `$0` extra cash, while writing regression tests against exact calculator inputs.
3. **Unifying `GuideItem` Type Definitions:**  
   *Verified Fact:* `src/types.ts` defines a legacy `GuideItem` (`relatedGuides: string[]`) while `src/data/guides.ts` defines and exports the authoritative `GuideItem` (`shortTitle`, `topicTag`, `relatedGuideSlugs`, `summaryPoints`, `contentSections`, `faq`).  
   *Recommendation:* Consolidate to a single authoritative `GuideItem` type in `packages/shared-types`.
4. **Regression Testing Strategy for Calculation Consistency:**  
   - Before refactoring any formula file, generate **Golden Master Test Fixtures** by executing all 10 existing `calculate*` functions in `src/lib/decisions/*.ts` across: (a) `*_DEFAULTS`, (b) zero/boundary inputs (`0%` APR, `0` down payment, `horizonYears = 1` and max), (c) equal-cost tie cases (`'equal'`), and (d) asymmetric real-world scenarios.
   - Store these fixtures as JSON test vectors in `packages/decision-core/tests/fixtures/`.
   - Run Vitest against `packages/decision-core` in CI so both `apps/web` and `apps/mobile` import the verified package with 100% identical outputs.

---

## 4. Mobile Framework Comparison

Evaluating **Option A (Astro + Capacitor)** vs. **Option B (Dedicated Vite + React + TypeScript SPA + Capacitor)**:

| Evaluation Dimension | Option A: Astro + Capacitor (Separate Mobile Build Target) | Option B: Dedicated Vite + React + TypeScript + Capacitor |
|---|---|---|
| **Static Build Output & `webDir`** | Outputs 33+ separate HTML files (`dist/*/index.html`). Requires custom Astro config without `https://decision-tools.org` canonicals/AdSense/GA4 web tags, and multi-page asset resolution inside Capacitor's `capacitor://localhost` / `http://localhost` bridge can break relative/root paths. | Single-bundle Vite SPA (`dist/index.html` + hashed JS/CSS assets). Standard, first-class target for Capacitor `webDir: 'dist'` with zero HTML path-rewriting headaches. |
| **Navigation & Routing** | Multi-page HTML full-document reloads between tabs/screens cause noticeable WebView flashes on iOS/Android, reset JS state/timers, and lack native-style stack transitions, bottom tab bars, or swipe-back preservation. | Client-side SPA router (e.g., React Router / TanStack Router or lightweight state stack) gives instant 60fps transitions, persistent bottom tab bar (`Home`, `Tools`, `Compare`, `Saved`, `Guides`), preserved scroll/state, and hardware back-button handling on Android. |
| **Client-Side Interaction & State** | Current Astro calculators use imperative `document.getElementById()` vanilla JS scripts. Building reactive **Saved Decisions**, **Side-by-Side Scenario Comparison**, and **Decision History** in vanilla DOM scripts across 10 separate HTML pages would be brittle and heavily duplicated. | React 19 declarative state + shared custom hooks (`useDecisionCalculator`, `useSavedDecisions`, `useScenarioComparison`) allow a unified mobile calculator shell, live reactive tables/charts, and instant scenario swapping with minimal boilerplate. |
| **Native Plugin Integration (SQLite, AdMob, UMP, Share, Haptics)** | Capacitor JS plugins must be re-initialized on every full-page HTML navigation, breaking persistent listeners (e.g., AdMob banner lifecycle, keyboard events, Android `backButton` listener, SQLite connection pools). | Single long-lived JS runtime initializes Capacitor App lifecycle, SQLite DB connection, Google UMP consent flow, and AdMob SDK **once** at startup and keeps plugin state intact across all screens. |
| **Offline Behavior & Startup Performance** | Multi-page HTML loading adds repeated parse/layout overhead on every screen tap and complicates offline state synchronization between pages. | Vite produces an optimized local JS bundle loaded once from local device storage; instant offline startup and zero network dependency for all 10 calculators and 16 guides. |
| **Code Reuse & Maintainability** | Reuses `.astro` page shells only partially (since mobile needs a completely different layout without website headers/footers/SEO/AdSense), forcing conditional flags across Astro templates. | Clean separation of concerns: `apps/web` stays 100% focused on SEO/SSG/AdSense on Astro; `apps/mobile` stays 100% focused on native mobile UX on Vite + React; **100% of math, validation, types, and guide/decision data** is shared via `packages/*`. |
| **Platform-Specific UI & App Store Risk** | High risk of looking like a bundled website in a WebView, increasing **Apple App Store Guideline 4.2 (Minimum Functionality)** rejection risk. | Purpose-built mobile navigation, safe-area padding, bottom sheets, native share sheets, and reactive comparison workflows feel authentically like an app. |

### How Option B Fits the Confirmed Astro + Capacitor Strategy
- **Website remains on Astro:** `apps/web` keeps the exact Astro 7.3.3 SSG architecture, URLs, SEO metadata, Vercel deployment, GA4, and AdSense setup untouched.
- **Mobile runs on Capacitor:** `apps/mobile` compiles via Vite + TypeScript into static local assets bundled inside **Capacitor** for iOS (Xcode) and Android (Gradle).
- **Shared Core Across Both:** Both Astro (`apps/web`) and Capacitor (`apps/mobile`) import the exact same TypeScript business logic (`packages/decision-core`), validation (`packages/validation`), types (`packages/shared-types`), and content data (`packages/shared-data`). There is zero formula divergence.

**Audit Verdict:** **Strongly Recommend Option B (Dedicated Vite + React + TypeScript + Capacitor)** alongside the existing **Astro SSG Website**.

---

## 5. Recommended Target Architecture

```text
+======================================================================================+
|                           DECISION TOOLS SHARED PACKAGES                             |
|                                                                                      |
|  +-----------------------+  +-----------------------+  +--------------------------+  |
|  | packages/shared-types |  | packages/validation   |  | packages/shared-data     |  |
|  | - Input/Result types  |  | - Unified validators  |  | - DECISIONS (10 tools)   |  |
|  | - SavedScenario types |  | - Safe numeric parser |  | - GUIDES (16 articles)   |  |
|  | - Category/Guide types|  | - Bounds/constraints  |  | - Methodology metadata   |  |
|  +-----------+-----------+  +-----------+-----------+  +------------+-------------+  |
|              |                          |                           |                |
|              +--------------------------+---------------------------+                |
|                                         |                                            |
|                                         v                                            |
|                         +-------------------------------+                            |
|                         |    packages/decision-core     |                            |
|                         | - 10 pure TS calculators      |                            |
|                         | - Comparison & delta helpers  |                            |
|                         | - Locale-safe formatters      |                            |
|                         | - Vitest golden-master suite  |                            |
|                         +-------+---------------+-------+                            |
+=================================|===============|====================================+
                                  |               |
               +------------------+               +------------------+
               |                                                     |
               v                                                     v
+----------------------------------------+     +----------------------------------------+
|       apps/web (ASTRO 7.3.3 SSG)       |     |   apps/mobile (VITE + REACT + TS)      |
|----------------------------------------|     |----------------------------------------|
| - Preserves all 33 public SEO routes   |     | - Dedicated Mobile UI & Bottom Tabs    |
| - BaseLayout, DecisionLayout, .astro   |     | - Native-feel Input Controls & Charts  |
| - Google AdSense (ca-pub-1850854173...) |     | - Saved Decisions & Decision History   |
| - Google Analytics 4 (Web Tag)         |     | - Side-by-Side Scenario Comparison     |
| - Sitemap, JSON-LD, robots.txt, ads.txt|     | - Offline SQLite + Capacitor Prefs     |
|                                        |     | - Native Share Sheet                   |
|          Vercel Static Hosting         |     | - Google UMP Consent + AdMob Native SDK|
|       (https://decision-tools.org)     |     |                                        |
+----------------------------------------+     +--------------------+-------------------+
                                                                    |
                                                                    v
                                               +----------------------------------------+
                                               |       CAPACITOR NATIVE RUNTIME         |
                                               |   iOS (Xcode/Swift) | Android (Kotlin) |
                                               +----------------------------------------+
```

---

## 6. Proposed Monorepo Structure

### Target Directory Layout
```text
decision-tools/
|-- apps/
|   |-- web/                          # Existing Astro 7.3.3 SSG website
|   |   |-- astro.config.mjs
|   |   |-- package.json
|   |   |-- tsconfig.json
|   |   |-- public/                   # ads.txt, robots.txt, favicon.svg, assets/
|   |   `-- src/
|   |       |-- components/
|   |       |-- layouts/
|   |       |-- pages/
|   |       `-- styles/
|   |
|   `-- mobile/                       # New Vite + React + TypeScript + Capacitor app
|       |-- capacitor.config.ts
|       |-- package.json
|       |-- tsconfig.json
|       |-- vite.config.ts
|       |-- index.html
|       |-- ios/                      # Generated Capacitor iOS native project
|       |-- android/                  # Generated Capacitor Android native project
|       `-- src/
|           |-- App.tsx
|           |-- navigation/
|           |-- screens/
|           |-- components/
|           |-- storage/              # SQLite + Preferences repositories
|           |-- ads/                  # AdMob & Google UMP consent wrapper
|           `-- theme/                # Design tokens matching global.css
|
|-- packages/
|   |-- decision-core/                # Extracted calculation engines & comparison logic
|   |   |-- package.json
|   |   |-- tsconfig.json
|   |   |-- src/
|   |   |   |-- calculators/          # 10 calculator modules
|   |   |   |-- formulas/             # Shared amortization / TCO / break-even math
|   |   |   |-- comparison/           # Scenario diff & sensitivity helpers
|   |   |   |-- formatters/           # Explicit-locale formatting utilities
|   |   |   `-- index.ts
|   |   `-- tests/                    # Vitest unit, boundary, and golden-master fixtures
|   |
|   |-- shared-types/                 # Unified TS interfaces (inputs, results, guides, saved scenarios)
|   |-- shared-data/                  # DECISIONS (10), CATEGORIES (5), GUIDES (16), methodology data
|   `-- validation/                   # Pure input validation & safe numeric parsing
|
|-- docs/
|   |-- architecture/
|   |-- audits/
|   `-- mobile/
|
|-- package.json                      # Root npm workspaces config & orchestrator scripts
`-- tsconfig.base.json                # Shared strict TypeScript base config
```

### Tooling & Workspace Evaluation
1. **Are `npm workspaces` sufficient?**  
   **Technical Recommendation:** **Yes.** With 2 apps (`apps/web`, `apps/mobile`) and 4 lightweight pure-TypeScript internal packages (`packages/*`), native `npm workspaces` (built into npm 7+) are completely sufficient without introducing Turborepo, Nx, Rush, or Lerna. Packages can export TypeScript entry points or lightweight `tsc --build` outputs directly consumed by Astro/Vite.
   - *Assumption requiring verification:* The existing repo contains a `bun.lock` file (`package.json` uses npm scripts). Verify whether Vercel production deploys use `npm` or `bun` before finalizing lockfile conventions.
2. **Independent Builds, Tests, and Deployments:**  
   - Root `package.json` can expose `build:web` (`npm --workspace=apps/web run build`), `build:mobile` (`npm --workspace=apps/mobile run build`), `test:core` (`npm --workspace=packages/decision-core run test`), and `lint`.
   - Vercel configures Root Directory or Build Command (`npm run build --workspace=apps/web` and Output Directory `apps/web/dist`), isolating website releases from mobile Xcode/Gradle builds.
   - Clean up unused starter artifacts (`index.html`, `vite.config.ts`, `src/App.tsx`, `src/main.tsx`, `express`, `@google/genai`) during the `apps/web` migration so `apps/web/package.json` only carries actual Astro dependencies while `apps/mobile/package.json` carries React/Vite/Capacitor dependencies.

### Proposed Safe Migration Sequence (To Execute in Phases 2–3, Not Phase 1)
1. Establish Golden Master test fixtures from current `src/lib/decisions/*.ts` **before** moving a single file.
2. Create `packages/shared-types`, `packages/validation`, `packages/decision-core`, and `packages/shared-data` while temporarily keeping re-exports in `src/lib/decisions/` and `src/data/` so the Astro site builds identically at every step.
3. Move Astro website into `apps/web`, update imports to `@decision-tools/*` workspace packages, verify all 33 routes build with identical HTML output, and verify Vercel build configuration.
4. Scaffold `apps/mobile` (Vite + React + TS + Capacitor) consuming `@decision-tools/*`.

---

## 7. Migration Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Calculation drift during extraction** (rounding, falsy-zero bugs, `.toLocaleString()` locale differences) | Medium | High | Snapshot golden-master outputs from existing `src/lib/decisions/*.ts` before refactoring; run automated Vitest parity tests across all 10 calculators; use explicit `en-US` formatting defaults where `$` is displayed. |
| **Breaking Vercel production builds during monorepo move** | Medium | High | Do not move `src/` to `apps/web` until `packages/*` are verified via re-exports; update Vercel Root Directory/Build Command atomically and test preview deployment before merging to production branch. |
| **Web UI vs. Core Divergence** (8/10 Astro calculators currently skip `validate*` and don't update `ComparisonTable` / `CostBreakdown`) | High | Medium | Document explicitly as separate web maintenance vs. mobile reactive UI; keep all existing formulas untouched in `decision-core` while ensuring mobile UI binds reactively to every metric and table row. |
| **Unused starter dependencies (`express`, `@google/genai`) causing mobile bundle bloat or App Store binary flags** | Medium | Medium | Isolate `apps/mobile/package.json` cleanly from `apps/web/package.json`; never bundle server/AI SDKs into `apps/mobile`. |
| **Type mismatch (`src/types.ts` vs. `src/data/guides.ts` `GuideItem`)** | Low | Low | Reconcile into a single canonical `GuideItem` interface in `packages/shared-types`. |

---

## 8. Mobile Feature Feasibility Matrix

| Feature | Feasibility | Storage & Architecture Needed | Implementation Notes & Trade-offs |
|---|---|---|---|
| **Dedicated Mobile Homepage** | High | Reads `DECISIONS` & `CATEGORIES` from `packages/shared-data` + recent records from local SQLite | Features quick launch to all 10 tools, recent Saved Decisions card, category filter pills, and neutral "We don't tell you what to choose" positioning. |
| **All 10 Calculators (Mobile-Optimized UI)** | High | React forms + `@decision-tools/decision-core` + `@decision-tools/validation` | Group inputs into collapsible/stepped Option A vs. Option B cards, numeric decimal keypads (`inputMode="decimal"`), instant validation feedback, and live summary + breakdown cards. |
| **Results & Comparison Charts** | High | Lightweight native SVG/React chart components (bar / cumulative line crossover) | Visualize Rent vs. Buy equity curves, Debt vs. Invest net worth trajectories, and Buy vs. Subscribe break-even crossovers without heavy charting libraries (no massive bundle bloat). |
| **Detailed Decision Analysis** | High | Reads `GUIDES` (16 guides) and calculator methodology/limitations from `packages/shared-data` | Render structured sections, tables, callouts, and FAQs natively in-app using clean mobile typography and collapsible accordions. |
| **1. Saved Decisions** (Save, Edit, Delete) | High | SQLite (`saved_decisions` table: `id`, `calculator_slug`, `title`, `inputs_json`, `results_snapshot_json`, `notes`, `created_at`, `updated_at`) | Users name a scenario (e.g., *"7-Yr Austin Condo vs Rent"*), save inputs + computed snapshot, reopen directly into the calculator for editing, or delete locally. |
| **2. Scenario Comparison** (Side-by-Side) | High | SQLite query by `calculator_slug` + `compareScenarios()` helper in `packages/decision-core` | Users select 2–3 saved scenarios for the **same calculator** (e.g., Offer A vs. Offer B under 3% vs. 5% bonus, or 15-yr vs. 30-yr mortgage) and view highlighted numerical deltas and key trade-offs side by side. |
| **3. Decision History** | High | SQLite (`decision_history` or `is_pinned` / timestamped log) | Automatically or manually logs calculated runs (capped e.g. at last 100 runs to stay tidy), searchable/filterable by category, allowing one-tap reload and edit. |
| **4. Share Results** (Privacy-Safe) | High | `@capacitor/share` native OS share sheet + deterministic text/summary formatter | **Privacy-by-design:** Default share payload exports only the high-level comparison summary and decision conclusion (e.g., *"Rent vs. Buy over 7 years: Estimated net difference of $X"*), explicitly omitting raw sensitive inputs (exact salary, debt balance, home price) unless the user toggles *"Include full assumptions"* with a clear preview. |
| **5. Offline Access** | High | Bundled Vite SPA assets + SQLite + `packages/decision-core` + `packages/shared-data` | 100% of calculations, all 16 guides, Saved Decisions, Scenario Comparisons, and Decision History work in Airplane Mode with zero network calls. Only AdMob ad loading degrades gracefully when offline. |

### Local Storage Architecture Recommendation: Capacitor Preferences vs. SQLite
| Criteria | `@capacitor/preferences` | `@capacitor-community/sqlite` |
|---|---|---|
| **Best Use Case** | Small key-value settings (theme mode, onboarding/tips seen, consent state, default currency symbol) | Structured collections (`saved_decisions`, `decision_history`, indexed queries by `calculator_slug`, `updated_at`, schema migrations) |
| **Querying & Filtering** | Must read/parse entire JSON blob into memory; fragile as saved scenarios grow | Native SQL queries (`WHERE calculator_slug = ? ORDER BY updated_at DESC`), transactional writes, easy schema versioning |
| **Data Loss / Size Limits** | Backed by `UserDefaults` (iOS) / `SharedPreferences` (Android); not intended for larger structured datasets | Reliable SQLite file storage on iOS/Android; standard mobile persistence |

**Technical Recommendation:** Use **both for what they do best**:
- **`@capacitor/preferences`**: App settings (light/dark/system theme, last selected currency/region display preference, privacy consent UI state).
- **`@capacitor-community/sqlite`**: All Saved Decisions, Scenario Comparisons, and Decision History, wrapped behind a clean `DecisionStorageRepository` TypeScript interface (with a `localStorage`/IndexedDB fallback for browser-based Vite dev previews during development).
- **No User Accounts / Cloud Sync:** Confirmed unnecessary for v1; keeps user financial inputs 100% private on-device and avoids backend auth/database liability.

---

## 9. Advertising Architecture

### Strict Platform Separation
| Platform | Ad Network | Implementation | Configuration / Identifiers |
|---|---|---|---|
| **Website (`apps/web`)** | **Google AdSense** | Existing `<script src="...adsbygoogle.js?client=ca-pub-1850854173653124">` in `BaseLayout.astro` + `public/ads.txt` | Preserved untouched. Never loaded inside `apps/mobile`. |
| **Mobile (`apps/mobile`)** | **Google AdMob (Native Mobile Ads SDK)** | Native iOS (`Google-Mobile-Ads-SDK` Swift/CocoaPods/SPM) & Android (`com.google.android.gms:play-services-ads`) via Capacitor bridge | Separate iOS AdMob App ID + Android AdMob App ID in `Info.plist` / `AndroidManifest.xml`. |

### Capacitor AdMob Integration Evaluation
- **Fact Check:** Google does **not** publish an official Capacitor plugin for AdMob; Google provides native iOS/Android Mobile Ads SDKs.
- **Third-Party Plugin Assessment (`@capacitor-community/admob`):** Actively maintained community plugin wrapping Google Mobile Ads SDK for iOS & Android and supporting banner, interstitial, rewarded ads, and Google UMP (`requestConsentInfo` / `showConsentForm`).
  - *Assumption requiring verification:* Verify exact version compatibility of `@capacitor-community/admob` against Capacitor v6/v7 and latest iOS/Android Google Mobile Ads SDK + UMP versions at Phase 8 start. If banner/native styling or UMP behavior lags behind Google SDK requirements, a small custom Swift/Kotlin Capacitor plugin (~150 lines per platform) can wrap the official Google Mobile Ads SDK directly with zero third-party lag.
- **Ad Formats & Placement Safety Rules:**
  - **Recommended Formats:** Non-intrusive **Adaptive Banner Ads** anchored safely at the bottom of browse/guide/results-summary views (above safe-area inset and outside interactive input fields) or **Native Ads** clearly badged `"Ad"` in the Guide/Directory feeds.
  - **Prohibited Placements (Safety Requirements):**
    - **NEVER** load `pagead2.googlesyndication.com` / AdSense scripts inside `apps/mobile`.
    - **NEVER** render interstitial ads mid-calculation, on calculator submit, or on tab switches during an active decision session.
    - **NEVER** place banners directly adjacent to primary "Calculate", "Save Scenario", or numeric input controls where fat-finger taps could occur.
    - **NEVER** style Native Ads to resemble a calculator output card, "Recommended Option", or analytical warning callout.
  - **Dev vs. Prod Separation:** Enforce build-time environment separation (`VITE_ADMOB_ENV=development|production`). Development and QA builds **must** strictly use Google's official test App IDs and test Ad Unit IDs (plus `isTesting: true` / `testDeviceIdentifiers`) and enforce a compile/CI guard preventing production Ad Unit IDs in debug builds.

---

## 10. Privacy and Regulatory Requirements

### Regulatory Landscape (Target Markets: US, UK, Canada, Australia, EU/EEA)
1. **GDPR & UK GDPR / ePrivacy (UK & European Markets):**
   - Even when financial inputs never leave the device, integrating the **Google Mobile Ads SDK (AdMob)** triggers device identifier access (`IDFA` on iOS, Advertising ID / `AAID` on Android), IP address transmission, and ad-delivery telemetry.
   - Under GDPR/UK GDPR, **User Messaging Platform (UMP) SDK** consent must be requested *before* initializing personalized/non-personalized AdMob requests in the EEA and UK, and a **Privacy Options** button ("Manage Ad Consent") must remain accessible in the mobile app's Settings/Privacy screen so users can revoke or change consent anytime.
2. **Apple App Tracking Transparency (ATT) & iOS App Privacy:**
   - If using personalized ads or accessing `IDFA`, iOS requires `NSUserTrackingUsageDescription` in `Info.plist` and presenting Apple's native ATT prompt (typically coordinated via UMP / IDFA consent flow). If choosing strictly non-personalized / contextual ads without `IDFA` tracking, document carefully in App Store Connect Privacy Nutrition Labels.
   - **App Privacy Disclosures:** Accurately declare **Advertising Data / Device ID / Diagnostics** collected by Google AdMob SDK (and any mobile analytics if enabled), while explicitly clarifying that user-entered financial calculator figures and saved scenarios are **Not Collected** (stored locally on device only).
3. **US State Privacy Laws (CCPA/CPRA, Virginia VCDPA, Colorado CPA, etc.):**
   - Provide US state consent/opt-out support via Google UMP ("Do Not Sell or Share My Personal Information" / Limited Data Processing where applicable) and an accessible in-app Privacy Policy link.
4. **Google Play Data Safety & Advertising ID Declaration:**
   - Declare Android `com.google.android.gms.permission.AD_ID` permission, disclose AdMob SDK third-party data collection (device IDs, approximate location from IP, ad interactions), and state that financial inputs remain local to the device.
5. **Canada (PIPEDA) & Australia (Privacy Act):**
   - Clear plain-English disclosure of local storage vs. third-party advertising SDKs, plus opt-out/consent controls.

### Privacy-by-Design Architecture Recommendations
- **Zero Account Requirement:** Users access all 10 calculators, 16 guides, Saved Decisions, Scenario Comparisons, and Offline History with zero registration.
- **Zero Financial Input Telemetry:** Never send calculator input values, saved scenario titles, notes, or result figures to GA4, Firebase, AdMob custom targeting, or any external API. If mobile usage analytics are added later, restrict parameters strictly to non-sensitive slug names (`calculator_slug`) and provide an analytics toggle—or omit GA4 entirely on mobile if AdMob diagnostics suffice.
- **Do Not Overclaim:** Never state *"no data is collected anywhere"* when AdMob SDK is present; state accurately: *"Your financial inputs and saved scenarios stay strictly on your device; third-party advertising partners (Google AdMob) process device/ad identifiers subject to your consent preferences."*

---

## 11. App Store Readiness Assessment

### Apple App Store Requirements & Guideline 4.2 Risk Assessment
- **Technical Readiness Requirements:**
  - Modern Xcode + iOS deployment target (confirm Capacitor's minimum supported iOS version, typically iOS 14+/15+ depending on Capacitor 6/7).
  - Unique Bundle Identifier (e.g., `org.decisiontools.app`), App Icons (1024×1024 + asset catalog), Launch Screen storyboard matching brand slate/surface colors (`#f8fafc` / `#0f172a`) with zero flicker, `PrivacyInfo.xcprivacy` (Apple Privacy Manifest required for SDKs/UserDefaults APIs), and `SKAdNetworkItems` in `Info.plist` for AdMob.
- **Apple Guideline 4.2 (Minimum Functionality — Critical Risk Area):**
  - Apple routinely rejects Capacitor/WebView apps that feel like a *"repackaged website"* or a thin wrapper around `https://decision-tools.org/`.
  - **How Decision Tools Mitigates Guideline 4.2:**
    1. **Dedicated Native-Style Mobile UI:** Bottom tab bar navigation, safe-area layout, mobile input steppers/sliders, touch-friendly comparison cards, and visual SVG charts—distinct from the desktop web layout.
    2. **Offline-First Utility:** Every calculator and guide operates seamlessly in Airplane Mode with zero remote web loading.
    3. **App-Only Features:** **Saved Decisions** (SQLite persistence), **Side-by-Side Scenario Comparison** (comparing 2–3 saved runs visually), **Decision History**, and **Native Share Sheet** provide genuine device-native utility that the static website does not offer.
    4. **No External Web Chrome:** Zero website footer links (`ads.txt`, sitemap), zero external browser redirects for core flows, and clean in-app legal/privacy/methodology views.

### Google Play Store Requirements
- **Technical Readiness Requirements:**
  - Android App Bundle (`.aab`) signed with Play App Signing, unique Application ID (e.g., `org.decisiontools.app`), target API level meeting current Google Play mandate (API 34/35+), adaptive icons, splash screen API, and `AD_ID` permission declaration.
  - **Closed Testing Requirement:** New personal Google Play developer accounts require closed testing (12+ testers opted in continuously for 14 days—verify account type: Organization vs. Personal!).
  - **WebView & Deceptive Ads Policy:** Ensure local bundled assets (`capacitor://` / `https://localhost` internal scheme—never loading live remote `https://decision-tools.org` in a WebView, which would violate AdSense-in-WebView and minimum-functionality rules).

---

## 12. Mobile UI/UX Recommendations

### Brand Continuity & Design System
Preserve Decision Tools' restrained, trustworthy editorial identity from `src/styles/global.css`:
- **Light Mode (Default):** Background `#f8fafc`, Surface `#ffffff`, Subtle Surface `#f1f5f9`, Primary Slate `#0f172a`, Trust Blue Accent `#2563eb`, Option A Blue (`#1d4ed8` / `#eff6ff`), Option B Green (`#15803d` / `#f0fdf4`).
- **Dark Mode Support:** Add semantic dark-mode palette tokens (`#0f172a` background, `#1e293b` elevated card surface, high-contrast Option A `#60a5fa` & Option B `#4ade80` accents) respecting iOS/Android system appearance + manual override in Settings.
- **Avoid:** Trading-terminal tickers, celebratory confetti/gamification, "Winner!" badges, forced onboarding carousels, or cluttered financial dashboards.

### Mobile Ergonomics & Platform Behavior
- **Safe Areas & Portrait Orientation:** Lock primary mobile phone layout to Portrait (allowing adaptive tablet split-view on iPad/Android tablets if enabled) with `env(safe-area-inset-top/bottom)` respected on headers, tab bars, and bottom AdMob banner containers.
- **Keyboards & Numeric Inputs:** Use `inputMode="decimal"` / `inputMode="numeric"` with clear inline unit prefixes/suffixes (`$`, `%`, `yrs`, `mi`, `kWh`), explicit *"Done"* toolbar/dismiss behavior on iOS numeric pads, and inline validation messages directly beneath invalid inputs.
- **Sticky Result Preview Pill/Bar:** On long input forms (e.g., `Gas vs. EV` with 16 inputs or `Job Offer` with 21 inputs), render a compact collapsible live summary bar or sticky *"View Results"* action so users don't lose context scrolling down long forms.
- **Charts & Tables on 360px–430px Screens:**
  - Replace wide multi-column desktop HTML tables (`min-width: 540px` in `ComparisonTable.astro`) with stacked 2-column Option A vs. Option B comparison cards and compact delta badges (`+$X` / `-$X`), plus responsive SVG line/bar charts (cumulative cost crossover, equity growth, debt payoff curve).
- **Accessible Typography:** Minimum `16px` body/input font size (prevents iOS WebView auto-zoom on input focus!), Dynamic Type / font-scaling compatibility, and `44×44pt` minimum touch targets.

### Proposed Screen Map & Navigation Structure

```text
Bottom Tab Bar (5 Core Destinations)
|-- [1. Home]
|   |-- Continue Recent / Saved Decisions strip
|   |-- Quick-launch 5 Featured Calculators + Category Pills
|   `-- Neutral Principle & Offline Status indicator
|
|-- [2. Calculators] (Directory + 10 Native-Feel Tool Flows)
|   |-- Category Filter (Housing, Career, Transportation, Finance, Lifestyle)
|   `-- Calculator Screen (Segmented Tab: [Inputs] | [Results & Charts] | [Analysis & Limits])
|       |-- Actions: [Save Scenario], [Share Summary], [Reset Defaults]
|
|-- [3. Compare] (App-Exclusive Feature)
|   |-- Select Calculator -> Pick 2–3 Saved Scenarios
|   `-- Side-by-Side Matrix + Delta Highlights + Trade-Off Breakdown
|
|-- [4. Saved] (Decision History & Saved Library)
|   |-- Saved Scenarios (Pinned/Named) & Recent History tabs
|   `-- Tap to Reopen in Calculator | Duplicate | Compare | Delete
|
`-- [5. Guides & Info]
    |-- 16 Decision Guides (Category Filter + Native Reader View + Tables + FAQs)
    |-- Methodology & Assumptions Reference (Adapted from /about)
    `-- Settings & Privacy (Dark Mode, Currency Format, Privacy Policy, Terms, Manage Ad Consent)
```

---

## 13. Testing Strategy

| Layer | Scope & Tooling | Measurable Acceptance Criteria |
|---|---|---|
| **1. Shared Calculation Engine (`packages/decision-core`, `packages/validation`)** | **Vitest** unit, boundary, parity, and locale tests | - 100% pass on Golden Master fixtures matching pre-extraction `src/lib/decisions/*.ts` outputs across all 10 calculators.<br>- Boundary tests pass for `0` inputs (`0%` APR, `$0` tax, `$0` extra cash), max bounds, equal-tie cases, and invalid inputs.<br>- Determinism verified under `en-US`, `en-GB`, `en-CA`, `en-AU`, and `de-DE` ICU locales. |
| **2. Website (`apps/web`)** | `astro build`, `tsc --noEmit`, sitemap/canonical/JSON-LD audit script | - Builds all 33 static pages cleanly with zero TypeScript errors.<br>- Zero changes to public URLs, `sitemap-0.xml` (33 URLs), `robots.txt`, `ads.txt`, AdSense tag, GA4 events, or SEO metadata.<br>- Numeric outputs for default inputs match `decision-core` fixtures 100%. |
| **3. Mobile App Functional & Offline QA (`apps/mobile`)** | Vitest + React Testing Library (components/hooks) + iOS Simulator, Android Emulator, Physical iOS & Android Devices | - All 10 calculators load defaults, validate inputs, compute identical results to website, and render charts/cards cleanly on 360px (SE/Android compact) to 430px+ screens.<br>- **Offline Test:** Enable Airplane Mode, cold-start app, run all 10 calculators, read all 16 guides, create/edit/delete SQLite Saved Decisions, and compare 2 saved scenarios with zero errors.<br>- **Lifecycle Test:** Background/kill/relaunch app preserves SQLite data and Preferences state. |
| **4. Ads, Consent & Store Compliance QA** | Physical iOS & Android devices (EEA/UK VPN/UMP debug geography + US region) | - Google Test Ad Units render cleanly in designated banner slots without obscuring inputs/results.<br>- Zero AdSense (`adsbygoogle.js`) scripts present in built `apps/mobile/dist`.<br>- UMP consent prompt appears on simulated EEA/UK launch; "Manage Ad Consent" button in Settings re-opens UMP form.<br>- Native Share sheet exports privacy-safe summary without raw financial inputs unless explicitly enabled. |

---

## 14. Recommended Development Roadmap

The proposed 10-phase sequence is technically sound; below are refined entry/exit gates informed by this audit:

1. **Phase 1: Existing Codebase & Architecture Audit** *(Completed with this document — Read-Only).*
2. **Phase 2: Shared Calculation Engine Extraction & Golden-Master Test Suite**  
   - Record golden-master outputs from existing `src/lib/decisions/*.ts`; extract `packages/shared-types`, `packages/validation`, `packages/decision-core`, and `packages/shared-data`; implement locale-safe formatters; resolve `GuideItem` type divergence; keep re-exports in `src/` temporarily to prove zero web regression.
3. **Phase 3: Monorepo Migration & Mobile Foundation**  
   - Configure npm workspaces (`apps/web`, `apps/mobile`, `packages/*`); move Astro site into `apps/web` cleanly (removing unused Express/Gemini starter boilerplate from `apps/web`); verify Vercel build; scaffold `apps/mobile` (Vite + React 19 + TypeScript + Capacitor iOS/Android projects).
4. **Phase 4: Mobile Design System, Navigation & Core Screens**  
   - Implement light/dark theme tokens, safe-area shell, 5-tab navigation, dedicated mobile Homepage, Guide Reader (16 guides), and Methodology/Settings screens.
5. **Phase 5: Calculator Migration & Visualization**  
   - Build mobile-native reactive UI wrappers (`Inputs`, `Results & Charts`, `Analysis & Limits`) for all 10 calculators powered by `@decision-tools/decision-core` and `@decision-tools/validation` (properly handling `0` inputs and live table/chart updates).
6. **Phase 6: Local Persistence & Offline Functionality (SQLite + Preferences)**  
   - Implement `DecisionStorageRepository` using `@capacitor-community/sqlite` + `@capacitor/preferences`; wire offline verification across all routes and guides. *(Moved ahead of Scenario Comparison so Saved Decisions/History storage exists before building comparison UI on top of it.)*
7. **Phase 7: Saved Decisions, Scenario Comparison, History & Privacy-Safe Sharing**  
   - Implement Save/Edit/Delete workflows, Side-by-Side Scenario Comparison (2–3 saved runs per calculator), searchable Decision History, and native Share sheet (`@capacitor/share`).
8. **Phase 8: AdMob Native SDK & Privacy/Consent (UMP/ATT) Integration**  
   - Integrate native Google Mobile Ads SDK + Google UMP SDK (EEA/UK GDPR + US state privacy), configure separate test/prod Ad Unit IDs, implement Settings consent revocation trigger, and update Mobile Privacy Policy / App Store disclosures.
9. **Phase 9: Comprehensive QA & Physical Device Testing**  
   - Execute simulator, emulator, and physical iOS/Android device testing across screen sizes, dark mode, Airplane Mode, consent geographies, and AdMob test units.
10. **Phase 10: App Store & Google Play Submission**  
    - Generate signed `.aab` and Xcode Archive, complete App Privacy Nutrition Labels / Google Play Data Safety / `PrivacyInfo.xcprivacy`, run Google Play closed testing if required by account type, and submit for review.

---

## 15. Unresolved Technical Questions & Owner Decisions Needed

Before starting Phase 2/3, confirm the following items:

1. **Bundle / Package Identifier:** Confirm canonical reverse-domain ID for iOS & Android (recommended: `org.decisiontools.app`).
2. **Apple & Google Developer Accounts:** Confirm whether Apple Developer Program and Google Play Console accounts are registered as **Organization** or **Individual** (affects Apple DUNS verification and Google Play's 14-day/12-tester closed testing mandate).
3. **Lockfile & Package Manager Standardization:** Repository currently contains `bun.lock` while scripts run `npm`/`npx`. Confirm whether Vercel and CI should standardize on `npm` workspaces (`package-lock.json`) or `bun` workspaces.
4. **Mobile Analytics Policy:** Decide whether `apps/mobile` should exclude GA4/Firebase Analytics entirely (maximizing privacy simplicity and minimizing App Privacy disclosures to AdMob-only) or include anonymized event tracking with consent gating.
5. **iOS ATT / Personalized Ads Strategy:** Decide whether to prompt iOS users with Apple ATT (`IDFA`) via UMP for personalized AdMob ads, or serve non-personalized / contextual AdMob ads without requesting `IDFA` tracking (simpler privacy nutrition label and higher UX cleanliness).
6. **Multi-Currency Display Scope:** Target markets include US, UK, Canada, and Australia. Decide whether v1 mobile displays USD (`$`) defaults matching `decision-tools.org` or adds a currency symbol selector (`$`, `£`, `A$`, `C$`) in Settings (formatting only, keeping numerical defaults transparent).
7. **Fixing Existing Web UI Gaps (Optional Separate Web Task):** Should the 8 website calculators that currently skip `validate*` and leave `ComparisonTable`/`CostBreakdown` static on input change be patched on `apps/web` during/after Phase 2, or kept untouched for now?

---

## 16. Final Architecture Decision

| Decision Area | Final Selection | Verification Basis |
|---|---|---|
| **Website Runtime** | Keep **Astro 7.3.3 SSG** (`apps/web`) on Vercel | Preserves all 33 verified routes, SEO metadata, sitemap, AdSense, and GA4 with zero disruption. |
| **Mobile App Architecture** | **Option B: Dedicated Vite + React 19 + TypeScript SPA + Capacitor** (`apps/mobile`) | Eliminates multi-page WebView navigation flaws, unlocks stateful Scenario Comparison & SQLite persistence, and mitigates Apple Guideline 4.2 rejection risk while retaining Capacitor. |
| **Shared Logic Strategy** | **npm workspaces** with `packages/decision-core`, `packages/validation`, `packages/shared-types`, `packages/shared-data` | All 10 files in `src/lib/decisions/*.ts` are verified 100% pure TypeScript with zero browser/framework dependencies. |
| **Local Persistence** | **`@capacitor-community/sqlite`** (Saved Decisions, Comparisons, History) + **`@capacitor/preferences`** (Settings/Flags) | Supports relational querying and full offline functionality without cloud backend or user account liability. |
| **Advertising & Consent** | Keep **AdSense** on `apps/web`; use **Google Mobile Ads SDK (AdMob)** + **Google UMP SDK** on `apps/mobile` | Strictly isolates web and native ad ecosystems and satisfies GDPR/UK/US consent requirements. |
