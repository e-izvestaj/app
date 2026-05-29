import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import { saveReport, setActiveDraftId } from "../../lib/indexedDb";
import { generatePdf } from "../../lib/pdf";
import {
  deriveReportStatus,
  getDocumentationMissingFields,
  getReportStatusLabel,
  getVehicleSectionMissingFields,
  nowIso,
  reportTitle
} from "../../lib/utils";
import type { ReportDraft } from "../../types";
import AccidentDetails from "./AccidentDetails";
import { stepTitles, type StepTitle } from "./constants";
import DamageCaptureStep from "./DamageCaptureStep";
import DocumentationStep from "./DocumentationStep";
import LocationTimeStep from "./LocationTimeStep";
import ReviewStep from "./ReviewStep";
import SafetyCheckStep from "./SafetyCheckStep";
import SceneSituationStep from "./SceneSituationStep";
import SceneSketchStep from "./SceneSketchStep";
import ShareStep from "./ShareStep";
import SignatureStep from "./SignatureStep";
import VehicleForm from "./VehicleForm";

type Props = {
  report: ReportDraft;
  onReportChange: Dispatch<SetStateAction<ReportDraft | null>>;
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
  const [isLocking, setIsLocking] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const activeSteps = useMemo(() => [...stepTitles], []);
  const currentStep = activeSteps[stepIndex];
  const readOnly = forceReadOnly || report.status === "locked";

  useEffect(() => {
    if (stepIndex >= activeSteps.length) {
      setStepIndex(activeSteps.length - 1);
    }
  }, [activeSteps.length, stepIndex]);

  useEffect(() => {
    if (report.status === "locked") {
      setStepIndex(activeSteps.indexOf("Finalizacija"));
    }
  }, [activeSteps, report.status]);

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
    if (!report.signatures.a || !report.signatures.b || report.status === "locked" || isLocking) {
      return;
    }

    if (report.status !== "ready_for_signature") {
      return;
    }

    void (async () => {
      setIsLocking(true);
      setLockError(null);

      try {
        const lockedReport: ReportDraft = {
          ...report,
          status: "locked",
          lockedAt: report.lockedAt || nowIso(),
          readyForSignatureAt: report.readyForSignatureAt || nowIso(),
          updatedAt: nowIso()
        };

        const pdfResult = await generatePdf(lockedReport);
        const finalizedReport = {
          ...lockedReport,
          pdfDataUrl: pdfResult.dataUrl
        };

        setPdfUrl(pdfResult.url);
        onReportChange(finalizedReport);
        await saveReport(finalizedReport);
        await setActiveDraftId(null);
        setStepIndex(activeSteps.indexOf("Finalizacija"));
      } catch (error) {
        console.error("Zaključavanje izveštaja nije uspelo.", error);
        setLockError("Zaključavanje nije uspelo. Pokušaj ponovo.");
      } finally {
        setIsLocking(false);
      }
    })();
  }, [activeSteps, isLocking, onReportChange, report]);

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

    onReportChange((current) =>
      current
        ? {
            ...current,
            ...patch,
            updatedAt: nowIso()
          }
        : current
    );
  };

  const goNext = () => setStepIndex((current) => Math.min(current + 1, activeSteps.length - 1));

  const goBack = () => {
    if (stepIndex === 0) {
      navigate("/");
      return;
    }

    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const goToStep = (step: StepTitle) => {
    const index = activeSteps.indexOf(step);
    if (index >= 0) {
      setStepIndex(index);
    }
  };

  const previewPdf = () => {
    if (!pdfUrl) {
      return;
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
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
          files: [file]
        });
        return;
      }
    } catch {
      // Fallback below.
    }

    previewPdf();
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
    window.location.href = `mailto:?subject=${encodeURIComponent(report.publicId)}&body=${encodeURIComponent("PDF je spreman za slanje iz aplikacije.")}`;
  };

  const whatsappPdf = () => {
    previewPdf();
  };

  const viberPdf = () => {
    previewPdf();
  };

  const locationLabel =
    report.location.address ||
    [report.location.street, report.location.streetNumber, report.location.city]
      .filter(Boolean)
      .join(", ");

  const canProceed = () => {
    switch (currentStep) {
      case "Bezbednost":
        return (
          report.safety.injured === false &&
          report.safety.vehiclesInPosition !== null &&
          report.safety.damageOtherVehicles !== null &&
          report.safety.damageOtherObjects !== null
        );
      case "Vreme i mesto":
        return Boolean(
          report.location.date &&
            report.location.time &&
            (report.location.address ||
              report.location.latitude ||
              report.location.street ||
              report.location.city)
        );
      case "Dokumentacija":
        return getDocumentationMissingFields(report).length === 0;
      case "Vozač A":
        return getVehicleSectionMissingFields(report.vehicleA, "driver").length === 0;
      case "Vozilo A":
        return getVehicleSectionMissingFields(report.vehicleA, "vehicle").length === 0;
      case "Polisa A":
        return getVehicleSectionMissingFields(report.vehicleA, "policy").length === 0;
      case "Vozač B":
        return getVehicleSectionMissingFields(report.vehicleB, "driver").length === 0;
      case "Vozilo B":
        return getVehicleSectionMissingFields(report.vehicleB, "vehicle").length === 0;
      case "Polisa B":
        return getVehicleSectionMissingFields(report.vehicleB, "policy").length === 0;
      case "Oštećenja vozila":
        return Boolean(
          report.scenePhotos.some((photo) => photo.kind === "damage-a") &&
            report.scenePhotos.some((photo) => photo.kind === "damage-b") &&
            report.vehicleA.impactZone &&
            report.vehicleB.impactZone
        );
      case "Fotografija mesta nezgode":
        return Boolean(report.scenePhotos.some((photo) => photo.kind === "scene"));
      case "Okolnosti nezgode":
        return true;
      case "Skica nezgode":
        return Boolean(report.annotatedPhotoDataUrl || report.sceneSketch.status === "confirmed");
      case "Pregled izveštaja":
        return true;
      case "Potpisi":
        return false;
      case "Finalizacija":
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
      case "Vreme i mesto":
        return (
          <LocationTimeStep
            onChange={(location) => updateReport({ location })}
            onWitnessInfoChange={(witnessInfo) => updateReport({ witnessInfo })}
            readOnly={readOnly}
            value={report.location}
            witnessInfo={report.witnessInfo}
          />
        );
      case "Dokumentacija":
        return (
          <DocumentationStep
            onVehicleAChange={(vehicleA) => updateReport({ vehicleA })}
            onVehicleBChange={(vehicleB) => updateReport({ vehicleB })}
            readOnly={readOnly}
            vehicleA={report.vehicleA}
            vehicleB={report.vehicleB}
          />
        );
      case "Vozač A":
        return (
          <VehicleForm
            accent="red"
            onChange={(vehicleA) => updateReport({ vehicleA })}
            readOnly={readOnly}
            section="driver"
            title="Vozač A"
            value={report.vehicleA}
          />
        );
      case "Vozilo A":
        return (
          <VehicleForm
            accent="red"
            onChange={(vehicleA) => updateReport({ vehicleA })}
            readOnly={readOnly}
            section="vehicle"
            title="Vozilo A"
            value={report.vehicleA}
          />
        );
      case "Polisa A":
        return (
          <VehicleForm
            accent="red"
            onChange={(vehicleA) => updateReport({ vehicleA })}
            readOnly={readOnly}
            section="policy"
            title="Polisa A"
            value={report.vehicleA}
          />
        );
      case "Vozač B":
        return (
          <VehicleForm
            accent="blue"
            onChange={(vehicleB) => updateReport({ vehicleB })}
            readOnly={readOnly}
            section="driver"
            title="Vozač B"
            value={report.vehicleB}
          />
        );
      case "Vozilo B":
        return (
          <VehicleForm
            accent="blue"
            onChange={(vehicleB) => updateReport({ vehicleB })}
            readOnly={readOnly}
            section="vehicle"
            title="Vozilo B"
            value={report.vehicleB}
          />
        );
      case "Polisa B":
        return (
          <VehicleForm
            accent="blue"
            onChange={(vehicleB) => updateReport({ vehicleB })}
            readOnly={readOnly}
            section="policy"
            title="Polisa B"
            value={report.vehicleB}
          />
        );
      case "Oštećenja vozila":
        return (
          <DamageCaptureStep
            onChange={(scenePhotos) => updateReport({ scenePhotos })}
            onVehicleAChange={(vehicleA) => updateReport({ vehicleA })}
            onVehicleBChange={(vehicleB) => updateReport({ vehicleB })}
            photos={report.scenePhotos}
            readOnly={readOnly}
            vehicleA={report.vehicleA}
            vehicleB={report.vehicleB}
          />
        );
      case "Fotografija mesta nezgode":
        return (
          <SceneSituationStep
            onChange={(scenePhotos) => updateReport({ scenePhotos })}
            photos={report.scenePhotos}
            readOnly={readOnly}
          />
        );
      case "Okolnosti nezgode":
        return (
          <AccidentDetails
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
      case "Skica nezgode":
        return (
          <SceneSketchStep
            hasGps={Boolean(report.location.latitude && report.location.longitude)}
            latitude={report.location.latitude}
            locationLabel={locationLabel || null}
            longitude={report.location.longitude}
            onChange={(sceneSketch) => updateReport({ sceneSketch })}
            onSaveSketchImage={(annotatedPhotoDataUrl) => updateReport({ annotatedPhotoDataUrl })}
            readOnly={readOnly}
            sceneSketch={report.sceneSketch}
          />
        );
      case "Pregled izveštaja":
        return <ReviewStep onEditStep={goToStep} report={report} />;
      case "Potpisi":
        return (
          <SignatureStep
            onChange={(signatures, signatureTimestamps) =>
              updateReport({
                signatures,
                signatureTimestamps: signatureTimestamps || report.signatureTimestamps
              })
            }
            readOnly={readOnly || report.status === "locked"}
            signatureTimestamps={report.signatureTimestamps}
            signatures={report.signatures}
            statusLabel={getReportStatusLabel(report.status, { isLocking })}
          />
        );
      case "Finalizacija":
        return (
          <ShareStep
            onEmail={emailPdf}
            onPreview={previewPdf}
            onSave={savePdf}
            onShare={sharePdf}
            onViber={viberPdf}
            onWhatsApp={whatsappPdf}
            pdfUrl={pdfUrl}
            reportId={report.publicId}
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
          <div>
            {stepIndex + 1}/{activeSteps.length}
          </div>
        </div>
      </div>

      <Card className="mb-5 space-y-3">
        <ProgressBar current={stepIndex + 1} label={currentStep} total={activeSteps.length} />
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.26em] text-white/40">
          <span>Status</span>
          <span>{getReportStatusLabel(report.status, { isLocking })}</span>
        </div>
      </Card>

      <div className="flex-1">{renderStep()}</div>

      {lockError ? (
        <div className="mt-4 rounded-[20px] border border-rose-400/25 bg-rose-500/12 px-4 py-3 text-sm text-rose-100">
          {lockError}
        </div>
      ) : null}

      <div className="mt-6">
        {currentStep === "Potpisi" ? (
          <Button disabled type="button" variant="secondary">
            {isLocking
              ? "Zaključavam izveštaj..."
              : report.status === "locked"
                ? "Izveštaj je zaključan"
                : "Sačuvaj oba potpisa"}
          </Button>
        ) : currentStep !== "Finalizacija" ? (
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
