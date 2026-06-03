# 배포 준비 체크리스트

## 배포 원칙

실제 고객 데이터는 `data/customers.local.json`로 배포하지 않는다.

- 로컬 확인: `data/customers.local.json` 사용
- 배포 앱: `/api/customers`가 Supabase `stores` 테이블에서 읽어옴
- 고객 데이터가 들어간 배포는 Vercel Deployment Protection을 켠 Preview 배포부터 확인
- 정식 공개 배포는 Supabase Auth 적용 후 진행

## 현재 준비된 것

- `api/customers.js`: Vercel 서버리스 API에서 Supabase 고객 데이터를 현재 앱 형태로 변환
- `scripts/import-supabase-stores.py`: 로컬 고객 JSON을 Supabase `stores` 테이블로 업로드
- `supabase/schema.sql`: `external_id`, `contact` 컬럼을 포함하도록 보강
- `.vercelignore`: 실제 고객 JSON과 로컬 env 파일 배포 제외
- `.gitignore`: 실제 고객 JSON과 로컬 env 파일 Git 제외

## 사용자가 해야 할 일

### 1. GitHub CLI 재인증

현재 `gh` 토큰이 만료되어 있다.

```bash
gh auth login -h github.com
```

### 2. Supabase 스키마 적용

Supabase Dashboard에서 프로젝트 `ltirryijdgzfsxkntvmb`를 열고 SQL Editor에 `supabase/schema.sql` 내용을 실행한다.

중요:

- `stores` 테이블에 `external_id`와 `contact` 컬럼이 있어야 한다.
- RLS는 켜져 있어야 한다.
- 지금 단계에서는 Vercel API가 서버 환경변수의 service role key로 읽는다.

### 3. Supabase 로컬 env 생성

`.env.supabase.example`을 참고해 `.env.supabase.local`을 만든다.

```text
SUPABASE_URL=https://프로젝트-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=서비스-role-key
```

`SUPABASE_SERVICE_ROLE_KEY`는 브라우저 코드에 넣으면 안 된다.

### 4. 실제 고객 데이터 업로드

로컬에서 실행한다.

```bash
python3 scripts/import-supabase-stores.py
```

성공하면 `Imported 10,198/10,198 stores` 형태로 출력된다.

### 5. Vercel 프로젝트 연결

Preview 배포부터 진행한다.

```bash
vercel
```

처음 연결할 때는 현재 폴더를 새 Vercel 프로젝트로 연결한다.

### 6. Vercel 환경변수 설정

Vercel Project Settings에서 아래 환경변수를 Preview와 Production에 추가한다.

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### 7. Vercel Deployment Protection 켜기

실제 고객 데이터가 들어간 배포는 Supabase Auth가 붙기 전까지 보호된 Preview로만 확인한다.

필수:

- Deployment Protection 또는 Password Protection 활성화
- 보호가 꺼진 Production에 실제 고객 데이터를 연결하지 않기

### 8. Preview 확인

Preview URL에서 기술부 사용자로 로그인해 확인한다.

- 양석원: `61000A` 계열만 보여야 함
- 신규철: `61000B` 계열만 보여야 함
- 이승혁: `61000C` 계열만 보여야 함
- `data/customers.local.json` URL은 배포에서 없어야 함

## 다음 구현 순서

1. Supabase Auth 실제 로그인 적용
2. 부서/이름 선택을 Supabase profile 기반 로그인으로 교체
3. 방문 보고서와 완료 상태를 Supabase에 저장
4. 사진 업로드를 Supabase Storage로 연결
5. Production 배포
