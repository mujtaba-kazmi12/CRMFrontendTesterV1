import * as React from "react";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
}) => {
  const handleToggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  return (
    <div className="border rounded p-2 bg-white dark:bg-zinc-900">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((val) => {
          const opt = options.find((o) => o.value === val);
          return (
            <span
              key={val}
              className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs"
            >
              {opt?.label || val}
            </span>
          );
        })}
      </div>
      <div className="max-h-40 overflow-y-auto">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 cursor-pointer py-1"
          >
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={() => handleToggle(opt.value)}
              className="accent-indigo-500"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {options.length === 0 && (
        <div className="text-zinc-400 text-sm">{placeholder}</div>
      )}
    </div>
  );
}; 