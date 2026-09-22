export type DecisionCategory =
  | 'housing'
  | 'career'
  | 'transportation'
  | 'lifestyle'
  | 'finance';

export interface CategoryInfo {
  id: DecisionCategory;
  name: string;
  description: string;
  count?: number;
}

export interface DecisionItem {
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  category: DecisionCategory;
  featured: boolean;
  timeToEstimate: string; // e.g. "3 min"
  optionAName: string;
  optionBName: string;
  keyMetric: string;
  primaryKeyword?: string;
  relatedGuides: string[];
  relatedDecisions: string[];
  faq: Array<{ question: string; answer: string }>;
}

export interface GuideItem {
  slug: string;
  title: string;
  description: string;
  category: DecisionCategory;
  readTime: string;
  primaryKeyword?: string;
  relatedDecisionSlug: string;
  relatedGuides: string[];
}
