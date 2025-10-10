# CloudType 배포 가이드

## 개요
이 가이드는 ChatWeb 프로젝트를 CloudType으로 배포하는 방법을 설명합니다.

## 사전 준비사항

### 1. CloudType 계정 생성
- [CloudType 웹사이트](https://cloudtype.io)에서 계정을 생성하세요
- GitHub 계정으로 로그인하는 것을 권장합니다

### 2. 데이터베이스 준비
현재 프로젝트는 PostgreSQL을 사용합니다. 다음 중 하나를 선택하세요:

#### 옵션 1: Supabase (권장)
- [Supabase](https://supabase.com)에서 무료 PostgreSQL 데이터베이스 생성
- 데이터베이스 연결 문자열 복사

#### 옵션 2: 다른 PostgreSQL 서비스
- ElephantSQL, Railway, 또는 다른 PostgreSQL 호스팅 서비스 사용

## 배포 단계

### 1단계: GitHub 저장소 준비
```bash
# 현재 프로젝트를 GitHub에 푸시
git init
git add .
git commit -m "Initial commit for CloudType deployment"
git branch -M main
git remote add origin https://github.com/yourusername/chatweb.git
git push -u origin main
```

### 2단계: CloudType에서 새 프로젝트 생성
1. CloudType 대시보드에 로그인
2. "새 프로젝트" 클릭
3. "GitHub 저장소 연결" 선택
4. ChatWeb 저장소 선택

### 3단계: 프로젝트 설정
- **프레임워크**: Node.js
- **빌드 명령어**: `npm install`
- **실행 명령어**: `npm start`
- **포트**: 3000 (자동 감지)

### 4단계: 환경변수 설정
CloudType 대시보드의 "환경변수" 섹션에서 다음을 설정:

```
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-super-secret-session-key-here
```

### 5단계: 데이터베이스 초기화
배포 후 데이터베이스 테이블을 생성해야 합니다:

```sql
-- 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 채팅방 테이블
CREATE TABLE chatrooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    admin_id INTEGER REFERENCES users(id),
    guest_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 메시지 테이블
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chatroom_id INTEGER REFERENCES chatrooms(id),
    sender_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 관리자 계정 생성 (비밀번호: admin123)
INSERT INTO users (username, password, name, role) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '관리자', 'admin');
```

### 6단계: 배포 실행
1. CloudType 대시보드에서 "배포" 버튼 클릭
2. 빌드 로그를 확인하여 오류가 없는지 확인
3. 배포 완료 후 제공되는 URL로 접속

## 배포 후 확인사항

### 1. 애플리케이션 접속
- CloudType에서 제공하는 URL로 접속
- 예: `https://your-project-name.cloudtype.app`

### 2. 기능 테스트
- 회원가입 기능 테스트
- 로그인 기능 테스트
- 채팅 기능 테스트
- 관리자 페이지 접근 테스트

### 3. 로그 확인
- CloudType 대시보드의 "로그" 섹션에서 오류 확인
- 데이터베이스 연결 상태 확인

## 문제 해결

### 일반적인 문제들

#### 1. 데이터베이스 연결 오류
```
❌ 데이터베이스 연결 실패
```
**해결방법:**
- DATABASE_URL 환경변수가 올바른지 확인
- 데이터베이스 서비스가 실행 중인지 확인
- 방화벽 설정 확인

#### 2. 포트 오류
```
Error: listen EADDRINUSE: address already in use
```
**해결방법:**
- PORT 환경변수를 3000으로 설정
- CloudType에서 자동 포트 할당 사용

#### 3. 의존성 설치 오류
```
npm ERR! peer dep missing
```
**해결방법:**
- package.json의 dependencies 확인
- Node.js 버전 호환성 확인

### 로그 확인 방법
1. CloudType 대시보드 → 프로젝트 → "로그" 탭
2. 빌드 로그와 런타임 로그를 구분하여 확인
3. 오류 메시지의 전체 스택 트레이스 확인

## 보안 고려사항

### 1. 환경변수 보안
- SESSION_SECRET을 강력한 랜덤 문자열로 설정
- 데이터베이스 비밀번호를 안전하게 관리
- 프로덕션 환경에서는 HTTPS 사용

### 2. 데이터베이스 보안
- 데이터베이스 접근 IP 제한 설정
- 정기적인 백업 수행
- 민감한 데이터 암호화

## 성능 최적화

### 1. 데이터베이스 최적화
- 인덱스 추가
- 연결 풀링 설정
- 쿼리 최적화

### 2. 애플리케이션 최적화
- 정적 파일 캐싱
- 압축 미들웨어 사용
- 메모리 사용량 모니터링

## 추가 리소스

- [CloudType 공식 문서](https://docs.cloudtype.io)
- [Node.js 배포 가이드](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PostgreSQL 연결 가이드](https://www.postgresql.org/docs/current/libpq-connect.html)

## 지원

문제가 발생하면 다음을 확인하세요:
1. CloudType 공식 문서
2. 프로젝트 GitHub Issues
3. CloudType 지원팀 문의
