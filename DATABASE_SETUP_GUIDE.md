# 데이터베이스 연결 가이드

## 개요
ChatWeb 프로젝트를 위한 PostgreSQL 데이터베이스 설정 및 연결 방법을 설명합니다.

## 추천 데이터베이스 서비스

### 1. Supabase (권장) ⭐
- **무료 플랜**: 월 500MB, 2개 프로젝트
- **장점**: 빠른 설정, 자동 백업, 실시간 기능
- **가격**: 무료 시작, 유료 플랜 $25/월부터

### 2. ElephantSQL
- **무료 플랜**: 월 20MB
- **장점**: 간단한 설정, 안정적
- **가격**: 무료 시작, 유료 플랜 $5/월부터

### 3. Railway
- **무료 플랜**: 월 $5 크레딧
- **장점**: 다양한 서비스 통합
- **가격**: 사용량 기반

## Supabase 설정 방법 (상세)

### 1단계: Supabase 계정 생성
1. [Supabase](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인 (권장)

### 2단계: 새 프로젝트 생성
1. "New Project" 클릭
2. Organization 선택
3. 프로젝트 정보 입력:
   - **Name**: `chatweb-db`
   - **Database Password**: 강력한 비밀번호 설정 (기억해두세요!)
   - **Region**: `Northeast Asia (Seoul)` 선택
4. "Create new project" 클릭

### 3단계: 데이터베이스 연결 정보 확인
1. 프로젝트 대시보드에서 **Settings** → **Database** 클릭
2. **Connection string** 섹션에서 **URI** 복사
3. 형식: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### 4단계: 데이터베이스 테이블 생성
Supabase 대시보드의 **SQL Editor**에서 다음 스크립트 실행:

```sql
-- 사용자 테이블 생성
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 채팅방 테이블 생성
CREATE TABLE chatrooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    admin_id INTEGER REFERENCES users(id),
    guest_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 메시지 테이블 생성
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chatroom_id INTEGER REFERENCES chatrooms(id),
    sender_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 관리자 계정 생성 (비밀번호: admin123)
INSERT INTO users (username, password, name, role) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '관리자', 'admin');

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_chatrooms_admin_id ON chatrooms(admin_id);
CREATE INDEX idx_chatrooms_guest_id ON chatrooms(guest_id);
CREATE INDEX idx_messages_chatroom_id ON messages(chatroom_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### 5단계: CloudType 환경변수 설정
CloudType 대시보드에서 다음 환경변수 설정:

```
DATABASE_URL=postgresql://postgres:실제비밀번호@db.프로젝트ID.supabase.co:5432/postgres
SESSION_SECRET=생성된랜덤문자열
NODE_ENV=production
PORT=3000
```

## ElephantSQL 설정 방법

### 1단계: 계정 생성
1. [ElephantSQL](https://www.elephantsql.com) 접속
2. "Get a managed database today" 클릭
3. 계정 생성

### 2단계: 인스턴스 생성
1. "Create New Instance" 클릭
2. 설정:
   - **Name**: `chatweb-db`
   - **Plan**: Tiny Turtle (Free)
   - **Region**: AWS Asia Pacific (Seoul)
3. "Review" → "Create instance" 클릭

### 3단계: 연결 정보 확인
1. 인스턴스 선택
2. **Details** 탭에서 **URL** 복사
3. 형식: `postgresql://user:pass@host:port/database`

### 4단계: 테이블 생성
**Browser** 탭에서 SQL 실행:

```sql
-- 위와 동일한 SQL 스크립트 실행
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 나머지 테이블들도 동일하게 생성
```

## 연결 테스트 방법

### 1. 로컬 테스트
```bash
# 환경변수 설정
export DATABASE_URL="postgresql://postgres:비밀번호@host:port/database"

# 서버 실행
node server_cloudtype.js
```

### 2. CloudType 배포 후 테스트
1. CloudType 대시보드 → **로그** 확인
2. "✅ 데이터베이스 연결 성공" 메시지 확인
3. 웹사이트 접속하여 회원가입/로그인 테스트

### 3. 데이터베이스 연결 확인
```sql
-- Supabase SQL Editor에서 실행
SELECT * FROM users;
SELECT * FROM chatrooms;
SELECT * FROM messages;
```

## 문제 해결

### 일반적인 오류들

#### 1. 연결 거부 오류
```
Error: connect ECONNREFUSED
```
**해결방법:**
- DATABASE_URL이 올바른지 확인
- 데이터베이스 서비스가 실행 중인지 확인
- 방화벽 설정 확인

#### 2. 인증 실패
```
Error: password authentication failed
```
**해결방법:**
- 비밀번호가 올바른지 확인
- 사용자명이 정확한지 확인
- 데이터베이스 서비스에서 비밀번호 재설정

#### 3. 테이블 없음 오류
```
Error: relation "users" does not exist
```
**해결방법:**
- SQL 스크립트를 다시 실행
- 테이블명 오타 확인
- 데이터베이스 선택 확인

### 연결 상태 확인
```javascript
// 서버 코드에 추가하여 연결 상태 확인
app.get('/api/health', async (req, res) => {
    try {
        if (db) {
            await db.query('SELECT 1');
            res.json({ 
                status: 'healthy', 
                database: 'connected',
                timestamp: new Date().toISOString()
            });
        } else {
            res.json({ 
                status: 'unhealthy', 
                database: 'disconnected',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        res.json({ 
            status: 'unhealthy', 
            database: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
```

## 보안 고려사항

### 1. 데이터베이스 보안
- 강력한 비밀번호 사용
- 정기적인 백업 수행
- 접근 IP 제한 설정 (가능한 경우)

### 2. 연결 보안
- SSL 연결 사용 (Supabase는 기본 제공)
- 환경변수로 민감한 정보 관리
- 프로덕션과 개발 환경 분리

### 3. 데이터 보안
- 비밀번호 해시화 (bcrypt 사용)
- 세션 보안 설정
- SQL 인젝션 방지 (매개변수화된 쿼리 사용)

## 모니터링 및 유지보수

### 1. 성능 모니터링
- 데이터베이스 쿼리 성능 확인
- 연결 풀 상태 모니터링
- 메모리 사용량 확인

### 2. 백업 전략
- 정기적인 데이터베이스 백업
- 중요 데이터의 다중 복사본 유지
- 재해 복구 계획 수립

### 3. 확장성 고려
- 사용자 증가에 따른 데이터베이스 업그레이드
- 읽기 전용 복제본 고려
- 캐싱 전략 구현

## 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [ElephantSQL 가이드](https://www.elephantsql.com/docs/)
- [CloudType 데이터베이스 연결 가이드](https://docs.cloudtype.io)

## 지원

문제가 발생하면 다음을 확인하세요:
1. 데이터베이스 서비스 상태
2. CloudType 로그
3. 네트워크 연결 상태
4. 환경변수 설정

