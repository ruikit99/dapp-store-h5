# SafePal Store DApp

A mobile e-commerce DApp built with Vite, React 18, and TypeScript (for the SafePal App WebView).

## Development

```bash
npm install
npm run dev
```

Runs locally at `http://0.0.0.0:3000` by default.

## Build

```bash
npm run build
npm run preview
```

Build output is located in the `dist/` directory.

## Tech Stack

- Vite + React 18 + TypeScript
- antd-mobile 5 / Less / postcss-pxtorem
- Zustand 5 / axios + qs
- i18next + react-i18next
- react-router-dom

Source code directory: `src/`. Static assets: `static/` (Vite `publicDir`).

## Internationalization (i18n)

```bash
npm run xlsxToLang
```