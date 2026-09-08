'use client';

import { useId, useState } from 'react';

const OTHER = '__other__';

/**
 * A dropdown that still accepts a value outside its list.
 *
 * A plain `<datalist>` cannot do this: browsers filter the suggestions by what
 * is already in the field, so once a value matches an option exactly the list
 * appears empty and the choice cannot be changed. A real `<select>` always
 * opens, and picking "Other" reveals a free-text box for anything unlisted.
 */
export function SelectWithOther({ value, options, onChange, placeholder = 'Select an option', otherLabel = 'Other (type your own)', otherPlaceholder = 'Type the value' }: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  otherLabel?: string;
  otherPlaceholder?: string;
}) {
  // A stored value the list does not contain is already an "other" value.
  const [freeText, setFreeText] = useState(() => Boolean(value) && !options.includes(value));
  const inputId = useId();

  return (
    <div className="space-y-2">
      <select
        className="input-field"
        value={freeText ? OTHER : value}
        onChange={(event) => {
          if (event.target.value === OTHER) {
            setFreeText(true);
            onChange('');
          } else {
            setFreeText(false);
            onChange(event.target.value);
          }
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
        <option value={OTHER}>{otherLabel}</option>
      </select>

      {freeText && (
        <input
          id={inputId}
          autoFocus
          className="input-field"
          placeholder={otherPlaceholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
