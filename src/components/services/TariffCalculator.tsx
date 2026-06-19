import { useMemo, useState } from "react";
import { useApp } from "@/context/AppProvider";
import { calcTariff } from "@/lib/api";

type TariffCalculatorProps = {
  serviceId: string;
  basePrice: number;
};

export function TariffCalculator({ serviceId, basePrice }: TariffCalculatorProps) {
  const { tr } = useApp();
  const [type, setType] = useState("parcel");
  const [weight, setWeight] = useState(500);
  const [declared, setDeclared] = useState(false);

  const price = useMemo(() => calcTariff(basePrice, type, weight, declared), [basePrice, type, weight, declared]);

  if (!["post-shipment", "international", "courier", "calculator", "ecommerce"].includes(serviceId)) {
    return null;
  }

  return (
    <div className="tariff-calc" onClick={(e) => e.stopPropagation()}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{tr("sections", "calculator")}</p>
      <label className="fluid-label text-xs">
        {tr("sections", "shipmentType")}
        <select value={type} onChange={(e) => setType(e.target.value)} className="fluid-input text-sm">
          <option value="letter">{tr("sections", "letter")}</option>
          <option value="parcel">{tr("sections", "parcel")}</option>
          <option value="ems">{tr("sections", "ems")}</option>
        </select>
      </label>
      <label className="fluid-label mt-2 text-xs">
        {tr("sections", "weight")}
        <input type="number" min={1} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="fluid-input text-sm" />
      </label>
      <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} />
        {tr("sections", "declaredValue")}
      </label>
      <p className="mt-2 text-sm font-bold text-brand">
        {tr("sections", "calculatedPrice")}: {price.toFixed(2)} BYN
      </p>
    </div>
  );
}
