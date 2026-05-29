export const stepTitles = [
  "Bezbednost",
  "Vreme i lokacija",
  "Vozac A",
  "Vozilo A",
  "Polisa A",
  "Vozac B",
  "Vozilo B",
  "Polisa B",
  "Fotografije ostecenja",
  "Okolnosti nezgode",
  "Fotografija cele situacije",
  "Skica nezgode",
  "Pregled izvestaja",
  "Potpisi",
  "Finalizacija"
] as const;

export type StepTitle = (typeof stepTitles)[number];
