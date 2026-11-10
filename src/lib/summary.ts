import {
  ACTIVATION_OPTIONS,
  type ForecastInputs,
  type ForecastResult,
  getSponsorship,
  isHistorical,
} from './model';
import { formatCount, formatCurrency, formatCurrencyInput, formatPercent, formatRate } from './format';
import { APP_TITLE, ESTIMATE_NOTE } from './content';

export function selectedActivationLabels(inputs: ForecastInputs): string[] {
  return ACTIVATION_OPTIONS.filter((a) => inputs.activations.includes(a.id)).map(
    (a) => `${a.name} (+${a.uplift} pts)`,
  );
}

/** Plain-text summary for the clipboard. */
export function buildTextSummary(inputs: ForecastInputs, result: ForecastResult): string {
  const sponsorship = getSponsorship(inputs.sponsorship);
  const activations = selectedActivationLabels(inputs);
  const c = inputs.conversions;
  const source = isHistorical(c) ? 'Sumo Logic 2-year historical averages' : 'Customized';

  return [
    APP_TITLE.toUpperCase(),
    '',
    `Estimated new pipeline: ${formatCurrency(result.pipeline)}`,
    '',
    'INPUTS',
    `Expected attendees: ${formatCount(inputs.attendees)}`,
    `Average opportunity value: ${formatCurrencyInput(inputs.avgOpportunityValue)}`,
    `Sponsorship footprint: ${sponsorship.name} (${sponsorship.baseRate}% base engagement)`,
    `Additional activations: ${activations.length ? activations.join('; ') : 'None'}`,
    `Estimated engagement rate: ${formatRate(result.engagementRate)}${result.isCapped ? ' (capped)' : ''}`,
    '',
    `CONVERSION RATES (${source})`,
    `Engagement to MQL: ${formatPercent(c.engagementToMql)}`,
    `MQL to sales meeting: ${formatPercent(c.mqlToMeeting)}`,
    `Sales meeting to opportunity: ${formatPercent(c.meetingToOpportunity)}`,
    '',
    'PROJECTED OUTCOMES',
    `Attendee engagements: ${formatCount(result.engagedAttendees)}`,
    `Marketing-qualified leads: ${formatCount(result.mqls)}`,
    `Sales meetings: ${formatCount(result.meetings)}`,
    `Sales opportunities: ${formatCount(result.opportunities)}`,
    `Projected new pipeline: ${formatCurrency(result.pipeline)}`,
    '',
    ESTIMATE_NOTE,
  ].join('\n');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}
