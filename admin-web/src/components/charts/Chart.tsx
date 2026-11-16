import { useState, type ReactNode } from "react";

/**
 * Lienzo SVG con tooltip. Las marcas llaman a `tip` al pasar el mouse o al enfocarlas con el
 * teclado; el texto aparece sobre el gráfico (posición en % del lienzo) y también como
 * `aria-label` de la marca, para lectores de pantalla.
 */
export interface Tip {
  x: number;
  y: number;
  title: string;
  lines: string[];
}
export interface ChartApi {
  /** Props para una marca enfocable con tooltip. (x, y) en coordenadas del viewBox. */
  mark: (x: number, y: number, title: string, lines: string[]) => {
    tabIndex: number;
    role: "img";
    "aria-label": string;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
  };
}
export const WIDTH = 560;

export function Chart(
  { height, label, children }: { height: number; label: string; children: (api: ChartApi) => ReactNode },
) {
  const [tip, setTip] = useState<Tip | null>(null);
  const api: ChartApi = {
    mark: (x, y, title, lines) => {
      const show = () => setTip({ x, y, title, lines });
      const hide = () => setTip(null);
      return {
        tabIndex: 0,
        role: "img",
        "aria-label": [title, ...lines].join(". "),
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: show,
        onBlur: hide,
      };
    },
  };
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} role="group" aria-label={label}>
        {children(api)}
      </svg>
      {tip && (
        <div
          className={"chart-tip" + (tip.x > WIDTH * 0.6 ? " left" : "")}
          style={{ left: (tip.x / WIDTH) * 100 + "%", top: (tip.y / height) * 100 + "%" }}
          aria-hidden="true"
        >
          <strong>{tip.title}</strong>
          {tip.lines.map((line) => <span key={line}>{line}</span>)}
        </div>
      )}
    </div>
  );
}

/** Patrón rayado de «sin datos suficientes». Se define una vez por página. */
export function ChartDefs() {
  return (
    <svg className="chart-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="wb-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="var(--wb-hatch-bg)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--wb-hatch-line)" strokeWidth="2" />
        </pattern>
      </defs>
    </svg>
  );
}

/** Rectángulo rayado con un texto corto, para una celda o barra sin datos suficientes. */
export function Missing(
  { x, y, width, height, text = "< 5" }: { x: number; y: number; width: number; height: number; text?: string },
) {
  return (
    <g className="missing">
      <rect x={x} y={y} width={Math.max(width, 0)} height={Math.max(height, 0)} rx="4" fill="url(#wb-hatch)" />
      {text && width > 24 && (
        <text x={x + width / 2} y={y + Math.min(height / 2 + 4, 16)} textAnchor="middle" className="missing-text">
          {text}
        </text>
      )}
    </g>
  );
}
