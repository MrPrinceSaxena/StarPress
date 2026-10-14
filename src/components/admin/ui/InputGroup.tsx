'use client';

import React from 'react';

export interface InputGroupProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
}

export default function InputGroup({
  label,
  children,
  hint,
  required,
  htmlFor,
  className = '',
}: InputGroupProps) {
  return (
    <div className={`space-y-1.5 ${className}`.trim()}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold text-slate-700 block"
      >
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}
