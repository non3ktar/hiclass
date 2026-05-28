import en from './en.json'
import zh from './zh.json'
import pt from './pt.json'

export type I18nKey = keyof typeof en

const locales: Record<string, Record<string, string>> = {
  en,
  zh,
  pt
}

function detectLocale(): string {
  // PWA version always defaults to pt-BR for this project
  return 'pt'
}

export function createI18n(
  locale?: string
): (key: I18nKey, params?: Record<string, string>) => string {
  const lang = (locale || detectLocale()).split('-')[0]
  const messages = locales[lang] || locales['pt']

  return (key: I18nKey, params?: Record<string, string>): string => {
    let msg = messages[key]
    if (!msg) {
      // Fall back to Portuguese then English
      msg = locales['pt'][key] || locales['en'][key] || key
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        msg = msg.replace(`{{${k}}}`, v)
      }
    }
    return msg
  }
}

export type I18nFn = ReturnType<typeof createI18n>

// Pre-initialized instance for the renderer process.
export const t: I18nFn = createI18n()

// Expose the detected locale so the renderer can adjust font-family etc.
export const detectedLocale: string = 'pt'
