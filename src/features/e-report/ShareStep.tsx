import { useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import type { ReportDraft } from "../../types";
import DocumentationPackageView, {
  buildDocumentationHtml,
  createDocumentationHtmlFile,
  downloadDocumentationHtml
} from "./DocumentationPackageView";

type DocumentAsset = {
  dataUrl: string;
  label: string;
};

type Props = {
  documents: DocumentAsset[];
  pdfUrl: string | null;
  report: ReportDraft;
  reportId: string;
};

type InsurancePartner = {
  acceptsHtmlPackage: boolean;
  acceptsJson: boolean;
  acceptsPdfAndImages: boolean;
  acceptsZip: boolean;
  claimsEmail: string;
  name: string;
  partner: boolean;
  portalUrl?: string;
};

const INSURANCE_PARTNERS: InsurancePartner[] = [
  {
    acceptsHtmlPackage: true,
    acceptsJson: true,
    acceptsPdfAndImages: true,
    acceptsZip: false,
    claimsEmail: "stete.mv@grawe.rs",
    name: "Grawe",
    partner: true,
    portalUrl: "Partner portal"
  },
  {
    acceptsHtmlPackage: false,
    acceptsJson: false,
    acceptsPdfAndImages: true,
    acceptsZip: false,
    claimsEmail: "stete@dunav.com",
    name: "Dunav",
    partner: false
  },
  {
    acceptsHtmlPackage: false,
    acceptsJson: false,
    acceptsPdfAndImages: true,
    acceptsZip: false,
    claimsEmail: "prijava.stete@ddor.rs",
    name: "DDOR",
    partner: false
  }
];

function extensionFromDataUrl(dataUrl: string) {
  const mime = dataUrl.match(/^data:([^;]+);/)?.[1] || "image/jpeg";

  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

function safeFileName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "prilog"
  );
}

async function dataUrlToFile(document: DocumentAsset, index: number) {
  const response = await fetch(document.dataUrl);
  const blob = await response.blob();
  const extension = extensionFromDataUrl(document.dataUrl);

  return new File(
    [blob],
    `${String(index + 1).padStart(2, "0")}-${safeFileName(document.label)}.${extension}`,
    {
      type: blob.type || "image/jpeg"
    }
  );
}

export default function ShareStep({
  documents,
  pdfUrl,
  report,
  reportId
}: Props) {
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);
  const [selectedDocumentKeys, setSelectedDocumentKeys] = useState(() =>
    documents.map((document) => `${document.label}-${document.dataUrl.slice(-16)}`)
  );
  const [selectedInsuranceName, setSelectedInsuranceName] = useState(
    INSURANCE_PARTNERS[0]?.name || ""
  );
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const selectedInsurance =
    INSURANCE_PARTNERS.find((insurance) => insurance.name === selectedInsuranceName) ||
    INSURANCE_PARTNERS[0];
  const documentKey = (document: DocumentAsset) =>
    `${document.label}-${document.dataUrl.slice(-16)}`;
  const selectedDocuments = documents.filter((document) =>
    selectedDocumentKeys.includes(documentKey(document))
  );

  const toggleDocument = (key: string) => {
    setSelectedDocumentKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const shareSelectedAttachments = async () => {
    if (!selectedDocuments.length) {
      setShareMessage("Izaberi bar jedan prilog za slanje.");
      return;
    }

    try {
      const files = await Promise.all(selectedDocuments.map(dataUrlToFile));
      const shareData = {
        title: `Prilozi ${report.publicId}`,
        text: `Prilozi za e-Izvestaj ${report.publicId}`,
        files
      };

      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        setShareMessage("Otvoren je meni za deljenje priloga.");
        return;
      }

      setShareMessage("Ovaj uredjaj ne podrzava direktno deljenje vise slika iz browsera.");
    } catch {
      setShareMessage("Slanje priloga nije uspelo. Pokusaj sa manjim brojem slika.");
    }
  };

  const shareReportAsImage = () => {
    setShareMessage(
      "Konverzija PDF-a u sliku je sledeci tehnicki korak. Za sada korisnik moze da podeli PDF ili slike iz priloga."
    );
  };

  const shareWithInsurance = async () => {
    if (!selectedInsurance) {
      setShareMessage("Izaberi osiguravajucu kucu.");
      return;
    }

    const file = createDocumentationHtmlFile(report, documents, {
      allowJsonExport: Boolean(selectedInsurance.acceptsJson)
    });
    const shareData = {
      title: `Dokumentacija ${report.publicId} - ${selectedInsurance.name}`,
      text: `Dokumentacija za e-Izvestaj ${report.publicId}. Osiguranje: ${selectedInsurance.name}.`,
      files: [file]
    };

    try {
      if (
        selectedInsurance.partner &&
        navigator.share &&
        (!navigator.canShare || navigator.canShare(shareData))
      ) {
        await navigator.share(shareData);
        setShareMessage("Otvoren je meni za deljenje partner paketa.");
        return;
      }

      if (selectedInsurance.partner) {
        downloadDocumentationHtml(report, documents, {
          allowJsonExport: Boolean(selectedInsurance.acceptsJson)
        });
        setShareMessage("Partner paket je preuzet. Zakljucani portal/link dodajemo u sledecem koraku.");
        return;
      }

      setShareMessage(`Za ${selectedInsurance.name} posalji PDF i slike na ${selectedInsurance.claimsEmail}.`);
    } catch {
      setShareMessage("Deljenje osiguranju nije uspelo. Pokusaj rucno slanje PDF-a i priloga.");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">Izvestaj je spreman</h2>

      <Card className="space-y-4 border border-accent/25 bg-[radial-gradient(circle_at_top_left,rgba(47,128,255,0.22),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Broj izvestaja</div>
        <div className="text-3xl font-semibold text-white">{reportId}</div>
      </Card>

      <Card className="space-y-3">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Pregled</div>
        {pdfUrl ? (
          <a
            className="block w-full rounded-[24px] border border-white/10 bg-white/10 px-5 py-4 text-left text-base font-semibold text-white transition duration-200 hover:bg-white/14"
            href={pdfUrl}
            rel="noreferrer"
            target="_blank"
          >
            Pregledaj e-Izvestaj PDF
          </a>
        ) : (
          <Button disabled type="button" variant="secondary">
            Pregledaj e-Izvestaj PDF
          </Button>
        )}
        <Button disabled={!documents.length} onClick={() => setPackageOpen(true)} type="button" variant="secondary">
          Pregled dokumentacije
        </Button>
        <Button disabled={!documents.length} onClick={() => setDocumentsOpen(true)} type="button" variant="secondary">
          Pregledaj priloge
        </Button>
      </Card>

      <Card className="space-y-3 border border-emerald-300/25 bg-emerald-500/8">
        <div className="text-xs uppercase tracking-[0.28em] text-emerald-100/60">Podaci za slanje</div>
        <Button onClick={shareReportAsImage} type="button" variant="secondary">
          Prosledi evropski izvestaj kao sliku
        </Button>
        <Button disabled={!documents.length} onClick={() => setAttachmentsOpen(true)} type="button" variant="secondary">
          Prosledi slike iz priloga
        </Button>
        <Button disabled={!documents.length} onClick={() => setInsuranceOpen(true)} type="button" variant="success">
          Posalji osiguranju
        </Button>
        {shareMessage ? (
          <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
            {shareMessage}
          </div>
        ) : null}
      </Card>

      {documentsOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-bg/50 px-4 py-6">
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-semibold text-white">Prilozi</h3>
              <Button fullWidth={false} onClick={() => setDocumentsOpen(false)} type="button" variant="secondary">
                Zatvori
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {documents.map((document) => (
                <div
                  className="overflow-hidden rounded-[8px] border border-white/10 bg-white/5"
                  key={`${document.label}-${document.dataUrl.slice(-16)}`}
                >
                  <img
                    alt={document.label}
                    className="aspect-[4/3] w-full bg-white object-contain"
                    src={document.dataUrl}
                  />
                  <div className="px-3 py-3 text-sm text-white/70">{document.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {packageOpen ? (
        <DocumentationPackageView documents={documents} onClose={() => setPackageOpen(false)} report={report} />
      ) : null}

      {attachmentsOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-bg/70 px-4 py-6">
          <div className="mx-auto w-full max-w-md space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-semibold text-white">Slike iz priloga</h3>
              <Button fullWidth={false} onClick={() => setAttachmentsOpen(false)} type="button" variant="secondary">
                Zatvori
              </Button>
            </div>
            <Card className="space-y-4">
              <div className="grid gap-3">
                {documents.map((document, index) => {
                  const key = documentKey(document);
                  const checked = selectedDocumentKeys.includes(key);

                  return (
                    <label
                      className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/5 p-3"
                      key={key}
                    >
                      <input
                        checked={checked}
                        className="h-5 w-5"
                        onChange={() => toggleDocument(key)}
                        type="checkbox"
                      />
                      <img
                        alt={document.label}
                        className="h-14 w-14 rounded-[8px] bg-white object-cover"
                        src={document.dataUrl}
                      />
                      <span className="text-sm text-white/75">{document.label || `Prilog ${index + 1}`}</span>
                    </label>
                  );
                })}
              </div>
              <Button onClick={() => void shareSelectedAttachments()} type="button" variant="success">
                Podeli izabrane slike
              </Button>
            </Card>
          </div>
        </div>
      ) : null}

      {insuranceOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-bg/70 px-4 py-6">
          <div className="mx-auto w-full max-w-md space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-semibold text-white">Posalji osiguranju</h3>
              <Button fullWidth={false} onClick={() => setInsuranceOpen(false)} type="button" variant="secondary">
                Zatvori
              </Button>
            </div>
            <Card className="space-y-3">
              <div className="text-xs uppercase tracking-[0.28em] text-white/40">Osiguranje</div>
              <select
                className="w-full rounded-[18px] border border-white/10 bg-[#111827] px-4 py-3 text-white"
                onChange={(event) => setSelectedInsuranceName(event.target.value)}
                value={selectedInsuranceName}
              >
                {INSURANCE_PARTNERS.map((insurance) => (
                  <option key={insurance.name} value={insurance.name}>
                    {insurance.name}
                  </option>
                ))}
              </select>
              {selectedInsurance ? (
                <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
                  {selectedInsurance.partner
                    ? "Partner osiguranje: podrzava HTML paket i JSON izvoz za ERP."
                    : `Nije partner: preporuceno slanje PDF-a i slika na ${selectedInsurance.claimsEmail}.`}
                </div>
              ) : null}
              {selectedInsurance?.partner ? (
                <>
                  <iframe
                    className="h-56 w-full rounded-[8px] border border-white/10 bg-white"
                    srcDoc={buildDocumentationHtml(report, documents, {
                      allowJsonExport: Boolean(selectedInsurance.acceptsJson)
                    })}
                    title="Pregled paketa za osiguranje"
                  />
                  <Button onClick={() => void shareWithInsurance()} type="button" variant="success">
                    Prosledi partner paket
                  </Button>
                  <Button
                    onClick={() =>
                      downloadDocumentationHtml(report, documents, {
                        allowJsonExport: Boolean(selectedInsurance.acceptsJson)
                      })
                    }
                    type="button"
                    variant="secondary"
                  >
                    Preuzmi partner paket
                  </Button>
                </>
              ) : (
                <>
                  {pdfUrl ? (
                    <a
                      className="block w-full rounded-[24px] bg-emerald-500 px-5 py-4 text-left text-base font-semibold text-white shadow-[0_12px_35px_rgba(16,185,129,0.32)] transition duration-200 hover:brightness-110"
                      href={pdfUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Otvori evropski izvestaj PDF
                    </a>
                  ) : null}
                  <Button
                    onClick={() => {
                      setInsuranceOpen(false);
                      setAttachmentsOpen(true);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    Izaberi i podeli slike iz priloga
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
