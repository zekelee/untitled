"use client";

import { Loader } from "@mantine/core";
import styles from "./deal-dashboard.module.css";

interface LoadingOverlayProps {
  visible: boolean;
  label?: string;
}

export default function LoadingOverlay({
  visible,
  label = "데이터를 불러오는 중입니다...",
}: LoadingOverlayProps) {
  if (!visible) return null;
  return (
    <div className={styles.loadingOverlay}>
      <Loader color="var(--accent)" size="sm" />
      <span>{label}</span>
    </div>
  );
}
