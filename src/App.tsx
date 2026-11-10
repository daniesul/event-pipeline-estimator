import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, GitBranch, LoaderCircle, Presentation, RotateCcw, Users } from 'lucide-react';
import {
  type ActivationId,
  type ConversionRates,
  DEFAULT_INPUTS,
  type ForecastInputs,
  HISTORICAL_CONVERSIONS,
  LIMITS,
  type SponsorshipId,
  calculateForecast,
  getSponsorship,
  isHistorical,
} from './lib/model';
import { buildTextSummary, copyText } from './lib/summary';
import { DISCLAIMER } from './lib/content';
import { Hero } from './components/Hero';
import { SectionHeader } from './components/SectionHeader';
import { NumberField } from './components/NumberField';
import { SponsorshipSelector } from './components/SponsorshipSelector';
import { ActivationToggles } from './components/ActivationToggles';
import { EngagementReadout } from './components/EngagementReadout';
import { ConversionControl } from './components/ConversionControl';
import { Results } from './components/Results';
import { ScenarioComparison } from './components/ScenarioComparison';
import { Methodology } from './components/Methodology';
import { LiveBar } from './components/LiveBar';

const freshDefaults = (): ForecastInputs => ({
  ...DEFAULT_INPUTS,
  activations: [],
  conversions: { ...HISTORICAL_CONVERSIONS },
});

const CONVERSIONS: {
  key: keyof ConversionRates;
  from: string;
  to: string;
  description: string;
}[] = [
  {
    key: 'engagementToMql',
    from: 'Engagement',
    to: 'MQL',
    description: 'Percentage of engagements becoming marketing-qualified leads',
  },
  {
    key: 'mqlToMeeting',
    from: 'MQL',
    to: 'Sales Meeting',
    description: 'Percentage of MQLs converting into sales meetings',
  },
  {
    key: 'meetingToOpportunity',
    from: 'Sales Meeting',
    to: 'Opportunity',
    description: 'Percentage of sales meetings converting into qualified opportunities',
  },
];

const divider = <hr className="border-line" />;

export default function App() {
  const [inputs, setInputs] = useState<ForecastInputs>(freshDefaults);
  const result = useMemo(() => calculateForecast(inputs), [inputs]);
  const sponsorship = getSponsorship(inputs.sponsorship);

  const [pdfState, setPdfState] = useState<'idle' | 'working' | 'error'>('idle');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [announcement, setAnnouncement] = useState('');

  // ── Updaters ────────────────────────────────────────────
  const update = useCallback(<K extends keyof ForecastInputs>(key: K, value: ForecastInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleActivation = useCallback((id: ActivationId) => {
    setInputs((prev) => ({
      ...prev,
      activations: prev.activations.includes(id)
        ? prev.activations.filter((a) => a !== id)
        : [...prev.activations, id],
    }));
  }, []);

  const setConversion = useCallback((key: keyof ConversionRates, value: number) => {
    setInputs((prev) => ({ ...prev, conversions: { ...prev.conversions, [key]: value } }));
  }, []);

  const selectSponsorship = useCallback((id: SponsorshipId) => update('sponsorship', id), [update]);

  const reset = () => {
    setInputs(freshDefaults());
    setAnnouncement('Calculator reset to default inputs and historical conversion rates.');
  };

  // ── Export & copy ───────────────────────────────────────
  const handleDownload = async () => {
    setPdfState('working');
    try {
      const { downloadForecastPdf } = await import('./lib/pdf');
      await downloadForecastPdf(inputs, result);
      setPdfState('idle');
      setAnnouncement('Forecast PDF downloaded.');
    } catch (err) {
      console.error(err);
      setPdfState('error');
      setAnnouncement('The PDF could not be generated. Please try again.');
    }
  };

  const copyTimer = useRef<number | undefined>(undefined);
  const handleCopy = async () => {
    const ok = await copyText(buildTextSummary(inputs, result));
    setCopyState(ok ? 'copied' : 'error');
    setAnnouncement(ok ? 'Forecast summary copied to clipboard.' : 'Copy failed. Your browser blocked clipboard access.');
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyState('idle'), 2400);
  };

  // ── Live bar visibility ─────────────────────────────────
  const calcRef = useRef<HTMLDivElement>(null);
  const [calcVisible, setCalcVisible] = useState(false);
  useEffect(() => {
    const el = calcRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setCalcVisible(entry.isIntersecting), {
      rootMargin: '0px 0px -40% 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const actions = (
    <>
      <button type="button" onClick={handleDownload} disabled={pdfState === 'working'} className="btn-primary">
        {pdfState === 'working' ? (
          <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
        ) : (
          <Download size={17} aria-hidden="true" />
        )}
        {pdfState === 'working' ? 'Preparing PDF…' : 'Download forecast'}
      </button>
      <button type="button" onClick={handleCopy} className="btn-secondary">
        {copyState === 'copied' ? (
          <Check size={17} className="text-accent" aria-hidden="true" />
        ) : (
          <Copy size={17} aria-hidden="true" />
        )}
        {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy forecast summary'}
      </button>
      <button type="button" onClick={reset} className="btn text-muted hover:text-fg sm:ml-auto">
        <RotateCcw size={16} aria-hidden="true" />
        Reset calculator
      </button>
      {pdfState === 'error' && (
        <p className="w-full text-[14px] text-[#f87171]">PDF generation failed. Please try again.</p>
      )}
    </>
  );

  return (
    <>
      <a
        href="#calculator"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-[#111]"
      >
        Skip to calculator
      </a>

      <div className="mx-auto max-w-[1240px] px-3 py-4 sm:px-6 sm:py-10">
        <main className="rounded-[28px] border border-line bg-surface px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <Hero />

          <div className="my-8 border-t border-line" />

          <div id="calculator" ref={calcRef} className="space-y-8">
            {/* 1 — Conference inputs */}
            <section aria-labelledby="inputs-title">
              <SectionHeader number="1" title="Conference inputs" id="inputs-title" icon={Users}>
                Start with the anticipated size of the conference and your organization&apos;s average sales opportunity
                value.
              </SectionHeader>
              <div className="mt-5 grid gap-x-5 gap-y-2 sm:grid-cols-2">
                <NumberField
                  label="Expected attendees"
                  hint="Total registered or expected attendees. Whole numbers only."
                  kind="integer"
                  value={inputs.attendees}
                  onChange={(v) => update('attendees', Math.round(v))}
                  min={LIMITS.attendees.min}
                  max={LIMITS.attendees.max}
                />
                <NumberField
                  label="Average opportunity value ($)"
                  hint="Average new-business opportunity size, in US dollars."
                  kind="currency"
                  value={inputs.avgOpportunityValue}
                  onChange={(v) => update('avgOpportunityValue', v)}
                  min={0.01}
                  max={LIMITS.avgOpportunityValue.max}
                />
              </div>
            </section>

            {divider}

            {/* 2 — Sponsorship & activation */}
            <section aria-labelledby="strategy-title" className="space-y-7">
              <SectionHeader number="2" title="Sponsorship & activation strategy" id="strategy-title" icon={Presentation}>
                Your event footprint and the experiences you create influence how many attendees you can realistically
                engage. Select the sponsorship level and activations that best represent your planned presence.
              </SectionHeader>
              <SponsorshipSelector value={inputs.sponsorship} onChange={selectSponsorship} />
              <div className="border-t border-line" />
              <ActivationToggles value={inputs.activations} onToggle={toggleActivation} />
              <EngagementReadout result={result} baseRate={sponsorship.baseRate} />
            </section>

            {divider}

            {/* 3 — Historical conversion benchmarks */}
            <section aria-labelledby="benchmarks-title">
              <SectionHeader number="3" title="Historical conversion benchmarks" id="benchmarks-title" icon={GitBranch}>
                Default conversion rates reflect two years of actual Sumo Logic marketing and sales performance. Adjust
                these percentages to reflect the expected quality and intent of your event audience.
              </SectionHeader>
              {!isHistorical(inputs.conversions) && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-raised px-3 py-1 text-[13px] text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f0a35e]" aria-hidden="true" />
                  Customized rates in use
                </p>
              )}
              <div className="mt-5 space-y-4">
                {CONVERSIONS.map((c) => (
                  <ConversionControl
                    key={c.key}
                    from={c.from}
                    to={c.to}
                    description={c.description}
                    historical={HISTORICAL_CONVERSIONS[c.key]}
                    value={inputs.conversions[c.key]}
                    onChange={(v) => setConversion(c.key, v)}
                  />
                ))}
              </div>
            </section>
          </div>

          <div className="my-8 border-t border-line" />

          <Results inputs={inputs} result={result} actions={actions} />

          <div className="my-8 border-t border-line" />

          <ScenarioComparison inputs={inputs} onSelect={selectSponsorship} />

          <div className="mt-8">
            <Methodology />
          </div>
        </main>

        <footer className="px-2 py-6 text-center text-[13px] text-muted">
          {DISCLAIMER} Results are estimates, not guarantees.
        </footer>
      </div>

      <LiveBar result={result} visible={calcVisible} />

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </>
  );
}
