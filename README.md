# e-Izvestaj

Mobile-first PWA za digitalno popunjavanje evropskog izvestaja o saobracajnoj nezgodi.

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- react-router-dom
- IndexedDB
- react-signature-canvas
- pdf-lib

## Run

```bash
npm install
npm run dev
```

## Napomene

- OCR je ostavljen kao placeholder/mock sloj u [src/lib/ocr.ts](/C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/lib/ocr.ts).
- Draft i zavrseni izvestaji se cuvaju u IndexedDB kroz [src/lib/indexedDb.ts](/C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/lib/indexedDb.ts).
- PDF generisanje je implementirano kroz [src/lib/pdf.ts](/C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/lib/pdf.ts).
