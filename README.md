# 매장세일즈 v1.2 - 단순 로그인 버전

## 변경 내용

- Firebase Authentication 로그인 제거
- 직원은 이름 + 비밀번호만 입력해서 로그인
- 최초 관리자 자동 생성
  - 이름: 심민준
  - 비밀번호: 12345678
- 관리자 화면에서 직원 계정 생성 가능
- 담당자는 이메일이 아니라 이름으로 저장/출력
- 로그아웃 기능 유지
- 입력 항목: 크레딧카드, 스타카드, 달러, 원화, 원화금액
- 날짜는 한국 시간 기준 자동 적용
- 메모 제거
- 일별매출 = 크레딧카드 + 스타카드 + 달러 + 원화
- 원화금액은 일별매출 합산 제외

## 최초 로그인

사이트 접속 후 아래로 로그인하세요.

- 이름: 심민준
- 비밀번호: 12345678

최초 로그인 시 Firestore의 `users` 컬렉션에 관리자 계정이 자동으로 생성됩니다.

## 중요한 Firebase 설정

이 버전은 Firebase Authentication을 사용하지 않습니다.
Firestore만 사용합니다.

Firebase Console > Firestore Database > 규칙에 아래 내용을 넣어야 합니다.

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

이 규칙은 MVP 테스트용입니다. 실제 운영 안정화 후 보안 규칙을 강화하는 것을 권장합니다.

## 배포 방법

1. 이 ZIP 압축 해제
2. GitHub 저장소의 기존 파일 삭제
3. 압축 푼 안쪽 파일 전체 업로드
4. Commit changes
5. Vercel 자동 배포 확인

## 환경변수

Vercel Environment Variables에 기존 Firebase 설정값을 그대로 유지하면 됩니다.

- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
