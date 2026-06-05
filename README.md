# 매장세일즈 웹사이트 MVP

무료 운영 기준: Vercel Hobby + Firebase Spark.

## 기능
- 직원 로그인
- 담당자 자동 입력
- 날짜, 크레딧카드, 스타카드, 달러, 원화, 메모 입력
- 관리자 대시보드
- 월별 매출표 인쇄/PDF 저장

## 실행
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Firebase 설정
1. Firebase 프로젝트 생성
2. Authentication > Email/Password 활성화
3. Firestore Database 생성
4. 웹 앱 등록 후 `.env.local`에 값 입력
5. 직원 계정은 Firebase Authentication에서 생성
6. Firestore `users/{uid}` 문서에 아래 형태로 저장
```json
{
  "name": "홍길동",
  "role": "staff",
  "storeName": "본점"
}
```
관리자는 role을 `admin`으로 설정.

## 인쇄
`/report` 페이지에서 연도/월 선택 후 인쇄 버튼을 누르면 업로드한 양식과 같은 A4 인쇄 화면으로 출력됩니다.
