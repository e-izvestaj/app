export const stepTitles = [
  "Bezbednost",
  "Vreme i mesto",
  "Dokumentacija",
  "Vozač A",
  "Vozilo A",
  "Polisa A",
  "Vozač B",
  "Vozilo B",
  "Polisa B",
  "Oštećenja vozila",
  "Fotografija mesta nezgode",
  "Okolnosti nezgode",
  "Skica nezgode",
  "Pregled izveštaja",
  "Potpisi",
  "Finalizacija"
] as const;

export type StepTitle = (typeof stepTitles)[number];
