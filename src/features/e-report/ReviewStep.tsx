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
  const scenePhotos = report.scenePhotos.filter((photo) => photo.kind === "scene");
  const damagePhotoA = report.scenePhotos.find((photo) => photo.kind === "damage-a");
  const damagePhotoB = report.scenePhotos.find((photo) => photo.kind === "damage-b");
  const sketchImage = report.annotatedPhotoDataUrl || report.sceneSketch.svgDataUrl;

  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">Pregled izvestaja</h2>

      <SummaryCard
        body={[
          `${report.location.date} · ${report.location.time}`,
          report.location.address ||
            [report.location.street, report.location.streetNumber, report.location.city]
              .filter(Boolean)
              .join(", ") ||
            "Lokacija nije uneta"
        ]}
        onEdit={() => onEditStep("Vreme i mesto")}
        title="Vreme i mesto"
      />

      <SummaryCard
        body={[
          `Vozacka A: ${report.vehicleA.documentPhotos.filter((item) => item.documentType === "driver-license").length}/2`,
          `Saobracajna A: ${report.vehicleA.documentPhotos.filter((item) => item.documentType === "registration").length}/2`,
          `Polisa A: ${report.vehicleA.documentPhotos.filter((item) => item.documentType === "policy").length}/1`
        ]}
        onEdit={() => onEditStep("Dokumentacija")}
        title="Dokumentacija"
      />

      <SummaryCard
        body={[
          `${report.vehicleA.driverFirstName} ${report.vehicleA.driverLastName}`.trim() ||
            "Nije uneto",
          report.vehicleA.plate || "Registracija nije uneta",
          report.vehicleA.insurer || "Polisa nije uneta"
        ]}
        onEdit={() => onEditStep("Vozač A")}
        title="Ucesnik A"
      />

      <SummaryCard
        body={[
          `${report.vehicleB.driverFirstName} ${report.vehicleB.driverLastName}`.trim() ||
            "Nije uneto",
          report.vehicleB.plate || "Registracija nije uneta",
          report.vehicleB.insurer || "Polisa nije uneta",
          report.vehicleB.source === "qr" ? "QR dodat" : "Ceka QR"
        ]}
        onEdit={() => onEditStep("Vozač B")}
        title="Ucesnik B"
      />

      <SummaryCard
        body={[
          `A oznaceno: ${report.circumstances.filter((item) => item.selectedByA).length}`,
          `B oznaceno: ${report.circumstances.filter((item) => item.selectedByB).length}`
        ]}
        onEdit={() => onEditStep("Okolnosti nezgode")}
        title="Okolnosti"
      />

      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="text-base font-semibold text-white">Slike i skica</div>
          <Button fullWidth={false} onClick={() => onEditStep("Skica nezgode")} type="button" variant="ghost">
            Izmeni
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {scenePhotos[0] ? (
            <img alt="Mesto nezgode" className="aspect-square rounded-[18px] object-cover" src={scenePhotos[0].dataUrl} />
          ) : null}
          {damagePhotoA ? (
            <img alt="Ostecenje A" className="aspect-square rounded-[18px] object-cover" src={damagePhotoA.dataUrl} />
          ) : null}
          {damagePhotoB ? (
            <img alt="Ostecenje B" className="aspect-square rounded-[18px] object-cover" src={damagePhotoB.dataUrl} />
          ) : null}
        </div>

        {sketchImage ? (
          <img alt="Skica nezgode" className="w-full rounded-[20px] bg-[#0B0D12] object-cover" src={sketchImage} />
        ) : null}
      </Card>
    </div>
  );
}
