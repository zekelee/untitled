import classNames from "classnames";
import styles from "./deal-dashboard.module.css";
import { IconBriefcase, IconReceipt2 } from "@tabler/icons-react";

const LOAN_POINTS = [
  {
    label: "대출 한도",
    value: "최대 4.7억",
    helper: "생애최초 + 자녀 2명 기준",
  },
  {
    label: "금리 구간",
    value: "연 3.45%~",
    helper: "혼합형 고정 · 변동 혼용",
  },
  {
    label: "LTV / DTI",
    value: "70% / 60%",
    helper: "비규제 지역, 시가 9억 이하",
  },
  {
    label: "거치 / 상환",
    value: "거치 3년 / 만기 30년",
    helper: "중도상환수수료 3년차 0%까지",
  },
] as const;

const DOCS = [
  "주민등록등본, 가족관계증명서, 혼인관계증명서",
  "재직증명서 + 근로소득원천징수영수증 (또는 소득금액증명)",
  "매매계약서 사본 및 계약금 영수증",
  "기존 대출 상환내역, 신용정보 조회 동의서",
] as const;

export default function FinanceBoard() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>생애최초 보금자리론</p>
            <h1>자금 조달 & 준비 서류 빠른 체크</h1>
            <p className={styles.subtitle}>
              운정 아파트 매입 시 적용 가능한 금리/한도와 필수 구비서류를 정리했습니다.
              상담 전 기본 정보를 정비하면 심사 지연을 줄일 수 있습니다.
            </p>
          </div>
        </header>

        <section className={classNames(styles.card, styles.loanCard)}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>조건 요약</p>
              <h2>대출 핵심 비교</h2>
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
