const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
        transports: ['websocket', 'polling']
    },
    allowEIO3: true
});

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 세션 설정
app.use(session({
    secret: 'chatweb-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24시간
}));

// /webchat/ 경로에서 정적 파일 서빙
app.use('/webchat', express.static('public'));

// 데이터베이스 연결 설정
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

let db;

// 데이터베이스 연결
async function connectDB() {
    try {
        if (process.env.DATABASE_URL) {
            db = new mysql.Client(process.env.DATABASE_URL);
        } else {
            db = new mysql.Client(dbConfig);
        }
        await db.connect();
        console.log('데이터베이스 연결 성공');
    } catch (error) {
        console.error('데이터베이스 연결 실패:', error);
        // 연결 실패해도 서버는 계속 실행
    }
}

// 사용자 인증 미들웨어
function requireAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: '로그인이 필요합니다.' });
    }
}

// API 라우트

// 로그인
app.post('/api/login', async (req, res) => {
    // 타임아웃 설정
    req.setTimeout(30000);
    res.setTimeout(30000);
    
    try {
        const { username, password } = req.body;
        
        // 데이터베이스 연결 확인
        if (!db) {
            return res.status(500).json({ error: '데이터베이스 연결이 없습니다.' });
        }
        
        const result = await db.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        const rows = result.rows;
        
        if (rows.length === 0) {
            return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
        }
        
        const user = rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
        }
        
        req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role
        };
        
        res.json({ 
            success: true, 
            user: req.session.user,
            redirect: user.role === 'admin' ? '/admin' : '/chat'
        });
        
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 회원가입
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, name, phone } = req.body;
        
        // 중복 사용자명 확인
        const existingUsers = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );
        
        if (existingUsers.rows.length > 0) {
            return res.status(400).json({ error: '이미 존재하는 사용자명입니다.' });
        }
        
        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 사용자 생성
        const result = await db.query(
            'INSERT INTO users (username, password, name, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [username, hashedPassword, name, phone, 'guest']
        );
        
        res.json({ success: true, message: '회원가입이 완료되었습니다.' });
        
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 로그아웃
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// 어드민 채팅방 목록
app.get('/api/admin/chatrooms', requireAuth, async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ error: '권한이 없습니다.' });
        }
        
        const result = await db.query(`
            SELECT c.*, u.name as guest_name, u.username as guest_username
            FROM chatrooms c
            LEFT JOIN users u ON c.guest_id = u.id
            WHERE c.admin_id = $1
            ORDER BY c.updated_at DESC
        `, [req.session.user.id]);
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('채팅방 목록 조회 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 게스트 채팅방 정보
app.get('/api/guest/chatroom', requireAuth, async (req, res) => {
    try {
        if (req.session.user.role !== 'guest') {
            return res.status(403).json({ error: '권한이 없습니다.' });
        }
        
        let result = await db.query(`
            SELECT c.*, u.name as admin_name
            FROM chatrooms c
            JOIN users u ON c.admin_id = u.id
            WHERE c.guest_id = $1
        `, [req.session.user.id]);
        let rows = result.rows;
        
        // 채팅방이 없으면 새로 생성
        if (rows.length === 0) {
            // 관리자 ID 찾기 (첫 번째 관리자)
            const adminResult = await db.query(
                'SELECT id FROM users WHERE role = $1 LIMIT 1',
                ['admin']
            );
            
            if (adminResult.rows.length === 0) {
                return res.status(500).json({ error: '관리자를 찾을 수 없습니다.' });
            }
            
            const adminId = adminResult.rows[0].id;
            
            // 새 채팅방 생성
            const createResult = await db.query(`
                INSERT INTO chatrooms (name, admin_id, guest_id) 
                VALUES ($1, $2, $3) 
                RETURNING *
            `, [`고객상담 ${req.session.user.name}`, adminId, req.session.user.id]);
            
            // 관리자 정보와 함께 반환
            const newChatroom = createResult.rows[0];
            const adminInfo = await db.query(
                'SELECT name FROM users WHERE id = $1',
                [adminId]
            );
            
            newChatroom.admin_name = adminInfo.rows[0].name;
            res.json(newChatroom);
        } else {
            res.json(rows[0]);
        }
        
    } catch (error) {
        console.error('채팅방 정보 조회 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 메시지 조회
app.get('/api/messages/:chatroomId', requireAuth, async (req, res) => {
    try {
        const { chatroomId } = req.params;
        
        // 채팅방 접근 권한 확인
        const chatroomResult = await db.query(
            'SELECT * FROM chatrooms WHERE id = $1 AND (admin_id = $2 OR guest_id = $3)',
            [chatroomId, req.session.user.id, req.session.user.id]
        );
        
        if (chatroomResult.rows.length === 0) {
            return res.status(403).json({ error: '채팅방에 접근할 권한이 없습니다.' });
        }
        
        const result = await db.query(`
            SELECT m.*, u.name as sender_name, u.role as sender_role
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.chatroom_id = $1
            ORDER BY m.created_at ASC
        `, [chatroomId]);
        const rows = result.rows;
        
        res.json(rows);
        
    } catch (error) {
        console.error('메시지 조회 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 페이지 라우트 - 기본 경로로 설정
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', requireAuth, (req, res) => {
    if (req.session.user.role !== 'admin') {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/chat', requireAuth, (req, res) => {
    if (req.session.user.role !== 'guest') {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Socket.io 연결 처리
io.on('connection', (socket) => {
    console.log('✅ 사용자 연결:', socket.id);
    
    // 연결 확인 이벤트
    socket.emit('connected', { message: '서버에 연결되었습니다.' });
    
    // 채팅방 입장
    socket.on('join-room', (chatroomId) => {
        socket.join(chatroomId);
        console.log(`✅ 사용자 ${socket.id}가 채팅방 ${chatroomId}에 입장했습니다.`);
        socket.emit('room-joined', { chatroomId, message: '채팅방에 입장했습니다.' });
    });
    
    // 메시지 전송
    socket.on('send-message', async (data) => {
        try {
            console.log('📨 메시지 전송 요청:', data);
            const { chatroomId, message, senderId } = data;
            
            if (!chatroomId || !message || !senderId) {
                throw new Error('필수 데이터가 누락되었습니다.');
            }
            
            // 메시지 저장
            const result = await db.query(
                'INSERT INTO messages (chatroom_id, sender_id, message) VALUES ($1, $2, $3) RETURNING id',
                [chatroomId, senderId, message]
            );
            
            // 메시지 정보 조회
            const messageResult = await db.query(`
                SELECT m.*, u.name as sender_name, u.role as sender_role
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.id = $1
            `, [result.rows[0].id]);
            const rows = messageResult.rows;
            
            if (rows.length === 0) {
                throw new Error('메시지 조회에 실패했습니다.');
            }
            
            // 채팅방 업데이트 시간 갱신
            await db.query(
                'UPDATE chatrooms SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [chatroomId]
            );
            
            console.log('✅ 메시지 저장 완료:', rows[0]);
            
            // 채팅방의 모든 사용자에게 메시지 전송
            io.to(chatroomId).emit('receive-message', rows[0]);
            console.log(`📤 채팅방 ${chatroomId}에 메시지 전송 완료`);
            
            // 관리자에게 채팅방 목록 업데이트 알림
            io.emit('chatroom-updated', { chatroomId });
            console.log('🔄 관리자에게 채팅방 업데이트 알림 전송');
            
        } catch (error) {
            console.error('❌ 메시지 전송 오류:', error);
            socket.emit('error', { message: '메시지 전송에 실패했습니다: ' + error.message });
        }
    });
    
    // 연결 해제
    socket.on('disconnect', () => {
        console.log('사용자 연결 해제:', socket.id);
    });
});

// 서버 시작
const PORT = process.env.PORT || 3000;

// Vercel 환경 확인
if (process.env.VERCEL) {
    // Vercel 환경에서는 데이터베이스 연결만 수행
    setTimeout(async () => {
        await connectDB();
    }, 1000);
} else {
    // 로컬 환경에서는 서버 시작
    server.listen(PORT, '0.0.0.0', async () => {
        console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
        setTimeout(async () => {
            await connectDB();
        }, 1000);
    });
}

// Vercel을 위한 export
module.exports = app;
