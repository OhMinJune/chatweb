#!/usr/bin/env node

/**
 * 데이터베이스 자동 초기화 스크립트
 * CloudType 배포 시 자동으로 실행되어 데이터베이스 테이블을 생성합니다.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 환경변수에서 데이터베이스 연결 정보 가져오기
const dbConfig = process.env.DATABASE_URL || {
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || '120191590DB',
    password: process.env.PGPASSWORD || '123456',
    database: process.env.PGDATABASE || '120191590DB',
    port: process.env.PGPORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 5
};

async function initializeDatabase() {
    let client;
    
    try {
        console.log('🔧 데이터베이스 초기화 시작...');
        
        // 데이터베이스 연결
        if (process.env.DATABASE_URL) {
            console.log('📡 DATABASE_URL을 사용하여 연결 중...');
            client = new Client(process.env.DATABASE_URL);
        } else {
            console.log('📡 로컬 설정을 사용하여 연결 중...');
            client = new Client(dbConfig);
        }
        
        await client.connect();
        console.log('✅ 데이터베이스 연결 성공');
        
        // SQL 스키마 파일 읽기
        const schemaPath = path.join(__dirname, 'database_schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
            console.log('📄 스키마 파일 읽기 완료');
            
            // SQL 실행
            await client.query(schemaSQL);
            console.log('✅ 데이터베이스 스키마 생성 완료');
        } else {
            console.log('⚠️ 스키마 파일을 찾을 수 없습니다. 기본 테이블을 생성합니다.');
            
            // 기본 테이블 생성
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20),
                    role VARCHAR(20) DEFAULT 'guest',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS chatrooms (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    admin_id INTEGER REFERENCES users(id),
                    guest_id INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    chatroom_id INTEGER REFERENCES chatrooms(id),
                    sender_id INTEGER REFERENCES users(id),
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // 인덱스 생성
            await client.query(`CREATE INDEX IF NOT EXISTS idx_chatrooms_admin_id ON chatrooms(admin_id)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_chatrooms_guest_id ON chatrooms(guest_id)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_chatroom_id ON messages(chatroom_id)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
            
            // 기본 관리자 계정 생성 (비밀번호: admin123)
            await client.query(`
                INSERT INTO users (username, password, name, phone, role) 
                VALUES ('admin', '$2a$10$LLbAib.NirTNjFv3kAhqp.PSKvUSnH2YjmRi/I5H8UWUE9VaNyKX6', '관리자', '010-0000-0000', 'admin')
                ON CONFLICT (username) DO NOTHING
            `);
            
            console.log('✅ 기본 테이블 생성 완료');
        }
        
        // 테이블 확인
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);
        
        console.log('📊 생성된 테이블:', tablesResult.rows.map(row => row.table_name).join(', '));
        
        // 관리자 계정 확인
        const adminResult = await client.query('SELECT username, name, role FROM users WHERE role = $1', ['admin']);
        if (adminResult.rows.length > 0) {
            console.log('👤 관리자 계정:', adminResult.rows[0]);
        }
        
        console.log('🎉 데이터베이스 초기화 완료!');
        
    } catch (error) {
        console.error('❌ 데이터베이스 초기화 실패:', error);
        process.exit(1);
    } finally {
        if (client) {
            await client.end();
            console.log('🔌 데이터베이스 연결 종료');
        }
    }
}

// 스크립트가 직접 실행된 경우에만 초기화 실행
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };
