import { ENGAGEMENT_CAP, STANDARD_REFERENCE_RATE, type ForecastResult } from '../lib/model';
import { formatPoints, formatRate } from '../lib/format';

interface Props {
  result: ForecastResult;
  baseRate: number;
}

export function EngagementReadout({ result }: Props) {
  const delta = result.engagementRate - STANDARD_REFERENCE_RATE;
  const fill = (result.engagementRate / ENGAGEMENT_CAP) * 100;
  const deltaColor = delta > 0 ? 'text-accent' : delta < 0 ? 'text-[#f0a35e]' : 'text-accent';

  return (
    <div className="rounded-2xl bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[16px] text-muted" id="engagement-label">
            Calculated attendee engagement rate
          </p>
          <p
            className="mt-1 text-[3.25rem] leading-none font-semibold tracking-tight tabular sm:text-[3.75rem]"
            aria-labelledby="engagement-label"
            aria-live="polite"
          >
            {formatRate(result.engagementRate)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[16px] text-muted">Compared with standard 10% baseline</p>
          <p className={`mt-2 text-[18px] tabular ${deltaColor}`}>{formatPoints(delta).replace('±', '+')}</p>
        </div>
      </div>

      <div
        className="mt-5 h-4 overflow-hidden rounded-full bg-raised"
        role="meter"
        aria-label="Engagement rate relative to the 25% maximum"
        aria-valuemin={0}
        aria-valuemax={ENGAGEMENT_CAP}
        aria-valuenow={result.engagementRate}
      >
        <div
          className="h-full rounded-full bg-accent-bar transition-[width] duration-300 ease-out-quart"
          style={{ width: `${fill}%` }}
        />
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        Maximum modeled engagement: {ENGAGEMENT_CAP}%.
        {result.isCapped && ` Your combined selections (${formatRate(result.uncappedEngagementRate)}) are capped.`} The
        footprint rates and activation uplifts are illustrative assumptions, not verified historical coefficients.
      </p>
    </div>
  );
}
