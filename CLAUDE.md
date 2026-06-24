# CLAUDE.md

## 코딩 도구
- 이 프로젝트는 Claude Code로 작업합니다
- 작업 전 반드시 이 파일(CLAUDE.md)을 먼저 읽으세요

## 프로젝트 개요
- 회사: 애니워터 (정수필터 렌탈/설치)
- 앱: 현장 엔지니어 방문 보고 웹앱
- 스택: 정적 HTML + Vanilla JS + Vercel 서버리스 함수(api/)
- 배포: Vercel (프로덕션 URL: anywater-engineer-report.vercel.app)

## 환경
- 로컬 Python 서버(`scripts/local-server.py`)는 `/api/*` 엔드포인트 없음 → Supabase 연동 테스트 불가
- **테스트는 항상 프로덕션 URL에서 수행**: `anywater-engineer-report.vercel.app`
- `git push` 후 Vercel 자동 배포 (~30초) 대기
- Supabase production DB: ltirryijdgzfsxkntvmb
- 현재 연결: production DB (dev DB 불필요)

## 배포 흐름
1. 코드 수정
2. `node --check app.js` 문법 확인
3. `git add` → `git commit` → `git push origin main` (Claude가 직접 수행)
4. 프로덕션 URL에서 curl 또는 브라우저로 테스트

## DB 핵심 테이블
- `customers`: 고객 정보 (관리번호, 위도/경도 포함)
- `products`: 설치 제품 (방문_월1, 방문_월2, 정기_담당_엔지니어)
- `service_orders`: 방문 오더 (status: scheduled/done/hold)
- `visit_reports`: 방문 보고서 (status: 검토대기/승인/반려)

## 역할 및 멤버
- 현장 엔지니어: 이승혁, 신규철, 양석원
- CS 상담원: 주미경, 정선영, 차성광, 이경희
- 관리자: 해강

## 이번달 방문 대상 로직
- `products.방문_월1 = 현재월 OR products.방문_월2 = 현재월`
- `products.정기_담당_엔지니어 = 로그인한 엔지니어 이름`
- `/api/monthly-route` 서버리스 함수가 2단계 쿼리로 처리 (products → customers)
- OR 필터: `encodeURIComponent` 대신 방문_월1/방문_월2 쿼리 분리 후 병합

## Vercel API 엔드포인트
- `/api/index` — `_index.html` 서빙 + TMAP_APP_KEY 주입
- `/api/supabase-config` — Supabase URL/키 브라우저에 전달
- `/api/monthly-route?month=N&engineer=이름` — 이번달 방문 대상 조회 (service role key 사용, RLS 우회)

## 작업 원칙
- DB 구조 변경은 반드시 dev DB에서 먼저 테스트
- 환경변수는 Vercel 대시보드 + `.env.local`에서만 관리, 코드에 직접 입력 금지
- `node --check app.js`로 문법 확인
- git push는 Claude가 직접 수행
- 로컬 서버(4174포트) 실행 불필요
