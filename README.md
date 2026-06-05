# 매장세일즈 웹사이트 MVP v1.1

무료 운영 기준: Vercel Hobby + Firebase Spark.

## 이번 버전 기능
- BBQ Outpost 로고 로그인 화면 표시
- 이름 + 비밀번호 로그인
- 로그아웃 기능
- 관리자 직원 계정 생성 화면: `/admin/users`
- 직원 입력 항목 단순화
  - 크레딧카드
  - 스타카드
  - 달러
  - 원화
  - 원화금액
- 날짜는 한국 시간 기준 자동 입력
- 담당자는 로그인한 이름으로 자동 저장
- 메모 제거
- 일별매출 계산: `크레딧카드 + 스타카드 + 달러 + 원화`
- `원화금액`은 별도 표시, 일별매출 합산 제외
- 월별 매출표 인쇄/PDF 저장

## 실행
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Firebase 설정
1. Authentication > Email/Password 활성화
2. Firestore Database 생성
3. 웹 앱 등록 후 `.env.local` 또는 Vercel Environment Variables에 값 입력
4. Firestore Rules에 `firestore.rules` 내용을 반영

## 최초 관리자 설정
이미 Firebase Authentication에서 만든 관리자 이메일 계정이 있다면 Firestore에 아래 문서를 추가하세요.

컬렉션: `users`
문서 ID: 관리자 Firebase UID
```json
{
  "name": "심민준",
  "role": "admin",
  "storeName": "본점",
  "email": "simminjun@bbqoutpost.com"
}
```

이름 로그인도 쓰려면 추가로 아래 문서를 생성하세요.

컬렉션: `loginNames`
문서 ID: `심민준`에서 공백 제거 후 소문자 처리한 값. 예: `심민준`
```json
{
  "name": "심민준",
  "email": "simminjun@bbqoutpost.com",
  "role": "admin",
  "uid": "관리자 Firebase UID"
}
```

그 다음부터는 관리자 화면 `/admin/users`에서 직원 이름과 임시 비밀번호를 넣어 계정을 만들 수 있습니다.
