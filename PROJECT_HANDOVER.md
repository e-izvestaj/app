# PROJECT HANDOVER

## Project goal

This application is a mobile-first e-Izvestaj flow for collecting accident data from two participants and producing a final European accident report PDF that can be reviewed, saved, downloaded, shared, and printed.

Primary product goals:
- collect accident metadata, participant data, vehicle data, signatures, and sketch
- support participant-B completion through QR flow
- generate a final PDF that follows the official European accident report layout
- keep all critical data local/browser-side where possible

## Current architecture

### Frontend stack
- React + TypeScript + Vite
- Local-first draft persistence through IndexedDB
- PDF generation through `pdf-lib`

### Main report model
- Canonical report state is `ReportDraft`
- Key source file:
  - [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\src\types.ts](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/types.ts)

### Main feature areas
- Wizard flow:
  - [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\src\features\e-report\ReportWizard.tsx](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/features/e-report/ReportWizard.tsx)
- Participant B QR flow:
  - [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\src\pages\ParticipantPage.tsx](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/pages/ParticipantPage.tsx)
  - [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\src\lib\qr.ts](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/lib/qr.ts)
- Sketch editor:
  - [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\src\features\e-report\SceneSketchStep.tsx](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/features/e-report/SceneSketchStep.tsx)
- Review:
  - [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\src\features\e-report\ReviewStep.tsx](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/features/e-report/ReviewStep.tsx)
- PDF generation:
  - [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\src\lib\pdf.ts](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/lib/pdf.ts)
  - [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\src\features\e-report\pdf-template\generate-report-pdf.ts](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/features/e-report/pdf-template/generate-report-pdf.ts)

### Static assets currently in use
- Fillable PDF template with sketch/signature areas:
  - [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\public\Evropski_izvestaj_FILLABLE_TEMPLATE_skica.pdf](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/public/Evropski_izvestaj_FILLABLE_TEMPLATE_skica.pdf)
- Vehicle marker PNGs used in sketch editor:
  - [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\public\sketch-car-a.png](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/public/sketch-car-a.png)
  - [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\public\sketch-car-b.png](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/public/sketch-car-b.png)

## What currently works

### Wizard / data flow
- Safety step simplified; removed unnecessary “vehicles still in position” question
- Documentation flow simplified toward current product direction:
  - driver license front only
  - damage photos for vehicle A and vehicle B
- Participant B QR flow revised to match final form needs more closely

### PDF flow
- Final PDF generation uses fillable PDF template path instead of previous fake/approximate overlay experiment
- The app has a dedicated test route for PDF testing:
  - `#/pdf-test`
- PDF preview/save/download flow is wired and functioning
- Text/check field population in fillable template is operational
- Sketch/signature-capable fillable template is the current base

### Sketch editor
- Leaflet replaced old OSM iframe background in editor
- Map is visible and pannable/zoomable
- Existing sketch editor UX was kept largely intact
- Vehicle markers use real PNG top-view car icons
- Vehicle movement and rotation controls are functioning again
- Impact marker (`X`) is larger and black
- Direction controls exist and are visually improved

## What currently does NOT work / is not finished

### Phase 2 sketch export
- The core unresolved task is:
  - save the **actual visible Leaflet sketch container** as PNG
  - then use that exact PNG in preview and final PDF
- This has **not** been fully integrated yet
- Current `SceneSketchStep.tsx` was rolled back to preserve editor stability after an attempted Phase 2 path caused regressions

### Current sketch save mismatch
- Editor now uses Leaflet
- Saved sketch path is still not finalized as “what user sees = what gets saved”
- `html-to-image` has now been installed successfully, but only a minimal helper attempt was started and then rolled back to restore editor stability

### PDF exactness
- Fillable-template path is much better than the earlier fake overlay/template attempts
- However, exact visual verification for every dynamic element still depends on the sketch PNG export being finalized

### OCR
- OCR is effectively de-scoped from the current product direction
- Product decision moved away from depending on OCR for core workflow

## Technical decisions already made

### Accepted decisions
- Do not rely on OCR as a core requirement for completing the report
- Use only driver license front image, not full OCR-driven document automation
- Use fillable official PDF template as final PDF base
- Keep editor UX stable; do not redesign it while fixing export
- Use Leaflet as live GPS-based sketch map layer
- Use PNG top-view car assets instead of generic placeholder vehicle shapes
- Use one canonical `ReportDraft` state model

### Important semantic decisions
- Participant A and B data should mirror the final official document structure
- Sketch editor is part of the legal/credibility flow and must remain GPS-backed
- Photo of general accident scene was intentionally de-emphasized relative to sketch + damage photos

## What was attempted and rejected

### Rejected / abandoned
- Fake PDF recreation from scratch that visually approximated the official form
  - rejected because it did not look official enough
- Overlaying arbitrary coordinates onto non-blank or misaligned PDF templates
  - too brittle and confusing
- Separate HTML/CSS “new form” pretending to be the official form
  - rejected because user explicitly wanted official-looking output
- OCR-first flow
  - rejected because it did not provide reliable value versus manual entry
- Old sketch save renderers:
  - simplified renderer
  - tile-stitching export renderer
  - both rejected because editor and saved/PDF sketch diverged

### Why they were rejected
- mismatch with official form
- poor reliability
- too much manual calibration pain
- user trust was lost when editor view and saved output differed

## Open bugs / known risks

1. Sketch export is not yet finalized
- Current blocker: need safe DOM-to-PNG export of the existing Leaflet sketch container without changing editor UX

2. `SceneSketchStep.tsx` is high-risk
- This file has had many iterations and is easy to destabilize
- Any future work should be tightly scoped and tested immediately in-browser

3. PDF route depends on sketch PNG quality
- Even if PDF field fill works, sketch credibility depends on matching editor screenshot/export

4. There are local experimental/untracked artifacts in the repo working tree
- These should be reviewed before future cleanup commits

## Current best path forward

### Immediate next technical step
Finish Phase 2 in the narrowest possible way:
- do not redesign editor
- do not change map logic
- do not change drag/rotate/state model
- export the existing visible Leaflet sketch board container to PNG with `html-to-image`
- store the resulting dataUrl into the same report field already used for preview/PDF

### Explicit implementation target
- add one helper in `SceneSketchStep.tsx`:
  - `exportCurrentSketchToPng(container)`
- use it from `Sačuvaj skicu`
- export only the sketch board container
- no second renderer
- no tile stitching
- no scene reconstruction

### Validation path
1. Open sketch editor
2. Move vehicles
3. Rotate vehicles
4. Move impact X
5. Save sketch
6. Compare:
   - editor view
   - saved preview
   - PDF sketch

Acceptance:
- they must visually match

## Files most likely to be touched next
- [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\src\features\e-report\SceneSketchStep.tsx](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/features/e-report/SceneSketchStep.tsx)

Likely no changes needed initially in:
- [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\src\features\e-report\ReviewStep.tsx](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/features/e-report/ReviewStep.tsx)
- [C:\Users\ddosl\Documents\Codex\2026-05-27\files-mentioned-by-the-user-logo\src\features\e-report\pdf-template\generate-report-pdf.ts](C:/Users/ddosl/Documents/Codex/2026-05-27/files-mentioned-by-the-user-logo/src/features/e-report/pdf-template/generate-report-pdf.ts)

## Notes for next developer

- Do not assume “almost matching” PDF/sketch output is acceptable.
- The user is highly sensitive to regressions in:
  - sketch editor behavior
  - official-form fidelity
  - misleading claims that something is fixed when it is not
- Prefer small reversible changes with immediate in-browser verification.
