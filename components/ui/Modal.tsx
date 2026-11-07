"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Modal dựa trên <dialog> native: top layer, nền phía sau bị inert (focus trap),
 * Esc đóng, trình duyệt tự trả focus về phần tử trước đó.
 */
export function Modal({
  open,
  onClose,
  children,
  label,
  className = "",
  dismissible = true,
  fullscreen = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
  className?: string;
  /** false: Esc / click nền không đóng được */
  dismissible?: boolean;
  fullscreen?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
      className={[
        "m-auto bg-transparent p-0 text-ink backdrop:bg-ink/80",
        fullscreen ? "h-dvh max-h-none w-screen max-w-none" : "max-h-[90dvh] w-[min(92vw,560px)] overflow-visible",
        className,
      ].join(" ")}
    >
      {open && children}
    </dialog>
  );
}
