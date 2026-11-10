import { Columns3 } from 'lucide-react';
import { compareScenarios, type ForecastInputs, type ForecastResult, type SponsorshipId } from '../lib/model';
import { formatCount, formatCurrency, formatRate } from '../lib/format';
import { SectionHeader } from './SectionHeader';

interface Props {
  inputs: ForecastInputs;
  onSelect: (id: SponsorshipId) => void;
}

const ROWS: { label: string; get: (r: ForecastResult) => string; emphasis?: boolean }[] = [
  { label: 'Engagement rate', get: (r) => formatRate(r.engagementRate) },
  { label: 'Attendee engagements', get: (r) => formatCount(r.engagedAttendees) },
  { label: 'MQLs', get: (r) => formatCount(r.mqls) },
  { label: 'Sales meetings', get: (r) => formatCount(r.meetings) },
  { label: 'Opportunities', get: (r) => formatCount(r.opportunities) },
  { label: 'Projected new pipeline', get: (r) => formatCurrency(r.pipeline), emphasis: true },
];

export function ScenarioComparison({ inputs, onSelect }: Props) {
  const scenarios = compareScenarios(inputs);

  return (
    <section aria-labelledby="compare-title">
      <SectionHeader number="5" title="Compare sponsorship scenarios" id="compare-title" icon={Columns3}>
        Your selected activations and conversion rates applied to every footprint. This compares potential pipeline,
        not financial ROI; event costs are not included.
      </SectionHeader>

      <div
        className="mt-6 overflow-x-auto rounded-2xl border border-line"
        role="region"
        aria-labelledby="compare-title"
        tabIndex={0}
      >
        <table className="w-full min-w-[620px] border-collapse text-left">
          <caption className="sr-only">
            Projected outcomes for each sponsorship footprint. The current selection is marked.
          </caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="px-5 py-4 text-[14px] font-normal text-muted">
                Metric
              </th>
              {scenarios.map(({ option }) => {
                const selected = option.id === inputs.sponsorship;
                return (
                  <th
                    key={option.id}
                    scope="col"
                    aria-current={selected ? 'true' : undefined}
                    className={`px-4 py-4 align-top font-normal ${selected ? 'bg-raised' : ''}`}
                  >
                    <span className="block text-[15px] leading-snug font-medium">{option.name}</span>
                    {selected ? (
                      <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-0.5 text-[12px] text-accent">
                        Selected
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelect(option.id)}
                        className="mt-1.5 text-[12px] text-muted underline decoration-line-strong underline-offset-4 hover:text-fg"
                        aria-label={`Select ${option.name}`}
                      >
                        Select
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-b-0">
                <th
                  scope="row"
                  className={`px-5 py-3.5 text-[15px] font-normal ${row.emphasis ? 'text-fg' : 'text-muted'}`}
                >
                  {row.label}
                </th>
                {scenarios.map(({ option, result }) => {
                  const selected = option.id === inputs.sponsorship;
                  return (
                    <td
                      key={option.id}
                      className={`px-4 py-3.5 tabular ${row.emphasis ? 'text-[17px] font-semibold' : 'text-[15px]'} ${
                        selected ? 'bg-raised' : ''
                      }`}
                    >
                      {row.get(result)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-muted sm:hidden">Scroll sideways to compare all four →</p>
    </section>
  );
}
