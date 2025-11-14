import classNames from "classnames";
import { format } from "date-fns";
import { IconNews, IconHomeSearch } from "@tabler/icons-react";
import styles from "./deal-dashboard.module.css";

const NEWS_ITEMS = [
  {
    title: "기준금리 동결…주담대 금리 3%대 초반 복귀",
    summary:
      "한국은행이 기준금리를 동결하면서 시중은행 주담대가 3%대 초반으로 내려가 매수 심리에 호재가 되고 있습니다.",
    source: "연합인포맥스",
    publishedAt: "2025-02-19",
  },
  {
    title: "GTX-A 연장 및 수도권 광역 철도망 예산 확정",
    summary:
      "GTX-A와 B 노선 예산이 확정되면서 수도권 서북부 교통 호재가 다시 부각되고 있습니다.",
    source: "한국경제",
    publishedAt: "2025-02-18",
  },
  {
    title: "부동산 PF 연착륙 정책 발표, 중대형 건설사 숨통",
    summary:
      "정부가 PF 보증 확대와 대환 프로그램을 발표하면서 공급 차질 우려가 완화돼 분양 시장이 안정되는 분위기입니다.",
    source: "매일경제",
    publishedAt: "2025-02-17",
  },
];

const AUTOMATION_STEPS = [
  "국토부 실거래 API 데이터 적재 (주기: 3시간)",
  "네이버부동산/직방 신규 매물 크롤링 → 운정 필터",
  "카카오톡 챗봇 + 이메일로 신규 매물 요약 발송",
  "향후: Slack/Discord 채널로 확장, 가족 단톡 자동 공유",
];

export default function NewsBoard() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>운정 현장 브리핑</p>
            <h1>뉴스 & 매물 자동화 계획</h1>
            <p className={styles.subtitle}>
              실거래 외에도 시장 분위기를 빠르게 파악할 수 있도록 운정
              관련 뉴스 클리핑과 매물 알림 로드맵을 정리했습니다.
            </p>
          </div>
        </header>

        <section className={classNames(styles.card, styles.newsCard)}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>운정 이슈</p>
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
