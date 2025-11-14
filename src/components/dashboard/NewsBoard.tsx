import classNames from "classnames";
import { format } from "date-fns";
import { IconNews, IconHomeSearch } from "@tabler/icons-react";
import MarketIndicators from "./MarketIndicators";
import styles from "./deal-dashboard.module.css";

const NEWS_ITEMS = [
  {
    title: "한국 기준금리 동결, 주담대 3%대 유지",
    summary:
      "한국은행이 기준금리를 동결하며 시중은행 주담대가 3%대 초반을 유지하고 있습니다.",
    source: "연합인포맥스",
    publishedAt: "2025-05-16",
  },
  {
    title: "GTX-A 파주 연장안 재추진",
    summary:
      "국토부가 GTX-A 추가 연장안을 검토하면서 운정 역세권 복합개발이 다시 속도를 내고 있습니다.",
    source: "한국경제",
    publishedAt: "2025-05-14",
  },
  {
    title: "PF 연착륙 2단계 대책 발표",
    summary:
      "정부가 PF 보증 확대와 대환 프로그램을 내놓으며 공급 차질 우려가 완화되고 있습니다.",
    source: "매일경제",
    publishedAt: "2025-05-12",
  },
];

const AUTOMATION_STEPS = [
  "국토부 실거래 API 수집 (3시간 간격)",
  "네이버부동산·직방 신규 매물 크롤링 → 운정 필터",
  "카카오봇/이메일로 신규 매물 요약 발송",
  "향후: Slack/Discord 채널, 가족 단톡 자동 공유",
];

export default function NewsBoard() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>시장 브리핑</p>
            <h1>부동산 뉴스 & 자동화 계획</h1>
            <p className={styles.subtitle}>
              금리·GTX·PF 등 최신 이슈와 카카오봇 매물 알림 로드맵을 정리했습니다.
            </p>
          </div>
        </header>

        <section className={classNames(styles.card, styles.newsCard)}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>최신 이슈</p>
              <h2>부동산 뉴스 클리핑</h2>
            </div>
            <IconNews size={20} />
          </div>
          <ul className={styles.newsList}>
            {NEWS_ITEMS.map((item) => (
              <li key={item.title} className={styles.newsItem}>
                <div className={styles.newsMeta}>
                  <span>{item.source}</span>
                  <span>{format(new Date(item.publishedAt), "MM.dd")}</span>
                </div>
                <p className={styles.newsTitle}>{item.title}</p>
                <p className={styles.newsSummary}>{item.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <MarketIndicators />

        <section className={classNames(styles.card, styles.automationCard)}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>카카오봇 로드맵</p>
              <h2>운정 신규 매물 알림</h2>
            </div>
            <IconHomeSearch size={20} />
          </div>
          <ul className={styles.automationList}>
            {AUTOMATION_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
