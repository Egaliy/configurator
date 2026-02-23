/**
 * Facebook (Meta) Pixel — configurator triggers.
 * If the pixel is not loaded (no PIXEL_ID or fbq), calls are ignored.
 */

declare global {
  interface Window {
    fbq?: (action: string, eventName: string, params?: Record<string, unknown>) => void
  }
}

const hasFbq = () => typeof window !== 'undefined' && typeof window.fbq === 'function'

/** Standard event (Lead, ViewContent, etc.) */
export function track(eventName: string, params?: Record<string, unknown>) {
  if (!hasFbq()) return
  try {
    window.fbq!('track', eventName, params)
  } catch {
    // ignore
  }
}

/** Custom configurator event */
export function trackCustom(eventName: string, params?: Record<string, unknown>) {
  if (!hasFbq()) return
  try {
    window.fbq!('trackCustom', eventName, params)
  } catch {
    // ignore
  }
}

/** Configurator step view (1–4) */
export function trackConfiguratorStep(step: number) {
  trackCustom('ConfiguratorStepView', { step, step_name: ['Goals', 'Scope', 'Options', 'Book'][step - 1] })
}

/** Site type selection (Goals) */
export function trackConfiguratorGoal(siteType: string, pages: number) {
  trackCustom('ConfiguratorGoal', { site_type: siteType, pages })
}

/** Animation level selection (Scope) */
export function trackConfiguratorScope(animationLevel: string, value: number) {
  trackCustom('ConfiguratorScope', { animation_level: animationLevel, value })
}

/** Next / Back navigation */
export function trackConfiguratorNavigate(direction: 'next' | 'back', fromStep: number, toStep: number) {
  trackCustom('ConfiguratorNavigate', { direction, from_step: fromStep, to_step: toStep })
}

/** Step 3 (Reduce) option change: discounts, etc. */
export function trackConfiguratorOption(optionName: string, value: boolean) {
  trackCustom('ConfiguratorOption', { option: optionName, value })
}

/** Add-on selection on step 3 (Increase) */
export function trackConfiguratorAddon(addonId: string, added: boolean) {
  trackCustom('ConfiguratorAddon', { addon_id: addonId, added })
}

/** Lead form submission */
export function trackConfiguratorLead(params?: { total_days?: number; total_cost?: number }) {
  track('Lead', params)
  trackCustom('ConfiguratorLead', params)
}

/** Book call button click (no form submit) */
export function trackConfiguratorBookCall() {
  trackCustom('ConfiguratorBookCall', {})
}
