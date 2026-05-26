const mysql = require('mysql2/promise');
const fs    = require('fs');

// ── 1. JSON 파일 읽기 ──────────────────────
const data = JSON.parse(fs.readFileSync('./bible.json', 'utf8'));

// ── 2. DB 연결 설정 ────────────────────────
const db = mysql.createPool({
  host:     'localhost',
  user:     'root',         // MySQL 아이디
  password: 'sk13207q!',             // MySQL 비밀번호 (없으면 빈칸)
  database: 'bible_db',
  charset:  'utf8mb4',
});

// ── 3. DB에 넣기 ───────────────────────────
async function importData() {
  console.log('시작...');

  for (const book of data) {
    // 책 insert
    const [bookResult] = await db.execute(
      'INSERT IGNORE INTO books (korean, english, testament) VALUES (?, ?, ?)',
      [book.korean, book.english, book.testament]
    );

    // book_id 가져오기
    const [[row]] = await db.execute(
      'SELECT id FROM books WHERE korean = ?',
      [book.korean]
    );
    const bookId = row.id;

    console.log(`📖 ${book.korean} 넣는 중...`);

    // 구절 insert
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        await db.execute(
          'INSERT IGNORE INTO verses (book_id, chapter, verse, content) VALUES (?, ?, ?, ?)',
          [bookId, parseInt(verse.chapterNum), parseInt(verse.verseNum), verse.verse]
        );
      }
    }
  }

  console.log('✅ 완료!');
  process.exit();
}

importData().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});