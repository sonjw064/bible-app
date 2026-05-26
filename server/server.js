const express = require('express');
const mysql   = require('mysql2/promise');
const app     = express();

app.use(express.json());

// 웹 앱에서 서버로 접근 허용 (CORS)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// ── DB 연결 ────────────────────────────────
const db = mysql.createPool({
  host:     'localhost',
  user:     'root',
  password: 'sk13207q!',       // 본인 MySQL 비밀번호
  database: 'bible_db',
  charset:  'utf8mb4',
});

// ── API 1 : 단일 절 조회 ───────────────────
// 예: /verse?book=요한복음&chapter=3&verse=16&version=개역한글
app.get('/verse', async (req, res) => {
  const { book, chapter, verse, version = '개역한글' } = req.query;
  const [[row]] = await db.execute(
    `SELECT b.korean, v.chapter, v.verse, v.content
     FROM verses v
     JOIN books b ON b.id = v.book_id
     WHERE b.korean = ? AND v.chapter = ? AND v.verse = ? AND v.version = ?`,
    [book, chapter, verse, version]
  );
  if (!row) return res.status(404).json({ error: '구절 없음' });
  res.json(row);
});

// ── API 2 : 절 범위 조회 ───────────────────
// 예: /range?book=마태복음&chapter=5&from=3&to=12&version=개역한글
app.get('/range', async (req, res) => {
  const { book, chapter, from, to, version = '개역한글' } = req.query;
  const [rows] = await db.execute(
    `SELECT v.verse, v.content
     FROM verses v
     JOIN books b ON b.id = v.book_id
     WHERE b.korean = ? AND v.chapter = ?
       AND v.verse BETWEEN ? AND ?
       AND v.version = ?
     ORDER BY v.verse`,
    [book, chapter, from, to, version]
  );
  res.json(rows);
});

// ── API 3 : 장 전체 조회 ───────────────────
// 예: /chapter?book=시편&chapter=23&version=개역한글
app.get('/chapter', async (req, res) => {
  const { book, chapter, version = '개역한글' } = req.query;
  const [rows] = await db.execute(
    `SELECT v.verse, v.content
     FROM verses v
     JOIN books b ON b.id = v.book_id
     WHERE b.korean = ? AND v.chapter = ? AND v.version = ?
     ORDER BY v.verse`,
    [book, chapter, version]
  );
  res.json(rows);
});

// ── API 4 : 책 목록 조회 ───────────────────
// 예: /books
app.get('/books', async (req, res) => {
  const [rows] = await db.execute(
    'SELECT id, korean, english, testament FROM books ORDER BY id'
  );
  res.json(rows);
});

// ── 서버 시작 ──────────────────────────────
app.listen(3000, () => {
  console.log('✅ 서버 실행 중 → http://localhost:3000');
});