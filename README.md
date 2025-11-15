## 이진규 집사기 프로젝트

파주 운정신도시 아파트 매물을 집중적으로 모니터링하고, 자금 전략과 시장 뉴스를 한 번에 확인하는 Next.js + TypeScript 대시보드입니다. 국토부 실거래가 공개 API를 직접 호출하며, 서비스키가 없으면 샘플 데이터를 자동 사용합니다.

## 주요 기능

- **운정 실거래 탭**: `/api/deals` 라우트가 국토부 아파트 매매 상세 API(`getRTMSDataSvcAptTradeDev`)를 호출해 법정동 코드 `41480` 기준 실거래 평균·중위값·계약건수·상세 목록을 제공합니다. 면적 단위를 ㎡ ↔ 평으로 전환하는 스위치와 데이터 새로고침 버튼이 포함됩니다.
- **시장 뉴스 탭**: 운정 및 수도권 부동산, 금리/경제 관련 뉴스를 카드형으로 정리하고, 카카오봇 기반 신규 매물 알림 로드맵을 함께 보여줍니다.
- **대출 전략 탭**: 생애최초 보금자리론 한도·금리·LTV/DTI 요약과 필수 서류 체크리스트를 제공합니다.
- **Mantine UI + Tabler Icons**: 플로팅 메뉴, 카드, 통계 위젯 등을 공통 디자인 시스템으로 정리해 일관된 화면을 구현했습니다.

## 환경 변수

프로젝트 루트에 `.env` 파일을 만들고 아래 값을 설정하세요. (`.env.example` 참고)

```bash
MOLIT_API_KEY=발급받은_서비스키(Encoding)
MOLIT_API_BASE=https://apis.data.go.kr/1613000
DEFAULT_REGION_CODE=41480
```

- 공공데이터포털에서 받은 “일반 인증키(Encoding)” 값을 그대로 `MOLIT_API_KEY`에 넣어 주세요. Decoding 키를 사용하면 특수문자 때문에 요청이 실패할 수 있습니다.
- 테스트 단계에서 키를 비워두면 Mock 데이터가 표시되며, 실거래 API가 연결되면 자동으로 실제 데이터로 바뀝니다.

## 실행 방법

```bash
yarn install
yarn dev        # http://localhost:3000
yarn build
yarn start
```

## 디렉터리 구조

- `src/app/(tabs)/*`: `/real-estate`, `/news`, `/finance` 탭 라우트와 레이아웃
- `src/app/api/deals/route.ts`: 국토부 API 호출 및 Mock fallback
- `src/lib/*`: 상수, 타입, 샘플 데이터, 요약 계산, API 헬퍼
- `src/components/dashboard/*`: 운정 실거래, 뉴스, 대출 전략 UI와 네비게이션

## 확장 아이디어

1. 네이버부동산/직방 등에서 운정 필터를 적용해 신규 매물을 크롤링하고, 국토부 실거래 신고 지연 데이터를 보완합니다.
2. Edge Function이나 주기적 크론 작업으로 카카오톡/이메일/Slack 알림을 자동 발송합니다.
3. 운정 외 수도권 주요 지역을 탭으로 확장하고, 가족 설득용 프레젠테이션이나 PDF 리포트를 자동 생성합니다.
---

## Environment extras

```bash
# optional ECOS key (defaults to sample)
BOK_API_KEY=sample

# optional manual overrides when public APIs are down
KOREA_BASE_RATE=3.50
KOREA_BASE_RATE_SOURCE=�ѱ����� �����ڷ�
KOREA_BASE_RATE_UPDATED_AT=2025-11-01
KOREA_BASE_RATE_CHANGE=-0.25
US_BASE_RATE=4.00
```

- Without `BOK_API_KEY` the ECOS `sample` key is used (daily quota 1,000). Obtain your own key for production deployments.
- Manual rate variables (`KOREA_BASE_RATE`, `US_BASE_RATE`, ��) act as fallbacks only. When the real APIs respond successfully these overrides are ignored.

## Live data sources

| Endpoint | Provider | Notes |
| --- | --- | --- |
| `/api/deals` | MOLIT `getRTMSDataSvcAptTradeDev` | ����(41480) �ǰŷ�, ����/����/�� �Ľ� |
| `/api/market` | �ѱ����� ECOS �� FRED �� open.er-api.com | �ѱ����̱� ���رݸ�, USD/KRW |
| `/api/news` | Google News RSS | ����/�ݸ� Ű����, �ֱ� 7�� ��縸 ���� |
