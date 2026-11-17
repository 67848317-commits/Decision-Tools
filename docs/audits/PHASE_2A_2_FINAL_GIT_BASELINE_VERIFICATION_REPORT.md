# Decision Tools — Phase 2A.2: Final Git Baseline Verification Report

**Document Status:** **PHASE 2 HOLD MAINTAINED (Blocked in Runtime Container — `.git` History Unavailable)**  
**Production Website:** `https://decision-tools.org/`  
**Target Pre-Phase-2 Commit:** `01afd59c4ece8db2a9e13c213d3916bc150feedb`  
**Target Phase 2 Commit:** `16608e357120179f37e77a75c622f282121158db`  
**Phase 3 Boundary:** Strictly respected — zero `apps/mobile`, Capacitor, mobile UI, AdMob, UMP, or SQLite changes introduced.

---

## 1. Commit References & Git Repository State

- **Pre-Phase-2 Commit Reference:** `01afd59c4ece8db2a9e13c213d3916bc150feedb`
- **Phase 2 Extraction Commit Reference:** `16608e357120179f37e77a75c622f282121158db`
- **Verified Container State (`/app/applet`):**
  - `git status` returns: `fatal: not a git repository (or any of the parent directories): .git`
  - Directory inspection of `/app/applet` and `/app` confirms there is no `.git` directory, no configured Git remote, and no Git bundle/mirror available in the AI Studio runtime container.
  - Because Section 1 strictly forbids fabricating or reconstructing historical source files from memory, commits `01afd59c4ece8db2a9e13c213d3916bc150feedb` and `16608e357120179f37e77a75c622f282121158db` could **not** be verified inside `/app/applet`, and the temporary worktree `/tmp/dt-pre-phase2` could **not** be created in this environment.

---

## 2. Git Worktree Verification Evidence

- **Worktree Creation Attempted / Checked:**
  - `git status` failed with `fatal: not a git repository (or any of the parent directories): .git`.
  - `/tmp` contains no pre-existing `dt-pre-phase2` directory.
- **Result:** **BLOCKED IN CONTAINER.** Execution of `git worktree add /tmp/dt-pre-phase2 01afd59c4ece8db2a9e13c213d3916bc150feedb` requires running in a full Git clone containing both commit objects (`01afd59c4ece8db2a9e13c213d3916bc150feedb` and `16608e357120179f37e77a75c622f282121158db`).
- **Corrected Worktree + Verification Command (Ready to Run in Full Git Clone):** See Section 4 below for the corrected procedure replacing the Phase 2A.1 Section 2 snippet.

---

## 3. Verified Runtime Locale

- Command executed in `/app/applet`:
  `bun -e 'console.log("locale:", new Intl.NumberFormat().resolvedOptions().locale)'`
- **Verified Output:** `locale: en-US`
- **Locale Determinism Rule for External Run:** When running the baseline comparison in another environment, enforce `LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8` and assert `new Intl.NumberFormat().resolvedOptions().locale === 'en-US'` before treating `summaryText` comparisons as locale-deterministic. If the host environment does not resolve to `en-US`, numeric/structural parity must be reported separately from locale-dependent `summaryText` mismatches rather than silently passing.

---

## 4. Corrected Comparison Algorithm & Precision Rules

The previous `JSON.stringify` check from Phase 2A.1 had two weaknesses: (1) it did not enforce/verify `en-US` locale determinism for original `.toLocaleString()` outputs, and (2) it depended on object property insertion order and strict float serialization.

Below is the **corrected, non-destructive verification script** ready for execution from the root of a full Git clone containing commits `01afd59c4ece8db2a9e13c213d3916bc150feedb` and `16608e357120179f37e77a75c622f282121158db`:

```bash
set -euo pipefail

ORIG_COMMIT="01afd59c4ece8db2a9e13c213d3916bc150feedb"
PHASE2_COMMIT="16608e357120179f37e77a75c622f282121158db"
WORKTREE_DIR="/tmp/dt-pre-phase2"

cleanup() {
  if [ -d "$WORKTREE_DIR" ]; then
    git worktree remove --force "$WORKTREE_DIR" || true
  fi
}
trap cleanup EXIT

# 1. Verify both commit references exist in Git history
git cat-file -e "${ORIG_COMMIT}^{commit}"
git cat-file -e "${PHASE2_COMMIT}^{commit}"

# 2. Create temporary pre-Phase-2 worktree
git worktree add "$WORKTREE_DIR" "$ORIG_COMMIT"

# 3. Verify all 10 original engine files exist
for f in rentVsBuy jobOffer leaseVsBuy gasVsEv buyVsRepair diyVsHire debtVsInvest buyVsSubscribe newVsUsed bulkBuy; do
  test -f "$WORKTREE_DIR/src/lib/decisions/${f}.ts"
done

# 4. Run Check A (Original vs Fixture) & Check B (Original vs Extracted) under verified en-US locale
LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 bun -e '
import fs from "node:fs";
import path from "node:path";

const runtimeLocale = new Intl.NumberFormat().resolvedOptions().locale;
console.log("Verified runtime locale:", runtimeLocale);
const isEnUs = runtimeLocale === "en-US";
if (!isEnUs) {
  console.warn("WARNING: Runtime locale is not en-US; summaryText mismatches will be flagged separately.");
}

type Category = "numeric" | "structural" | "summary_text";
type Mismatch = {
  comparison: "A_orig_vs_fixture" | "B_orig_vs_extracted";
  calculator: string;
  scenarioId: string;
  fieldPath: string;
  expected: unknown;
  actual: unknown;
  mismatchCategory: Category;
};

const TOLERANCE = 5e-7; // Matches Vitest toBeCloseTo(expected, 6)

function classifyLeaf(fieldPath: string, expected: unknown): Category {
  if (fieldPath === "result.summaryText" || fieldPath.endsWith(".summaryText")) {
    return "summary_text";
  }
  return typeof expected === "number" ? "numeric" : "structural";
}

function compareValues(
  comparison: Mismatch["comparison"],
  calculator: string,
  scenarioId: string,
  actual: unknown,
  expected: unknown,
  fieldPath: string,
  out: Mismatch[],
) {
  if (expected === null || typeof expected !== "object") {
    if (typeof expected === "number") {
      if (typeof actual !== "number" || !Number.isFinite(actual)) {
        out.push({ comparison, calculator, scenarioId, fieldPath, expected, actual, mismatchCategory: "structural" });
        return;
      }
      if (Number.isInteger(expected)) {
        if (!Object.is(actual, expected)) {
          out.push({ comparison, calculator, scenarioId, fieldPath, expected, actual, mismatchCategory: "numeric" });
        }
      } else if (Math.abs(actual - expected) >= TOLERANCE) {
        out.push({ comparison, calculator, scenarioId, fieldPath, expected, actual, mismatchCategory: "numeric" });
      }
      return;
    }

    if (!Object.is(actual, expected)) {
      out.push({
        comparison,
        calculator,
        scenarioId,
        fieldPath,
        expected,
        actual,
        mismatchCategory: classifyLeaf(fieldPath, expected),
      });
    }
    return;
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      out.push({ comparison, calculator, scenarioId, fieldPath, expected: "array", actual: typeof actual, mismatchCategory: "structural" });
      return;
    }
    if (actual.length !== expected.length) {
      out.push({
        comparison,
        calculator,
        scenarioId,
        fieldPath: `${fieldPath}.length`,
        expected: expected.length,
        actual: actual.length,
        mismatchCategory: "structural",
      });
    }
    const len = Math.min(actual.length, expected.length);
    for (let i = 0; i < len; i++) {
      compareValues(comparison, calculator, scenarioId, actual[i], expected[i], `${fieldPath}[${i}]`, out);
    }
    return;
  }

  if (actual === null || typeof actual !== "object" || Array.isArray(actual)) {
    out.push({ comparison, calculator, scenarioId, fieldPath, expected: "object", actual: actual === null ? "null" : typeof actual, mismatchCategory: "structural" });
    return;
  }

  const expectedObj = expected as Record<string, unknown>;
  const actualObj = actual as Record<string, unknown>;
  const expectedKeys = new Set(Object.keys(expectedObj));
  const actualKeys = new Set(Object.keys(actualObj));

  for (const key of expectedKeys) {
    if (!actualKeys.has(key)) {
      out.push({ comparison, calculator, scenarioId, fieldPath: `${fieldPath}.${key}`, expected: expectedObj[key], actual: "<missing>", mismatchCategory: "structural" });
    }
  }
  for (const key of actualKeys) {
    if (!expectedKeys.has(key)) {
      out.push({ comparison, calculator, scenarioId, fieldPath: `${fieldPath}.${key}`, expected: "<absent>", actual: actualObj[key], mismatchCategory: "structural" });
    }
  }
  for (const key of expectedKeys) {
    if (actualKeys.has(key)) {
      compareValues(comparison, calculator, scenarioId, actualObj[key], expectedObj[key], `${fieldPath}.${key}`, out);
    }
  }
}

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
] as const;

const allMismatches: Mismatch[] = [];
let totalScenarios = 0;

for (const [fixFile, modFile, fnName, mode] of map) {
  const fixture = JSON.parse(fs.readFileSync(path.join("packages/decision-core/tests/fixtures", fixFile), "utf8"));
  const origMod = await import(path.resolve("/tmp/dt-pre-phase2/src/lib/decisions", modFile));
  const extMod = await import(path.resolve("packages/decision-core/src/calculators", modFile));

  const calcMismatches: Mismatch[] = [];
  for (const s of fixture.scenarios) {
    totalScenarios++;
    const origOut = mode === "job" ? origMod[fnName](s.input.offerA, s.input.offerB) : origMod[fnName](s.input);
    const extOut = mode === "job" ? extMod[fnName](s.input.offerA, s.input.offerB) : extMod[fnName](s.input);
    compareValues("A_orig_vs_fixture", fixFile, s.id, origOut, s.expected, "result", calcMismatches);
    compareValues("B_orig_vs_extracted", fixFile, s.id, extOut, origOut, "result", calcMismatches);
  }
  allMismatches.push(...calcMismatches);

  const count = (cmp: Mismatch["comparison"], cat: Category) =>
    calcMismatches.filter((m) => m.comparison === cmp && m.mismatchCategory === cat).length;

  console.log(
    `${fixFile}: ${fixture.scenarios.length} scenarios | ` +
    `A(num=${count("A_orig_vs_fixture","numeric")}, struct=${count("A_orig_vs_fixture","structural")}, text=${count("A_orig_vs_fixture","summary_text")}) | ` +
    `B(num=${count("B_orig_vs_extracted","numeric")}, struct=${count("B_orig_vs_extracted","structural")}, text=${count("B_orig_vs_extracted","summary_text")})`
  );
}

if (allMismatches.length > 0) {
  console.error("MISMATCH DETAILS:", JSON.stringify(allMismatches, null, 2));
  process.exit(1);
}
if (!isEnUs) {
  console.error("Runtime locale is not en-US; refusing silent pass.");
  process.exit(1);
}
console.log(`ALL PASSED: ${totalScenarios} scenarios verified for Checks A & B.`);
'
```

### Precision & Semantic Comparison Rules Enforced
- **Integer numbers:** Exact `Object.is` equality (rejects `-0` vs `0` and off-by-1 integers).
- **Non-integer numbers:** Absolute delta `< 5e-7` (matching Vitest `toBeCloseTo(expected, 6)`).
- **Strings, booleans, null:** Exact `Object.is` equality.
- **Objects:** Exact key-set equality independent of key insertion order (`missing key` / `unexpected key` reported as `structural`).
- **Arrays:** Exact length check (`structural`) plus ordered element-by-element recursion.
- **Summary strings:** Exact equality under verified `en-US` locale; categorized explicitly as `summary_text`.

---

## 5. Scenario-by-Scenario Summary Across All 10 Calculators (69 Scenarios Total)

| Calculator | Fixture Scenarios | Check A: Original (`01afd59c`) vs. Fixture | Check B: Original (`01afd59c`) vs. Extracted | Check C: Extracted vs. Fixture (`vitest`) | Check C Mismatches (Numeric / Structural / Text) |
|---|---:|---|---|---|---:|
| Rent vs. Buy | 9 | **Blocked (No `.git`)** | **Blocked (No `.git`)** | **9 / 9 Pass** | 0 / 0 / 0 |
| Job Offer | 7 | **Blocked (No `.git`)** | **Blocked (No `.git`)** | **7 / 7 Pass** | 0 / 0 / 0 |
| Lease vs. Buy | 8 | **Blocked (No `.git`)** | **Blocked (No `.git`)** | **8 / 8 Pass** | 0 / 0 / 0 |
| Gas vs. EV | 7 | **Blocked (No `.git`)** | **Blocked (No `.git`)** | **7 / 7 Pass** | 0 / 0 / 0 |
| Buy vs. Repair | 7 | **Blocked (No `.git`)** | **Blocked (No `.git`)** | **7 / 7 Pass** | 0 / 0 / 0 |
| DIY vs. Hire | 6 | **Blocked (No `.git`)** | **Blocked (No `.git`)** | **6 / 6 Pass** | 0 / 0 / 0 |
| Debt vs. Invest | 7 | **Blocked (No `.git`)** | **Blocked (No `.git`)** | **7 / 7 Pass** | 0 / 0 / 0 |
| Buy vs. Subscribe | 7 | **Blocked (No `.git`)** | **Blocked (No `.git`)** | **7 / 7 Pass** | 0 / 0 / 0 |
| New vs. Used | 6 | **Blocked (No `.git`)** | **Blocked (No `.git`)** | **6 / 6 Pass** | 0 / 0 / 0 |
| Bulk Buy | 6 | **Blocked (No `.git`)** | **Blocked (No `.git`)** | **6 / 6 Pass** | 0 / 0 / 0 |
| **Total** | **69** | **Blocked (0 / 69 Executed)** | **Blocked (0 / 69 Executed)** | **69 / 69 Pass** | **0 / 0 / 0** |

---

## 6. Check A — Original Engine (`01afd59c`) vs. Committed Fixture Results

- **Status:** **UNVERIFIABLE / BLOCKED IN SANDBOX.**
- **Cause:** No `.git` repository exists in `/app/applet` (`fatal: not a git repository (or any of the parent directories): .git`). Commit `01afd59c4ece8db2a9e13c213d3916bc150feedb` cannot be checked out into `/tmp/dt-pre-phase2`, so original engines could not be executed in this container.

---

## 7. Check B — Original Engine (`01afd59c`) vs. Extracted Engine Results

- **Status:** **UNVERIFIABLE / BLOCKED IN SANDBOX.**
- **Cause:** Original source modules from `01afd59c4ece8db2a9e13c213d3916bc150feedb` are not present in this container and cannot be obtained without `.git` history or an external clone.

---

## 8. Check C — Extracted Engine vs. Committed Fixture Results (Plus Workspace Suite)

Executed cleanly in `/app/applet` during Phase 2A.2:
- `bun run test` (`vitest run`): **3 test files, 109 / 109 passed**:
  - `packages/decision-core/tests/golden-master.test.ts`: **79 / 79 passed** (all 69 golden-master fixture scenarios + 10 comparator/precision/helper/compatibility tests).
  - `packages/decision-core/tests/formatting-and-compat.test.ts`: **7 / 7 passed**.
  - `packages/validation/tests/validation.test.ts`: **23 / 23 passed**.
- `bun run lint` (`tsc --noEmit`): **Passed (0 errors)**.
- `bun run build` (`astro build`): **Passed (33 static pages built cleanly in `dist/`)**.

No committed fixtures, calculation formulas, public URLs, SEO metadata, AdSense configuration, or GA4 configuration were modified.

---

## 9. Mismatches & Root Causes

- **Check C Mismatches:** `0` numeric, `0` structural, `0` summary-text mismatches across all 69 scenarios.
- **Checks A & B Mismatches:** Unknown / unexecuted because `.git` history is absent in `/app/applet`.

---

## 10. Final Phase 2 Acceptance Recommendation

**RECOMMENDATION: MAINTAIN PHASE 2 HOLD (DO NOT APPROVE FINAL SIGN-OFF OR START PHASE 3).**

Per Section 8 of the Phase 2A.2 Acceptance Gate, Phase 2 can only be approved if:
1. All 69 original-engine (`01afd59c4ece8db2a9e13c213d3916bc150feedb`) vs. fixture comparisons pass — **UNVERIFIABLE IN THIS SANDBOX (NO `.git`)**.
2. All 69 original-engine (`01afd59c4ece8db2a9e13c213d3916bc150feedb`) vs. extracted-engine comparisons pass — **UNVERIFIABLE IN THIS SANDBOX (NO `.git`)**.
3. All 69 extracted-engine vs. fixture comparisons pass — **PASS (69 / 69)**.
4. No unexplained mathematical or structural differences remain — **PENDING CHECKS A & B**.
5. Existing validation, TypeScript, tests, and Astro build remain successful — **PASS (`109 / 109` tests, `tsc --noEmit`, 33-page `astro build`)**.

### Required Next Action Outside This Container
Run the Section 4 verification script inside an environment containing the full Git history for `01afd59c4ece8db2a9e13c213d3916bc150feedb` and `16608e357120179f37e77a75c622f282121158db`, record the Check A and Check B outputs into this report, and confirm `0` numeric/structural/summary-text mismatches before lifting the Phase 2 hold or starting Phase 3.
