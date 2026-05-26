const mysql = require('mysql2/promise');
const fs    = require('fs');

// ── 1. JSON 파일 읽기 ──────────────────────
const data = JSON.parse(fs.readFileSync('./bible_old.json', 'utf8'));

// ── 2. 약어 → 전체 이름 변환 테이블 ──────────
const BOOK_MAP = {
  '창':'창세기', '출':'출애굽기', '레':'레위기', '민':'민수기', '신':'신명기',
  '수':'여호수아', '삿':'사사기', '룻':'룻기', '삼상':'사무엘상', '삼하':'사무엘하',
  '왕상':'열왕기상', '왕하':'열왕기하', '대상':'역대상', '대하':'역대하',
  '스':'에스라', '느':'느헤미야', '에':'에스더', '욥':'욥기', '시':'시편',
  '잠':'잠언', '전':'전도서', '아':'아가', '사':'이사야', '렘':'예레미야',
  '애':'예레미야애가', '겔':'에스겔', '단':'다니엘', '호':'호세아', '욜':'요엘',
  '암':'아모스', '옵':'오바댜', '욘':'요나', '미':'미가', '나':'나훔',
  '합':'하박국', '습':'스바냐', '학':'학개', '슥':'스가랴', '말':'말라기',
  '마':'마태복음', '막':'마가복음', '눅':'누가복음', '요':'요한복음',
  '행':'사도행전', '롬':'로마서', '고전':'고린도전서', '고후':'고린도후서',
  '갈':'갈라디아서', '엡':'에베소서', '빌':'빌립보서', '골':'골로새서',
  '살전':'데살로니가전서', '살후':'데살로니가후서', '딤전':'디모데전서',
  '딤후':'디모데후서', '딛':'디도서', '몬':'빌레몬서', '히':'히브리서',
  '약':'야고보서', '벧전':'베드로전서', '벧후':'베드로후서', '요일':'요한일서',
  '요이':'요한이서', '요삼':'요한삼서', '유':'유다서', '계':'요한계시록',
};

// ── 3. DB 연결 ─────────────────────────────
const db = mysql.createPool({
  host:     'localhost',
  user:     'root',
  password: 'sk13207q!',             // 본인 비밀번호 입력
  database: 'bible_db',
  charset:  'utf8mb4',
});

// ── 4. 키 파싱 ("창1:1" → 책이름, 장, 절) ───
function parseKey(key) {
  // 절 범위 처리 (예: 창1:1-2 → 1절로 저장)
  const cleaned = key.replace(/-\d+$/, '');

  const m = cleaned.match(/^([a-zA-Z가-힣]+)(\d+):(\d+)$/);
  if (!m) return null;
  const abbr    = m[1];
  const chapter = parseInt(m[2]);
  const verse   = parseInt(m[3]);
  const korean  = BOOK_MAP[abbr];
  if (!korean) return null;
  return { korean, chapter, verse };
}

// ── 5. DB에 넣기 ───────────────────────────
async function importData() {
  console.log('시작...');

  let count = 0;
  let failList = [];
  let currentBook = '';

  for (const [key, content] of Object.entries(data)) {
    const parsed = parseKey(key);
    if (!parsed) {
      failList.push(key);
      continue;
    }

    const { korean, chapter, verse } = parsed;

    // 책 이름 바뀔 때 로그
    if (korean !== currentBook) {
      currentBook = korean;
      console.log(`📖 ${korean} 넣는 중...`);
    }

    // book_id 가져오기
    const [[row]] = await db.execute(
      'SELECT id FROM books WHERE korean = ?',
      [korean]
    );
    if (!row) {
      console.log(`⚠️ DB에 책 없음: ${korean}`);
      continue;
    }

    // 구절 insert
    await db.execute(
      `INSERT IGNORE INTO verses (book_id, chapter, verse, content, version)
       VALUES (?, ?, ?, ?, '개역한글')`,
      [row.id, chapter, verse, content.trim()]
    );

    count++;
  }

  console.log(`✅ 완료! 총 ${count}절 추가됨`);
  console.log(`⚠️ 파싱 실패 목록 (${failList.length}개):`);
  failList.forEach(k => console.log(' -', k));
  process.exit();
}

importData().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});