"use client";

import classNames from "classnames";
import styles from "./deal-dashboard.module.css";

export type AreaUnit = "sqm" | "pyeong";

interface Props {
  value: AreaUnit;
  onChange: (value: AreaUnit) => void;
}

const OPTIONS: { label: string; value: AreaUnit }[] = [
  { label: "㎡", value: "sqm" },
  { label: "평", value: "pyeong" },
];

export default function AreaToggle({ value, onChange }: Props) {
  const nextValue = value === "sqm" ? "pyeong" : "sqm";
  return (
    <button
      type="button"
      aria-label="면적 단위 전환"
      className={styles.areaToggle}
      onClick={() => onChange(nextValue)}
    >
      <span className={styles.areaToggleLabel}>
        {OPTIONS.map((option, index) => (
          <span
            key={option.value}
            className={classNames({
              [styles.areaToggleActive]: option.value === value,
            })}
          >
            {option.label}
            {index === 0 && (
              <span className={styles.areaToggleDivider}>|</span>
            )}
          </span>
        ))}
      </span>
    </button>
  );
}
