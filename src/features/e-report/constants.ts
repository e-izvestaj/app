export const stepTitles = [
  "Bezbednost",
  "Vreme i mesto",
  "Drugi ucesnik",
  "Dokumentacija",
  "Vozac A",
  "Vozilo A",
  "Polisa A",
  "Ostecenja vozila",
  "Fotografija mesta nezgode",
  "Okolnosti nezgode",
  "Skica nezgode",
  "Podaci ucesnika B",
  "Pregled izvestaja",
  "Potpisi",
  "Finalizacija"
] as const;

export type StepTitle = (typeof stepTitles)[number] | "Vozač A" | "Vozač B";
