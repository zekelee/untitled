import NavTabs from "@/components/dashboard/NavTabs";
import styles from "./tabs.module.css";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.tabsShell}>
      <NavTabs />
      <div className={styles.tabContent}>{children}</div>
    </div>
  );
}
