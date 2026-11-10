import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DISCLAIMER, METHODOLOGY } from '../lib/content';

export function Methodology() {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-2xl border border-line">
      <h2 id={`${id}-title`} className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-5 text-left text-[18px] font-medium transition-colors hover:bg-raised/50 sm:px-6"
        >
          Methodology &amp; assumptions
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={`shrink-0 text-muted transition-transform duration-300 ease-out-quart ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </h2>

      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-title`} hidden={!open} className="px-5 pb-6 sm:px-6">
        <ul className="space-y-3 border-t border-line pt-5 text-[16px] leading-relaxed text-muted">
          {METHODOLOGY.map((para, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span>{para}</span>
            </li>
          ))}
        </ul>
        <pre className="mt-6 overflow-x-auto rounded-xl bg-panel p-4 text-[13px] leading-6 text-fg">
{`Engaged attendees = Attendees × engagement rate
MQLs              = Engaged × engagement-to-MQL %
Sales meetings    = MQLs × MQL-to-meeting %
Opportunities     = Meetings × meeting-to-opportunity %
New pipeline      = Opportunities × average opportunity value
Engagement rate   = footprint base + activation uplifts (max 25%)`}
        </pre>
        <p className="mt-5 text-[14px] text-muted">{DISCLAIMER}</p>
      </div>
    </section>
  );
}
