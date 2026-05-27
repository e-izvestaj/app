import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import Button from "../../components/Button";
import Card from "../../components/Card";

type SignatureKey = "a" | "b";

type Props = {
  signatures: {
    a: string | null;
    b: string | null;
  };
  onChange: (next: { a: string | null; b: string | null }) => void;
};

function SignaturePad({
  label,
  signatureKey,
  signatures,
  onChange
}: {
  label: string;
  signatureKey: SignatureKey;
  signatures: Props["signatures"];
  onChange: Props["onChange"];
}) {
  const ref = useRef<any>(null);

  const saveSignature = () => {
    const dataUrl = ref.current?.getTrimmedCanvas().toDataURL("image/png") || null;
    onChange({ ...signatures, [signatureKey]: dataUrl });
  };

  const clear = () => {
    ref.current?.clear();
    onChange({ ...signatures, [signatureKey]: null });
  };

  return (
    <Card className="space-y-4">
      <div className="text-base font-medium text-white">{label}</div>
      <div className="overflow-hidden rounded-[24px] bg-white">
        <SignatureCanvas
          canvasProps={{ className: "h-[180px] w-full" }}
          onEnd={saveSignature}
          penColor="#0B0D12"
          ref={ref}
        />
      </div>
      <Button onClick={clear} type="button" variant="secondary">
        Reset
      </Button>
    </Card>
  );
}

export default function SignatureStep({ signatures, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Potpisi.</h2>
        <p className="text-sm text-white/60">Dva potpisa, jasno odvojena.</p>
      </div>
      <SignaturePad
        label="Potpis vozaca A"
        signatureKey="a"
        signatures={signatures}
        onChange={onChange}
      />
      <SignaturePad
        label="Potpis vozaca B"
        signatureKey="b"
        signatures={signatures}
        onChange={onChange}
      />
    </div>
  );
}
