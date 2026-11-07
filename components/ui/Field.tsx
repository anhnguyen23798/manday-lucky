import type { InputHTMLAttributes, Ref } from "react";

export function Field({
  label,
  error,
  className = "",
  id,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null; ref?: Ref<HTMLInputElement> }) {
  const inputId = id ?? `f-${label.replace(/\s+/g, "-")}`;
  return (
    <label htmlFor={inputId} className={`flex flex-col gap-1 ${className}`}>
      <span className="font-rounded text-base font-extrabold">{label}</span>
      <input
        id={inputId}
        ref={ref}
        {...props}
        aria-invalid={error ? true : undefined}
        className={`min-h-12 rounded-chunky border-[3px] bg-white px-3 text-base outline-none transition-shadow focus:shadow-brutal-sm ${
          error ? "border-bbq" : "border-ink"
        }`}
      />
      {error && <span className="text-sm font-semibold text-ink">⚠️ {error}</span>}
    </label>
  );
}
