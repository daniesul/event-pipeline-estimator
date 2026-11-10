import { Check } from 'lucide-react';
import { ACTIVATION_OPTIONS, type ActivationId } from '../lib/model';

interface Props {
  value: ActivationId[];
  onToggle: (id: ActivationId) => void;
}

export function ActivationToggles({ value, onToggle }: Props) {
  return (
    <fieldset>
      <legend className="text-[18px] font-medium">Additional activations</legend>
      <p className="mt-2 text-[16px] text-muted">
        Select all that apply. Each activation contributes an illustrative uplift to the modeled attendee engagement rate.
      </p>
      <div className="mt-4 space-y-1">
        {ACTIVATION_OPTIONS.map((option) => {
          const checked = value.includes(option.id);
          return (
            <label key={option.id} className="group flex cursor-pointer items-start gap-4 rounded-2xl px-1 py-2.5">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.id)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                  checked ? 'border-accent bg-accent text-[#111]' : 'border-line-strong text-transparent group-hover:border-muted'
                }`}
              >
                <Check size={16} strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[18px] font-medium">{option.name}</span>
                <span className="block text-[16px] text-muted">{option.description}</span>
              </span>
              <span className="pt-0.5 text-[18px] text-accent tabular">+{option.uplift} pts</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
