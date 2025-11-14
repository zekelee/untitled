import classNames from "classnames";
import styles from "./deal-dashboard.module.css";
import { IconBriefcase, IconReceipt2 } from "@tabler/icons-react";

const LOAN_POINTS = [
  {
    label: "대출 한도",
    value: "최대 4.7억",
    helper: "생애최초 + 2인 이상 가구 기준",
  },
  {
    label: "금리 구간",
    value: "연 3.45%~",
    helper: "신혼/다자녀 우대 시",
  },
  {
    label: "LTV / DTI",
    value: "70% / 60%",
    helper: "비규제지역, 시가 9억 이하",
  },
  {
    label: "거치 / 상환",
    value: "거치 3년 / 30년",
    helper: "중도상환수수료 3년간 1.2% → 0%",
  },
];

const DOCS = [
  "혼인·가족관계증명서, 주민등록등본, 등본상 세대원 전원 준비",
  "재직증명서 + 근로소득원천징수영수증(또는 소득금액증명)",
  "매매계약서 원본 및 잔금계약 관련 서류",
  "기존 대출 상환내역, 신용정보 조회 동의서",
];

export default function FinanceBoard() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>생애최초 보금자리론</p>
            <h1>자금 조달 & 서류 체크리스트</h1>
            <p className={styles.subtitle}>
              운정 아파트 구매를 위한 대출 전략과 필수 서류를 정리했습니다.
              추후 은행 상담 시 바로 활용할 수 있습니다.
            </p>
          </div>
        </header>

        <section className={classNames(styles.card, styles.loanCard)}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>대출 한눈에 보기</p>
              <h2>조건 요약</h2>
            </div>
            <IconBriefcase size={20} />
          </div>
          <div className={styles.loanGrid}>
            {LOAN_POINTS.map((point) => (
              <div key={point.label} className={styles.loanItem}>
                <p>{point.label}</p>
                <strong>{point.value}</strong>
                <span>{point.helper}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={classNames(styles.card, styles.memoCard)}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>필수 서류</p>
              <h2>체크리스트</h2>
            </div>
            <IconReceipt2 size={20} />
          </div>
          <ul className={styles.memoList}>
            {DOCS.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
