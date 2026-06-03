export const stepTitles = [
  "Bezbednost",
  "Vreme i mesto",
  "Drugi ucesnik",
  "Dokumentacija",
  "Vozac A",
  "Vozilo A",
  "Polisa A",
  "Okolnosti nezgode",
  "Skica nezgode",
  "Podaci ucesnika B",
  "Pregled izvestaja",
  "Potpisi",
  "Finalizacija"
] as const;

export type StepTitle = (typeof stepTitles)[number] | "Vozač A" | "Vozač B";
