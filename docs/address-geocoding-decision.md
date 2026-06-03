# 주소 좌표 변환 방식 결정

작성일: 2026-05-21

## 결정

1차 주소 좌표 변환은 **네이버 지도 Geocoding API**로 진행한다.

이유:

- 애니워터 고객 주소는 전부 국내 주소라 한국 도로명/지번 주소 처리 품질이 중요하다.
- 네이버 지도 Geocoding은 주소를 입력하면 도로명 주소, 지번 주소, 위도/경도(`x`, `y`)를 반환한다.
- 공식 요금표 기준 Geocoding은 월 3,000,000건 이하 무료 구간이 있어, 현재 10,198건 고객 데이터 초기 변환과 이후 증분 변환에 충분하다.
- 같은 네이버 지도 계열 API로 향후 지도 표시, 정적 지도, 경로 탐색까지 이어가기 쉽다.

## 보류/대안

- 카카오 Local API
  - 장점: 주소 좌표 변환 API가 단순하고 한국 주소 품질이 좋다.
  - 한계: 공식 쿼터 기준 주소 좌표 변환 무료 일 100,000건, 추가 사용 0.5원/건이다. 현재 물량에는 충분하지만 네이버의 월 무료 구간이 더 넉넉하다.
- Google Geocoding API
  - 장점: 글로벌 주소 품질과 생태계가 좋다.
  - 한계: 국내 현장 업무용으로는 우선순위가 낮고, 결제/과금 관리 부담이 더 크다.

## 구현 원칙

- 브라우저에서 API 키를 직접 호출하지 않는다.
- 좌표 변환은 서버 작업 또는 관리자 전용 배치로 실행한다.
- 원본 주소, 정제 주소, 위도, 경도, 좌표 제공자, 변환 상태, 오류 메시지, 변환 시각을 저장한다.
- 이미 좌표가 있는 고객은 재호출하지 않는다.
- 실패 건은 주소 뒷부분의 호수/층/괄호 정보를 제거한 정제 주소로 1회 재시도한다.
- 그래도 실패하면 `geocodeStatus: "needs_review"`로 두고 관리자 검수 대상으로 보낸다.

## 필요한 환경값

- `NAVER_MAPS_CLIENT_ID`
- `NAVER_MAPS_CLIENT_SECRET`

## API 주소

새 Maps 콘솔에서 발급한 키는 다음 엔드포인트를 사용한다.

```text
https://maps.apigw.ntruss.com/map-geocode/v2/geocode
```

구 AI·NAVER API 문서에 있는 `naveropenapi.apigw.ntruss.com` 엔드포인트는 같은 키로 호출하면 `A subscription to the API is required`가 날 수 있다.

## 참고한 공식 문서

- 네이버 Geocoding API: https://api.ncloud-docs.com/docs/ai-naver-mapsgeocoding-geocode
- 네이버 Maps 요금표: https://www.ncloud.com/api-cms/service-product/static/maps
- 카카오 Local API 목록: https://developers.kakao.com/docs/ko/rest-api/reference
- 카카오 쿼터/요금: https://developers.kakao.com/docs/en/getting-started/quota
- Google Geocoding usage/billing: https://developers.google.com/maps/documentation/geocoding/usage-and-billing
