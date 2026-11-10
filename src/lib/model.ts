/**
 * Central forecasting model.
 *
 * Every number shown in the UI, the scenario comparison, the clipboard
 * summary and the PDF is produced by `calculateForecast`, so all outputs
 * stay consistent. Values are kept at full precision; rounding happens
 * only at display time (see format.ts).
 */

export type SponsorshipId = 'small' | 'standard' | 'large' | 'premier';

export type ActivationId = 'speaking' | 'demos' | 'swag' | 'vip' | 'partner';

export interface SponsorshipOption {
  id: SponsorshipId;
  name: string;
  detail: string;
  /** Base engagement rate, in percentage points. */
  baseRate: number;
}

export interface ActivationOption {
  id: ActivationId;
  name: string;
  description: string;
  /** Engagement uplift, in percentage points. */
  uplift: number;
}

export interface ConversionRates {
  /** All values are percentages, 0–100. */
  engagementToMql: number;
  mqlToMeeting: number;
  meetingToOpportunity: number;
}

export interface ForecastInputs {
  attendees: number;
  avgOpportunityValue: number;
  sponsorship: SponsorshipId;
  activations: ActivationId[];
  conversions: ConversionRates;
}

export interface ForecastResult {
  /** Engagement rate after uplifts and cap, in percentage points. */
  engagementRate: number;
  /** Uncapped sum, so the UI can say when the cap applied. */
  uncappedEngagementRate: number;
  isCapped: boolean;
  engagedAttendees: number;
  mqls: number;
  meetings: number;
  opportunities: number;
  pipeline: number;
}

export const SPONSORSHIP_OPTIONS: readonly SponsorshipOption[] = [
  { id: 'small', name: 'Small footprint', detail: 'Tabletop or small booth presence', baseRate: 5 },
  { id: 'standard', name: 'Standard sponsorship', detail: '10 × 10 or 10 × 20 booth', baseRate: 10 },
  { id: 'large', name: 'Large footprint', detail: '20 × 20 booth with greater visibility', baseRate: 13 },
  { id: 'premier', name: 'Premier sponsorship', detail: 'Major sponsorship and prominent show presence', baseRate: 16 },
];

export const ACTIVATION_OPTIONS: readonly ActivationOption[] = [
  { id: 'speaking', name: 'Sponsored speaking session', description: 'Thought leadership or breakout presentation', uplift: 2 },
  { id: 'demos', name: 'Interactive demo experience', description: 'Hands-on demos, games or additional demo stations', uplift: 1.5 },
  { id: 'swag', name: 'Premium giveaway or booth attraction', description: 'High-value swag, creative experiences or engagement incentives', uplift: 1 },
  { id: 'vip', name: 'Ancillary event', description: 'VIP experience, customer reception or co-sponsored event activations', uplift: 3 },
  { id: 'partner', name: 'Partner co-marketing', description: 'Joint events, promotions and partner-led engagement', uplift: 1.5 },
];

/** Maximum modeled engagement rate, in percentage points. */
export const ENGAGEMENT_CAP = 25;

/** Reference point shown beside the engagement rate. */
export const STANDARD_REFERENCE_RATE = 10;

/** Two-year Sumo Logic historical averages. */
export const HISTORICAL_CONVERSIONS: Readonly<ConversionRates> = {
  engagementToMql: 16,
  mqlToMeeting: 20,
  meetingToOpportunity: 34,
};

export const DEFAULT_INPUTS: Readonly<ForecastInputs> = {
  attendees: 20_000,
  avgOpportunityValue: 50_000,
  sponsorship: 'standard',
  activations: [],
  conversions: { ...HISTORICAL_CONVERSIONS },
};

export const LIMITS = {
  attendees: { min: 1, max: 10_000_000 },
  avgOpportunityValue: { min: 1, max: 1_000_000_000 },
  percent: { min: 0, max: 100 },
} as const;

/** Coerce anything non-finite or negative to a safe, bounded number. */
export function safeNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function getSponsorship(id: SponsorshipId): SponsorshipOption {
  return SPONSORSHIP_OPTIONS.find((o) => o.id === id) ?? SPONSORSHIP_OPTIONS[1];
}

export function engagementRateFor(sponsorship: SponsorshipId, activations: readonly ActivationId[]) {
  const base = getSponsorship(sponsorship).baseRate;
  const unique = new Set(activations);
  const uplift = ACTIVATION_OPTIONS.filter((a) => unique.has(a.id)).reduce((sum, a) => sum + a.uplift, 0);
  // Round away float noise such as 10 + 1.5 + 1.5 = 12.999999… before comparing to the cap.
  const uncapped = Math.round((base + uplift) * 1e9) / 1e9;
  return { uncapped, rate: Math.min(uncapped, ENGAGEMENT_CAP) };
}

export function calculateForecast(inputs: ForecastInputs): ForecastResult {
  const attendees = safeNumber(inputs.attendees, 0, LIMITS.attendees.max);
  const avgValue = safeNumber(inputs.avgOpportunityValue, 0, LIMITS.avgOpportunityValue.max);
  const pct = (v: number) => safeNumber(v, LIMITS.percent.min, LIMITS.percent.max) / 100;

  const { uncapped, rate } = engagementRateFor(inputs.sponsorship, inputs.activations);

  // Full precision throughout — no intermediate rounding.
  const engagedAttendees = attendees * (rate / 100);
  const mqls = engagedAttendees * pct(inputs.conversions.engagementToMql);
  const meetings = mqls * pct(inputs.conversions.mqlToMeeting);
  const opportunities = meetings * pct(inputs.conversions.meetingToOpportunity);
  const pipeline = opportunities * avgValue;

  return {
    engagementRate: rate,
    uncappedEngagementRate: uncapped,
    isCapped: uncapped > ENGAGEMENT_CAP,
    engagedAttendees,
    mqls,
    meetings,
    opportunities,
    pipeline,
  };
}

/** Same inputs, evaluated for every sponsorship footprint. */
export function compareScenarios(inputs: ForecastInputs) {
  return SPONSORSHIP_OPTIONS.map((option) => ({
    option,
    result: calculateForecast({ ...inputs, sponsorship: option.id }),
  }));
}

export function isHistorical(conversions: ConversionRates): boolean {
  return (
    conversions.engagementToMql === HISTORICAL_CONVERSIONS.engagementToMql &&
    conversions.mqlToMeeting === HISTORICAL_CONVERSIONS.mqlToMeeting &&
    conversions.meetingToOpportunity === HISTORICAL_CONVERSIONS.meetingToOpportunity
  );
}
