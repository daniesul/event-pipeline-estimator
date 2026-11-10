import { useEffect, useId, useState, type ChangeEvent } from 'react';

interface Props {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
  kind: 'integer' | 'currency';
  min: number;
  max: number;
}

const fmt = (n: number, kind: Props['kind']) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: kind === 'currency' ? 2 : 0 }).format(n);

/** Strip everything except digits (and a single decimal point for currency). */
function sanitize(raw: string, kind: Props['kind']): string {
  if (kind === 'integer') return raw.replace(/[^\d]/g, '');
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
}

/**
 * Text input with live thousands separators on blur. Invalid drafts never
 * reach the model: the last valid value stays in effect and an inline
 * message explains what's needed.
 */
export function NumberField({ label, hint, value, onChange, kind, min, max }: Props) {
  const id = useId();
  const [draft, setDraft] = useState(() => fmt(value, kind));
  const [error, setError] = useState<string | null>(null);

  // Keep the draft in sync when the value changes externally (e.g. reset).
  useEffect(() => {
    const parsed = Number(sanitize(draft, kind));
    if (parsed !== value) {
      setDraft(fmt(value, kind));
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = sanitize(e.target.value, kind);
    setDraft(raw);
    const n = Number(raw);
    if (raw === '' || raw === '.' || !Number.isFinite(n) || n < min) {
      setError(kind === 'integer' ? 'Enter a whole number of at least 1.' : 'Enter a value greater than $0.');
      return;
    }
    if (n > max) {
      setError(`Maximum is ${fmt(max, kind)}.`);
      onChange(max);
      return;
    }
    setError(null);
    onChange(n);
  };

  const handleBlur = () => {
    setDraft(fmt(value, kind));
    setError(null);
  };

  return (
    <div>
      <label htmlFor={id} className="block text-[17px] text-muted">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode={kind === 'integer' ? 'numeric' : 'decimal'}
        autoComplete="off"
        spellCheck={false}
        className="pill-input mt-3"
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={(e) => e.currentTarget.select()}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${id}-hint ${id}-err`}
      />
      <p id={`${id}-hint`} className="sr-only">
        {hint}
      </p>
      <p id={`${id}-err`} role="status" className="mt-2 min-h-5 pl-6 text-[13px] text-[#f87171]">
        {error ?? ''}
      </p>
    </div>
  );
}
