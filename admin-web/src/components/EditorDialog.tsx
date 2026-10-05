import { type ReactNode, useEffect, useId, useRef, useState } from "react";

/** Native modal keeps keyboard focus inside the editor and restores its opener. */
export function EditorDialog(
  { title, subtitle, dirty, busy, unconfirmed = false, onClose, children }: {
    title: string;
    subtitle: string;
    dirty: boolean;
    busy: boolean;
    unconfirmed?: boolean;
    onClose: () => void;
    children: ReactNode;
  },
) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const keepButton = useRef<HTMLButtonElement>(null);
  const [discard, setDiscard] = useState(false);
  const closeRequest = useRef<() => void>(() => {});
  const id = useId();
  useEffect(() => {
    const element = dialog.current!;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const cancel = (event: Event) => {
      event.preventDefault();
      closeRequest.current();
    };
    element.addEventListener("cancel", cancel);
    element.showModal();
    return () => {
      element.removeEventListener("cancel", cancel);
      element.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  useEffect(() => {
    if (discard) keepButton.current?.focus();
  }, [discard]);
  function requestClose() {
    if (busy || unconfirmed) return;
    if (dirty) setDiscard(true);
    else onClose();
  }
  closeRequest.current = requestClose;
  return (
    <dialog
      ref={dialog}
      className="editor-dialog"
      aria-labelledby={id}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          requestClose();
          return;
        }
        if (event.key !== "Tab") return;
        const stops = Array.from(dialog.current!.querySelectorAll<HTMLElement>(
          "button, a[href], input, select, textarea, [tabindex]",
        )).filter((element) =>
          element.tabIndex >= 0 && !element.matches(":disabled") &&
          element.getClientRects().length > 0 && !element.closest("[inert]")
        );
        const first = stops[0], last = stops.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <header className="dialog-header">
        <div>
          <span className="eyebrow">{subtitle}</span>
          <h2 id={id}>{title}</h2>
        </div>
        <button
          ref={closeButton}
          className="dialog-close secondary"
          aria-label="Cerrar editor"
          disabled={busy || unconfirmed}
          onClick={requestClose}
        >
          ✕
        </button>
      </header>
      {discard && (
        <section
          className="discard-confirmation"
          aria-label="Cambios sin guardar"
        >
          <strong>Tienes cambios sin guardar</strong>
          <p>Si cierras el editor, perderás estos cambios.</p>
          <div className="actions">
            <button
              ref={keepButton}
              onClick={() => {
                setDiscard(false);
                closeButton.current?.focus();
              }}
            >
              Seguir editando
            </button>
            <button className="danger" onClick={onClose}>
              Descartar y cerrar
            </button>
          </div>
        </section>
      )}
      {unconfirmed && (
        <p className="notice error">
          La operación no está confirmada. Reintenta la misma acción o recarga
          su estado antes de cerrar.
        </p>
      )}
      <div className="dialog-body" inert={discard}>{children}</div>
    </dialog>
  );
}
