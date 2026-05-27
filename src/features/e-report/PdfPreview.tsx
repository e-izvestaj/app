import Button from "../../components/Button";
import Card from "../../components/Card";
import type { ReportDraft } from "../../types";

type Props = {
  report: ReportDraft;
  onGeneratePdf: () => void;
  isGenerating: boolean;
};

export default function PdfPreview({ report, onGeneratePdf, isGenerating }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">PDF preview.</h2>
        <p className="text-sm text-white/60">Brza kontrola pre generisanja dokumenta.</p>
      </div>
      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm text-white/70">
          <div className="rounded-[20px] bg-white/5 p-4">
            <div className="text-white/45">Lokacija</div>
            <div className="mt-2 text-white">{report.location.address || "Nije uneta"}</div>
          </div>
          <div className="rounded-[20px] bg-white/5 p-4">
            <div className="text-white/45">Foto materijal</div>
            <div className="mt-2 text-white">{report.scenePhotos.length} fotografija</div>
          </div>
          <div className="rounded-[20px] bg-white/5 p-4">
            <div className="text-white/45">Vozilo A</div>
            <div className="mt-2 text-white">
              {report.vehicleA.plate || "Bez tablica"} {report.vehicleA.make}
            </div>
          </div>
          <div className="rounded-[20px] bg-white/5 p-4">
            <div className="text-white/45">Vozilo B</div>
            <div className="mt-2 text-white">
              {report.vehicleB.plate || "Bez tablica"} {report.vehicleB.make}
            </div>
          </div>
        </div>
        {report.annotatedPhotoDataUrl ? (
          <img
            alt="annotated"
            className="w-full rounded-[24px] object-cover"
            src={report.annotatedPhotoDataUrl}
          />
        ) : null}
      </Card>
      <Button onClick={onGeneratePdf} type="button">
        {isGenerating ? "Generisem PDF..." : "Generisi PDF"}
      </Button>
    </div>
  );
}
