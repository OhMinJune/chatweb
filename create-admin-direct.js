#!/usr/bin/env node

/**
 * Admin 계정 직접 생성 스크립트
 * 사용자가 Supabase DATABASE_URL을 입력하면 admin 계정을 생성합니다.
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function createAdminAccount() {
    try {
        console.log('🔧 Admin 계정 생성 도구');
        console.log('📋 Supabase DATABASE_URL이 필요합니다.');
        console.log('💡 Supabase → Settings → Database → Connection string에서 확인 가능');
        console.log('');
        
        const databaseUrl = await askQuestion('🔗 DATABASE_URL을 입력하세요: ');
        
        if (!databaseUrl || !databaseUrl.includes('supabase.co')) {
            console.log('❌ 올바른 Supabase DATABASE_URL이 아닙니다.');
            process.exit(1);
        }
        
        console.log('');
        console.log('📡 데이터베이스 연결 중...');
        
        const client = new Client(databaseUrl);
        await client.connect();
        console.log('✅ 데이터베이스 연결 성공');
        
        // admin123 비밀번호 해시 생성
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        console.log('🔐 비밀번호 해시 생성 완료');
        
        // 기존 admin 계정 확인
        const checkResult = await client.query('SELECT id, username, name, role FROM users WHERE username = $1', ['admin']);
        
        if (checkResult.rows.length > 0) {
            console.log('⚠️ 기존 Admin 계정이 있습니다:', checkResult.rows[0]);
            
            const update = await askQuestion('🔄 기존 계정을 업데이트하시겠습니까? (y/n): ');
            
            if (update.toLowerCase() === 'y') {
                await client.query(`
                    UPDATE users 
                    SET password = $1, name = $2, role = $3
                    WHERE username = $4
                `, [hashedPassword, '관리자', 'admin', 'admin']);
                console.log('✅ Admin 계정 업데이트 완료');
            } else {
                console.log('❌ 작업이 취소되었습니다.');
                await client.end();
                process.exit(0);
            }
        } else {
            console.log('👤 새 Admin 계정 생성 중...');
            
            await client.query(`
                INSERT INTO users (username, password, name, phone, role) 
                VALUES ($1, $2, $3, $4, $5)
            `, ['admin', hashedPassword, '관리자', '010-0000-0000', 'admin']);
            
            console.log('✅ Admin 계정 생성 완료');
        }
        
        // 생성된 계정 확인
        const verifyResult = await client.query('SELECT id, username, name, role, created_at FROM users WHERE username = $1', ['admin']);
        console.log('🔍 생성된 Admin 계정:', verifyResult.rows[0]);
        
        // 비밀번호 검증 테스트
        const testResult = await client.query('SELECT password FROM users WHERE username = $1', ['admin']);
        const storedHash = testResult.rows[0].password;
        const isValid = bcrypt.compareSync('admin123', storedHash);
        
        console.log('🔐 비밀번호 검증 테스트:', isValid ? '✅ 성공' : '❌ 실패');
        
        console.log('');
        console.log('🎉 Admin 계정 생성 완료!');
        console.log('📋 로그인 정보:');
        console.log('   사용자명: admin');
        console.log('   비밀번호: admin123');
        console.log('   역할: admin (관리자)');
        
        await client.end();
        console.log('🔌 데이터베이스 연결 종료');
        
    } catch (error) {
        console.error('❌ Admin 계정 생성 실패:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// 스크립트 실행
createAdminAccount();
