"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export function Barcode({
  value,
  height = 48,
  displayValue = true,
}: {
  value: string;
  height?: number;
  displayValue?: boolean;
}) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        displayValue,
        fontSize: 12,
        height,
        margin: 0,
        background: "#ffffff",
        lineColor: "#1c242c",
      });
    } catch {
      /* ignore invalid */
    }
  }, [value, height, displayValue]);

  return <svg ref={ref} role="img" aria-label={value} />;
}
