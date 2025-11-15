'use client';

import * as React from 'react';

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
};

export function Switch({ checked, onCheckedChange }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition
        ${checked ? 'bg-green-600' : 'bg-gray-300'}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white transition
          ${checked ? 'translate-x-5' : 'translate-x-1'}
        `}
      />
    </button>
  );
}
