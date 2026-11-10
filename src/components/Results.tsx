import type { ReactNode } from 'react';
import { ChartColumn } from 'lucide-react';
import type { ForecastInputs, ForecastResult } from '../lib/model';
import { formatCount, formatCurrency, formatCurrencyInput, formatPlain } from '../lib/format';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { SectionHeader } from './SectionHeader';

interface Props {
  inputs: ForecastInputs;
  result: ForecastResult;
  actions: ReactNode;
}

function Kpi({ label, value }: { label: string; value: number }) {
  const animated = useAnimatedNumber(value);
  return (
    <div className="rounded-2xl border border-line px-5 py-5 sm:px-6">
      <p className="text-[16px] text-muted">{label}</p>
      <p className="mt-1 text-[2.5rem] leading-tight font-semibold tracking-tight tabular sm:text-[2.75rem]">
        <span aria-hidden="true">{formatCount(animated)}</span>
        <span className="sr-only">{formatCount(value)}</span>
      </p>
    </div>
  );
}

export function Results({ inputs, result, actions }: Props) {
  const pipeline = useAnimatedNumber(result.pipeline, 600);

  return (
    <section aria-labelledby="results-title" id="results" className="scroll-mt-6">
      <SectionHeader number="4" title="Your projected pipeline" id="results-title" icon={ChartColumn}>
        Based on your current sponsorship strategy, engagement assumptions and conversion rates.
      </SectionHeader>

      <div className="mt-6 rounded-3xl bg-panel px-6 py-8 text-center sm:py-10">
        <p className="text-[17px] text-muted">Estimated new pipeline generated</p>
        <p
          className="mt-1 text-[clamp(2.75rem,9vw,4.5rem)] leading-tight font-semibold tracking-tight tabular [overflow-wrap:anywhere]"
          aria-hidden="true"
        >
          {formatCurrency(pipeline)}
        </p>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          Estimated new pipeline generated: {formatCurrency(result.pipeline)}
        </p>
        <p className="text-[16px] text-muted">Directional forecast · Not guaranteed revenue</p>
        <p className="mt-3 text-[13px] text-muted/70 tabular">
          {formatPlain(result.opportunities)} opportunities × {formatCurrencyInput(inputs.avgOpportunityValue)} average
          opportunity value
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Kpi label="Attendee engagements" value={result.engagedAttendees} />
        <Kpi label="Marketing-qualified leads" value={result.mqls} />
        <Kpi label="Sales meetings" value={result.meetings} />
        <Kpi label="Sales opportunities" value={result.opportunities} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{actions}</div>
    </section>
  );
}
