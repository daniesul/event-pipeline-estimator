import { SPONSORSHIP_OPTIONS, type SponsorshipId } from '../lib/model';

interface Props {
  value: SponsorshipId;
  onChange: (id: SponsorshipId) => void;
}

/** Native radio group (arrow-key navigation for free), styled as round radios. */
export function SponsorshipSelector({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="text-[18px] font-medium">Sponsorship footprint</legend>
      <div className="mt-4 space-y-1">
        {SPONSORSHIP_OPTIONS.map((option) => {
          const selected = option.id === value;
          return (
            <label
              key={option.id}
              className="group flex cursor-pointer items-center gap-4 rounded-2xl px-1 py-2.5 transition-colors"
            >
              <input
                type="radio"
                name="sponsorship"
                value={option.id}
                checked={selected}
                onChange={() => onChange(option.id)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                  selected ? 'border-fg bg-fg' : 'border-line-strong group-hover:border-muted'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${selected ? 'bg-bg' : 'bg-transparent'}`} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[18px] font-medium">{option.name}</span>
                <span className="block text-[16px] text-muted">{option.detail}</span>
              </span>
              <span className={`text-[18px] tabular ${selected ? 'text-fg' : 'text-muted'}`}>{option.baseRate}%</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
