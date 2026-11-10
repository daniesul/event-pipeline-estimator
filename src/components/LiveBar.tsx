import { ArrowDown } from 'lucide-react';
import { formatCount, formatCurrency, formatRate } from '../lib/format';
import type { ForecastResult } from '../lib/model';

interface Props {
  result: ForecastResult;
  visible: boolean;
}

/**
 * Floating pill that keeps the live pipeline figure in view while the user
 * edits inputs above the results. Decorative duplicate of the results, so it
 * is hidden from assistive tech.
 */
export function LiveBar({ result, visible }: Props) {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 transition-all duration-300 ease-out-quart ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      <div className="flex items-center gap-4 rounded-full border border-line-strong bg-surface/95 py-2 pr-2 pl-6 shadow-2xl shadow-black/50 backdrop-blur-sm sm:gap-6">
        <span className="text-[13px] text-muted">Live forecast</span>
        <span className="text-[20px] font-semibold tracking-tight tabular">{formatCurrency(result.pipeline)}</span>
        <span className="hidden text-[13px] text-muted tabular sm:inline">
          {formatRate(result.engagementRate)} engaged · {formatCount(result.opportunities)} opps
        </span>
        <a
          href="#results"
          tabIndex={-1}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-fg px-4 text-[13px] font-medium text-[#111] transition-colors hover:bg-white"
        >
          Results <ArrowDown size={14} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
