-- 실시간 채팅 웹사이트 데이터베이스 초기화
-- Supabase SQL Editor에서 실행하세요

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(10) DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 채팅방 테이블
CREATE TABLE IF NOT EXISTS chatrooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    admin_id INTEGER NOT NULL,
    guest_id INTEGER,
    status VARCHAR(10) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chatroom_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(10) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 관리자 계정 생성 (비밀번호: admin123)
INSERT INTO users (username, password, name, phone, role) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '관리자', '010-0000-0000', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 샘플 게스트 계정 생성 (비밀번호: guest123)
INSERT INTO users (username, password, name, phone, role) VALUES 
('guest1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '게스트1', '010-1111-1111', 'guest'),
('guest2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '게스트2', '010-2222-2222', 'guest')
ON CONFLICT (username) DO NOTHING;

-- 샘플 채팅방 생성
INSERT INTO chatrooms (name, admin_id, guest_id) VALUES 
('고객상담 1', 1, 2),
('고객상담 2', 1, 3)
ON CONFLICT DO NOTHING;

-- 샘플 메시지
INSERT INTO messages (chatroom_id, sender_id, message) VALUES 
(1, 2, '안녕하세요! 문의사항이 있어서 연락드렸습니다.'),
(1, 1, '안녕하세요! 어떤 도움이 필요하신가요?'),
(2, 3, '제품에 대해 문의드리고 싶습니다.'),
(2, 1, '네, 어떤 제품에 대해 궁금하신가요?')
ON CONFLICT DO NOTHING;
