/**
 * i18n AvlMonitor PLG (misma dinámica ES/EN que Tuk Tuk / p2l-locale).
 */
(function () {
  const STORAGE_KEY = 'p2l-locale'
  const DEFAULT_LANG = 'es'

  function normalizeLocale(code) {
    return String(code || '').toLowerCase().startsWith('en') ? 'en' : 'es'
  }

  function getSavedLocale() {
    try {
      return normalizeLocale(localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG)
    } catch (_) {
      return DEFAULT_LANG
    }
  }

  function persistLocale(code) {
    const normalized = normalizeLocale(code)
    try {
      localStorage.setItem(STORAGE_KEY, normalized)
    } catch (_) {
      /* ignore */
    }
    document.documentElement.lang = normalized
    return normalized
  }

  function applyStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n')
      if (!key) return
      const value = i18next.t(key)
      if (value == null || value === key || typeof value !== 'string') return
      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = value
      } else {
        el.textContent = value
      }
    })

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria')
      if (!key) return
      const value = i18next.t(key)
      if (value && value !== key && typeof value === 'string') {
        el.setAttribute('aria-label', value)
      }
    })

    document.querySelectorAll('[data-i18n-meta]').forEach((el) => {
      const key = el.getAttribute('data-i18n-meta')
      if (!key) return
      const value = i18next.t(key)
      if (value && value !== key && typeof value === 'string') {
        el.setAttribute('content', value)
      }
    })

    const titleKey = document.querySelector('title')?.getAttribute('data-i18n')
    if (titleKey) {
      const t = i18next.t(titleKey)
      if (t && t !== titleKey) document.title = t
    }
  }

  function syncLangSwitch(active) {
    document.querySelectorAll('[data-set-locale]').forEach((btn) => {
      const code = btn.getAttribute('data-set-locale')
      btn.classList.toggle('qa-lang-switch__btn--active', code === active)
      btn.setAttribute('aria-pressed', code === active ? 'true' : 'false')
    })
  }

  async function setLocale(code, opts = {}) {
    const lang = persistLocale(code)
    await i18next.changeLanguage(lang)
    syncLangSwitch(lang)
    applyStaticTranslations()
    if (typeof window.onAvlMonitorLocaleChange === 'function') {
      window.onAvlMonitorLocaleChange(lang, { skipScroll: !!opts.skipScroll })
    }
  }

  async function boot() {
    if (typeof i18next === 'undefined') {
      console.error('[AvlMonitor] i18next no cargó')
      return
    }
    const resources = window.AVL_MONITOR_I18N_RESOURCES
    if (!resources) {
      console.error('[AvlMonitor] Falta scripts/locales-embed.js')
      return
    }
    const lang = getSavedLocale()
    await i18next.init({
      lng: lang,
      fallbackLng: 'es',
      resources,
      interpolation: { escapeValue: false }
    })
    persistLocale(lang)
    syncLangSwitch(lang)
    applyStaticTranslations()
    window.avlMonitorI18n = { ready: true, setLocale }
    document.querySelectorAll('[data-set-locale]').forEach((btn) => {
      btn.addEventListener('click', () => setLocale(btn.getAttribute('data-set-locale')))
    })
    if (typeof window.onAvlMonitorI18nReady === 'function') {
      window.onAvlMonitorI18nReady(lang)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
