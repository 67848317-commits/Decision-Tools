import type { DecisionCategory, CategoryInfo, DecisionItem } from '../types';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'housing',
    name: 'Housing & Property',
    description: 'Compare long-term housing costs, mortgage equity, and residential commitments.',
  },
  {
    id: 'career',
    name: 'Career & Income',
    description: 'Evaluate total compensation packages, benefits, and commute trade-offs.',
  },
  {
    id: 'transportation',
    name: 'Transportation',
    description: 'Analyze vehicle ownership, leasing, and fuel efficiency economics.',
  },
  {
    id: 'finance',
    name: 'Personal Finance',
    description: 'Weigh fixed interest savings against prospective investment growth.',
  },
  {
    id: 'lifestyle',
    name: 'Goods & Spending',
    description: 'Measure repair thresholds, subscription lock-in, and bulk purchase efficiencies.',
  },
];

export const DECISIONS: DecisionItem[] = [
  {
    slug: 'rent-vs-buy',
    title: 'Rent vs. Buy Comparison',
    shortTitle: 'Rent vs Buy',
    tagline: 'Compare long-term wealth building, monthly cash outflows, and net housing costs.',
    description: 'Evaluate total estimated rental costs versus homeownership costs over your target horizon, accounting for mortgage amortization, equity growth, property taxes, maintenance, and transaction fees.',
    category: 'housing',
    featured: true,
    timeToEstimate: '3 min',
    optionAName: 'Renting',
    optionBName: 'Buying',
    keyMetric: 'Net Housing Cost Difference',
    primaryKeyword: 'rent vs buy calculator',
    relatedGuides: ['rent-vs-buy', 'rent-vs-buy-hidden-costs'],
    relatedDecisions: ['lease-vs-buy', 'debt-vs-invest'],
    faq: [
      {
        question: 'Does buying always build more wealth than renting?',
        answer: 'Not necessarily. Buying builds equity through debt paydown and potential appreciation, but involves substantial upfront transaction costs, mortgage interest, property taxes, insurance, and ongoing maintenance. Renting keeps capital liquid, which can be invested elsewhere.',
      },
      {
        question: 'What is net housing cost?',
        answer: 'Net housing cost calculates the true economic cost of living in a home by subtracting accumulated home equity and property value appreciation from the cumulative cash outflows (mortgage interest, taxes, insurance, repairs, and transaction fees).',
      },
    ],
  },
  {
    slug: 'job-offer',
    title: 'Job Offer Comparison',
    shortTitle: 'Job Offer',
    tagline: 'Compare base pay, bonuses, retirement matches, healthcare, and commute trade-offs between two roles.',
    description: 'Analyze total real compensation between two job opportunities by balancing base salaries, cash bonuses, 401(k) matching, health premiums, paid time off, and the hidden cost of commuting.',
    category: 'career',
    featured: true,
    timeToEstimate: '4 min',
    optionAName: 'Offer A',
    optionBName: 'Offer B',
    keyMetric: 'Net Effective Compensation',
    primaryKeyword: 'job offer comparison calculator',
    relatedGuides: ['how-to-compare-job-offers', 'how-to-value-job-benefits'],
    relatedDecisions: ['diy-vs-hire', 'debt-vs-invest'],
    faq: [
      {
        question: 'How does commute time factor into compensation?',
        answer: 'Commuting incurs direct vehicle or transit expenses as well as personal opportunity costs. While not deducted from pre-tax payroll, an unpaid 60-minute daily commute represents over 240 hours per year of uncompensated personal time.',
      },
      {
        question: 'Are fringe benefits included in total compensation?',
        answer: 'Yes, this model accounts for tangible employer contributions including 401(k) matches, employer-subsidized health premiums, and paid time off based on your daily rate.',
      },
    ],
  },
  {
    slug: 'lease-vs-buy',
    title: 'Car Lease vs. Buy Comparison',
    shortTitle: 'Lease vs Buy',
    tagline: 'Examine cumulative cash outflows, equity retention, and cost per mile for vehicle acquisition.',
    description: 'Calculate the true financial difference between leasing a new vehicle and financing or purchasing it outright, factoring in monthly payments, residual value, down payments, and ownership equity.',
    category: 'transportation',
    featured: true,
    timeToEstimate: '3 min',
    optionAName: 'Lease Vehicle',
    optionBName: 'Purchase Vehicle',
    keyMetric: 'Net Cost Difference After Term',
    primaryKeyword: 'lease vs buy calculator',
    relatedGuides: ['lease-vs-buy', 'true-cost-of-leasing-a-car'],
    relatedDecisions: ['gas-vs-ev', 'rent-vs-buy'],
    faq: [
      {
        question: 'Why does leasing often have lower monthly payments?',
        answer: 'Lease payments only fund the vehicle depreciation and financing charges during the lease term (typically 36 months), whereas purchase loan payments amortize the entire vehicle price.',
      },
      {
        question: 'What happens at the end of a lease compared to a purchase?',
        answer: 'At the end of a lease, you return the vehicle with zero asset value unless you exercise a buyout option. With purchase financing, you own the remaining equity value of the vehicle after loan maturity.',
      },
    ],
  },
  {
    slug: 'gas-vs-ev',
    title: 'Gasoline vs. Electric Vehicle (EV) Cost',
    shortTitle: 'Gas vs EV',
    tagline: 'Compare fuel versus home electricity costs, scheduled maintenance, and multi-year total cost of ownership.',
    description: 'Weigh the upfront price premium of an electric vehicle against lower per-mile electricity costs, reduced routine powertrain maintenance, and driving habits over a 5-year operating horizon.',
    category: 'transportation',
    featured: true,
    timeToEstimate: '3 min',
    optionAName: 'Internal Combustion (Gas)',
    optionBName: 'Electric Vehicle (EV)',
    keyMetric: '5-Year Total Energy & Maintenance Cost',
    primaryKeyword: 'gas vs electric car cost calculator',
    relatedGuides: ['gas-vs-ev-cost', 'how-to-calculate-ev-charging-cost'],
    relatedDecisions: ['lease-vs-buy', 'rent-vs-buy'],
    faq: [
      {
        question: 'How is EV energy cost calculated?',
        answer: 'EV energy cost is calculated by dividing annual miles by the vehicle efficiency (miles per kWh) and multiplying by your home electric utility tariff per kWh, adjusted for charging efficiency losses.',
      },
      {
        question: 'Do electric vehicles require less routine maintenance?',
        answer: 'Generally yes. EVs eliminate oil changes, spark plugs, timing belts, and exhaust systems, while regenerative braking substantially reduces brake pad wear.',
      },
    ],
  },
  {
    slug: 'buy-vs-repair',
    title: 'Buy New vs. Repair Existing Item',
    shortTitle: 'Buy vs Repair',
    tagline: 'Determine when repairing an appliance, electronics, or vehicle makes mathematical sense.',
    description: 'Compare the cost of fixing a malfunctioning appliance, device, or vehicle against replacing it with a new model by analyzing expected remaining service life, repair frequencies, and operating efficiency.',
    category: 'lifestyle',
    featured: false,
    timeToEstimate: '2 min',
    optionAName: 'Repair Existing',
    optionBName: 'Buy Replacement',
    keyMetric: 'Annualized Operating Cost',
    primaryKeyword: 'repair or replace calculator',
    relatedGuides: ['buy-vs-repair', 'when-does-repairing-an-appliance-make-sense'],
    relatedDecisions: ['diy-vs-hire', 'lease-vs-buy'],
    faq: [
      {
        question: 'What is the 50% rule of thumb for repairs?',
        answer: 'A common consumer benchmark evaluates replacement when the repair estimate exceeds 50% of the cost of a brand-new comparable item, or when the product has surpassed half of its expected operating lifespan.',
      },
      {
        question: 'Does this calculator factor in energy efficiency?',
        answer: 'Yes, replacement models frequently deliver lower annual utility or operating costs, which can offset higher initial purchase prices over several years.',
      },
    ],
  },
  {
    slug: 'diy-vs-hire',
    title: 'DIY vs. Hire Professional',
    shortTitle: 'DIY vs Hire',
    tagline: 'Balance material costs and tool investments against contractor bids and the value of your personal hours.',
    description: 'Quantify the real cost of home improvement, repair, or creative tasks by accounting for project materials, specialty tool purchases, execution hours, and your effective personal hourly rate.',
    category: 'lifestyle',
    featured: false,
    timeToEstimate: '2 min',
    optionAName: 'Do It Yourself (DIY)',
    optionBName: 'Hire Professional',
    keyMetric: 'Total Resource Cost (Cash + Time)',
    primaryKeyword: 'DIY vs hire calculator',
    relatedGuides: ['diy-vs-hire', 'how-to-estimate-the-cost-of-diy-projects'],
    relatedDecisions: ['buy-vs-repair', 'job-offer'],
    faq: [
      {
        question: 'Why assign a dollar value to personal DIY time?',
        answer: 'Assigning an hourly rate reflects the trade-off between spending hours on manual tasks versus professional work, family time, or leisure. Even without direct wage loss, your time represents finite bandwidth.',
      },
      {
        question: 'Are tool costs included?',
        answer: 'Yes. First-time DIY projects often require specialized tools, safety gear, and supplies that narrow the initial financial gap compared to professional quotes.',
      },
    ],
  },
  {
    slug: 'debt-vs-invest',
    title: 'Pay Off Debt vs. Invest Capital',
    shortTitle: 'Debt vs Invest',
    tagline: 'Compare fixed interest savings from early debt reduction against prospective market investment compounding.',
    description: 'Evaluate the mathematical and risk trade-offs between accelerating payments on outstanding debt balances versus investing that surplus capital in broad market index funds over time.',
    category: 'finance',
    featured: true,
    timeToEstimate: '3 min',
    optionAName: 'Accelerate Debt Payoff',
    optionBName: 'Invest Available Capital',
    keyMetric: 'Net Financial Position Difference',
    primaryKeyword: 'pay off debt vs invest calculator',
    relatedGuides: ['pay-off-debt-vs-invest', 'how-to-compare-debt-interest-with-investment-returns'],
    relatedDecisions: ['rent-vs-buy', 'job-offer'],
    faq: [
      {
        question: 'How is eliminating fixed debt interest mathematically different from investment returns?',
        answer: 'Paying off debt with an 8% APR avoids fixed interest charges of 8% on that capital under the contractual terms of the loan. In contrast, investment returns fluctuate with market performance, carry volatility, and are not predetermined.',
      },
      {
        question: 'How do marginal tax rates influence this comparison?',
        answer: 'Investment returns may be subject to capital gains taxes unless housed inside tax-advantaged retirement accounts, whereas avoiding consumer interest is equivalent to post-tax gains.',
      },
    ],
  },
  {
    slug: 'buy-vs-subscribe',
    title: 'Buy Outright vs. Monthly Subscription',
    shortTitle: 'Buy vs Subscribe',
    tagline: 'Identify the break-even threshold between one-time software or equipment ownership and recurring subscriptions.',
    description: 'Calculate cumulative costs over 1, 3, and 5-year periods to reveal exactly when paying an upfront purchase price becomes more cost-effective than continuous monthly or annual subscription fees.',
    category: 'lifestyle',
    featured: false,
    timeToEstimate: '2 min',
    optionAName: 'One-Time Purchase',
    optionBName: 'Recurring Subscription',
    keyMetric: 'Break-Even Duration',
    primaryKeyword: 'buy vs subscription calculator',
    relatedGuides: ['buy-vs-subscribe', 'how-to-calculate-subscription-break-even'],
    relatedDecisions: ['lease-vs-buy', 'bulk-buy'],
    faq: [
      {
        question: 'What is a subscription break-even point?',
        answer: 'The break-even point represents the exact number of months or years of service where the cumulative sum of subscription payments equals the one-time upfront purchase price.',
      },
      {
        question: 'What benefits does a subscription provide besides lower initial cash outlays?',
        answer: 'Subscriptions frequently include ongoing software updates, cloud hosting, customer support, and the flexibility to cancel whenever the tool is no longer actively needed.',
      },
    ],
  },
  {
    slug: 'new-vs-used',
    title: 'New vs. Used Purchase Comparison',
    shortTitle: 'New vs Used',
    tagline: 'Quantify initial steep depreciation, warranty protection, financing rates, and maintenance burdens.',
    description: 'Measure the comprehensive multi-year total ownership cost of acquiring a brand-new asset versus a late-model pre-owned alternative, including depreciation curves, insurance premiums, and upkeep.',
    category: 'lifestyle',
    featured: false,
    timeToEstimate: '3 min',
    optionAName: 'Purchase New',
    optionBName: 'Purchase Used',
    keyMetric: 'Total 3-Year & 5-Year Ownership Cost',
    primaryKeyword: 'new vs used car calculator',
    relatedGuides: ['new-vs-used', 'how-to-compare-the-cost-of-a-new-and-used-car'],
    relatedDecisions: ['lease-vs-buy', 'gas-vs-ev'],
    faq: [
      {
        question: 'Why does a new vehicle lose significant value in the first two years?',
        answer: 'New goods undergo immediate retail-to-wholesale depreciation upon transfer of title. A typical new vehicle loses 20% to 30% of its initial value within the first 12 to 24 months.',
      },
      {
        question: 'Does buying used always result in higher repair costs?',
        answer: 'While older vehicles or equipment experience greater wear-and-tear and lack comprehensive factory warranties, the reduced initial depreciation often outweighs moderate maintenance expenditures.',
      },
    ],
  },
  {
    slug: 'bulk-buy',
    title: 'Bulk Buying Savings & Waste Analysis',
    shortTitle: 'Bulk Buy',
    tagline: 'Determine if volume discounts overcome storage constraints, spoilage rates, and upfront capital costs.',
    description: 'Compare standard retail unit pricing with warehouse bulk packaging discounts, factoring in expected household consumption velocity, storage overhead, and potential spoilage waste.',
    category: 'lifestyle',
    featured: false,
    timeToEstimate: '2 min',
    optionAName: 'Standard Unit Size',
    optionBName: 'Bulk Quantity Package',
    keyMetric: 'Net Savings After Spoilage & Waste',
    primaryKeyword: 'bulk buying calculator',
    relatedGuides: ['bulk-buying', 'how-to-calculate-bulk-purchase-savings'],
    relatedDecisions: ['buy-vs-subscribe', 'buy-vs-repair'],
    faq: [
      {
        question: 'How does product waste undermine bulk savings?',
        answer: 'If a 40% per-unit discount results in 25% of the perishable contents being discarded before expiration, the effective realized savings diminish drastically or can even result in higher net expenditures.',
      },
      {
        question: 'Which product categories yield the highest bulk efficiency?',
        answer: 'Non-perishable household staples (paper products, laundry detergent, shelf-stable pantry goods) provide reliable long-term savings because the risk of spoilage is essentially zero.',
      },
    ],
  },
];

export function getDecisionBySlug(slug: string): DecisionItem | undefined {
  return DECISIONS.find((d) => d.slug === slug);
}

export function getDecisionsByCategory(category: DecisionCategory): DecisionItem[] {
  return DECISIONS.filter((d) => d.category === category);
}

export function getFeaturedDecisions(): DecisionItem[] {
  return DECISIONS.filter((d) => d.featured);
}
