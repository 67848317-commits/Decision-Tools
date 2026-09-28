# Phase 5: Calculator Content & Quality Audit

**Project:** Decision Tools  
**Production Domain:** `https://decision-tools.org`  
**Date:** September 2026  
**Status:** Complete Inventory of 10 Decision Calculators  

---

## 1. Audit Framework & Evaluation Criteria

Each calculator is evaluated against 14 essential criteria:
1. **Clear H1 & Title:** Descriptive, user-focused heading.
2. **Introductory Explanation:** Plain-English framing of the core decision trade-off.
3. **Input Labels & Units:** Explicit units ($, %, years, miles, kWh, hours).
4. **Sensible Defaults:** Realistic, benchmarked economic starting parameters.
5. **Result Clarity:** Clear primary comparison metric with numerical delta.
6. **Result Interpretation:** Narrative explanation of what the numbers mean.
7. **Assumptions Section:** Documented modeling assumptions (inflation, interest, taxes).
8. **Limitations Disclosure:** Transparent boundary conditions (what the tool cannot predict).
9. **Methodology & Formulas:** Mathematical basis documented in accessible language.
10. **Related Guides:** Bidirectional internal links to relevant analytical guides.
11. **Related Calculators:** Cross-links to related decision tools.
12. **FAQ Section:** Visible questions addressing practical nuances and edge cases.
13. **Disclaimer:** Clear notice that results are estimates, not professional advice.
14. **Mobile Usability:** Responsive layout with stacked input panels and clear tap targets.

---

## 2. Individual Calculator Evaluations

### 1. Rent vs. Buy Calculator
- **Route:** `/decisions/rent-vs-buy`
- **H1:** Rent vs. Buy Calculator: Compare Total Costs & Net Wealth
- **Defaults:** $400,000 purchase price, 20% down payment, 6.8% mortgage rate, 30-year term, $2,200/mo rent, 3% rent inflation, 4% home appreciation, 7% investment return, 7-year horizon.
- **Result Metrics:** Estimated Net Housing Cost, Cumulative Cash Outflow, Estimated Home Equity at Horizon, Annual Break-Even Crossover.
- **Assumptions & Methodology:** Complete compound amortization schedule, property taxes, maintenance escrow, opportunity cost of down payment.
- **FAQ:** 4 comprehensive questions (5-year rule, down payment opportunity cost, market depreciation, renters insurance).
- **Related Links:** Links to 4 guides (`rent-vs-buy`, `rent-vs-buy-hidden-costs`, etc.) and related decisions.
- **Mobile Usability:** Two-column desktop grid folds seamlessly to single column on mobile.
- **Classification:** **Strong**

---

### 2. Job Offer Comparison Calculator
- **Route:** `/decisions/job-offer`
- **H1:** Job Offer Comparison Calculator: Compare Total Compensation & Net Value
- **Defaults:** Offer A ($110k base, 10% bonus, 4% 401k match, $250/mo health, 15 mi commute) vs. Offer B ($125k base, 5% bonus, 3% 401k match, $400/mo health, 28 mi commute).
- **Result Metrics:** Gross Cash Compensation, Net Value after Commute/Health, Effective Hourly Rate, Comprehensive Comparison Table.
- **Assumptions & Methodology:** Tax estimates, commute time opportunity cost, bonus risk discounting, fringe benefit values.
- **FAQ:** 4 practical questions (valuing 401k matching, calculating true commute costs, bonus risk factoring, evaluating non-financial culture).
- **Related Links:** Links to guides (`how-to-compare-job-offers`, `how-to-value-job-benefits`) and career decisions.
- **Mobile Usability:** Clean card stacking with side-by-side comparison on tablet/desktop and vertical toggle on narrow viewports.
- **Classification:** **Strong**

---

### 3. Gas vs. EV Cost Calculator
- **Route:** `/decisions/gas-vs-ev`
- **H1:** Gas vs. Electric Vehicle Cost Calculator: Fuel & Maintenance Comparison
- **Defaults:** 13,500 annual miles, $3.60/gal gas, 28 MPG, $0.16/kWh electricity, 3.5 mi/kWh EV efficiency, 85% home charging / 15% public charging ($0.38/kWh), $400/yr maintenance differential.
- **Result Metrics:** Annual Fuel/Energy Cost, 5-Year Operating Outflow, Break-Even Mileage Crossover.
- **Assumptions & Methodology:** Grounded in EIA energy statistics and FHWA annual driving averages; includes charging efficiency losses.
- **FAQ:** 4 detailed questions (public charging cost variations, battery longevity/degradation, maintenance variances, home Level 2 charger installation costs).
- **Related Links:** Links to guides (`gas-vs-ev-cost`, `how-to-calculate-ev-charging-cost`) and vehicle decisions.
- **Mobile Usability:** Responsive dual-slider inputs with clear unit tags and high-contrast difference badges.
- **Classification:** **Strong**

---

### 4. Lease vs. Buy Calculator
- **Route:** `/decisions/lease-vs-buy`
- **H1:** Lease vs. Buy Car Calculator: Compare Total Out-of-Pocket & Equity
- **Defaults:** $42,000 vehicle MSRP, $480/mo lease with $3,000 down (36 months), 5.9% loan rate over 60 months with $5,000 down, 52% residual value.
- **Result Metrics:** Estimated Net Cost (36 Months), Monthly Payment Commitment, Total Cumulative Cash Outflow, Retained Asset Equity.
- **Assumptions & Methodology:** Discloses lease money factor mechanics, depreciation absorption, disposition fees, loan amortization, and end-of-term equity reconciliation.
- **FAQ:** 4 questions (mileage penalties, equity ownership upon lease expiration, financing interest vs money factor, when leasing is strategically preferable).
- **Related Links:** Links to guides (`true-cost-of-leasing-a-car`, `how-to-compare-the-cost-of-a-new-and-used-car`) and automotive decisions.
- **Mobile Usability:** Responsive table and breakdown cards adapt with readable typography.
- **Classification:** **Strong**

---

### 5. Pay Off Debt vs. Invest Calculator
- **Route:** `/decisions/debt-vs-invest`
- **H1:** Pay Off Debt vs. Invest Calculator: Compare Guaranteed vs. Expected Returns
- **Defaults:** $18,000 debt balance, 19.5% APR (credit card/unsecured loan), $450 minimum payment, $300 extra monthly payment, 7.5% expected investment return, 5-year horizon.
- **Result Metrics:** Total Interest Paid, Projected Portfolio Balance, Net Financial Advantage, Guaranteed Return equivalent.
- **Assumptions & Methodology:** Demonstrates guaranteed risk-free return of debt payoff vs market volatility risk of equity investing; incorporates marginal tax considerations.
- **FAQ:** 4 questions (guaranteed return vs market volatility, the interest rate cutoff threshold, emergency fund prerequisite, tax deductibility of debt interest).
- **Related Links:** Links to guides (`pay-off-debt-vs-invest`, `how-to-compare-debt-interest-with-investment-returns`) and financial decisions.
- **Mobile Usability:** Responsive grid with clean metric callouts.
- **Classification:** **Strong**

---

### 6. Buy vs. Repair Calculator
- **Route:** `/decisions/buy-vs-repair`
- **H1:** Buy vs. Repair Calculator: The 50% Rule & Life-Cycle Economics
- **Defaults:** $900 replacement purchase, $320 repair estimate, 3 years expected repaired lifespan, 8 years new item lifespan, $30/yr energy efficiency savings.
- **Result Metrics:** Annualized Cost of Repair vs Replacement, 50% Rule Threshold Assessment, Break-Even Repair Lifespan.
- **Assumptions & Methodology:** Applies the established appliance/equipment 50% Rule alongside discounted annual capital cost recovery equations.
- **FAQ:** 4 questions (the 50% rule explanation, risk of secondary breakdowns, opportunity cost of downtime, environmental impact of premature disposal).
- **Related Links:** Links to guides (`buy-vs-repair`, `when-does-repairing-an-appliance-make-sense`).
- **Mobile Usability:** Clean vertical flow with mobile-friendly input steppers and clear result highlights.
- **Classification:** **Strong**

---

### 7. DIY vs. Hire Calculator
- **Route:** `/decisions/diy-vs-hire`
- **H1:** DIY vs. Hire Calculator: Compare Project Cash, Time Value & Risk
- **Defaults:** $2,400 contractor quote, $650 DIY materials and tool rental, 24 hours estimated DIY personal labor, $35/hr opportunity cost of personal time, 15% rework buffer ($180).
- **Result Metrics:** Total Economic Cost (DIY vs Pro), Net Financial Savings, Effective Hourly Wage Earned by DIYing.
- **Assumptions & Methodology:** Accounts for personal opportunity cost of time, tool acquisition/rental, permits, and empirical rework risk buffers.
- **FAQ:** 4 questions (how to value personal free time, projects where DIY is dangerous or code-prohibited, tool purchase vs tool rental accounting, handling project fatigue).
- **Related Links:** Links to guides (`diy-vs-hire`, `how-to-estimate-the-cost-of-diy-projects`).
- **Mobile Usability:** Compact mobile layout with accessible slider and number controls.
- **Classification:** **Strong**

---

### 8. Buy vs. Subscribe Calculator
- **Route:** `/decisions/buy-vs-subscribe`
- **H1:** Buy vs. Subscribe Calculator: Compare Long-Term Ownership vs. Recurring Fees
- **Defaults:** $380 upfront purchase price, $18/mo recurring subscription fee, 12 months/year usage frequency, 3-year analysis horizon, $25/yr maintenance/upgrade reserve.
- **Result Metrics:** Cumulative Cost at Horizon, Month-by-Month Crossover Break-Even Point, Flexibility Premium.
- **Assumptions & Methodology:** Models cumulative subscription inflation, software vs hardware depreciation, residual resale value, and commitment flexibility.
- **FAQ:** 4 questions (subscription creep risk, asset residual value upon cancellation, software vs hardware subscriptions, maintenance and warranty responsibilities).
- **Related Links:** Links to guide (`how-to-calculate-subscription-break-even`).
- **Mobile Usability:** Touch-friendly inputs with interactive break-even month indicators.
- **Classification:** **Strong**

---

### 9. New vs. Used Car Calculator
- **Route:** `/decisions/new-vs-used`
- **H1:** New vs. Used Car Calculator: Total 5-Year Ownership Cost & Depreciation
- **Defaults:** $39,000 new vehicle, $24,500 3-year-old pre-owned vehicle, 5-year ownership horizon, 13,500 miles/year, 6.2% APR (new) vs 8.4% APR (used), calibrated depreciation curve.
- **Result Metrics:** Total 5-Year Ownership Cost, Annualized Cost of Ownership, Cumulative Depreciation Loss, Estimated Residual Equity.
- **Assumptions & Methodology:** Detailed multi-year depreciation modeling, financing rate differences, warranty coverage adjustments, and out-of-warranty maintenance schedules.
- **FAQ:** 4 questions (steep initial 3-year depreciation cliff, CPO warranty value vs private sellers, financing interest rate premiums on pre-owned cars, maintenance reliability gap).
- **Related Links:** Links to guides (`how-to-compare-the-cost-of-a-new-and-used-car`, `true-cost-of-leasing-a-car`).
- **Mobile Usability:** Fully responsive side-by-side cost breakdown that stacks gracefully on mobile viewports.
- **Classification:** **Strong**

---

### 10. Bulk Buy Savings Calculator
- **Route:** `/decisions/bulk-buy`
- **H1:** Bulk Buy Savings Calculator: Calculate Real Unit Savings & Spoilage Break-Even
- **Defaults:** $0.42/unit standard retail ($8.40 for 20 units), $0.26/unit bulk packaging ($26.00 for 100 units), 15 units/month consumption, 8% spoilage/waste estimate, $60/yr club membership fee allocation ($5/mo).
- **Result Metrics:** Net Annual Savings, Effective Unit Cost After Waste, Maximum Spoilage Tolerance (Break-Even Spoilage Rate), Capital Tied Up.
- **Assumptions & Methodology:** Evaluates unit cost delta, holding costs, membership amortized overhead, and food/product spoilage wastage thresholds.
- **FAQ:** 4 questions (when buying in bulk costs more money, non-perishable vs perishable items, calculating warehouse club membership payback, opportunity cost of home storage space).
- **Related Links:** Links to guide (`how-to-calculate-bulk-purchase-savings`).
- **Mobile Usability:** Clean numeric inputs with immediate real-time update of waste tolerance limits.
- **Classification:** **Strong**

---

## 3. Summary & Findings

| Calculator | Category | Mathematical Rigor | Methodology & Assumptions | FAQ Depth | Classification |
|---|---|---|---|---|---|
| Rent vs. Buy | Housing | High | Full amortization + opportunity cost | 4 FAQs | **Strong** |
| Job Offer Comparison | Career | High | Total cash + benefits + commute deduction | 4 FAQs | **Strong** |
| Gas vs. EV Cost | Transportation | High | EIA benchmark fuel + kWh efficiency | 4 FAQs | **Strong** |
| Lease vs. Buy | Transportation | High | Money factor + depreciation + equity | 4 FAQs | **Strong** |
| Pay Off Debt vs. Invest | Finance | High | Guaranteed APR vs expected market return | 4 FAQs | **Strong** |
| Buy vs. Repair | Lifestyle | High | 50% rule + annualized lifespan capital | 4 FAQs | **Strong** |
| DIY vs. Hire | Lifestyle | High | Time valuation + materials + rework buffer | 4 FAQs | **Strong** |
| Buy vs. Subscribe | Lifestyle | High | Crossover break-even + upgrade reserve | 4 FAQs | **Strong** |
| New vs. Used Car | Transportation | High | Depreciation curve + financing rate gap | 4 FAQs | **Strong** |
| Bulk Buy Savings | Lifestyle | High | Waste/spoilage threshold + membership fee | 4 FAQs | **Strong** |

**Key Operational Improvement Identified:**  
All 10 calculators already possess outstanding mathematical rigor, comprehensive assumptions, and 4 detailed FAQs. The only functional defect was the parameter naming mismatch in `DecisionLayout.astro` (`faqs` vs `faqItems`) which suppressed the visible display of FAQs for 5 of the calculators. Once resolved in `DecisionLayout.astro`, all 10 calculators operate at full editorial depth and feature complete, visible FAQ accordions and schema.
