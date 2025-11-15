import Link from "next/link";
import styles from "./page.module.css";

export default function NotFound() {
  return (
    <main className={styles.notFoundWrapper}>
      <section className={styles.notFoundCard}>
        <p className={styles.kicker}>404</p>
        <h1>요청하신 페이지를 찾을 수 없습니다.</h1>
        <p>
          주소가 잘못 입력되었거나 삭제된 페이지일 수 있습니다. 홈으로 돌아가 다시 탐색해 주세요.
        </p>
        <Link href="/real-estate" className={styles.notFoundButton}>
          홈으로 돌아가기
        </Link>
      </section>
    </main>
  );
}