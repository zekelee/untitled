## 이진규 집사기 프로젝트

파주 운정신도시 아파트 매물을 집중적으로 모니터링하고, 가족 설득/자금계획 자료를 한 화면에서 정리하는 개인 맞춤형 Next.js + TypeScript 대시보드입니다. 국토부 실거래가 공개 API를 직접 호출하며, API 키가 없으면 Mock 데이터를 자동 사용합니다.

## 주요 기능

- **운정 실거래 인텔리전스**: `/api/deals` 라우트가 국토부 아파트 매매 상세 API(`getRTMSDataSvcAptTradeDev`)를 호출해 운정 법정동 코드(41480) 기준 실거래 평균, 중위값, 계약 건수를 계산합니다.
- **Mantine UI + Tabler Icons**: 플로팅 면적 토글, 알림 설정, 카드형 뉴스/대출 정보 등 전체 UI를 일관된 디자인 시스템으로 구성했습니다.
- **면적 단위 토글**: ㎡ ↔ 평 단위를 우측 상단 플로팅 메뉴에서 즉시 전환하며, 표/통계/메모의 모든 면적 값이 자동 변환됩니다.
- **부동산 뉴스/대출/자동화 로드맵**: 운정 관련 뉴스 클리핑, 생애최초 보금자리론 요약, 카카오봇 알림 계획을 추가 섹션으로 제공해 가족 설득용 자료를 강화했습니다.
- **향후 확장 포인트**: 운정 아파트 외 지역 확장, 실매물 크롤링/카카오톡 알림 자동화, Slack·이메일 리포트 등.

## 환경 변수

프로젝트 루트에 `.env` 파일을 생성하고 아래 값을 설정합니다. (`.env.example` 참고)

```bash
MOLIT_API_KEY=발급받은_서비스키(Encoding)
MOLIT_API_BASE=https://apis.data.go.kr/1613000
DEFAULT_REGION_CODE=41480
```

- 공공데이터포털에서 받은 “일반 인증키(Encoding)” 값을 그대로 `MOLIT_API_KEY`에 넣어야 합니다. Decoding 키를 사용하면 특수문자 때문에 요청이 실패할 수 있습니다.
- 테스트 단계에서는 `MOLIT_API_KEY`를 비워두면 Mock 데이터가 사용됩니다.

## 실행 방법

```bash
yarn install
yarn dev        # http://localhost:3000
yarn build
yarn start
```

## 디렉터리 구조

- `src/app/page.tsx` – 루트 페이지, `DealDashboard` 렌더링
- `src/app/api/deals/route.ts` – 국토부 API 호출 및 Mock fallback
- `src/lib/*` – 상수/타입/Mock 데이터/요약 계산/국토부 헬퍼
- `src/components/dashboard/*` – 운정 대시보드 UI와 스타일

## 확장 아이디어

1. 부동산 플랫폼/국토부 실거래 신고 지연 데이터를 조합해 신규 매물 크롤러 구현.
2. Edge Function 또는 CRON으로 카카오톡/이메일/Slack 알림 자동 발송.
3. 운정 외 수도권 주요 지역을 탭 방식으로 확장하고, 가족 설득용 프레젠테이션/PDF를 자동 생성.
