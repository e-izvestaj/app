export const stepTitles = [
  "Bezbednost",
  "Vreme i lokacija",
  "Vozač A",
  "Vozilo A",
  "Polisa A",
  "Vozač B",
  "Vozilo B",
  "Polisa B",
  "Fotografije oštećenja",
  "Okolnosti nezgode",
  "Fotografija cele situacije",
  "Pregled izveštaja",
  "Potpisi",
  "Finalizacija"
] as const;

export type StepTitle = (typeof stepTitles)[number];
