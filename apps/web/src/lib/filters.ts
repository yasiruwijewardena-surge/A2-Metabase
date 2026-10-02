import type { CaseStudy } from './types';

/** Shared so every filtered route agrees on what "matching" means. */
export const matches = (
  c: CaseStudy,
  industry: string | null,
  useCase: string | null,
): boolean =>
  (!industry || c.company?.industry?.slug === industry) &&
  (!useCase || c.useCases.some((u) => u.slug === useCase));

export const filterCases = (
  cases: CaseStudy[],
  industry: string | null = null,
  useCase: string | null = null,
) => cases.filter((c) => matches(c, industry, useCase));
