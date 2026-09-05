# Rule: Always Use Localization (i18n) for UI Labels

## Mandatory Guideline
- **NEVER** hardcode user-facing text strings, labels, titles, or descriptions directly in UI components (e.g. `title: 'Net Likidite'`).
- **ALWAYS** use the translation function `t('key')` provided by `useTranslation()` (e.g., `react-i18next`).
- Whenever adding, editing, or refactoring UI components:
  1. Add corresponding translation keys to both `tr` (Turkish) and `en` (English) in `ui/src/i18n.js` (or project locale files).
  2. Use `t('translationKey', 'Fallback Default Text')` in the JSX / component code.
