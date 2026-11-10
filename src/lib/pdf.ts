import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import {
  type ForecastInputs,
  type ForecastResult,
  HISTORICAL_CONVERSIONS,
  getSponsorship,
  isHistorical,
} from './model';
import {
  formatCount,
  formatCurrency,
  formatCurrencyInput,
  formatPercent,
  formatPlain,
  formatRate,
} from './format';
import { APP_TITLE, DISCLAIMER, ESTIMATE_NOTE, METHODOLOGY } from './content';
import { selectedActivationLabels } from './summary';

// Palette (0–1 RGB)
const INK = rgb(0x11 / 255, 0x11 / 255, 0x11 / 255);
const MUTED = rgb(0x73 / 255, 0x73 / 255, 0x73 / 255);
const LINE = rgb(0xe5 / 255, 0xe5 / 255, 0xe0 / 255);
const BONE = rgb(0xf5 / 255, 0xf5 / 255, 0xf0 / 255);
const LIME = rgb(0xe3 / 255, 0xf1 / 255, 0x6b / 255);

// US Letter
const W = 612;
const H = 792;
const M = 48;
const CW = W - M * 2;

/** Standard PDF fonts use WinAnsi; replace the few glyphs it lacks. */
const clean = (s: string) =>
  s.replace(/[→]/g, '->').replace(/[−]/g, '-').replace(/[  ]/g, ' ');

interface Fonts {
  bold: PDFFont;
  regular: PDFFont;
  mono: PDFFont;
  monoBold: PDFFont;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = clean(text).split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Tracked (letter-spaced) uppercase label, drawn glyph by glyph. */
function label(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  f: PDFFont,
  size = 7,
  color = MUTED,
  tracking = size * 0.12,
) {
  const s = clean(text.toUpperCase());
  let cx = x;
  for (const ch of s) {
    page.drawText(ch, { x: cx, y, size, font: f, color });
    cx += f.widthOfTextAtSize(ch, size) + tracking;
  }
}

function hr(page: PDFPage, y: number, color = LINE, thickness = 0.75) {
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness, color });
}

export async function buildForecastPdf(inputs: ForecastInputs, result: ForecastResult): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${APP_TITLE} — Forecast`);
  doc.setSubject('Directional event pipeline forecast');
  doc.setCreator(APP_TITLE);
  doc.setProducer(APP_TITLE);

  const fonts: Fonts = {
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    regular: await doc.embedFont(StandardFonts.Helvetica),
    mono: await doc.embedFont(StandardFonts.Courier),
    monoBold: await doc.embedFont(StandardFonts.CourierBold),
  };

  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const pages: PDFPage[] = [];
  let page = doc.addPage([W, H]);
  pages.push(page);
  let y = H - M;

  const newPage = () => {
    page = doc.addPage([W, H]);
    pages.push(page);
    y = H - M;
    label(page, APP_TITLE, M, y - 7, fonts.mono);
    y -= 28;
  };
  const ensure = (space: number) => {
    if (y - space < M + 40) newPage();
  };

  // ── Header ─────────────────────────────────────────────
  label(page, 'Data-informed forecasting / Event pipeline forecast', M, y - 7, fonts.mono);
  const dateW = fonts.mono.widthOfTextAtSize(date.toUpperCase(), 7) + date.length * 0.84;
  label(page, date, W - M - dateW, y - 7, fonts.mono);
  y -= 22;
  hr(page, y, INK, 1);
  y -= 40;

  for (const line of ['THIRD-PARTY EVENT', 'PIPELINE ESTIMATOR']) {
    page.drawText(line, { x: M - 1.5, y, size: 34, font: fonts.bold, color: INK });
    y -= 34;
  }
  y -= 4;
  page.drawText('Turn event strategy into pipeline projections.', {
    x: M, y, size: 11, font: fonts.regular, color: MUTED,
  });
  y -= 30;

  // ── Hero figure ────────────────────────────────────────
  const heroTop = y;
  const heroH = 128;
  page.drawRectangle({ x: M, y: heroTop - heroH, width: CW, height: heroH, color: INK });
  page.drawRectangle({ x: M + 20, y: heroTop - 30, width: 6, height: 6, color: LIME });
  label(page, 'Estimated new pipeline generated', M + 32, heroTop - 30, fonts.mono, 7.5, rgb(1, 1, 1));
  page.drawText(clean(formatCurrency(result.pipeline)), {
    x: M + 18, y: heroTop - 88, size: 52, font: fonts.bold, color: rgb(1, 1, 1),
  });
  page.drawText(
    clean(
      `${formatPlain(result.opportunities)} opportunities × ${formatCurrencyInput(inputs.avgOpportunityValue)} average opportunity value`,
    ),
    { x: M + 20, y: heroTop - 112, size: 8, font: fonts.mono, color: rgb(0.75, 0.75, 0.72) },
  );
  y = heroTop - heroH - 26;

  // ── KPI row ────────────────────────────────────────────
  const kpis: [string, string][] = [
    ['Attendee engagements', formatCount(result.engagedAttendees)],
    ['Marketing-qualified leads', formatCount(result.mqls)],
    ['Sales meetings', formatCount(result.meetings)],
    ['Sales opportunities', formatCount(result.opportunities)],
  ];
  const colW = CW / 4;
  hr(page, y + 10, INK, 1);
  kpis.forEach(([k, v], i) => {
    const x = M + i * colW + (i === 0 ? 0 : 12);
    if (i > 0) {
      page.drawLine({ start: { x: M + i * colW, y: y + 10 }, end: { x: M + i * colW, y: y - 58 }, thickness: 0.75, color: LINE });
    }
    label(page, `0${i + 1}`, x, y - 6, fonts.mono, 6.5);
    label(page, k, x, y - 18, fonts.mono, 6, INK, 0.4);
    page.drawText(clean(v), { x, y: y - 50, size: 26, font: fonts.bold, color: INK });
  });
  y -= 70;
  hr(page, y);
  y -= 34;

  // ── Section helper ─────────────────────────────────────
  const section = (num: string, title: string) => {
    ensure(70);
    label(page, num, M, y, fonts.mono, 7.5);
    page.drawText(clean(title.toUpperCase()), { x: M + 28, y: y - 1, size: 12, font: fonts.bold, color: INK });
    y -= 12;
    hr(page, y, INK, 1);
    y -= 4;
  };

  const row = (k: string, v: string, note?: string) => {
    const valueX = M + 210;
    const lines = wrap(v, fonts.monoBold, 9, CW - 210 - (note ? 100 : 0));
    const rowH = Math.max(1, lines.length) * 13 + 12;
    ensure(rowH);
    page.drawText(clean(k), { x: M, y: y - 15, size: 9.5, font: fonts.regular, color: MUTED });
    lines.forEach((ln, i) => {
      page.drawText(ln, { x: valueX, y: y - 15 - i * 13, size: 9, font: fonts.monoBold, color: INK });
    });
    if (note) {
      const nw = fonts.mono.widthOfTextAtSize(clean(note), 7.5);
      page.drawText(clean(note), { x: W - M - nw, y: y - 15, size: 7.5, font: fonts.mono, color: MUTED });
    }
    y -= rowH;
    hr(page, y);
  };

  const sponsorship = getSponsorship(inputs.sponsorship);
  const activations = selectedActivationLabels(inputs);

  section('01', 'Event inputs');
  row('Expected conference attendees', formatCount(inputs.attendees));
  row('Average opportunity value', formatCurrencyInput(inputs.avgOpportunityValue));
  row('Sponsorship footprint', `${sponsorship.name} — ${sponsorship.detail}`, `BASE ${sponsorship.baseRate}%`);
  row('Additional activations', activations.length ? activations.join(', ') : 'None selected');
  row(
    'Estimated engagement rate',
    formatRate(result.engagementRate),
    result.isCapped ? 'CAPPED AT 25%' : 'STANDARD REF 10.0%',
  );
  y -= 26;

  const c = inputs.conversions;
  const historical = isHistorical(c);
  section('02', `Conversion rates — ${historical ? 'Historical' : 'Customized'}`);
  const conv = (k: string, v: number, h: number) =>
    row(k, formatPercent(v), v === h ? 'SUMO LOGIC 2-YR AVG' : `HISTORICAL ${h}%`);
  conv('Engagement to MQL', c.engagementToMql, HISTORICAL_CONVERSIONS.engagementToMql);
  conv('MQL to sales meeting', c.mqlToMeeting, HISTORICAL_CONVERSIONS.mqlToMeeting);
  conv('Sales meeting to opportunity', c.meetingToOpportunity, HISTORICAL_CONVERSIONS.meetingToOpportunity);
  y -= 26;

  section('03', 'Projected outcomes');
  row('Attendee engagements', formatCount(result.engagedAttendees));
  row('Marketing-qualified leads', formatCount(result.mqls));
  row('Sales meetings', formatCount(result.meetings));
  row('Sales opportunities', formatCount(result.opportunities), `UNROUNDED ${formatPlain(result.opportunities)}`);
  row('Projected new pipeline', formatCurrency(result.pipeline));
  y -= 26;

  section('04', 'Methodology & assumptions');
  y -= 8;
  for (const para of METHODOLOGY) {
    const lines = wrap(para, fonts.regular, 9, CW - 28);
    ensure(lines.length * 12.5 + 8);
    page.drawRectangle({ x: M, y: y - 6, width: 4, height: 4, color: INK });
    lines.forEach((ln, i) => {
      page.drawText(ln, { x: M + 16, y: y - 8 - i * 12.5, size: 9, font: fonts.regular, color: INK });
    });
    y -= lines.length * 12.5 + 8;
  }
  y -= 10;

  const noteLines = wrap(`${ESTIMATE_NOTE} ${DISCLAIMER}`, fonts.regular, 8, CW - 24);
  const boxH = noteLines.length * 11 + 20;
  ensure(boxH + 10);
  page.drawRectangle({ x: M, y: y - boxH, width: CW, height: boxH, color: BONE });
  noteLines.forEach((ln, i) => {
    page.drawText(ln, { x: M + 12, y: y - 16 - i * 11, size: 8, font: fonts.regular, color: MUTED });
  });

  // ── Footers ────────────────────────────────────────────
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: M - 8 }, end: { x: W - M, y: M - 8 }, thickness: 0.75, color: LINE });
    label(p, 'Directional estimate / not a guarantee of results', M, M - 22, fonts.mono, 6.5);
    const pn = `${String(i + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
    const pw = fonts.mono.widthOfTextAtSize(pn, 6.5) + pn.length * 0.78;
    label(p, pn, W - M - pw, M - 22, fonts.mono, 6.5);
  });

  return doc.save();
}

export async function downloadForecastPdf(inputs: ForecastInputs, result: ForecastResult) {
  const bytes = await buildForecastPdf(inputs, result);
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `event-pipeline-forecast-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
