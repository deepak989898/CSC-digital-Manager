"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef, useId } from "react";

interface ComboInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  options: { value: string; label: string; meta?: string }[];
  onChange: (value: string) => void;
  onSelectOption?: (option: { value: string; label: string; meta?: string }) => void;
}

const ComboInput = forwardRef<HTMLInputElement, ComboInputProps>(
  ({ className, label, options, onChange, onSelectOption, id, value, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-") || autoId;
    const listId = `${inputId}-list`;

    return (
      <div className="space-y-0.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          list={listId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            const match = options.find(
              (o) => o.label.toLowerCase() === e.target.value.toLowerCase() || o.value === e.target.value
            );
            if (match && onSelectOption) onSelectOption(match);
          }}
          className={cn(
            "w-full h-8 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20",
            className
          )}
          {...props}
        />
        <datalist id={listId}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.label}>
              {opt.meta}
            </option>
          ))}
        </datalist>
      </div>
    );
  }
);

ComboInput.displayName = "ComboInput";
export default ComboInput;
