import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import { saveReport, setActiveDraftId } from "../../lib/indexedDb";
import { generatePdf } from "../../lib/pdf";
import { nowIso, reportTitle } from "../../lib/utils";
import type { ReportDraft } from "../../types";
import AccidentDetails from "./AccidentDetails";
import LocationTimeStep from "./LocationTimeStep";
import PdfPreview from "./PdfPreview";
import PhotoAnnotator from "./PhotoAnnotator";
import SceneCapture from "./SceneCapture";
import ShareStep from "./ShareStep";
import SignatureStep from "./SignatureStep";
import SafetyCheckStep from "./SafetyCheckStep";
import VehicleForm from "./VehicleForm";
import { getActiveStepTitles } from "./reportSteps";

type Props = {
  report: ReportDraft;
  onReportChange: (report: ReportDraft) => void;
};

export default function ReportWizard({ report, onReportChange }: Props) {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(report.pdfDataUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const activeSteps = useMemo(() => getActiveStepTitles(report), [report]);
  const currentStep = activeSteps[stepIndex];

  useEffect(() => {
    if (stepIndex >= activeSteps.length) {
      setStepIndex(activeSteps.length - 1);
    }
  }, [activeSteps.length, stepIndex]);

  useEffect(() => {
    if (report.status === "completed") {
      setStepIndex(activeSteps.length - 1);
    }
  }, [activeSteps.length, report.status]);

  useEffect(() => {
    const next = { ...report, updatedAt: nowIso() };
    const timeout = window.setTimeout(() => {
      void saveReport(next);
      void setActiveDraftId(next.status === "draft" ? next.id : null);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [report]);

  const updateReport = (patch: Partial<ReportDraft>) => {
    onReportChange({ ...report, ...patch, updatedAt: nowIso() });
  };

  const goNext = () => {
    setStepIndex((current) => Math.min(current + 1, activeSteps.length - 1));
  };

  const goBack = () => {
    if (stepIndex === 0) {
      navigate("/");
      return;
    }

    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    const result = await generatePdf(report);
    setPdfUrl(result.url);
    updateReport({
      status: "completed",
      pdfDataUrl: result.dataUrl
    });
    await saveReport({
      ...report,
      status: "completed",
      pdfDataUrl: result.dataUrl,
      updatedAt: nowIso()
    });
    await setActiveDraftId(null);
    setIsGenerating(false);
    setStepIndex(activeSteps.length - 1);
  };

  const sharePdf = async () => {
    if (!pdfUrl) {
      return;
    }

    try {
      const blob = await fetch(pdfUrl).then((response) => response.blob());
      const file = new File([blob], `${reportTitle(report)}.pdf`, {
        type: "application/pdf"
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: reportTitle(report),
          text: "e-Izvestaj",
          files: [file]
        });
        return;
      }
    } catch {
      // Fallback below opens the generated PDF when file sharing is unavailable.
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const savePdf = () => {
    if (!pdfUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${reportTitle(report)}.pdf`;
    link.click();
  };

  const emailPdf = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(reportTitle(report))}&body=${encodeURIComponent("PDF je generisan u aplikaciji e-Izvestaj.")}`;
  };

  const whatsappPdf = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent("e-Izvestaj je spreman za deljenje.")}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case "Bezbednost":
        return report.safety.injured !== null && report.safety.vehiclesInPosition !== null;
      case "Lokacija i vreme":
        return Boolean(report.location.date && report.location.time);
      case "PDF preview":
        return true;
      case "Share":
        return Boolean(pdfUrl);
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "Bezbednost":
        return (
          <SafetyCheckStep
            value={report.safety}
            onChange={(safety) => updateReport({ safety })}
          />
        );
      case "Scene Capture":
        return (
          <SceneCapture
            photos={report.scenePhotos}
            onChange={(scenePhotos) =>
              updateReport({
                scenePhotos,
                selectedPhotoId: report.selectedPhotoId || scenePhotos[0]?.id || null
              })
            }
          />
        );
      case "Lokacija i vreme":
        return (
          <LocationTimeStep
            value={report.location}
            onChange={(location) => updateReport({ location })}
          />
        );
      case "Vozilo A":
        return (
          <VehicleForm
            title="Vozilo A"
            value={report.vehicleA}
            onChange={(vehicleA) => updateReport({ vehicleA })}
          />
        );
      case "Vozilo B":
        return (
          <VehicleForm
            title="Vozilo B"
            value={report.vehicleB}
            onChange={(vehicleB) => updateReport({ vehicleB })}
          />
        );
      case "Opis dogadjaja":
        return (
          <AccidentDetails
            note={report.note}
            onNoteChange={(note) => updateReport({ note })}
            onOptionsChange={(circumstances) => updateReport({ circumstances })}
            options={report.circumstances}
          />
        );
      case "Oznacavanje fotografije":
        return (
          <PhotoAnnotator
            markers={report.photoMarkers}
            onMarkersChange={(photoMarkers) => updateReport({ photoMarkers })}
            onSaveFlattened={(annotatedPhotoDataUrl) => updateReport({ annotatedPhotoDataUrl })}
            onSelectedPhotoIdChange={(selectedPhotoId) => updateReport({ selectedPhotoId })}
            photos={report.scenePhotos}
            selectedPhotoId={report.selectedPhotoId}
          />
        );
      case "Potpisi":
        return (
          <SignatureStep
            signatures={report.signatures}
            onChange={(signatures) => updateReport({ signatures })}
          />
        );
      case "PDF preview":
        return (
          <PdfPreview
            isGenerating={isGenerating}
            onGeneratePdf={handleGeneratePdf}
            report={report}
          />
        );
      case "Share":
        return (
          <ShareStep
            onEmail={emailPdf}
            onSave={savePdf}
            onShare={sharePdf}
            onWhatsApp={whatsappPdf}
            pdfUrl={pdfUrl}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-8 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <button className="text-sm text-white/55" onClick={goBack} type="button">
          Nazad
        </button>
        <div className="text-sm text-white/45">{reportTitle(report)}</div>
      </div>

      <Card className="mb-5">
        <ProgressBar
          current={stepIndex + 1}
          label={currentStep}
          total={activeSteps.length}
        />
      </Card>

      <div className="flex-1">{renderStep()}</div>

      <div className="mt-6">
        {currentStep !== "Share" ? (
          <Button disabled={!canProceed()} onClick={goNext} type="button">
            Nastavi
          </Button>
        ) : (
          <Button onClick={() => navigate("/")} type="button">
            Nazad na Home
          </Button>
        )}
      </div>
    </div>
  );
}
