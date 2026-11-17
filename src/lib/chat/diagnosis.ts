/**
 * Detection of the bot's structured closing summary.
 *
 * The provider is instructed to end a diagnosis with a line shaped like
 * `Resumen: {dolor} → {producto} ({precio})`. The widget uses that signal to
 * reveal the lead capture CTA at the exact moment the visitor is ready to be
 * contacted.
 */

/** Matches the structured closing summary the bot is instructed to emit. */
export const DIAGNOSIS_SUMMARY_PATTERN = /Resumen:\s*([^\n]+)/i

/**
 * True when the assistant reply is the structured closing summary. Pure and
 * case-insensitive so it can be unit-tested and reused by the widget.
 */
export function isDiagnosisSummary(reply: string): boolean {
  return DIAGNOSIS_SUMMARY_PATTERN.test(reply)
}
