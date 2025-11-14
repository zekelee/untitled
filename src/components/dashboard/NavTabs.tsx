"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import styles from "./nav-tabs.module.css";

const tabs = [
  { href: "/real-estate", label: "운정 실거래" },
  { href: "/news", label: "현장 뉴스" },
  { href: "/finance", label: "대출 전략" },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={classNames(styles.tab, {
            [styles.active]:
              pathname === tab.href ||
              (pathname?.startsWith(tab.href) && tab.href !== "/"),
          })}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
