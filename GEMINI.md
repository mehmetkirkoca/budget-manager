# Project Rules & Guidelines

## UI Localization (i18n)
- **ALWAYS** use `t(...)` from `react-i18next` for all user-facing UI labels, titles, buttons, placeholders, and messaging.
- **NEVER** hardcode raw text strings directly in React components.
- Maintain translation entries in both Turkish (`tr`) and English (`en`) within `ui/src/i18n.js`.
