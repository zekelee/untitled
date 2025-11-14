"use client";

import { ActionIcon, Loader, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import styles from "./deal-dashboard.module.css";

interface Props {
  loading: boolean;
  onClick: () => void;
}

export default function RefreshButton({ loading, onClick }: Props) {
  return (
    <Tooltip label="국토부 API 데이터 새로고침" position="bottom">
      <ActionIcon
        size="lg"
        radius="xl"
        variant="gradient"
        gradient={{ from: "cyan", to: "lime", deg: 120 }}
        onClick={onClick}
        disabled={loading}
        className={styles.refreshIcon}
      >
        {loading ? <Loader color="#03101f" size="xs" /> : <IconRefresh size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}
