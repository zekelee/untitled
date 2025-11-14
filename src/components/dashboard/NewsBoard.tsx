import classNames from "classnames";
import { format } from "date-fns";
import { IconNews, IconHomeSearch } from "@tabler/icons-react";
import styles from "./deal-dashboard.module.css";

const NEWS_ITEMS = [
  {
    title: "운정 GTX-A 역사 복합개발 윤곽…역세권 가치 ↑",
    summary:
      "운정역 복합환승센터와 상업시설이 2026년 착공 예정으로 인근 단지 거래가 늘고 있습니다.",
    source: "한국경제",
    publishedAt: "2025-02-18",
  },
  {
    title: "신혼·생애최초 대상 운정 공공분양 3천 세대 확정",
    summary:
      "운정3지구 중심으로 공공분양 물량이 확정돼, 전세 → 매매 갈아타기 수요가 집중되고 있습니다.",
    source: "국토일보",
    publishedAt: "2025-02-16",
  },
  {
    title: "운정 호수공원 생활권 리모델링 조합 속속 출범",
    summary:
      "2008~2010년 준공 단지를 중심으로 리모델링 조합이 구성돼 대형 평형 거래가 활발해졌습니다.",
    source: "머니투데이",
    publishedAt: "2025-02-12",
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
