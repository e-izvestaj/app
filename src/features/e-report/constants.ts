export const stepTitles = [
  "Bezbednost",
  "Vreme i mesto",
  "Dokumentacija",
  "Drugi ucesnik",
  "Vozac A",
  "Vozilo A",
  "Polisa A",
  "Okolnosti nezgode",
  "Skica nezgode",
  "Podaci ucesnika B",
  "Vozac B",
  "Vozilo B",
  "Polisa B",
  "Pregled izveštaja",
  "Potpisi",
  "Finalizacija"
] as const;

export type StepTitle = (typeof stepTitles)[number] | "Vozač A" | "Vozač B";
