"use client";

import { useMemo } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import countryList from "react-select-country-list";
import ReactCountryFlag from "react-country-flag";

type Option = { value: string; label: string };

export default function CountrySelect({
  value,
  onChange,
  placeholder = "Type your country...",
}: {
  value: string | null; // e.g., "CA"
  onChange: (code: string) => void; // ISO 3166-1 alpha-2
  placeholder?: string;
}) {
  const options: Option[] = useMemo(() => countryList().getData(), []);
  const selected = options.find((o) => o.value === value) ?? null;

  const styles: StylesConfig<Option, false> = {
    control: (base, state) => ({
      ...base,
      borderRadius: 12,
      borderColor: "var(--border)",
      background: "var(--field)",
      boxShadow: state.isFocused
        ? "0 0 0 2px color-mix(in_oklab,var(--accent) 35%, transparent)"
        : "none",
      ":hover": { borderColor: "var(--border)" },
      transition: "transform .15s ease, box-shadow .15s ease",
      transform: state.menuIsOpen ? "scale(1.015)" : undefined,
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 12,
      overflow: "hidden",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected
        ? "var(--accent)"
        : state.isFocused
        ? "color-mix(in_oklab,var(--accent) 10%, var(--surface))"
        : "transparent",
      color: state.isSelected ? "#fff" : "var(--foreground)",
      cursor: "pointer",
    }),
    singleValue: (base) => ({ ...base, color: "var(--foreground)" }),
    placeholder: (base) => ({ ...base, color: "var(--muted)" }),
    input: (base) => ({ ...base, color: "var(--foreground)" }),
    indicatorSeparator: () => ({ display: "none" }),
  };

  const formatOptionLabel = (opt: Option) => (
    <div className="flex items-center gap-2">
      <ReactCountryFlag
        svg
        countryCode={opt.value}
        style={{ width: "1.1rem", height: "1.1rem", borderRadius: 4 }}
        aria-label={opt.label}
      />
      <span>{opt.label}</span>
    </div>
  );

  return (
    <Select
      instanceId="country-select" // avoids SSR hydration warnings
      options={options}
      value={selected}
      onChange={(opt: SingleValue<Option>) => onChange(opt?.value ?? "")}
      placeholder={placeholder}
      styles={styles}
      classNamePrefix="country"
      formatOptionLabel={formatOptionLabel}
      isSearchable
    />
  );
}
