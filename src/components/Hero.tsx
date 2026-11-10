import { ChartNoAxesCombined, Database, SlidersHorizontal } from 'lucide-react';

export function Hero() {
  return (
    <header>
      <p className="flex items-center gap-3 text-[15px] font-medium tracking-[0.06em] text-muted uppercase">
        <ChartNoAxesCombined size={22} strokeWidth={1.75} className="text-fg" aria-hidden="true" />
        Field marketing planning tool
      </p>
      <h1 className="mt-4 text-[2.25rem] leading-[1.08] font-semibold tracking-tight sm:text-[3.25rem]">
        Third-Party Event Pipeline Estimator
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed sm:text-[19px]">
        Forecast the potential pipeline impact of your next trade show or industry conference using historical
        conversion performance and a customizable event activation strategy.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2.5" aria-label="Highlights">
        <li className="inline-flex items-center gap-2 rounded-full bg-raised px-3.5 py-1.5 text-[15px] font-medium tracking-wide">
          <Database size={15} aria-hidden="true" /> 2 years of historical data
        </li>
        <li className="inline-flex items-center gap-2 rounded-full bg-raised px-3.5 py-1.5 text-[15px] font-medium tracking-wide">
          <SlidersHorizontal size={15} aria-hidden="true" /> Customizable forecasts
        </li>
      </ul>
      <p className="mt-4 text-[14px] leading-relaxed text-muted sm:text-[15px]">
        Built on two years of actual Sumo Logic marketing and sales conversion data, this tool provides a directional
        estimate of event-driven pipeline. Outcomes vary based on sponsorship visibility, attendee engagement, activation
        quality, and sales follow-up. Adjust the inputs below to explore different scenarios.
      </p>
    </header>
  );
}
