## 내집마련 레이더

파주 운정신도시 아파트 실거래 흐름과 시장 뉴스, 대출 전략을 한 화면에서 확인하는 Next.js + TypeScript 대시보드입니다. 국토부/한국은행/Google News 공개 API를 직접 호출해 실시간 데이터를 보여 줍니다.

## 핵심 기능
- **운정 실거래 보드**: `/api/deals`가 국토부 `getRTMSDataSvcAptTradeDev`를 호출해 운정신도시 + 전용 84㎡ 이하 아파트만 추려 월별 추세, 카드, 상세 목록을 제공합니다.
- **거시 지표**: `/api/market`이 한국은행 ECOS·FRED·open.er-api.com 데이터를 결합해 한국/미국 기준금리와 USD/KRW 환율을 보여줍니다.
- **부동산 뉴스 & 자동화**: `/api/news`가 Google News RSS(운정, 금리 키워드)를 수집해 최근 7일 기사만 모으고, 카카오 봇 알림 로드맵을 함께 보여줍니다.
- **대출 전략 메모리**: 생애최초 보금자리론 기준(84㎡, 금리, LTV/DTI 등)을 카드/체크리스트로 정리했습니다.

## 데이터 범위
- **지역**: 파주 운정신도시 권역(동패·교하·야당·문발·목동·산남·당하·동산·와동·다율 등)으로 제한했습니다.
- **면적**: 생애최초 보금자리론 조건을 반영해 전용 84㎡ 이하 거래만 노출합니다.
- **층 정보**: 국토부 응답에 총층 값이 없어 단지별 거래 중 가장 높은 층을 총층으로 추정해 표시합니다.

## 기술 스택
- Next.js 16 (App Router) + TypeScript + SWR
- Mantine + Tabler Icons, Chart.js
- 국토부/한국은행/Google News 공개 API

## 환경 변수
`.env`에 다음 값을 설정하세요 (`.env.example` 참고).

| key | 설명 |
| --- | --- |
| `MOLIT_API_KEY` | 공공데이터포털 *Encoding* 서비스키 (필수) |
| `MOLIT_API_BASE` | 국토부 API 기본 URL, 기본값 `https://apis.data.go.kr/1613000` |
| `DEFAULT_REGION_CODE` | 조회 LAWD 코드. 기본 `41480`(파주시) |
| `BOK_API_KEY` | 한국은행 ECOS 키. 비우면 sample 키 사용(일 1000건 제한) |
| `KOREA_BASE_RATE` 등 | 금리 수동 override (선택). `_SOURCE`, `_UPDATED_AT`, `_BASE_RATE_CHANGE`와 같이 사용 |

> 서비스키는 반드시 Encoding 버전을 쓰세요. Decoding 키를 넣으면 일부 특수문자 때문에 인증이 실패합니다.

## 실행 방법
```bash
yarn install
yarn dev        # http://localhost:3000
yarn build
yarn start
```

## 실시간 데이터 소스
| Endpoint | Provider | Notes |
| --- | --- | --- |
| `/api/deals` | MOLIT `getRTMSDataSvcAptTradeDev` | 운정신도시 + 전용 84㎡ 이하 아파트 필터링 |
| `/api/market` | 한국은행 ECOS · FRED · open.er-api.com | 한국/미국 기준금리, USD/KRW 환율 |
| `/api/news` | Google News RSS | 운정/금리 키워드 기사, 최근 7일 이내만 노출 |

## 향후 계획
1. 운정 신규 매물을 네이버부동산/직방 크롤링으로 보완 후 카카오 챗봇 알림 연결
2. ECOS/FRED 데이터를 캐시에 저장해 API 호출량 최소화
3. 투자 근거 카드에 사용자 메모와 PDF 리포트 내보내기 기능 추가
