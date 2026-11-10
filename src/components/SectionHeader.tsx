import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  number: string;
  title: string;
  id: string;
  icon: LucideIcon;
  children?: ReactNode;
}

/** "1. Conference inputs" heading with icon tile and description. */
export function SectionHeader({ number, title, id, icon: Icon, children }: Props) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-panel" aria-hidden="true">
          <Icon size={20} strokeWidth={1.75} />
        </span>
        <h2 id={id} className="text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-[2.25rem]">
          {number}. {title}
        </h2>
      </div>
      {children && <div className="mt-4 text-[16px] leading-relaxed text-muted sm:text-[17px]">{children}</div>}
    </div>
  );
}
