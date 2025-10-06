const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Client } = require('pg');
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
        methods: ["GET", "POST"]
    }
});

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 세션 설정
app.use(session({
    secret: 'chatweb-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// 데이터베이스 연결
let db;

async function connectDB() {
    try {
        if (process.env.DATABASE_URL) {
            db = new Client({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });
        } else {
            db = new Client({
                host: 'localhost',
                user: 'postgres',
                password: 'password',
                database: 'chatweb',
                port: 5432
            });
        }
        await db.connect();
        console.log('데이터베이스 연결 성공');
    } catch (error) {
        console.error('데이터베이스 연결 실패:', error);
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
    try {
        const { username, password } = req.body;
        
        if (!db) {
            return res.status(500).json({ error: '데이터베이스 연결이 없습니다.' });
        }
        
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
        }
        
        const user = result.rows[0];
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
        
        if (!db) {
            return res.status(500).json({ error: '데이터베이스 연결이 없습니다.' });
        }
        
        const existingUsers = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        
        if (existingUsers.rows.length > 0) {
            return res.status(400).json({ error: '이미 존재하는 사용자명입니다.' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await db.query(
            'INSERT INTO users (username, password, name, phone, role) VALUES ($1, $2, $3, $4, $5)',
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

// 페이지 라우트
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
    console.log('사용자 연결:', socket.id);
    
    socket.on('join-room', (chatroomId) => {
        socket.join(chatroomId);
        console.log(`사용자 ${socket.id}가 채팅방 ${chatroomId}에 입장했습니다.`);
    });
    
    socket.on('send-message', async (data) => {
        try {
            const { chatroomId, message, senderId } = data;
            
            if (!db) {
                socket.emit('error', { message: '데이터베이스 연결이 없습니다.' });
                return;
            }
            
            const result = await db.query(
                'INSERT INTO messages (chatroom_id, sender_id, message) VALUES ($1, $2, $3) RETURNING id',
                [chatroomId, senderId, message]
            );
            
            const messageResult = await db.query(`
                SELECT m.*, u.name as sender_name, u.role as sender_role
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.id = $1
            `, [result.rows[0].id]);
            
            io.to(chatroomId).emit('receive-message', messageResult.rows[0]);
            
        } catch (error) {
            console.error('메시지 전송 오류:', error);
            socket.emit('error', { message: '메시지 전송에 실패했습니다.' });
        }
    });
    
    socket.on('disconnect', () => {
        console.log('사용자 연결 해제:', socket.id);
    });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    // 데이터베이스 연결을 백그라운드에서 처리
    setTimeout(connectDB, 2000);
});
