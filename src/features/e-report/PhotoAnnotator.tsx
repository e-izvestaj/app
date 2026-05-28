import { useMemo, useState, type MouseEvent } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import type { MarkerType, PhotoAsset, PhotoMarker } from "../../types";
import { createId } from "../../lib/utils";

type Props = {
  photos: PhotoAsset[];
  selectedPhotoId: string | null;
  markers: PhotoMarker[];
  onSelectedPhotoIdChange: (photoId: string) => void;
  onMarkersChange: (markers: PhotoMarker[]) => void;
  onSaveFlattened: (dataUrl: string) => void;
  readOnly?: boolean;
};

const markerMap: Record<MarkerType, string> = {
  "arrow-a": "A ->",
  "arrow-b": "B ->",
  impact: "X",
  "label-a": "Vozilo A",
  "label-b": "Vozilo B"
};

export default function PhotoAnnotator({
  photos,
  selectedPhotoId,
  markers,
  onSelectedPhotoIdChange,
  onMarkersChange,
  onSaveFlattened,
  readOnly = false
}: Props) {
  const [activeType, setActiveType] = useState<MarkerType>("arrow-a");
  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === selectedPhotoId) || photos[0] || null,
    [photos, selectedPhotoId]
  );

  const addMarker = (event: MouseEvent<HTMLDivElement>) => {
    if (!selectedPhoto || readOnly) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    onMarkersChange([...markers, { id: createId("marker"), type: activeType, x, y }]);
  };

  const saveFlattened = async () => {
    if (!selectedPhoto) {
      return;
    }

    const image = new Image();
    image.src = selectedPhoto.dataUrl;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(image, 0, 0);
    context.font = "700 32px Segoe UI";
    context.textAlign = "center";
    context.textBaseline = "middle";

    markers.forEach((marker) => {
      const drawX = marker.x * canvas.width;
      const drawY = marker.y * canvas.height;
      context.fillStyle = marker.type === "impact" ? "#FF4D4F" : "#2F80FF";
      context.beginPath();
      context.roundRect(drawX - 42, drawY - 20, 84, 40, 20);
      context.fill();
      context.fillStyle = "#FFFFFF";
      context.fillText(markerMap[marker.type], drawX, drawY + 1);
    });

    onSaveFlattened(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Oznaci fotografiju.</h2>
        <p className="text-sm text-white/60">Skica udara za standardni obrazac i PDF prilog.</p>
      </div>
      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(markerMap) as MarkerType[]).map((type) => (
            <button
              key={type}
              className={`rounded-full px-4 py-2 text-sm ${
                activeType === type ? "bg-accent text-white" : "bg-white/8 text-white/60"
              } ${readOnly ? "opacity-60" : ""}`}
              disabled={readOnly}
              onClick={() => setActiveType(type)}
              type="button"
            >
              {markerMap[type]}
            </button>
          ))}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {photos.map((photo) => (
            <button
              key={photo.id}
              className={`overflow-hidden rounded-[18px] border ${
                selectedPhoto?.id === photo.id ? "border-accent" : "border-white/10"
              }`}
              onClick={() => onSelectedPhotoIdChange(photo.id)}
              type="button"
            >
              <img alt="thumb" className="h-20 w-20 object-cover" src={photo.dataUrl} />
            </button>
          ))}
        </div>

        {selectedPhoto ? (
          <div
            className="relative overflow-hidden rounded-[24px] bg-black/30"
            onClick={addMarker}
            role="presentation"
          >
            <img alt="selected scene" className="w-full object-cover" src={selectedPhoto.dataUrl} />
            {markers.map((marker) => (
              <button
                key={marker.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 px-3 py-2 text-xs text-white"
                style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!readOnly) {
                    onMarkersChange(markers.filter((item) => item.id !== marker.id));
                  }
                }}
                type="button"
              >
                {markerMap[marker.type]}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/10 p-8 text-center text-white/45">
            Potrebna je makar jedna fotografija scene.
          </div>
        )}
      </Card>
      <Button disabled={readOnly} onClick={saveFlattened} type="button" variant="secondary">
        Sacuvaj oznacenu fotografiju
      </Button>
    </div>
  );
}
