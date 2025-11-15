import NavTabs from "@/components/dashboard/NavTabs";
import styles from "./tabs.module.css";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.tabsShell}>
      <header className={styles.tabsHeader}>
        <div className={styles.brand}>내집마련 레이더</div>
        <NavTabs />
      </header>
      <div className={styles.tabContent}>{children}</div>
    </div>
  );
}
