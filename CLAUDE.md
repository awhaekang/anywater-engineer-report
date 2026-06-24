# CLAUDE.md

## 코딩 도구
- 이 프로젝트는 Claude Code로 작업합니다
- 작업 전 반드시 이 파일(CLAUDE.md)을 먼저 읽으세요

## 프로젝트 개요
- 회사: 애니워터 (정수필터 렌탈/설치)
- 앱: 현장 엔지니어 방문 보고 웹앱
- 스택: 정적 HTML + Vanilla JS + Python 로컬 서버
- 배포: Vercel (추후 Next.js 통합 시 Railway로 이전 예정)

## 환경
- 로컬 서버: `python3 scripts/local-server.py`
- 로컬 주소: `http://127.0.0.1:4174/index.html`
- Supabase production DB: ltirryijdgzfsxkntvmb
- Supabase dev DB: qpicvbeowkketbeyajri
- 현재 연결: production DB

## DB 핵심 테이블
- `customers`: 고객 정보 (관리번호, 좌표 포함)
- `products`: 설치 제품 (방문_월1, 방문_월2, 정기_담당_엔지니어)
- `service_orders`: 방문 오더 (status: scheduled/done/hold)
- `visit_reports`: 방문 보고서 (status: 검토대기/승인/반려)

## 엔지니어
- 이승혁, 신규철, 양석원

## 이번달 방문 대상 로직
- `products.방문_월1 = 현재월 OR products.방문_월2 = 현재월`
- `products.정기_담당_엔지니어 = 로그인한 엔지니어 이름`
- `customers` JOIN은 2단계 쿼리로 처리 (Supabase JOIN 제한)

## 작업 원칙
- DB 구조 변경은 반드시 dev DB에서 먼저 테스트
- 환경변수는 `.env.local`에서만 관리, 코드에 직접 입력 금지
- `node --check app.js`로 문법 확인
- `python3 -m py_compile scripts/local-server.py`로 서버 문법 확인
- git push는 Claude가 직접 수행

## 현재 진행 중인 작업
- `fetchSupabaseMonthlyProductRows` 함수 수정
  - 2단계 쿼리 방식으로 products → customers 조회
  - 지도 마커 완료/미완료/보류 상태 연동
