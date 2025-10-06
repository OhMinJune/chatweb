-- 실시간 채팅 웹사이트 데이터베이스 스키마

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS chatweb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chatweb;

-- 사용자 테이블
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role ENUM('admin', 'guest') DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 채팅방 테이블
CREATE TABLE chatrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    admin_id INT NOT NULL,
    guest_id INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 메시지 테이블
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chatroom_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file') DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatroom_id) REFERENCES chatrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 기본 어드민 계정 생성 (비밀번호: admin123)
INSERT INTO users (username, password, name, phone, role) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '관리자', '010-0000-0000', 'admin');

-- 샘플 게스트 계정 생성 (비밀번호: guest123)
INSERT INTO users (username, password, name, phone, role) VALUES 
('guest1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '게스트1', '010-1111-1111', 'guest'),
('guest2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '게스트2', '010-2222-2222', 'guest');

-- 샘플 채팅방 생성
INSERT INTO chatrooms (name, admin_id, guest_id) VALUES 
('고객상담 1', 1, 2),
('고객상담 2', 1, 3);

-- 샘플 메시지
INSERT INTO messages (chatroom_id, sender_id, message) VALUES 
(1, 2, '안녕하세요! 문의사항이 있어서 연락드렸습니다.'),
(1, 1, '안녕하세요! 어떤 도움이 필요하신가요?'),
(2, 3, '제품에 대해 문의드리고 싶습니다.'),
(2, 1, '네, 어떤 제품에 대해 궁금하신가요?');
