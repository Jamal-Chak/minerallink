import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

export function FormSection({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-slate-200 pb-3">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    </div>
  );
}

export function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0 text-sm font-medium text-slate-700">
      <span className="mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  );
}

const controlClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15";

export function TextInput({
  label,
  registration,
  error,
  type = "text",
  placeholder,
  required,
  hint,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <FormField label={label} hint={hint}>
      <input {...registration} type={type} placeholder={placeholder} required={required} className={`${controlClass} ${error ? "border-rose-500" : ""}`} aria-invalid={Boolean(error)} />
      <FieldError message={error} />
    </FormField>
  );
}

export function SelectInput({
  label,
  registration,
  options,
  error,
  required,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  options: readonly { value: string; label: string }[];
  error?: string;
  required?: boolean;
}) {
  return (
    <FormField label={label}>
      <select {...registration} required={required} className={`${controlClass} ${error ? "border-rose-500" : ""}`} aria-invalid={Boolean(error)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <FieldError message={error} />
    </FormField>
  );
}

export function TextAreaInput({
  label,
  registration,
  error,
  rows = 3,
  placeholder,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <FormField label={label}>
      <textarea {...registration} rows={rows} placeholder={placeholder} className={`${controlClass} resize-y ${error ? "border-rose-500" : ""}`} aria-invalid={Boolean(error)} />
      <FieldError message={error} />
    </FormField>
  );
}

export function CheckboxInput({ label, registration, hint }: { label: string; registration: UseFormRegisterReturn; hint?: string }) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
      <input {...registration} type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald-700" />
      <span><span className="block font-medium">{label}</span>{hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}</span>
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <span className="mt-1 block text-xs font-medium text-rose-700">{message}</span> : null;
}
