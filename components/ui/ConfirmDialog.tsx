"use client";

import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "./Button";
import { Modal } from "./Modal";
import { Sticker } from "./Sticker";

/**
 * Hộp xác nhận chung. Focus mặc định vào nút HỦY để Enter/Space lỡ tay không chạy hành động.
 */
export function ConfirmDialog({
  open,
  title,
  emoji = "🤔",
  children,
  confirmLabel,
  confirmVariant = "beer",
  cancelLabel = "Thôi, giữ nguyên",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  emoji?: string;
  children: ReactNode;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} label={title}>
      <div className="flex flex-col gap-4 rounded-chunky border-4 border-ink bg-cream p-6 shadow-brutal-lg">
        <div className="flex items-center gap-3">
          <Sticker emoji={emoji} size={56} tilt={-10} />
          <h2 className="font-display text-2xl leading-tight">{title}</h2>
        </div>
        <div className="flex flex-col gap-2">{children}</div>
        <div className="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} autoFocus>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
