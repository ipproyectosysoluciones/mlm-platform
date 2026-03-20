import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRDisplayProps {
  value: string;
  referralCode: string;
}

export default function QRDisplay({ value, referralCode }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: 200,
        margin: 2,
        color: {
          dark: '#4F46E5',
          light: '#FFFFFF',
        },
      });
    }
  }, [value]);

  return (
    <div className="text-center">
      <canvas ref={canvasRef} className="mx-auto rounded-lg" />
      <p className="mt-3 text-sm font-medium text-gray-700">{referralCode}</p>
    </div>
  );
}
