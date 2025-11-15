"use client";

import { Loader } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import styles from "./deal-dashboard.module.css";

interface Props {
  loading: boolean;
  onClick: () => void;
}

export default function RefreshButton({ loading, onClick }: Props) {
  return (
    <button
      type="button"
      className={styles.refreshButton}
      onClick={onClick}
      disabled={loading}
      aria-label="데이터 새로고침"
    >
      {loading ? (
        <Loader size="xs" color="rgba(5, 8, 15, 0.8)" />
      ) : (
        <IconRefresh size={18} />
      )}
    </button>
  );
}
