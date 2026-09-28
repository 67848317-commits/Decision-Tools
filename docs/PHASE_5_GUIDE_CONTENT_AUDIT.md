# Phase 5: Guide Content & Quality Audit

**Project:** Decision Tools  
**Production Domain:** `https://decision-tools.org`  
**Date:** September 2026  
**Status:** Complete Inventory of 16 Published Editorial Guides  

---

## 1. Audit Framework & Evaluation Criteria

Each published guide in `src/data/guides.ts` is audited against the following search and editorial quality standards:
1. **Search Intent:** Targets a high-intent informational query without superficial filler.
2. **Title & H1 Alignment:** Matches user search queries with clear, unhurried academic tone.
3. **Introductory Paragraph:** Sets clear framing, defines the core trade-off, and avoids prescriptive bias.
4. **Heading Structure:** Logical H2/H3 semantic hierarchy.
5. **Depth & Mathematical Rigor:** Includes concrete numerical formulas, cost tables, or economic models.
6. **Originality:** Grounded in objective accounting (amortization, depreciation, opportunity cost) rather than generic blog advice.
7. **Useful Numerical Examples:** Real-world figures ($350k home, $120k salary, $40k vehicle) illustrating the calculations.
8. **Calculator Connection:** Direct bidirectional callout to the corresponding interactive decision tool.
9. **Internal Linking:** Related guide recommendations across the same life domain.
10. **FAQ Accordion & Schema:** 3 high-value, structured questions and answers for Google search snippets.

---

## 2. Individual Guide Audits

### 1. `rent-vs-buy`
- **Title:** Rent vs. Buy: The Complete Financial & Lifestyle Decision Framework
- **Category:** Housing | **Read Time:** ~8 min
- **Primary Keyword:** `rent vs buy calculator decision framework`
- **Search Intent:** Informational / High-consideration financial decision.
- **H1:** Rent vs. Buy: The Complete Financial & Lifestyle Decision Framework
- **Depth:** Covers the 5-year break-even rule, unrecoverable costs (rent vs mortgage interest/taxes/maintenance), down payment opportunity cost, and non-financial flexibility.
- **Numerical Example:** Compares a $400k home purchase ($80k down, 6.8% mortgage) against a $2,200/mo rental with remaining capital invested at 7%.
- **Calculator Connection:** Embedded callout linking to `/decisions/rent-vs-buy`.
- **FAQs:** 3 (5-year rule, down payment investing, depreciation risk).
- **Classification:** **Strong**

---

### 2. `how-to-compare-job-offers`
- **Title:** How to Compare Two Job Offers Beyond Just Base Salary
- **Category:** Career | **Read Time:** ~9 min
- **Primary Keyword:** `how to compare two job offers total compensation`
- **Search Intent:** Career transition comparison; total compensation evaluation.
- **H1:** How to Compare Two Job Offers Beyond Just Base Salary
- **Depth:** 5 comprehensive sections: Total cash comp, health insurance cost deductions, commute friction accounting, PTO monetary valuation, and non-financial culture scores.
- **Numerical Example:** Compares $120,000 (shorter commute, 4% match) with $135,000 (longer commute, higher health premium).
- **Calculator Connection:** Embedded callout linking to `/decisions/job-offer`.
- **FAQs:** 3 (401k match valuation, commute time accounting, bonus discount rates).
- **Classification:** **Strong**

---

### 3. `gas-vs-ev-cost`
- **Title:** Gas vs. Electric Vehicle: Total Cost of Ownership Comparison
- **Category:** Transportation | **Read Time:** ~8 min
- **Primary Keyword:** `gas vs ev total cost of ownership calculator`
- **Search Intent:** Vehicle purchase research; fuel vs electricity cost modeling.
- **H1:** Gas vs. Electric Vehicle: Total Cost of Ownership Comparison
- **Depth:** kWh efficiency conversion, home vs public charging rates, brake and oil maintenance differentials, battery degradation reserves, and 5-year total cost of ownership.
- **Numerical Example:** Compares 13,500 mi/yr at 28 MPG ($3.60/gal) vs 3.5 mi/kWh ($0.16/kWh home).
- **Calculator Connection:** Embedded callout linking to `/decisions/gas-vs-ev`.
- **FAQs:** 3 (public charging economics, battery replacement lifespan, winter range efficiency).
- **Classification:** **Strong**

---

### 4. `true-cost-of-leasing-a-car`
- **Title:** The True Cost of Leasing a Car vs. Buying
- **Category:** Transportation | **Read Time:** ~8 min
- **Primary Keyword:** `true cost of leasing a car vs buying`
- **Search Intent:** Automotive financing; evaluating monthly lease payments vs long-term purchase equity.
- **H1:** The True Cost of Leasing a Car vs. Buying
- **Depth:** Explains lease money factors, acquisition and disposition fees, depreciation absorption, mileage penalties, and the 10-year recurring cycle cost.
- **Numerical Example:** $42,000 vehicle evaluated across two consecutive 36-month leases ($34,560 total cash outflow, $0 equity) vs 60-month loan purchase ($47,100 outflow, $18,000 equity).
- **Calculator Connection:** Embedded callout linking to `/decisions/lease-vs-buy`.
- **FAQs:** 3 (money factor to APR formula, lease buyouts, mileage excess fees).
- **Classification:** **Strong**

---

### 5. `buy-vs-repair`
- **Title:** When to Repair vs. Replace an Appliance, Vehicle, or Electronics
- **Category:** Lifestyle | **Read Time:** ~7 min
- **Primary Keyword:** `when to repair vs replace appliance 50 percent rule`
- **Search Intent:** Household maintenance dilemma; cost-effective repair decision making.
- **H1:** When to Repair vs. Replace an Appliance, Vehicle, or Electronics
- **Depth:** Details the 50% Rule, product expected lifespan tables (HVAC, refrigerator, dishwasher, vehicles), secondary failure cascade probabilities, and energy efficiency upgrades.
- **Numerical Example:** $850 refrigerator with a $380 compressor failure at Year 7 of expected 12-year lifespan.
- **Calculator Connection:** Embedded callout linking to `/decisions/buy-vs-repair`.
- **FAQs:** 3 (the 50% rule, reliability after repair, environmental disposal).
- **Classification:** **Strong**

---

### 6. `diy-vs-hire`
- **Title:** DIY vs. Hiring a Professional: The Real Economic Equation
- **Category:** Lifestyle | **Read Time:** ~7 min
- **Primary Keyword:** `diy vs hire professional economic equation time value`
- **Search Intent:** Home renovation / task evaluation; valuing personal time vs contractor costs.
- **H1:** DIY vs. Hiring a Professional: The Real Economic Equation
- **Depth:** Formulates the DIY Economic Cost equation: `Cost = Materials + Tool Rental + (Hours × Personal Rate) + Rework Buffer`.
- **Numerical Example:** Interior room repainting: $300 materials + 18 hrs personal labor vs $1,400 contractor quote.
- **Calculator Connection:** Embedded callout linking to `/decisions/diy-vs-hire`.
- **FAQs:** 3 (valuing leisure time, hazardous/licensed work, tool acquisition amortizing).
- **Classification:** **Strong**

---

### 7. `pay-off-debt-vs-invest`
- **Title:** Paying Off Debt vs. Investing: A Mathematical & Behavioral Guide
- **Category:** Finance | **Read Time:** ~8 min
- **Primary Keyword:** `pay off debt vs invest mathematical comparison`
- **Search Intent:** Financial priority optimization; debt repayment vs market compounding.
- **H1:** Paying Off Debt vs. Investing: A Mathematical & Behavioral Guide
- **Depth:** Analyzes the guaranteed risk-free return of debt payoff against the probabilistic volatility of market equities, marginal tax deductibility, and emergency liquidity cushions.
- **Numerical Example:** Allocating $400/month extra cash to 21% credit card debt vs 8% S&P 500 index fund over 48 months.
- **Calculator Connection:** Embedded callout linking to `/decisions/debt-vs-invest`.
- **FAQs:** 3 (the 6-8% threshold rate, sequence of returns risk, emergency fund prerequisites).
- **Classification:** **Strong**

---

### 8. `rent-vs-buy-hidden-costs`
- **Title:** The Hidden Costs of Homeownership Most First-Time Buyers Ignore
- **Category:** Housing | **Read Time:** ~8 min
- **Primary Keyword:** `hidden costs of homeownership first time buyer`
- **Search Intent:** Home buying preparation; non-mortgage ownership costs.
- **H1:** The Hidden Costs of Homeownership Most First-Time Buyers Ignore
- **Depth:** Explores the 1-2% annual maintenance rule, property tax reassessments, supplemental insurance, HOA special assessments, closing costs, and seller commissions (5-6%).
- **Numerical Example:** Illustrates $12,400 in annual non-mortgage carrying expenses on a $450,000 home.
- **Calculator Connection:** Embedded callout linking to `/decisions/rent-vs-buy`.
- **FAQs:** 3 (HOA assessment defense, transfer taxes, maintenance reserve funds).
- **Classification:** **Strong**

---

### 9. `how-to-value-job-benefits`
- **Title:** How to Calculate the Cash Value of Employee Benefits
- **Category:** Career | **Read Time:** ~7 min
- **Primary Keyword:** `how to calculate cash value employee benefits`
- **Search Intent:** Career offer evaluation; quantifying fringe benefits.
- **H1:** How to Calculate the Cash Value of Employee Benefits
- **Depth:** Step-by-step valuation formulas for employer health insurance subsidies, 401(k) vesting schedules, daily PTO values, HSA contributions, and education stipends.
- **Numerical Example:** Calculates an additional $18,400 in real economic cash value across an employee benefits package.
- **Calculator Connection:** Embedded callout linking to `/decisions/job-offer`.
- **FAQs:** 3 (401k vesting cliffs, HSA pre-tax triple advantage, valuing unlimited PTO).
- **Classification:** **Strong**

---

### 10. `how-to-calculate-ev-charging-cost`
- **Title:** How to Calculate Real-World EV Charging Costs
- **Category:** Transportation | **Read Time:** ~7 min
- **Primary Keyword:** `how to calculate ev charging costs residential vs public`
- **Search Intent:** EV ownership research; electricity utility rates and charging efficiency.
- **H1:** How to Calculate Real-World EV Charging Costs
- **Depth:** Discloses the Level 1 vs Level 2 vs DC Fast charging efficiency losses (85-90% AC efficiency vs 80-85% DC fast charging), time-of-use (TOU) off-peak utility pricing, and annual kWh budgeting.
- **Numerical Example:** 12,000 miles at 3.3 mi/kWh = 3,636 kWh consumed; accounting for 12% charging loss = 4,072 kWh billed ($651 at $0.16/kWh off-peak).
- **Calculator Connection:** Embedded callout linking to `/decisions/gas-vs-ev`.
- **FAQs:** 3 (charging losses explanation, DC fast charging premiums, solar charging integration).
- **Classification:** **Strong**

---

### 11. `when-does-repairing-an-appliance-make-sense`
- **Title:** When Does Repairing an Appliance Actually Make Financial Sense?
- **Category:** Lifestyle | **Read Time:** ~7 min
- **Primary Keyword:** `when does repairing an appliance make financial sense`
- **Search Intent:** Home appliance maintenance decision guide.
- **H1:** When Does Repairing an Appliance Actually Make Financial Sense?
- **Depth:** Empirical lifespans for dishwashers (9 yrs), clothes washers (11 yrs), water heaters (10 yrs), and HVAC systems (15 yrs); diagnostic fee write-offs; parts availability cutoff points.
- **Numerical Example:** 8-year-old water heater repair ($450) vs new high-efficiency unit ($1,600).
- **Calculator Connection:** Embedded callout linking to `/decisions/buy-vs-repair`.
- **FAQs:** 3 (diagnostic fee crediting, DIY part replacement risk, home warranty contracts).
- **Classification:** **Strong**

---

### 12. `how-to-estimate-the-cost-of-diy-projects`
- **Title:** How to Accurately Estimate the True Cost of a DIY Project
- **Category:** Lifestyle | **Read Time:** ~7 min
- **Primary Keyword:** `how to accurately estimate true cost of diy project`
- **Search Intent:** Renovation budgeting; hidden DIY expenditures.
- **H1:** How to Accurately Estimate the True Cost of a DIY Project
- **Depth:** Step-by-step framework covering material waste multipliers (10-15%), specialty safety gear, debris disposal fees, permit expenditures, and personal frustration buffers.
- **Numerical Example:** Hardwood flooring project: $1,200 wood + $180 waste factor + $250 nailer/saw rental + $150 transition strips + $80 dump fee = $1,860 real cash cost.
- **Calculator Connection:** Embedded callout linking to `/decisions/diy-vs-hire`.
- **FAQs:** 3 (material waste allowance, tool rental vs purchase, building permit inspection risks).
- **Classification:** **Strong**

---

### 13. `how-to-compare-debt-interest-with-investment-returns`
- **Title:** Comparing Debt Interest Rates with Potential Investment Returns
- **Category:** Finance | **Read Time:** ~8 min
- **Primary Keyword:** `compare debt interest rates with investment returns`
- **Search Intent:** Debt vs equity capital allocation; risk premium evaluation.
- **H1:** Comparing Debt Interest Rates with Potential Investment Returns
- **Depth:** Compares certainty of debt prepayment against equity risk premiums, behavioral sleep-well factors, and inflation erosion effects on fixed-rate debt.
- **Numerical Example:** 5.5% fixed mortgage vs 7.5% expected equity return: evaluating after-tax return differential against market drawdown risk.
- **Calculator Connection:** Embedded callout linking to `/decisions/debt-vs-invest`.
- **FAQs:** 3 (inflation impact on debt, peace-of-mind psychological premium, margin loan investing).
- **Classification:** **Strong**

---

### 14. `how-to-calculate-subscription-break-even`
- **Title:** How to Calculate the Break-Even Point on Subscriptions
- **Category:** Lifestyle | **Read Time:** ~7 min
- **Primary Keyword:** `how to calculate break even point on subscriptions`
- **Search Intent:** Subscription audit; recurring fee vs outright purchase.
- **H1:** How to Calculate the Break-Even Point on Subscriptions
- **Depth:** Formula: `Break-Even Months = Upfront Purchase Cost / Monthly Subscription Fee`. Factors in software upgrade cycles, cloud storage costs, cancellation hurdles, and utilization drop-off.
- **Numerical Example:** Creative software suite ($60/month subscription vs $599 perpetual license): break-even occurs at month 10.
- **Calculator Connection:** Embedded callout linking to `/decisions/buy-vs-subscribe`.
- **FAQs:** 3 (software vs physical subscriptions, annual discount pitfalls, subscription creep auditing).
- **Classification:** **Strong**

---

### 15. `how-to-compare-the-cost-of-a-new-and-used-car`
- **Title:** How to Compare the Total Cost of a New vs. Used Car
- **Category:** Transportation | **Read Time:** ~8 min
- **Primary Keyword:** `how to compare total cost new vs used car depreciation`
- **Search Intent:** Used car buying analysis; multi-year depreciation and financing.
- **H1:** How to Compare the Total Cost of a New vs. Used Car
- **Depth:** Analyzes the 3-year 40% depreciation cliff, Certified Pre-Owned (CPO) warranty pricing, APR interest rate spreads (new car manufacturer subsidized rates vs used car market rates), and scheduled milestone services (60k/90k miles).
- **Numerical Example:** $38,000 new sedan vs $22,500 3-year-old counterpart evaluated across a 5-year ownership window.
- **Calculator Connection:** Embedded callout linking to `/decisions/new-vs-used`.
- **FAQs:** 3 (the 3-year sweet spot, CPO warranty economics, out-of-warranty repair funds).
- **Classification:** **Strong**

---

### 16. `how-to-calculate-bulk-purchase-savings`
- **Title:** How to Calculate Whether Buying in Bulk Actually Saves Money
- **Category:** Lifestyle | **Read Time:** ~7 min
- **Primary Keyword:** `how to calculate bulk purchase savings spoilage rate`
- **Search Intent:** Grocery / warehouse shopping optimization; real unit price savings.
- **H1:** How to Calculate Whether Buying in Bulk Actually Saves Money
- **Depth:** Evaluates effective unit cost formula: `Effective Cost = Total Spent / (Units Bought - Spoiled Units)`. Models holding costs, membership amortized fees, and pantry storage constraints.
- **Numerical Example:** Paper towels ($1.20/roll bulk vs $1.85/roll retail) vs fresh produce with 25% spoilage penalty.
- **Calculator Connection:** Embedded callout linking to `/decisions/bulk-buy`.
- **FAQs:** 3 (calculating membership payback, handling perishable bulk goods, pantry real estate value).
- **Classification:** **Strong**

---

## 3. Summary of Guide Findings

- All 16 guides satisfy search intent with comprehensive mathematical frameworks, clear tables, and real numerical illustrations.
- Every guide features bidirectional linking to its primary calculator and related educational topics.
- Every guide features 3 distinct, high-quality FAQ items ready for Google rich snippets.
- **Action for Implementation:** Ensure `src/pages/guides/[slug].astro` utilizes individual guide dates for `datePublished` and `dateModified` in the `Article` schema, using clean ISO 8601 formatting without arbitrary fabrication.
