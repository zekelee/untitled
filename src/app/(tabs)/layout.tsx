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
        <div className={styles.brand}>이진규 집사기 프로젝트</div>
        <NavTabs />
      </header>
      <div className={styles.tabContent}>{children}</div>
    </div>
  );
}
