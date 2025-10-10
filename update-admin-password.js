#!/usr/bin/env node

/**
 * Admin 계정 비밀번호 업데이트 스크립트
 * 기존 admin 계정의 비밀번호를 admin123으로 업데이트합니다.
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

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

async function updateAdminPassword() {
    let client;
    
    try {
        console.log('🔧 Admin 계정 비밀번호 업데이트 시작...');
        
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
        
        // admin123 비밀번호 해시 생성
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        console.log('🔐 새 비밀번호 해시 생성:', hashedPassword);
        
        // 기존 admin 계정 확인
        const checkResult = await client.query('SELECT id, username, name, role FROM users WHERE username = $1', ['admin']);
        
        if (checkResult.rows.length === 0) {
            console.log('👤 Admin 계정이 없습니다. 새로 생성합니다.');
            
            // 새 admin 계정 생성
            await client.query(`
                INSERT INTO users (username, password, name, role) 
                VALUES ($1, $2, $3, $4)
            `, ['admin', hashedPassword, '관리자', 'admin']);
            
            console.log('✅ Admin 계정 생성 완료');
        } else {
            console.log('👤 기존 Admin 계정 발견:', checkResult.rows[0]);
            
            // 기존 admin 계정 비밀번호 업데이트
            await client.query(`
                UPDATE users 
                SET password = $1 
                WHERE username = $2
            `, [hashedPassword, 'admin']);
            
            console.log('✅ Admin 계정 비밀번호 업데이트 완료');
        }
        
        // 업데이트된 admin 계정 확인
        const verifyResult = await client.query('SELECT username, name, role FROM users WHERE username = $1', ['admin']);
        console.log('🔍 업데이트된 Admin 계정:', verifyResult.rows[0]);
        
        // 비밀번호 검증 테스트
        const testResult = await client.query('SELECT password FROM users WHERE username = $1', ['admin']);
        const storedHash = testResult.rows[0].password;
        const isValid = bcrypt.compareSync('admin123', storedHash);
        
        console.log('🔐 비밀번호 검증 테스트:', isValid ? '✅ 성공' : '❌ 실패');
        
        console.log('🎉 Admin 계정 비밀번호 업데이트 완료!');
        console.log('📋 로그인 정보:');
        console.log('   사용자명: admin');
        console.log('   비밀번호: admin123');
        
    } catch (error) {
        console.error('❌ Admin 계정 비밀번호 업데이트 실패:', error);
        process.exit(1);
    } finally {
        if (client) {
            await client.end();
            console.log('🔌 데이터베이스 연결 종료');
        }
    }
}

// 스크립트가 직접 실행된 경우에만 실행
if (require.main === module) {
    updateAdminPassword();
}

module.exports = { updateAdminPassword };
