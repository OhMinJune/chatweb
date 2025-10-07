# 실시간 채팅 웹사이트

카카오톡과 같은 실시간 채팅 기능을 제공하는 웹사이트입니다. 관리자와 게스트 간의 1:1 채팅을 지원합니다.

## 주요 기능

- **사용자 인증**: 로그인/회원가입 시스템
- **역할 기반 접근**: 관리자와 게스트 역할 구분
- **실시간 채팅**: Socket.io를 이용한 실시간 메시지 전송
- **채팅방 관리**: 관리자는 여러 게스트와 동시 채팅 가능
- **반응형 디자인**: 모바일과 데스크톱 모두 지원

## 기술 스택

### 백엔드
- Node.js
- Express.js
- Socket.io (실시간 통신)
- MySQL (데이터베이스)
- bcryptjs (비밀번호 암호화)
- express-session (세션 관리)

### 프론트엔드
- HTML5
- CSS3 (반응형 디자인)
- Vanilla JavaScript
- Socket.io Client

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 데이터베이스 설정
MySQL에 접속하여 `database.sql` 파일의 내용을 실행하세요:

```sql
-- database.sql 파일의 모든 내용을 복사하여 실행
```

### 3. 데이터베이스 연결 설정
`server.js` 파일의 `dbConfig` 객체를 수정하세요:

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'chatweb',
    charset: 'utf8mb4'
};
```

### 4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

서버가 실행되면 `http://localhost:3000`에서 접속할 수 있습니다.

## 사용 방법

### 기본 계정 정보
- **관리자**: 아이디 `admin`, 비밀번호 `admin123`
- **게스트**: 아이디 `guest1`, 비밀번호 `guest123`

### 관리자 기능
1. 로그인 후 채팅방 목록 확인
2. 게스트와의 채팅방 선택
3. 실시간 채팅 진행

### 게스트 기능
1. 로그인 후 자동으로 할당된 채팅방 입장
2. 관리자와 실시간 채팅 진행

## 프로젝트 구조

```
ChatWeb/
├── public/                 # 정적 파일
│   ├── index.html         # 로그인/회원가입 페이지
│   ├── admin.html         # 관리자 채팅 페이지
│   ├── chat.html          # 게스트 채팅 페이지
│   └── style.css          # 스타일시트
├── server.js              # 서버 메인 파일
├── database.sql           # 데이터베이스 스키마
├── package.json           # 프로젝트 설정
└── README.md             # 프로젝트 문서
```

## API 엔드포인트

### 인증
- `POST /api/login` - 로그인
- `POST /api/register` - 회원가입
- `POST /api/logout` - 로그아웃

### 채팅
- `GET /api/admin/chatrooms` - 관리자 채팅방 목록
- `GET /api/guest/chatroom` - 게스트 채팅방 정보
- `GET /api/messages/:chatroomId` - 메시지 조회

### Socket.io 이벤트
- `join-room` - 채팅방 입장
- `send-message` - 메시지 전송
- `receive-message` - 메시지 수신

## 배포

### Heroku 배포
1. Heroku 계정 생성 및 CLI 설치
2. 프로젝트를 Git 저장소로 초기화
3. Heroku 앱 생성 및 배포

```bash
heroku create your-app-name
git push heroku main
```

### 다른 클라우드 서비스
- AWS EC2
- Google Cloud Platform
- Azure
- DigitalOcean

## 라이선스

MIT License

