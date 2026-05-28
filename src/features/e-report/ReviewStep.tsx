import Button from "../../components/Button";
import Card from "../../components/Card";
import type { ReportDraft } from "../../types";
import type { StepTitle } from "./constants";

type Props = {
  report: ReportDraft;
  onEditStep: (step: StepTitle) => void;
};

function SummaryCard({
  title,
  body,
  onEdit
}: {
  title: string;
  body: string[];
  onEdit: () => void;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="text-base font-semibold text-white">{title}</div>
        <button className="text-sm text-accent" onClick={onEdit} type="button">
          Izmeni
        </button>
      </div>
      <div className="space-y-1 text-sm text-white/70">
        {body.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </Card>
  );
}

export default function ReviewStep({ report, onEditStep }: Props) {
  const scenePhoto = report.scenePhotos.find((photo) => photo.kind === "scene");
  const damagePhotoA = report.scenePhotos.find((photo) => photo.kind === "damage-a");
  const damagePhotoB = report.scenePhotos.find((photo) => photo.kind === "damage-b");

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Pregled pre potpisa</h2>
        <p className="text-sm text-white/60">
          Prođi kroz ključne podatke i vrati se na bilo koji korak ako želiš ispravku.
        </p>
      </div>

      <SummaryCard
        body={[
          `${report.location.date} u ${report.location.time}`,
          report.location.address || "Lokacija nije uneta",
          report.location.city || "Grad nije unet"
        ]}
        onEdit={() => onEditStep("Vreme i lokacija")}
        title="Vreme i lokacija"
      />

      <SummaryCard
        body={[
          `${report.vehicleA.driverFirstName} ${report.vehicleA.driverLastName}`.trim() || "Vozač A nije unet",
          report.vehicleA.plate || "Registracija nije uneta",
          report.vehicleA.insurer || "Polisa nije uneta"
        ]}
        onEdit={() => onEditStep("Vozač A")}
        title="Vozilo A"
      />

      <SummaryCard
        body={[
          `${report.vehicleB.driverFirstName} ${report.vehicleB.driverLastName}`.trim() || "Vozač B nije unet",
          report.vehicleB.plate || "Registracija nije uneta",
          report.vehicleB.insurer || "Polisa nije uneta"
        ]}
        onEdit={() => onEditStep("Vozač B")}
        title="Vozilo B"
      />

      <SummaryCard
        body={[
          `A označeno: ${report.circumstances.filter((item) => item.selectedByA).length}`,
          `B označeno: ${report.circumstances.filter((item) => item.selectedByB).length}`
        ]}
        onEdit={() => onEditStep("Okolnosti nezgode")}
        title="Okolnosti nezgode"
      />

      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="text-base font-semibold text-white">Fotografije i skica</div>
          <Button fullWidth={false} onClick={() => onEditStep("Fotografija cele situacije")} type="button" variant="ghost">
            Izmeni
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {scenePhoto ? <img alt="Scena" className="aspect-square rounded-[18px] object-cover" src={scenePhoto.dataUrl} /> : null}
          {damagePhotoA ? <img alt="Šteta A" className="aspect-square rounded-[18px] object-cover" src={damagePhotoA.dataUrl} /> : null}
          {damagePhotoB ? <img alt="Šteta B" className="aspect-square rounded-[18px] object-cover" src={damagePhotoB.dataUrl} /> : null}
        </div>
        {report.annotatedPhotoDataUrl ? (
          <img alt="Skica" className="w-full rounded-[20px] object-cover" src={report.annotatedPhotoDataUrl} />
        ) : report.sceneSketch.svgDataUrl ? (
          <img alt="AI skica" className="w-full rounded-[20px] bg-[#0B0D12]" src={report.sceneSketch.svgDataUrl} />
        ) : null}
      </Card>
    </div>
  );
}
