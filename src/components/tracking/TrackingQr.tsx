import { motion } from "framer-motion";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

type TrackingQrProps = {
  trackingId: string;
};

export function TrackingQr({ trackingId }: TrackingQrProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(`BELPOST:${trackingId}`, {
      margin: 1,
      width: 220,
      color: { dark: "#1F6FD8", light: "#FFFFFF" },
    }).then((url) => {
      if (active) setDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [trackingId]);

  if (!dataUrl) return null;

  return (
    <motion.div
      className="tracking-qr-card"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.img
        src={dataUrl}
        alt={`QR-код отправления ${trackingId}`}
        className="tracking-qr-image"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <p className="tracking-qr-caption">
        Покажите данный QR-код оператору в отделении связи для ускоренного бесконтактного получения без паспорта
      </p>
      <p className="tracking-qr-id font-mono">{trackingId}</p>
    </motion.div>
  );
}
