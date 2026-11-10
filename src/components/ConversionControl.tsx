import { useEffect, useId, useState, type ChangeEvent, type CSSProperties } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  from: string;
  to: string;
  description: string;
  historical: number;
  value: number;
  onChange: (value: number) => void;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Percentage control: numeric field + synchronized slider + restore action. */
export function ConversionControl({ from, to, description, historical, value, onChange }: Props) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const changed = value !== historical;

  useEffect(() => {
    if (Number(draft) !== value || draft.trim() === '') setDraft(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleText = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d.]/g, '');
    setDraft(raw);
    if (raw === '' || raw === '.') return; // keep last valid value until blur
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onChange(round2(clamp(n)));
  };

  const handleBlur = () => setDraft(String(value));

  return (
    <div className="rounded-2xl border border-line p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id={`${id}-label`} className="text-[18px] font-medium">
            {from} to {to}
          </h3>
          <p id={`${id}-desc`} className="mt-1 text-[16px] text-muted">
            {description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <input
            id={`${id}-input`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className="h-12 w-[6.5rem] rounded-full border border-line-strong bg-transparent px-5 text-[17px] tabular outline-none transition-colors hover:border-muted focus:border-fg"
            value={draft}
            onChange={handleText}
            onBlur={handleBlur}
            onFocus={(e) => e.currentTarget.select()}
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-desc ${id}-hist`}
          />
          <span className="text-[17px] text-muted" aria-hidden="true">
            %
          </span>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={value}
        onChange={(e) => onChange(round2(clamp(Number(e.target.value))))}
        className="range mt-4"
        style={{ '--pct': `${value}%` } as CSSProperties}
        aria-labelledby={`${id}-label`}
        aria-valuetext={`${value}%`}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p id={`${id}-hist`} className="text-[16px] text-muted">
          Sumo Logic 2-year historical average: {historical}%
        </p>
        {changed && (
          <button type="button" className="link-action" onClick={() => onChange(historical)}>
            <RotateCcw size={13} strokeWidth={2.25} aria-hidden="true" />
            Restore default
          </button>
        )}
      </div>
    </div>
  );
}
