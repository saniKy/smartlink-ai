/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface TextBadgeProps {
  label: string;
  variant?: 'neutral' | 'success' | 'warning' | 'error';
  prefix?: React.ReactNode;
}

export function TextBadge({ label, variant = 'neutral', prefix }: TextBadgeProps) {
  // Anti-slop zero-pill design: unboxed text with disciplined color pairing
  const variantStyles = {
    neutral: 'text-slate-600',
    success: 'text-emerald-700 font-medium',
    warning: 'text-amber-700 font-medium',
    error: 'text-rose-700 font-medium',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${variantStyles[variant]}`}>
      {prefix}
      <span>{label}</span>
    </span>
  );
}
