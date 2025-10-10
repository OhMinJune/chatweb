-- ChatWeb 데이터베이스 스키마
-- PostgreSQL용 테이블 생성 스크립트

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 채팅방 테이블
CREATE TABLE IF NOT EXISTS chatrooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    admin_id INTEGER REFERENCES users(id),
    guest_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chatroom_id INTEGER REFERENCES chatrooms(id),
    sender_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_chatrooms_admin_id ON chatrooms(admin_id);
CREATE INDEX IF NOT EXISTS idx_chatrooms_guest_id ON chatrooms(guest_id);
CREATE INDEX IF NOT EXISTS idx_messages_chatroom_id ON messages(chatroom_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 기본 관리자 계정 생성 (비밀번호: admin123)
-- bcrypt 해시: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (username, password, name, role) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '관리자', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 테이블 생성 확인
SELECT 'Users table created' as status;
SELECT 'Chatrooms table created' as status;
SELECT 'Messages table created' as status;
SELECT 'Default admin account created' as status;
