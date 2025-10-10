#!/usr/bin/env node

/**
 * CloudType 환경변수 확인 스크립트
 * 배포 시 환경변수가 올바르게 설정되었는지 확인합니다.
 */

console.log('🔍 CloudType 환경변수 확인 중...');
console.log('=====================================');

// 필수 환경변수 확인
const requiredEnvVars = [
    'NODE_ENV',
    'PORT'
];

const optionalEnvVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'CLOUDTYPE'
];

console.log('📋 필수 환경변수:');
requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
        console.log(`✅ ${envVar}: ${value}`);
    } else {
        console.log(`❌ ${envVar}: 설정되지 않음`);
    }
});

console.log('\n📋 선택적 환경변수:');
optionalEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
        if (envVar === 'DATABASE_URL') {
            // 데이터베이스 URL의 민감한 정보는 마스킹
            const masked = value.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
            console.log(`✅ ${envVar}: ${masked}`);
        } else {
            console.log(`✅ ${envVar}: ${value}`);
        }
    } else {
        console.log(`⚠️ ${envVar}: 설정되지 않음`);
    }
});

console.log('\n🔧 환경 정보:');
console.log(`Node.js 버전: ${process.version}`);
console.log(`플랫폼: ${process.platform}`);
console.log(`아키텍처: ${process.arch}`);
console.log(`작업 디렉토리: ${process.cwd()}`);

// CloudType 환경 확인
if (process.env.CLOUDTYPE) {
    console.log('\n✅ CloudType 환경에서 실행 중');
} else {
    console.log('\n⚠️ CloudType 환경이 아닙니다');
}

console.log('=====================================');
console.log('환경변수 확인 완료');
