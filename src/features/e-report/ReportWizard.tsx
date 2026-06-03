import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ProgressBar from "../../components/ProgressBar";
import { saveReport, setActiveDraftId } from "../../lib/indexedDb";
import { generatePdf } from "../../lib/pdf";
import { generateReportZip } from "../../lib/zip";
import {
  deriveReportStatus,
  getReportStatusLabel,
  getVehicleSectionMissingFields,
  nowIso,
} from "../../lib/utils";
import type { ReportDraft } from "../../types";
import AccidentDetails from "./AccidentDetails";
import { stepTitles, type StepTitle } from "./constants";
import DocumentationStep from "./DocumentationStep";
import LocationTimeStep from "./LocationTimeStep";
import ReviewStep from "./ReviewStep";
import SafetyCheckStep from "./SafetyCheckStep";
import SceneSketchStep from "./SceneSketchStep";
import ShareStep from "./ShareStep";
import SignatureStep from "./SignatureStep";
import SecondParticipantStep from "./SecondParticipantStep";
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
  const readOnly = forceReadOnly || report.status === "locked" || report.status === "completed";

  useEffect(() => {
    if (stepIndex >= activeSteps.length) {
      setStepIndex(activeSteps.length - 1);
    }
  }, [activeSteps.length, stepIndex]);

  useEffect(() => {
    if (report.status === "locked" || report.status === "completed") {
      setStepIndex(activeSteps.indexOf("Finalizacija"));
    }
  }, [activeSteps, report.status]);

  useEffect(() => {
    if (report.pdfDataUrl && !pdfUrl) {
      setPdfUrl(report.pdfDataUrl);
    }
  }, [pdfUrl, report.pdfDataUrl]);

  useEffect(() => {
    if (report.status !== "locked" && report.status !== "completed" && !forceReadOnly) {
      const nextStatus = deriveReportStatus(report);
      const shouldSetReadyAt =
        (nextStatus === "ready_for_pdf" || nextStatus === "ready_for_signature") &&
        !report.readyForSignatureAt;
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
    if (
      !report.signatures.a ||
      !report.signatures.b ||
      report.status === "locked" ||
      report.status === "completed" ||
      isLocking
    ) {
      return;
    }

    if (report.status !== "ready_for_pdf" && report.status !== "ready_for_signature") {
      return;
    }

    void (async () => {
      setIsLocking(true);
      setLockError(null);

      try {
        const lockedReport: ReportDraft = {
          ...report,
          status: "completed",
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
      void setActiveDraftId(next.status === "locked" || next.status === "completed" ? null : next.id);
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
    const normalizedStep =
      step === "Vozač A" ? "Vozac A" : step === "Vozač B" ? "Drugi ucesnik" : step;
    const index = activeSteps.indexOf(normalizedStep);
    if (index >= 0) {
      setStepIndex(index);
    }
  };

  const previewPdf = () => {
    void (async () => {
      const readyUrl = await ensurePdfReady();
      if (!readyUrl) {
        return;
      }

      window.open(readyUrl, "_blank", "noopener,noreferrer");
    })();
  };

  const ensurePdfReady = async () => {
    if (pdfUrl) {
      return pdfUrl;
    }

    const pdfResult = await generatePdf(report);
    setPdfUrl(pdfResult.url);
    const updatedReport = {
      ...report,
      pdfDataUrl: pdfResult.dataUrl,
      updatedAt: nowIso()
    };
    onReportChange(updatedReport);
    await saveReport(updatedReport);
    return pdfResult.url;
  };

  const savePdf = () => {
    void (async () => {
      const readyUrl = await ensurePdfReady();
      if (!readyUrl) {
        return;
      }

      const link = document.createElement("a");
      link.href = readyUrl;
      link.download = `${report.publicId}.pdf`;
      link.click();
    })();
  };

  const saveZip = () => {
    void (async () => {
      await ensurePdfReady();
      const zip = await generateReportZip(report);
      const link = document.createElement("a");
      link.href = zip.url;
      link.download = `${report.publicId}.zip`;
      link.click();
    })();
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
        return true;
      case "Vozac A":
        return getVehicleSectionMissingFields(report.vehicleA, "driver").length === 0;
      case "Vozilo A":
        return getVehicleSectionMissingFields(report.vehicleA, "vehicle").length === 0;
      case "Polisa A":
        return getVehicleSectionMissingFields(report.vehicleA, "policy").length === 0;
      case "Okolnosti nezgode":
        return true;
      case "Skica nezgode":
        return Boolean(report.annotatedPhotoDataUrl || report.sceneSketch.status === "confirmed");
      case "Drugi ucesnik":
        return true;
      case "Podaci ucesnika B":
        return Boolean(report.vehicleB.source);
      case "Pregled izvestaja":
        return Boolean(report.vehicleB.source);
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
            onScenePhotosChange={(scenePhotos) => updateReport({ scenePhotos })}
            onVehicleAChange={(vehicleA) => updateReport({ vehicleA })}
            onVehicleBChange={(vehicleB) => updateReport({ vehicleB })}
            readOnly={readOnly}
            scenePhotos={report.scenePhotos}
            vehicleA={report.vehicleA}
            vehicleB={report.vehicleB}
          />
        );
      case "Vozac A":
        return (
          <VehicleForm
            accent="blue"
            onChange={(vehicleA) => updateReport({ vehicleA })}
            readOnly={readOnly}
            section="driver"
            title="Vozac A"
            value={report.vehicleA}
          />
        );
      case "Vozilo A":
        return (
          <VehicleForm
            accent="blue"
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
            accent="blue"
            onChange={(vehicleA) => updateReport({ vehicleA })}
            readOnly={readOnly}
            section="policy"
            title="Polisa A"
            value={report.vehicleA}
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
      case "Drugi ucesnik":
        return (
          <SecondParticipantStep
            mode="invite"
            onChange={(vehicleB, signature) =>
              updateReport({
                vehicleB,
                partyB: vehicleB,
                signatures: signature
                  ? { ...report.signatures, b: signature, partyB: signature }
                  : report.signatures
              })
            }
            readOnly={readOnly}
            signature={report.signatures.b}
            value={report.vehicleB}
          />
        );
      case "Podaci ucesnika B":
        return (
          <SecondParticipantStep
            mode="import"
            onChange={(vehicleB, signature) =>
              updateReport({
                vehicleB,
                partyB: vehicleB,
                signatures: signature
                  ? { ...report.signatures, b: signature, partyB: signature }
                  : report.signatures
              })
            }
            readOnly={readOnly}
            signature={report.signatures.b}
            value={report.vehicleB}
          />
        );
      case "Pregled izvestaja":
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
            onSaveZip={saveZip}
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
              : report.status === "locked" || report.status === "completed"
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
