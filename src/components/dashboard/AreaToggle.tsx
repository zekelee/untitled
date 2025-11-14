"use client";

import { SegmentedControl } from "@mantine/core";
import { IconRulerMeasure } from "@tabler/icons-react";
import styles from "./deal-dashboard.module.css";

export type AreaUnit = "sqm" | "pyeong";

interface Props {
  value: AreaUnit;
  onChange: (value: AreaUnit) => void;
}

const segments = [
  {
    label: (
      <span>
        ㎡
      </span>
    ),
    value: "sqm",
  },
  {
    label: (
      <span>
        평
      </span>
    ),
    value: "pyeong",
  },
];

export default function AreaToggle({ value, onChange }: Props) {
  return (
    <div className={styles.areaToggle}>
      <div className={styles.areaToggleLabel}>
        <IconRulerMeasure size={14} />
        <span>면적 단위</span>
      </div>
      <SegmentedControl
        value={value}
        onChange={(val) => onChange(val as AreaUnit)}
        data={segments}
        size="xs"
        radius="xl"
        className={styles.areaSegment}
      />
    </div>
  );
}
