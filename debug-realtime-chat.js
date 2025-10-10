#!/usr/bin/env node

/**
 * 실시간 채팅 디버깅 스크립트
 * Socket.io 연결 상태와 메시지 전송을 테스트합니다.
 */

const io = require('socket.io-client');

console.log('🔍 실시간 채팅 디버깅 시작...');
console.log('=====================================');

// CloudType URL 설정
const serverUrl = process.env.SERVER_URL || 'https://port-0-chatweb-mgkyr7u308f3a552.sel3.cloudtype.app';

console.log(`📡 서버 URL: ${serverUrl}`);

// Socket.io 연결
const socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    maxReconnectionAttempts: 5
});

// 연결 상태 이벤트
socket.on('connect', () => {
    console.log('✅ Socket.io 연결 성공:', socket.id);
    
    // 테스트 채팅방 입장
    const testChatroomId = 1;
    console.log(`📥 테스트 채팅방 ${testChatroomId} 입장 시도...`);
    socket.emit('join-room', testChatroomId);
});

socket.on('connected', (data) => {
    console.log('✅ 서버 연결 확인:', data.message);
    console.log('📊 연결 정보:', data);
});

socket.on('room-joined', (data) => {
    console.log('✅ 채팅방 입장 성공:', data);
    
    // 테스트 메시지 전송
    setTimeout(() => {
        console.log('📤 테스트 메시지 전송...');
        socket.emit('send-message', {
            chatroomId: data.chatroomId,
            message: '테스트 메시지입니다.',
            senderId: 1 // 테스트용 사용자 ID
        });
    }, 1000);
});

socket.on('receive-message', (message) => {
    console.log('📨 메시지 수신:', message);
});

socket.on('connect_error', (error) => {
    console.error('❌ Socket.io 연결 오류:', error);
});

socket.on('disconnect', (reason) => {
    console.log('❌ Socket.io 연결 해제:', reason);
});

socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Socket.io 재연결 성공:', attemptNumber);
});

socket.on('reconnect_error', (error) => {
    console.error('❌ Socket.io 재연결 오류:', error);
});

socket.on('error', (error) => {
    console.error('❌ Socket.io 오류:', error);
});

// 10초 후 연결 테스트 종료
setTimeout(() => {
    console.log('=====================================');
    console.log('🔍 실시간 채팅 디버깅 완료');
    console.log(`📊 연결 상태: ${socket.connected ? '연결됨' : '연결 안됨'}`);
    console.log(`📊 Socket ID: ${socket.id || '없음'}`);
    
    socket.disconnect();
    process.exit(0);
}, 10000);
