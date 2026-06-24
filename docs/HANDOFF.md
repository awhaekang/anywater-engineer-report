# 애니워터 현장보고 웹앱 인수인계

이 문서는 새 채팅에서 바로 이어서 작업하기 위한 요약입니다.

## 프로젝트 위치

```text
/Users/haekang/Library/CloudStorage/OneDrive-개인/업무 자동화/엔지니어 보고
```

## 현재 로컬 주소

현재는 로컬 전용 서버로 확인합니다.

```text
http://127.0.0.1:4174/index.html
```

고객 데이터가 포함되어 있으므로 서버를 열 때는 반드시 `127.0.0.1`에만 바인딩합니다.

```bash
python3 scripts/local-server.py
```

`scripts/local-server.py`는 정적 파일을 제공하면서 `/` 또는 `/index.html` 요청 시 Tmap SDK placeholder를 `.env.local`의 `TMAP_APP_KEY`로 치환합니다. API 키는 로컬 서버가 HTML을 응답할 때만 주입합니다.

## 핵심 파일

- `index.html`: 화면 구조
- `styles.css`: 화면 스타일
- `app.js`: 앱 로직
- `scripts/import-customers.py`: 엔콤 엑셀 고객데이터를 앱용 로컬 JSON으로 변환
- `data/customers.local.json`: 실제 고객 데이터, 로컬 전용, Git/Vercel 제외
- `data/import-summary.json`: 고객 데이터 변환 요약
- `docs/service-workflow.md`: 애니워터 업무 흐름/정책 정리
- `docs/customer-import-rules.md`: 고객 상태 분류 규칙
- `supabase/schema.sql`: Supabase 테이블/RLS 초안
- `.gitignore`, `.vercelignore`: 실제 고객 데이터 배포 제외 설정

## 회사/업무 전제

애니워터는 정수필터 제조/렌탈 업체입니다.

주요 고객:

- 음식점
- 카페
- 공장

현장 엔지니어 업무:

- 신규설치
- 철거
- A/S
- 정기점검
- 정기교체

업무 생성 방식:

- 신규설치, 철거, A/S는 사무실에서만 오더 생성
- 신규설치는 관리자가 엔지니어 배정
- A/S는 기본적으로 담당지역 엔지니어가 방문
- 긴급 A/S는 근처 엔지니어가 방문할 수 있음
- 엔지니어들끼리 조율할 수도 있음
- 정기점검/정기교체는 CMS 유지 고객과 주기 규칙을 기준으로 자동 생성하는 방향

## 정기관리 규칙

- 음식점: 보통 6개월 점검, 1년 교체
- 카페: 기존에는 6개월 교체
- 최근 신규 설치 카페: 1년 교체 정책으로 변경
- 신규 설치 후 첫 점검/교체는 단순히 6개월/1년 뒤가 아니라, 고객이 속한 지역의 월간 방문 루트에 맞춰 정렬
- 월마다 방문 지역이 정해져 있음
- 지역별 방문월 표가 아직 필요함

## 현재 앱 기능

로그인/권한 프로토타입:

- 로그인 화면
- 역할 선택
  - 현장 엔지니어
  - 사무/고객응대
  - 관리자
  - 대표/팀장
- 역할별 탭 표시

현장 엔지니어 화면:

- 오늘 방문 오더
- 근처 설치처 추천
- 설치처 직접 추가
- 방문 전 이력 확인
- 다음 방문 재확인 항목 표시/해결
- 이력 남기기
- 방문 유형별 체크리스트
- 방문 유형별 사진 단계
- 처리 제품/필터 다중 선택
- 다음 방문 재확인 항목 생성

관리자 화면:

- 대시보드
- 검토 대기 보고
- 개선 포인트
- 오더 생성
- 설치처 등록
- 고객/계약/제품/필터/지역/주기 입력칸
- CSV 내보내기

설치처 이력 화면:

- 설치처 검색
- 고객/계약 정보
- 연락/방문 정보
- 제품/관리 정보
- 지역/주기 정보
- 일정/오더 정보
- 제품별 관리 목록
- 접수/처리 메모
- 방문 이력
- 다음 방문 재확인 항목

## 실제 고객 데이터 상태

원본 파일:

```text
/Users/haekang/Library/CloudStorage/OneDrive-개인/업무 자동화/애니워터 CS/엔콤 전체 고객데이터.xlsx
```

변환 스크립트:

```bash
/Users/haekang/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/import-customers.py
```

변환 결과:

- 총 설치처: `10,198`
- 관리중: `5,031`
- 확인 필요: `2,288`
- 해지/회수: `2,879`
- 음식점: `8,626`
- 카페: `1,500`
- 공장: `72`
- 좌표 없음: `10,198`

현재 `data/customers.local.json`은 로컬 전용이며 개인정보를 포함합니다.

중요:

- GitHub에 커밋하면 안 됨
- Vercel에 배포하면 안 됨
- `.gitignore`, `.vercelignore`에 제외 처리 완료

## 고객 상태 분류

기본 규칙:

- `관리중`: 현장 추천 대상
- `확인 필요`: 관리자 확인 대상
- `해지/회수`: 현장 추천 제외
- `임시 등록`: 엔지니어가 현장 추가한 고객, 나중에 사무/관리자가 검수

판별 기준은 `docs/customer-import-rules.md` 참고.

## 위치/좌표 상태

현재 엔콤 고객 데이터에는 주소는 있지만 위도/경도가 없습니다.

따라서 실제 “근처 설치처” 추천을 정확히 하려면 다음 단계로 주소를 좌표로 변환해야 합니다.

후보:

- 카카오 주소검색 API
- 네이버 지도 Geocoding API
- Google Geocoding API

2026-05-21 결정:

- 1차 좌표 변환은 네이버 지도 Geocoding API로 진행
- 결정 근거와 구현 원칙은 `docs/address-geocoding-decision.md` 참고

현재 앱 동작:

- 좌표 있는 샘플/임시 설치처는 거리 계산 가능
- 엔콤 고객은 검색 가능
- 엔콤 고객은 `좌표 필요` 표시
- `data/geocode-results.local.json`이 있으면 앱 로딩 시 엔콤 고객 좌표를 자동 병합
- 해지/회수 고객은 현장 근처 추천에서 제외
- 근처 설치처는 현재 위치 기준 1km 이내만 표시
- 검색은 설치처명, 주소, 관리번호, 연락처 기준
- 표시 성능 때문에 한 번에 80건만 표시

좌표 변환 후 검수:

```bash
python3 scripts/summarize-geocodes.py
```

실패/미실행 주소는 `data/geocode-review.local.csv`로 저장됩니다.

## Supabase 상태

확인된 Supabase 프로젝트:

- 프로젝트 이름: `awhaekang's Project`
- 프로젝트 ID/ref: `ltirryijdgzfsxkntvmb`
- 리전: `ap-northeast-2`
- 상태: `ACTIVE_HEALTHY`

현재 Supabase에는 아직 테이블/고객데이터를 적용하지 않았습니다.

로컬 파일:

```text
supabase/schema.sql
```

이 스키마에는 다음 구조가 들어 있습니다.

- profiles
- stores
- service_orders
- visit_types
- visit_type_checks
- visit_type_photo_steps
- visit_reports
- visit_report_checks
- visit_report_photos
- follow_ups
- RLS 정책 초안

주의:

실제 고객 데이터를 Supabase에 넣기 전에 Auth/RLS를 먼저 적용하고 검증해야 합니다.

## Vercel 상태

아직 Vercel에 배포하지 않았습니다.

이유:

- 고객 데이터에 개인정보가 있음
- Supabase 인증/권한 연결 전에는 고객 데이터를 Vercel 정적 파일로 올리면 안 됨

방향:

- Vercel에는 앱 코드만 배포
- 고객 데이터는 Supabase에만 저장
- 앱은 로그인 후 Supabase에서 권한에 맞게 데이터 조회

## GitHub 상태

현재 폴더는 Git 저장소가 아닙니다.

`git status` 결과:

```text
fatal: not a git repository
```

GitHub로 올릴 때 주의:

- `data/customers.local.json` 제외
- `data/import-summary.json` 제외
- 민감 원본 엑셀 제외
- `.gitignore` 확인 후 커밋

## 다음 작업 추천 순서

1. 실제 고객데이터 검색 테스트
   - 설치처명
   - 주소
   - 관리번호
   - 연락처

2. 주소 좌표 변환 방식 결정
   - 어떤 API를 쓸지 결정
   - API 키 보관 방식 결정
   - 변환 결과를 `lat/lng`로 저장

3. Supabase Auth/RLS 적용
   - 직원 계정/역할 구조 확정
   - 엔지니어/사무/관리자 권한 검증

4. Supabase에 고객 데이터 적재
   - 처음에는 테스트 데이터 일부만 적재
   - 조회 권한 확인 후 전체 적재

5. 앱을 Supabase 연동으로 전환
   - localStorage 제거 또는 보조 저장으로 축소
   - reports, orders, follow_ups, photos 저장

6. Vercel 배포
   - 고객 데이터 없는 앱 코드만 배포
   - 환경 변수 연결

7. 현장 QA
   - 모바일 화면
   - 사진 촬영
   - 위치 권한
   - 오더 완료
   - 다음 방문 재확인 항목

## 다음 채팅에서 바로 말하면 좋은 시작 문장

```text
docs/HANDOFF.md 읽고 이어서 진행해줘. 우선 실제 고객데이터 검색 테스트와 주소 좌표 변환 방식 결정부터 하자.
```
