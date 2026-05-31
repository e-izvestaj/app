import type { PDFPage, PDFFont } from "pdf-lib";
import { rgb } from "pdf-lib";
import {
  PDF_LAYOUT,
  PDF_OFFSET_X,
  PDF_OFFSET_Y,
  PDF_PAGE_HEIGHT,
  PDF_SCALE
} from "./fieldsMap";

type Box = { left: number; top: number; width: number; height: number };
type FontSet = { regular: PDFFont; bold: PDFFont };

const BLUE = rgb(0.09, 0.60, 0.86);
const YELLOW = rgb(0.95, 0.85, 0.23);
const LIGHT_BLUE = rgb(0.80, 0.91, 0.97);
const LIGHT_YELLOW = rgb(1, 0.95, 0.66);
const BLACK = rgb(0.08, 0.10, 0.13);
const GRID = rgb(0.74, 0.78, 0.82);
const WHITE = rgb(1, 1, 1);

function sx(value: number) {
  return PDF_OFFSET_X + value * PDF_SCALE;
}

function sy(top: number, height = 0) {
  return PDF_PAGE_HEIGHT - PDF_OFFSET_Y - (top + height) * PDF_SCALE;
}

function ss(value: number) {
  return value * PDF_SCALE;
}

function drawBox(page: PDFPage, box: Box, fill?: ReturnType<typeof rgb>, borderWidth = 1.4, borderColor = BLACK) {
  page.drawRectangle({
    x: sx(box.left),
    y: sy(box.top, box.height),
    width: ss(box.width),
    height: ss(box.height),
    color: fill,
    borderColor,
    borderWidth: ss(borderWidth)
  });
}

function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number, thickness = 1, color = BLACK) {
  page.drawLine({
    start: { x: sx(x1), y: sy(y1) },
    end: { x: sx(x2), y: sy(y2) },
    thickness: ss(thickness),
    color
  });
}

function drawText(page: PDFPage, text: string, left: number, top: number, size: number, font: PDFFont, color = BLACK) {
  page.drawText(text, {
    x: sx(left),
    y: sy(top, size),
    size: ss(size),
    font,
    color
  });
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  centerX: number,
  top: number,
  size: number,
  font: PDFFont,
  color = BLACK
) {
  const textWidth = font.widthOfTextAtSize(text, ss(size));
  page.drawText(text, {
    x: sx(centerX) - textWidth / 2,
    y: sy(top, size),
    size: ss(size),
    font,
    color
  });
}

function drawSectionLabel(page: PDFPage, fonts: FontSet, x: number, y: number, number: number, text: string, color: ReturnType<typeof rgb>) {
  drawBox(page, { left: x, top: y, width: 20, height: 17 }, color, 1);
  page.drawText(String(number), {
    x: sx(x + 6),
    y: sy(y + 5, 10),
    size: ss(10),
    font: fonts.bold,
    color: WHITE
  });
  page.drawText(text, {
    x: sx(x + 26),
    y: sy(y + 4, 11),
    size: ss(11),
    font: fonts.bold,
    color: BLACK
  });
}

function ruledLines(page: PDFPage, left: number, width: number, startY: number, spacing: number, count: number) {
  for (let index = 0; index < count; index += 1) {
    const y = startY + index * spacing;
    drawLine(page, left, y, left + width, y, 0.8);
  }
}

function drawVehicleSubgrid(page: PDFPage, fonts: FontSet, area: Box) {
  const splitX = area.left + 148;
  const headerY = area.top + 24;
  drawLine(page, splitX, area.top, splitX, area.top + area.height, 1.1);
  drawLine(page, area.left, headerY, area.left + area.width, headerY, 1.1);
  drawCenteredText(page, "MOTORNO VOZILO", area.left + 74, area.top + 7, 10.5, fonts.bold);
  drawCenteredText(page, "PRIKOLICA", splitX + (area.width - 148) / 2, area.top + 7, 10.5, fonts.bold);
}

function drawImpactPlaceholder(page: PDFPage, area: Box) {
  drawBox(page, area, undefined, 1.1);
  const iconLeft = area.left + 18;
  const iconTop = area.top + 28;
  page.drawEllipse({
    x: sx(iconLeft + 6),
    y: sy(iconTop + 12),
    xScale: ss(5),
    yScale: ss(5),
    borderColor: BLACK,
    borderWidth: ss(1.2)
  });
  drawLine(page, iconLeft + 6, iconTop + 18, iconLeft + 6, iconTop + 34, 1.4);
  drawLine(page, iconLeft, iconTop + 24, iconLeft + 12, iconTop + 24, 1.4);
  drawLine(page, iconLeft + 6, iconTop + 34, iconLeft - 2, iconTop + 44, 1.4);
  drawLine(page, iconLeft + 6, iconTop + 34, iconLeft + 14, iconTop + 44, 1.4);
  drawBox(page, { left: area.left + 54, top: area.top + 24, width: 22, height: 52 }, undefined, 1.5);
  drawBox(page, { left: area.left + 92, top: area.top + 20, width: 30, height: 58 }, undefined, 1.5);
}

function drawCircumstancesGrid(page: PDFPage, fonts: FontSet) {
  const section = PDF_LAYOUT.centerSections.circumstances;
  const centerX = section.left + section.width / 2;
  drawLine(page, centerX, section.top + 24, centerX, section.top + section.height, 1);
  drawText(page, "A", section.left + 10, section.top + 16, 13, fonts.bold);
  drawText(page, "B", section.left + section.width - 18, section.top + 16, 13, fonts.bold);
  drawCenteredText(page, "Obeležite odgovarajuće polje", centerX, section.top + 8, 10, fonts.bold);

  for (let index = 0; index < 17; index += 1) {
    const y = PDF_LAYOUT.circumstances.startY + index * PDF_LAYOUT.circumstances.step;
    drawBox(page, { left: PDF_LAYOUT.circumstances.leftCheckX, top: y, width: 12, height: 12 }, undefined, 0.9);
    drawBox(page, { left: PDF_LAYOUT.circumstances.rightCheckX, top: y, width: 12, height: 12 }, undefined, 0.9);
    drawText(page, String(index + 1), PDF_LAYOUT.circumstances.numberLeftX, y + 1, 9.4, fonts.regular);
    drawText(page, String(index + 1), PDF_LAYOUT.circumstances.numberRightX, y + 1, 9.4, fonts.regular);
  }

  drawText(page, "navedite broj označenih polja", section.left + 72, section.top + section.height - 30, 10.2, fonts.bold);
  drawBox(page, { left: section.left + 18, top: section.top + section.height - 36, width: 18, height: 18 }, undefined, 0.9);
  drawBox(page, { left: section.left + section.width - 36, top: section.top + section.height - 36, width: 18, height: 18 }, undefined, 0.9);
}

function drawSketchGrid(page: PDFPage) {
  const sketch = PDF_LAYOUT.centerSections.sketch;
  for (let x = sketch.left + 8; x <= sketch.left + sketch.width - 8; x += 33) {
    drawLine(page, x, sketch.top + 28, x, sketch.top + sketch.height - 8, 0.6, GRID);
  }
  for (let y = sketch.top + 28; y <= sketch.top + sketch.height - 8; y += 42) {
    drawLine(page, sketch.left + 8, y, sketch.left + sketch.width - 8, y, 0.6, GRID);
  }
}

function drawSignatureFooter(page: PDFPage, fonts: FontSet) {
  const signatures = PDF_LAYOUT.centerSections.signatures;
  drawCenteredText(page, "A", signatures.left + 24, signatures.top + signatures.height - 28, 16, fonts.bold);
  drawCenteredText(page, "B", signatures.left + signatures.width - 24, signatures.top + signatures.height - 28, 16, fonts.bold);
}

export function drawProgrammaticTemplate(page: PDFPage, fonts: FontSet) {
  drawCenteredText(page, "IZVEŠTAJ O SAOBRAĆAJNOJ NEZGODI", PDF_LAYOUT.page.width / 2, PDF_LAYOUT.header.titleY - 4, 28, fonts.bold);

  drawBox(page, PDF_LAYOUT.topFields.dateTime);
  drawBox(page, PDF_LAYOUT.topFields.place);
  drawBox(page, PDF_LAYOUT.topFields.injured);
  drawBox(page, PDF_LAYOUT.topFields.damage);
  drawBox(page, PDF_LAYOUT.topFields.witnesses);

  drawLine(page, 194, 74, 194, 116);
  drawLine(page, 478, 74, 478, 116);
  drawLine(page, 184, 116, 184, 186);
  drawLine(page, 756, 74, 756, 116);

  drawSectionLabel(page, fonts, 44, 74, 1, "Datum nezgode", BLUE);
  drawText(page, "Vreme nezgode", 204, 79, 11.5, fonts.bold);
  drawSectionLabel(page, fonts, 324, 74, 2, "Mesto", BLUE);
  drawSectionLabel(page, fonts, 616, 74, 3, "Povređeni učesnici, uključujući i lakše povređene", BLUE);
  drawSectionLabel(page, fonts, 44, 116, 4, "Materijalna šteta na", BLUE);
  drawSectionLabel(page, fonts, 324, 116, 5, "Svedoci, imena, adrese, telefon", BLUE);

  drawText(page, "drugim vozilima pored A i B", 56, 140, 10.4, fonts.regular);
  drawText(page, "drugim stvarima osim na vozilima", 196, 140, 10.4, fonts.regular);
  drawText(page, "Država:", 342, 104, 10.6, fonts.regular);
  drawText(page, "Mesto:", 484, 79, 10.6, fonts.regular);
  drawText(page, "da", 755, 104, 10.6, fonts.regular);
  drawText(page, "ne", 790, 104, 10.6, fonts.regular);

  drawBox(page, PDF_LAYOUT.columns.left, LIGHT_BLUE);
  drawBox(page, PDF_LAYOUT.columns.center, WHITE);
  drawBox(page, PDF_LAYOUT.columns.right, LIGHT_YELLOW);

  drawBox(page, { left: PDF_LAYOUT.columns.left.left, top: PDF_LAYOUT.columns.left.top, width: PDF_LAYOUT.columns.left.width, height: 44 }, BLUE);
  drawBox(page, { left: PDF_LAYOUT.columns.right.left, top: PDF_LAYOUT.columns.right.top, width: PDF_LAYOUT.columns.right.width, height: 44 }, YELLOW);

  drawCenteredText(page, "VOZILO A", PDF_LAYOUT.columns.left.left + PDF_LAYOUT.columns.left.width / 2, 200, 18, fonts.bold, WHITE);
  drawCenteredText(page, "VOZILO B", PDF_LAYOUT.columns.right.left + PDF_LAYOUT.columns.right.width / 2, 200, 18, fonts.bold, BLACK);

  drawSectionLabel(page, fonts, 44, PDF_LAYOUT.leftSections.owner.top, 6, "Ugovarač osiguranja / osiguranik", BLUE);
  drawSectionLabel(page, fonts, 44, PDF_LAYOUT.leftSections.vehicle.top, 7, "Vozilo", BLUE);
  drawSectionLabel(page, fonts, 44, PDF_LAYOUT.leftSections.insurance.top, 8, "Osiguravajuća kuća", BLUE);
  drawSectionLabel(page, fonts, 44, PDF_LAYOUT.leftSections.driver.top, 9, "Vozač", BLUE);
  drawSectionLabel(page, fonts, 44, PDF_LAYOUT.leftSections.impact.top, 10, "Obeležite mesto inicijalnog udara", BLUE);
  drawSectionLabel(page, fonts, 44, PDF_LAYOUT.leftSections.visible.top, 11, "Vidljiva oštećenja na vozilu A", BLUE);
  drawSectionLabel(page, fonts, 44, PDF_LAYOUT.leftSections.notes.top, 14, "Vlastite napomene", BLUE);

  drawSectionLabel(page, fonts, 634, PDF_LAYOUT.rightSections.owner.top, 6, "Ugovarač osiguranja / osiguranik", YELLOW);
  drawSectionLabel(page, fonts, 634, PDF_LAYOUT.rightSections.vehicle.top, 7, "Vozilo", YELLOW);
  drawSectionLabel(page, fonts, 634, PDF_LAYOUT.rightSections.insurance.top, 8, "Osiguravajuća kuća", YELLOW);
  drawSectionLabel(page, fonts, 634, PDF_LAYOUT.rightSections.driver.top, 9, "Vozač", YELLOW);
  drawSectionLabel(page, fonts, 634, PDF_LAYOUT.rightSections.impact.top, 10, "Obeležite mesto inicijalnog udara", YELLOW);
  drawSectionLabel(page, fonts, 634, PDF_LAYOUT.rightSections.visible.top, 11, "Vidljiva oštećenja na vozilu B", YELLOW);
  drawSectionLabel(page, fonts, 634, PDF_LAYOUT.rightSections.notes.top, 14, "Vlastite napomene", YELLOW);

  drawBox(page, PDF_LAYOUT.leftSections.owner);
  drawBox(page, PDF_LAYOUT.leftSections.vehicle);
  drawBox(page, PDF_LAYOUT.leftSections.insurance);
  drawBox(page, PDF_LAYOUT.leftSections.driver);
  drawBox(page, PDF_LAYOUT.leftSections.impact);
  drawBox(page, PDF_LAYOUT.leftSections.visible);
  drawBox(page, PDF_LAYOUT.leftSections.notes);

  drawBox(page, PDF_LAYOUT.rightSections.owner);
  drawBox(page, PDF_LAYOUT.rightSections.vehicle);
  drawBox(page, PDF_LAYOUT.rightSections.insurance);
  drawBox(page, PDF_LAYOUT.rightSections.driver);
  drawBox(page, PDF_LAYOUT.rightSections.impact);
  drawBox(page, PDF_LAYOUT.rightSections.visible);
  drawBox(page, PDF_LAYOUT.rightSections.notes);

  drawBox(page, PDF_LAYOUT.centerSections.circumstances);
  drawBox(page, PDF_LAYOUT.centerSections.sketch);
  drawBox(page, PDF_LAYOUT.centerSections.signatures);
  drawSectionLabel(page, fonts, 326, 190, 12, "Okolnosti koje su dovele do nezgode", rgb(0.95, 0.95, 0.95));
  drawSectionLabel(page, fonts, 326, 620, 13, "Skica nezgode u trenutku nastanka udesa", BLUE);
  drawSectionLabel(page, fonts, 326, 1118, 15, "Potpisi vozača", YELLOW);

  drawVehicleSubgrid(page, fonts, PDF_LAYOUT.leftSections.vehicle);
  drawVehicleSubgrid(page, fonts, PDF_LAYOUT.rightSections.vehicle);
  drawCircumstancesGrid(page, fonts);
  drawSketchGrid(page);
  drawImpactPlaceholder(page, PDF_LAYOUT.impactDiagrams.a);
  drawImpactPlaceholder(page, PDF_LAYOUT.impactDiagrams.b);
  drawSignatureFooter(page, fonts);

  ruledLines(page, 58, 250, 290, 27, 4);
  ruledLines(page, 58, 250, 612, 24, 9);
  ruledLines(page, 58, 250, 900, 27, 8);
  ruledLines(page, 58, 250, 1288, 18, 4);
  ruledLines(page, 648, 250, 290, 27, 4);
  ruledLines(page, 648, 250, 612, 24, 9);
  ruledLines(page, 648, 250, 900, 27, 8);
  ruledLines(page, 648, 250, 1288, 18, 4);
}
