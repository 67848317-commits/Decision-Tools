import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  DEFAULT_LOCALE,
  formatCurrency,
  formatFixedDecimal,
  formatNumber,
  formatSummaryDollar,
  calculateRentVsBuy,
  RENT_VS_BUY_DEFAULTS,
} from '@decision-tools/decision-core';

import * as webTypes from '../../../src/types';
import * as sharedTypes from '@decision-tools/shared-types';
import * as webDecisions from '../../../src/data/decisions';
import * as sharedDecisions from '@decision-tools/shared-data/decisions';
import * as webGuides from '../../../src/data/guides';
import * as sharedGuides from '@decision-tools/shared-data/guides';

import * as webRentVsBuy from '../../../src/lib/decisions/rentVsBuy';
import * as coreRentVsBuy from '@decision-tools/decision-core/rentVsBuy';
import * as webJobOffer from '../../../src/lib/decisions/jobOffer';
import * as coreJobOffer from '@decision-tools/decision-core/jobOffer';
import * as webLeaseVsBuy from '../../../src/lib/decisions/leaseVsBuy';
import * as coreLeaseVsBuy from '@decision-tools/decision-core/leaseVsBuy';
import * as webGasVsEv from '../../../src/lib/decisions/gasVsEv';
import * as coreGasVsEv from '@decision-tools/decision-core/gasVsEv';
import * as webBuyVsRepair from '../../../src/lib/decisions/buyVsRepair';
import * as coreBuyVsRepair from '@decision-tools/decision-core/buyVsRepair';
import * as webDiyVsHire from '../../../src/lib/decisions/diyVsHire';
import * as coreDiyVsHire from '@decision-tools/decision-core/diyVsHire';
import * as webDebtVsInvest from '../../../src/lib/decisions/debtVsInvest';
import * as coreDebtVsInvest from '@decision-tools/decision-core/debtVsInvest';
import * as webBuyVsSubscribe from '../../../src/lib/decisions/buyVsSubscribe';
import * as coreBuyVsSubscribe from '@decision-tools/decision-core/buyVsSubscribe';
import * as webNewVsUsed from '../../../src/lib/decisions/newVsUsed';
import * as coreNewVsUsed from '@decision-tools/decision-core/newVsUsed';
import * as webBulkBuy from '../../../src/lib/decisions/bulkBuy';
import * as coreBulkBuy from '@decision-tools/decision-core/bulkBuy';

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

describe('Deterministic Formatting', () => {
  it('defaults explicitly to en-US locale', () => {
    expect(DEFAULT_LOCALE).toBe('en-US');
    expect(formatNumber(1234567.89)).toBe('1,234,567.89');
    expect(formatCurrency(90053)).toBe('$90,053');
    expect(formatCurrency(-23000)).toBe('-$23,000');
    expect(formatSummaryDollar(-23000)).toBe('$-23,000');
  });

  it('normalizes -0 to 0 across all formatters', () => {
    expect(formatNumber(-0)).toBe('0');
    expect(formatCurrency(-0)).toBe('$0');
    expect(formatSummaryDollar(-0)).toBe('$0');
    expect(formatFixedDecimal(-0, 2)).toBe('0.00');
  });

  it('supports optional display symbol overrides without currency conversion', () => {
    expect(formatCurrency(1500, { currencySymbol: '€' })).toBe('€1,500');
    expect(formatCurrency(-1500, { currencySymbol: '£' })).toBe('-£1,500');
  });

  it('produces identical RentVsBuy output with explicit locale formatting', () => {
    const res = calculateRentVsBuy(RENT_VS_BUY_DEFAULTS);
    expect(res.summaryText).toContain('$220,679');
    expect(res.summaryText).toContain('$130,626');
    expect(res.summaryText).toContain('$90,053');
  });
});

describe('Website Compatibility Re-Exports & Data Integrity', () => {
  it('re-exports identical calculator functions and defaults from src/lib/decisions/*', () => {
    expect(webRentVsBuy.calculateRentVsBuy).toBe(coreRentVsBuy.calculateRentVsBuy);
    expect(webRentVsBuy.validateRentVsBuyInput).toBe(coreRentVsBuy.validateRentVsBuyInput);
    expect(webRentVsBuy.RENT_VS_BUY_DEFAULTS).toBe(coreRentVsBuy.RENT_VS_BUY_DEFAULTS);

    expect(webJobOffer.compareJobOffers).toBe(coreJobOffer.compareJobOffers);
    expect(webJobOffer.validateJobOfferInput).toBe(coreJobOffer.validateJobOfferInput);

    expect(webLeaseVsBuy.calculateLeaseVsBuy).toBe(coreLeaseVsBuy.calculateLeaseVsBuy);
    expect(webGasVsEv.calculateGasVsEv).toBe(coreGasVsEv.calculateGasVsEv);
    expect(webBuyVsRepair.calculateBuyVsRepair).toBe(coreBuyVsRepair.calculateBuyVsRepair);
    expect(webDiyVsHire.calculateDiyVsHire).toBe(coreDiyVsHire.calculateDiyVsHire);
    expect(webDebtVsInvest.calculateDebtVsInvest).toBe(coreDebtVsInvest.calculateDebtVsInvest);
    expect(webBuyVsSubscribe.calculateBuyVsSubscribe).toBe(coreBuyVsSubscribe.calculateBuyVsSubscribe);
    expect(webNewVsUsed.calculateNewVsUsed).toBe(coreNewVsUsed.calculateNewVsUsed);
    expect(webBulkBuy.calculateBulkBuy).toBe(coreBulkBuy.calculateBulkBuy);
  });

  it('preserves all 10 decisions and all 16 published guides across src/data/* and @decision-tools/shared-data', () => {
    expect(webTypes).toBeDefined();
    expect(sharedTypes).toBeDefined();

    expect(webDecisions.DECISIONS).toBe(sharedDecisions.DECISIONS);
    expect(webDecisions.DECISIONS).toHaveLength(10);
    expect(webDecisions.CATEGORIES).toHaveLength(5);

    expect(webGuides.GUIDES).toBe(sharedGuides.GUIDES);
    expect(webGuides.GUIDES).toHaveLength(16);
    expect(webGuides.PLANNED_GUIDES).toHaveLength(20);
    expect(webGuides.PLANNED_GUIDES.filter((g) => g.isPublished)).toHaveLength(16);
  });
});

describe('Pure Package Architecture Guardrails', () => {
  it('shared packages contain zero DOM, Astro, React, or browser-specific imports', () => {
    const root = resolve(process.cwd(), 'packages');
    const pkgDirs = ['shared-types/src', 'validation/src', 'decision-core/src', 'shared-data/src'];
    const forbiddenPatterns = [
      /from\s+['"]react['"]/,
      /from\s+['"]astro/,
      /from\s+['"]@capacitor/,
      /\bwindow\s*(?:\.[a-zA-Z_$]|\[)/,
      /\bdocument\s*(?:\.[a-zA-Z_$]|\[)/,
      /\blocalStorage\b/,
      /\bsessionStorage\b/,
      /\.toLocaleString\(/,
    ];

    for (const relDir of pkgDirs) {
      const files = collectTsFiles(join(root, relDir));
      expect(files.length).toBeGreaterThan(0);
      for (const file of files) {
        const content = readFileSync(file, 'utf8');
        for (const pattern of forbiddenPatterns) {
          expect(pattern.test(content), `${file} matched forbidden pattern ${pattern}`).toBe(false);
        }
      }
    }
  });
});
