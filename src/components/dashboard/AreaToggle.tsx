"use client";

interface Props {
  value: "sqm" | "pyeong";
  onChange: (value: "sqm" | "pyeong") => void;
}

const options: { label: string; value: "sqm" | "pyeong" }[] = [
  { label: "㎡", value: "sqm" },
  { label: "평", value: "pyeong" },
];

export default function AreaToggle({ value, onChange }: Props) {
  const nextValue = value === "sqm" ? "pyeong" : "sqm";
  return (
    <button
      type="button"
      aria-label="면적 단위 변경"
      onClick={() => onChange(nextValue)}
    >
      {options
        .map((option) => `${option.label}${option.value === value ? "" : ""}`)
        .join(" ")}
    </button>
  );
}
