import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import { saveReport, setActiveDraftId } from "../../lib/indexedDb";
import { generatePdf } from "../../lib/pdf";
import { generateQrCodeDataUrl } from "../../lib/qr";
import {
  deriveReportStatus,
  getFinalReportUrl,
  isReportReadyForSignature,
  nowIso,
  reportTitle
} from "../../lib/utils";
import type { ReportDraft } from "../../types";
import AccidentDetails from "./AccidentDetails";
import LocationTimeStep from "./LocationTimeStep";
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
  forceReadOnly?: boolean;
};

export default function ReportWizard({
  report,
  onReportChange,
  forceReadOnly = false
}: Props) {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(report.pdfDataUrl);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const activeSteps = useMemo(() => getActiveStepTitles(report), [report]);
  const currentStep = activeSteps[stepIndex];
  const readOnly = forceReadOnly || report.status === "locked";
  const reportUrl = getFinalReportUrl(report.id);

  useEffect(() => {
    if (stepIndex >= activeSteps.length) {
      setStepIndex(activeSteps.length - 1);
    }
  }, [activeSteps.length, stepIndex]);

  useEffect(() => {
    if (report.status === "locked") {
      setStepIndex(activeSteps.length - 1);
    }
  }, [activeSteps.length, report.status]);

  useEffect(() => {
    if (report.pdfDataUrl && !pdfUrl) {
      setPdfUrl(report.pdfDataUrl);
    }
  }, [pdfUrl, report.pdfDataUrl]);

  useEffect(() => {
    if (report.status !== "locked" && !forceReadOnly) {
      const nextStatus = deriveReportStatus(report);
      const shouldSetReadyAt =
        nextStatus === "ready_for_signature" && !report.readyForSignatureAt;
      const shouldClearReadyAt = nextStatus === "draft" && report.readyForSignatureAt;

      if (report.status !== nextStatus || shouldSetReadyAt || shouldClearReadyAt) {
        onReportChange({
          ...report,
          status: nextStatus,
          readyForSignatureAt: shouldSetReadyAt
            ? nowIso()
            : nextStatus === "draft"
              ? null
              : report.readyForSignatureAt,
          updatedAt: nowIso()
        });
      }
    }
  }, [forceReadOnly, onReportChange, report]);

  useEffect(() => {
    if (report.status === "locked") {
      void generateQrCodeDataUrl(reportUrl).then(setQrCodeDataUrl);
    }
  }, [report.status, reportUrl]);

  useEffect(() => {
    if (!report.signatures.a || !report.signatures.b || report.status === "locked" || isLocking) {
      return;
    }

    if (!isReportReadyForSignature(report)) {
      return;
    }

    void (async () => {
      setIsLocking(true);
      const lockedReport: ReportDraft = {
        ...report,
        status: "locked",
        lockedAt: report.lockedAt || nowIso(),
        readyForSignatureAt: report.readyForSignatureAt || nowIso(),
        updatedAt: nowIso()
      };
      const [pdfResult, nextQrCodeDataUrl] = await Promise.all([
        generatePdf(lockedReport),
        generateQrCodeDataUrl(reportUrl)
      ]);

      const finalizedReport = {
        ...lockedReport,
        pdfDataUrl: pdfResult.dataUrl
      };

      setPdfUrl(pdfResult.url);
      setQrCodeDataUrl(nextQrCodeDataUrl);
      onReportChange(finalizedReport);
      await saveReport(finalizedReport);
      await setActiveDraftId(null);
      setStepIndex(activeSteps.length - 1);
      setIsLocking(false);
    })();
  }, [
    activeSteps.length,
    isLocking,
    onReportChange,
    report,
    report.signatures.a,
    report.signatures.b,
    report.status,
    reportUrl
  ]);

  useEffect(() => {
    const next = { ...report, updatedAt: nowIso() };
    const timeout = window.setTimeout(() => {
      void saveReport(next);
      void setActiveDraftId(next.status === "locked" ? null : next.id);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [report]);

  const updateReport = (patch: Partial<ReportDraft>) => {
    if (readOnly) {
      return;
    }

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
          text: `${report.publicId} - e-Izvestaj`,
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
    link.download = `${report.publicId}.pdf`;
    link.click();
  };

  const emailPdf = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(report.publicId)}&body=${encodeURIComponent(`Read-only primerak: ${reportUrl}`)}`;
  };

  const whatsappPdf = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${report.publicId} - ${reportUrl}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const copyReportId = async () => {
    await navigator.clipboard.writeText(report.publicId);
    setCopyStatus("Report ID je kopiran.");
    window.setTimeout(() => setCopyStatus(null), 2200);
  };

  const canProceed = () => {
    switch (currentStep) {
      case "Bezbednost":
        return (
          report.safety.injured !== null &&
          report.safety.vehiclesInPosition !== null &&
          report.safety.damageOtherVehicles !== null &&
          report.safety.damageOtherObjects !== null
        );
      case "Lokacija i vreme":
        return Boolean(report.location.date && report.location.time && report.location.address);
      case "Potpisi":
        return false;
      case "Zavrseno":
        return Boolean(report.pdfDataUrl || pdfUrl);
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "Bezbednost":
        return (
          <SafetyCheckStep
            onChange={(safety) => updateReport({ safety })}
            readOnly={readOnly}
            value={report.safety}
          />
        );
      case "Scene Capture":
        return (
          <SceneCapture
            onChange={(scenePhotos) =>
              updateReport({
                scenePhotos,
                selectedPhotoId: report.selectedPhotoId || scenePhotos[0]?.id || null
              })
            }
            onSceneSketchChange={(sceneSketch) => updateReport({ sceneSketch })}
            onVehicleAChange={(vehicleA) => updateReport({ vehicleA })}
            onVehicleBChange={(vehicleB) => updateReport({ vehicleB })}
            photos={report.scenePhotos}
            readOnly={readOnly}
            sceneSketch={report.sceneSketch}
            vehicleA={report.vehicleA}
            vehicleB={report.vehicleB}
          />
        );
      case "Lokacija i vreme":
        return (
          <LocationTimeStep
            onChange={(location) => updateReport({ location })}
            onWitnessInfoChange={(witnessInfo) => updateReport({ witnessInfo })}
            readOnly={readOnly}
            value={report.location}
            witnessInfo={report.witnessInfo}
          />
        );
      case "Vozilo A":
        return (
          <VehicleForm
            onChange={(vehicleA) => updateReport({ vehicleA })}
            readOnly={readOnly}
            title="Vozilo A"
            value={report.vehicleA}
          />
        );
      case "Vozilo B":
        return (
          <VehicleForm
            onChange={(vehicleB) => updateReport({ vehicleB })}
            readOnly={readOnly}
            title="Vozilo B"
            value={report.vehicleB}
          />
        );
      case "Opis dogadjaja":
        return (
          <AccidentDetails
            note={report.note}
            onNoteChange={(note) => updateReport({ note })}
            onOptionsChange={(circumstances) => updateReport({ circumstances })}
            onVehicleANoteChange={(note) =>
              updateReport({
                vehicleA: {
                  ...report.vehicleA,
                  note
                }
              })
            }
            onVehicleBNoteChange={(note) =>
              updateReport({
                vehicleB: {
                  ...report.vehicleB,
                  note
                }
              })
            }
            options={report.circumstances}
            readOnly={readOnly}
            vehicleANote={report.vehicleA.note}
            vehicleBNote={report.vehicleB.note}
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
            readOnly={readOnly}
            selectedPhotoId={report.selectedPhotoId}
          />
        );
      case "Potpisi":
        return (
          <SignatureStep
            onChange={(signatures) => updateReport({ signatures })}
            readOnly={readOnly || report.status === "locked"}
            signatures={report.signatures}
            statusLabel={
              report.status === "ready_for_signature"
                ? "ready_for_signature"
                : report.status === "locked"
                  ? "locked"
                  : "draft"
            }
          />
        );
      case "Zavrseno":
        return (
          <ShareStep
            onCopyReportId={copyReportId}
            onEmail={emailPdf}
            onSave={savePdf}
            onShare={sharePdf}
            onWhatsApp={whatsappPdf}
            pdfUrl={pdfUrl}
            qrCodeDataUrl={qrCodeDataUrl}
            reportId={report.publicId}
            reportUrl={reportUrl}
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
        <div className="text-right text-sm text-white/45">
          <div>{report.publicId}</div>
          <div>{reportTitle(report)}</div>
        </div>
      </div>

      <Card className="mb-5 space-y-3">
        <ProgressBar
          current={stepIndex + 1}
          label={currentStep}
          total={activeSteps.length}
        />
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.26em] text-white/40">
          <span>Status</span>
          <span>{report.status === "completed" ? "locked" : report.status}</span>
        </div>
      </Card>

      <div className="flex-1">{renderStep()}</div>

      {copyStatus ? (
        <div className="mt-4 rounded-[20px] border border-emerald-400/25 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-100">
          {copyStatus}
        </div>
      ) : null}

      <div className="mt-6">
        {currentStep === "Potpisi" ? (
          <Button disabled type="button" variant="secondary">
            {isLocking
              ? "Zakljucavam izvestaj..."
              : report.status === "locked"
                ? "Izvestaj je zakljucan"
                : "Nakon drugog potpisa izvestaj se automatski zakljucava"}
          </Button>
        ) : currentStep !== "Zavrseno" ? (
          <Button disabled={!canProceed() || readOnly} onClick={goNext} type="button">
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
