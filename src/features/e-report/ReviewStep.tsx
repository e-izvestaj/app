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
  const sketchMapUrl =
    report.location.latitude && report.location.longitude
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${(report.sceneSketch.mapCenterLongitude ?? report.location.longitude) - 0.012 / Math.pow(2, (report.sceneSketch.mapZoom ?? 20) - 14)}%2C${(report.sceneSketch.mapCenterLatitude ?? report.location.latitude) - (0.012 / Math.pow(2, (report.sceneSketch.mapZoom ?? 20) - 14)) * 0.94}%2C${(report.sceneSketch.mapCenterLongitude ?? report.location.longitude) + 0.012 / Math.pow(2, (report.sceneSketch.mapZoom ?? 20) - 14)}%2C${(report.sceneSketch.mapCenterLatitude ?? report.location.latitude) + (0.012 / Math.pow(2, (report.sceneSketch.mapZoom ?? 20) - 14)) * 0.94}&layer=mapnik&marker=${report.sceneSketch.mapCenterLatitude ?? report.location.latitude}%2C${report.sceneSketch.mapCenterLongitude ?? report.location.longitude}`
      : null;

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
        {sketchMapUrl && report.sceneSketch.status === "confirmed" ? (
          <div className="relative mx-auto h-[340px] w-[360px] overflow-hidden rounded-[20px] border border-white/10 bg-[#0B0D12]">
            <iframe
              className="pointer-events-none absolute inset-0 h-full w-full border-0 opacity-85"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={sketchMapUrl}
              title="Pregled GPS skice"
            />
            <div className="absolute inset-0 bg-[#0B0D12]/12" />
            <div
              className="absolute h-16 w-10 -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-[#FF5A5F] text-sm font-semibold text-white shadow-lg"
              style={{
                left: report.sceneSketch.vehicleAState.x,
                top: report.sceneSketch.vehicleAState.y,
                transform: `translate(-50%, -50%) rotate(${report.sceneSketch.vehicleAState.rotation}deg)`
              }}
            >
              <div className="flex h-full w-full items-center justify-center">A</div>
            </div>
            <div
              className="absolute h-16 w-10 -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-[#2F80FF] text-sm font-semibold text-white shadow-lg"
              style={{
                left: report.sceneSketch.vehicleBState.x,
                top: report.sceneSketch.vehicleBState.y,
                transform: `translate(-50%, -50%) rotate(${report.sceneSketch.vehicleBState.rotation}deg)`
              }}
            >
              <div className="flex h-full w-full items-center justify-center">B</div>
            </div>
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-yellow-300"
              style={{
                left: report.sceneSketch.impactPoint.x,
                top: report.sceneSketch.impactPoint.y
              }}
            >
              X
            </div>
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 360 340">
              {report.sceneSketch.drawPaths
                .filter((path) => path.points.length > 1)
                .map((path) => (
                  <polyline
                    key={path.id}
                    fill="none"
                    points={path.points.map((point) => `${point.x},${point.y}`).join(" ")}
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity="0.85"
                    strokeWidth="3"
                  />
                ))}
            </svg>
          </div>
        ) : report.annotatedPhotoDataUrl ? (
          <img alt="Skica" className="w-full rounded-[20px] object-cover" src={report.annotatedPhotoDataUrl} />
        ) : report.sceneSketch.svgDataUrl ? (
          <img alt="Skica" className="w-full rounded-[20px] bg-[#0B0D12]" src={report.sceneSketch.svgDataUrl} />
        ) : null}
      </Card>
    </div>
  );
}
