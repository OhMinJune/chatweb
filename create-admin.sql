-- Supabase에서 Admin 계정 생성 SQL
-- 실행 방법: Supabase SQL Editor에서 실행

-- Admin 계정 생성 (비밀번호: admin123)
-- bcrypt 해시: $2a$10$LLbAib.NirTNjFv3kAhqp.PSKvUSnH2YjmRi/I5H8UWUE9VaNyKX6
INSERT INTO users (username, password, name, phone, role) 
VALUES ('admin', '$2a$10$LLbAib.NirTNjFv3kAhqp.PSKvUSnH2YjmRi/I5H8UWUE9VaNyKX6', '관리자', '010-0000-0000', 'admin');

-- 생성된 계정 확인
SELECT id, username, name, phone, role, created_at 
FROM users 
WHERE username = 'admin';
