"use client";

type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectFieldProps = {
  label: string;
  name: string;
  options: readonly MultiSelectOption[] | readonly string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
};

function normalizeOption(option: MultiSelectOption | string) {
  if (typeof option === "string") {
    return { value: option, label: option };
  }

  return option;
}

export function MultiSelectField({
  label,
  name,
  options,
  selectedValues,
  onChange,
  required = false,
}: MultiSelectFieldProps) {
  function handleToggle(value: string) {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((selectedValue) => selectedValue !== value));
      return;
    }

    onChange([...selectedValues, value]);
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-neutral-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const normalizedOption = normalizeOption(option);
          const inputId = `${name}-${normalizedOption.value}`;

          return (
            <label
              className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
              htmlFor={inputId}
              key={normalizedOption.value}
            >
              <input
                checked={selectedValues.includes(normalizedOption.value)}
                className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                id={inputId}
                name={name}
                onChange={() => handleToggle(normalizedOption.value)}
                type="checkbox"
                value={normalizedOption.value}
              />
              <span>{normalizedOption.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
