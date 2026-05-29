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
  const docCountA = report.vehicleA.documentPhotos.length;
  const docCountB = report.vehicleB.documentPhotos.length;
  const finalSketchImage = report.annotatedPhotoDataUrl || report.sceneSketch.svgDataUrl;

  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">Pregled pre potpisa</h2>

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
          `${report.vehicleA.driverFirstName} ${report.vehicleA.driverLastName}`.trim() || "Vozac A nije unet",
          report.vehicleA.plate || "Registracija nije uneta",
          report.vehicleA.insurer || "Polisa nije uneta",
          `Dokumenti: ${docCountA}`
        ]}
        onEdit={() => onEditStep("Vozac A")}
        title="A strana"
      />

      <SummaryCard
        body={[
          `${report.vehicleB.driverFirstName} ${report.vehicleB.driverLastName}`.trim() || "Vozac B nije unet",
          report.vehicleB.plate || "Registracija nije uneta",
          report.vehicleB.insurer || "Polisa nije uneta",
          `Dokumenti: ${docCountB}`
        ]}
        onEdit={() => onEditStep("Vozac B")}
        title="B strana"
      />

      <SummaryCard
        body={[
          `A oznaceno: ${report.circumstances.filter((item) => item.selectedByA).length}`,
          `B oznaceno: ${report.circumstances.filter((item) => item.selectedByB).length}`
        ]}
        onEdit={() => onEditStep("Okolnosti nezgode")}
        title="Okolnosti nezgode"
      />

      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="text-base font-semibold text-white">Fotografije i skica</div>
          <Button fullWidth={false} onClick={() => onEditStep("Skica nezgode")} type="button" variant="ghost">
            Izmeni
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {scenePhoto ? <img alt="Scena" className="aspect-square rounded-[18px] object-cover" src={scenePhoto.dataUrl} /> : null}
          {damagePhotoA ? <img alt="Steta A" className="aspect-square rounded-[18px] object-cover" src={damagePhotoA.dataUrl} /> : null}
          {damagePhotoB ? <img alt="Steta B" className="aspect-square rounded-[18px] object-cover" src={damagePhotoB.dataUrl} /> : null}
        </div>
        {finalSketchImage ? (
          <img alt="Skica" className="w-full rounded-[20px] bg-[#0B0D12] object-cover" src={finalSketchImage} />
        ) : null}
      </Card>
    </div>
  );
}
