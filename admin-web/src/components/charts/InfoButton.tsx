import { useEffect, useId, useRef, useState } from "react";
import type { ChartInfo } from "../../domain/chartInfo";

/**
 * Botón «i» con la explicación de un gráfico. Se abre al pasar el puntero, al enfocarlo con el
 * teclado o al tocarlo (que la deja fija hasta tocar de nuevo, hacer clic fuera o pulsar Escape).
 */
export function InfoButton({ title, info }: { title: string; info: ChartInfo }) {
  const id = useId();
  const box = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hover || focus || pinned;

  const close = () => {
    setPinned(false);
    setHover(false);
    setFocus(false);
  };

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    const outside = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  return (
    <span
      className="info"
      ref={box}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
    >
      <button
        type="button"
        className="info-button"
        aria-label={`Qué muestra «${title}»`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => (pinned ? close() : setPinned(true))}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      >
        i
      </button>
      <span id={id} role="tooltip" className="info-popover" hidden={!open}>
        <span className="info-row"><strong>Qué muestra.</strong> {info.what}</span>
        <span className="info-row"><strong>Cómo leerlo.</strong> {info.read}</span>
        <span className="info-row"><strong>Cómo se calcula.</strong> {info.how}</span>
      </span>
    </span>
  );
}
