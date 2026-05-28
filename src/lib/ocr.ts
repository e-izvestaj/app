import { experimentalProviders } from "./ocrProviders";
import type { DocumentSuggestion, DocumentType, PhotoAsset } from "../types";

export async function extractDocumentSuggestion(
  photo: PhotoAsset | undefined,
  documentType: DocumentType
): Promise<DocumentSuggestion> {
  const provider = experimentalProviders.find((item) => item.supports(documentType));

  if (!provider) {
    return {
      documentType,
      status: "pending",
      sourcePhotoId: photo?.id || null,
      fields: []
    };
  }

  const result = await provider.extract(photo);

  return {
    documentType,
    status: "pending",
    sourcePhotoId: photo?.id || null,
    fields: result.fields,
    rawText: result.rawText
  };
}
