// typing_site_v_3_practice.js
import { PRELOAD_TXT, buildFromPreload } from './typing_site_v_3_content.js';

const USER_KEY = 'typing_user_v3';
const DATA_KEY = 'typing_uploaded_txt_v3';

const $ = (s)=>document.querySelector(s);
const pad2=(n)=>n<10?'0'+n:String(n);

(function ensurePreload(){
  if (localStorage.getItem(DATA_KEY)) return;
  const built = buildFromPreload(PRELOAD_TXT);
  if (built) localStorage.setItem(DATA_KEY, JSON.stringify(built));
})();

// ---------- 단어 풀 (영–한 짝 단위) ----------
function getWordPool() {
  // DATA_KEY = 'typing_uploaded_txt_v3'
  const up = JSON.parse(localStorage.getItem(DATA_KEY) || 'null');
  if (up?.words?.length) return up.words;

  // ✅ 업로드된 단어가 없을 때 기본 단어들 (영–한 짝 순서)
  return [
    'apple','사과',
    'banana','바나나',
    'practice','연습',
    'typing','타이핑',
    'speed','속도',
    'accuracy','정확도',
    'keyboard','키보드',
    'idea','아이디어',
    'focus','집중',
    'evidence','근거'
  ];
}

// ✅ 항상 "페어" 단위로 섞어서 N세트 반환
function makeRandomWordStream(pairCount = 5) {
  const raw = getWordPool();
  const pairs = [];

  // raw: [en,ko,en,ko,...] → [{en,ko}, ...]
  for (let i = 0; i < raw.length - 1; i += 2) {
    pairs.push({ en: raw[i], ko: raw[i + 1] });
  }

  // 페어 단위 셔플
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  return pairs.slice(0, pairCount);   // 세트 개수
}

// ---------- 모드 적용 (혼자/함께) ----------
(function applyMode(){
  const $ = (s)=>document.querySelector(s);
  const userInfoLabel = $('#userInfoLabel');
  const soloSection = $('#soloSection');
  const togetherSection = $('#togetherSection');

  const params = new URLSearchParams(location.search);
  const mode = (params.get('mode') || 'solo').toLowerCase(); // 'solo' | 'together'
  const teacher = (params.get('teacher') || '').trim();

  document.body.classList.remove('mode-solo', 'mode-together');
  document.body.classList.add(mode === 'together' ? 'mode-together' : 'mode-solo');

  const user = JSON.parse(localStorage.getItem('typing_user_v9') || 'null');
  if (userInfoLabel && user){
    userInfoLabel.textContent = mode === 'together'
      ? `👤 ${user.id} ${user.name} · 🧑‍🏫 ${teacher || '선생님'}`
      : `👤 ${user.id} ${user.name}`;
  }

  if (mode === 'together'){
    if (soloSection) soloSection.style.display = 'none';
    if (togetherSection) togetherSection.style.display = '';
  } else {
    if (soloSection) soloSection.style.display = '';
    if (togetherSection) togetherSection.style.display = 'none';
  }
})();

// ---------- 긴 글(혼자하기) ----------
function getParagraphPool(){
  const up = JSON.parse(localStorage.getItem(DATA_KEY) || 'null');
  if (up?.paragraphs?.length) return up.paragraphs;
  return ['관리자 자료가 없습니다. content.js를 확인하세요.'];
}

const SOLO_LIMIT_SEC = 10*60;
let soloText=''; let soloStartTs=0; let soloTimer=0; let soloKeystrokes=0; let soloRemainSec=SOLO_LIMIT_SEC;

const soloTextEl=$('#soloText'), soloInput=$('#soloInput'), soloNew=$('#soloNew'), soloStart=$('#soloStart');
const soloProgress=$('#soloProgress'), soloAccuracy=$('#soloAccuracy'), soloWpm=$('#soloWpm'), soloCpm=$('#soloCpm'), soloTime=$('#soloTime'), soloRemain=$('#soloRemain');
const soloKeystrokesEl = document.querySelector('#soloKeystrokes') || null;

function escapeHtml(s){return (s||'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderDecorated(){
  if (!soloStartTs){ soloTextEl.textContent='시작 버튼을 누르면 지문이 표시됩니다.'; return; }
  const target=soloText||''; const typed=soloInput.value||''; let html=''; const len=target.length; const tLen=typed.length;
  for (let i=0;i<len;i++){
    const t=target[i]; const u=typed[i]??'';
    if (i<tLen){ html += (u===t) ? `<span class="mark-correct">${escapeHtml(t)}</span>` : `<span class="mark-wrong">${escapeHtml(t)}</span>`; }
    else if (i===tLen){ html += `<span class="mark-next">${escapeHtml(t)}</span>`; }
    else { html += `<span>${escapeHtml(t)}</span>`; }
  }
  soloTextEl.innerHTML = html;
}

function updateSoloStats(){
  const typed=soloInput.value; const total=soloText.length; let correct=0;
  for (let i=0;i<typed.length && i<total;i++){ if (typed[i]===soloText[i]) correct++; }
  const progress=Math.min(typed.length/Math.max(1,total),1); const accuracy=typed.length?Math.round((correct/typed.length)*100):100;
  soloProgress.textContent=Math.round(progress*100)+'%'; soloAccuracy.textContent=accuracy+'%';
  const elapsed=soloStartTs?Math.max(0,Math.floor((Date.now()-soloStartTs)/1000)):0;
  soloTime.textContent=`${pad2(Math.floor(elapsed/60))}:${pad2(elapsed%60)}`;
  soloRemain.textContent=`${pad2(Math.floor(soloRemainSec/60))}:${pad2(soloRemainSec%60)}`;
  const wpm=elapsed>0?Math.round(((typed.length)/5)/(elapsed/60)):0; soloWpm.textContent=isFinite(wpm)?wpm:0;
  const cpm=elapsed>0?Math.round(soloKeystrokes/(elapsed/60)):0; soloCpm.textContent=isFinite(cpm)?cpm:0;
  if (soloKeystrokesEl) soloKeystrokesEl.textContent = String(soloKeystrokes);
  if (typed.length>=total && typed===soloText){
    soloInput.disabled = true;
    clearInterval(soloTimer);
    submitSoloScore(); // 완주 시 제출
  }
}

// ===== 공통: 유저 정보 =====
function getUser() {
  const u = JSON.parse(localStorage.getItem('typing_user_v9') || localStorage.getItem('typing_user_v3') || 'null');
  return u && u.id && u.name ? u : { id: 'unknown', name: 'unknown' };
}

// ===== 혼자하기 점수 제출 =====
let soloSubmitted = false;

async function submitSoloScore() {
  if (soloSubmitted) return;
  soloSubmitted = true;

  const user = getUser();
  const typed = soloInput.value || '';
  const total = soloText.length;
  let correct = 0;
  for (let i = 0; i < typed.length && i < total; i++) {
    if (typed[i] === soloText[i]) correct++;
  }

  const elapsed = soloStartTs ? Math.max(1, Math.floor((Date.now() - soloStartTs) / 1000)) : 1;
  const wpm = Math.round(((typed.length) / 5) / (elapsed / 60));
  const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 100;

  if (window.TypingAPI && typeof window.TypingAPI.submitScore === 'function') {
    try {
      await window.TypingAPI.submitScore({
        sid: user.id,
        sname: user.name,
        mode: 'solo',
        wpm,
        accuracy,
        time_sec: elapsed
      });
      console.log('[solo] Firebase 저장 완료');
    } catch (e) {
      console.error('[solo] Firebase 저장 실패', e);
      alert('점수 저장에 실패했습니다. firebase_init.js가 올바르게 연결되었는지 확인하세요.');
    }
  } else {
    console.warn('[solo] TypingAPI.submitScore 없음');
  }
}

function pickSolo(){
  const pool=getParagraphPool();
  soloText = pool[Math.floor(Math.random()*pool.length)] || '자료 없음';
  soloTextEl.textContent='시작 버튼을 누르면 지문이 표시됩니다.';
  soloInput.value=''; soloKeystrokes=0; soloInput.disabled=true; clearInterval(soloTimer);
  soloStartTs=0; soloRemainSec=SOLO_LIMIT_SEC; updateSoloStats();
  soloSubmitted = false; // 새 라운드에서 다시 제출 가능
}

// ------------------------ 함께하기(단어) 모드 ------------------------
const tgReady  = document.querySelector('#tgReady');
const tgStart  = document.querySelector('#tgStart');
const tgInput  = document.querySelector('#tgInput');
const wordStream = document.querySelector('#wordStream');
const tgCorrect = document.querySelector('#tgCorrect');
const tgWrong   = document.querySelector('#tgWrong');
const tgWpm     = document.querySelector('#tgWpm');
const tgTime    = document.querySelector('#tgTime');
const limitSec  = document.querySelector('#limitSec');

let stream = [];        // [{en,ko}, ...]
let streamIdx = 0;      // 현재 세트 인덱스
let phase = 0;          // 0: 영어 입력 단계, 1: 한국어 입력 단계

let tgTimer = 0;
let tgRemain = 0;
let tgCorrectN = 0;
let tgWrongN = 0;
let tgStartTs = 0;
let tgStarted = false;
let tgKeystrokes = 0;
let tgSubmitted = false; // ✅ 함께하기 점수 중복저장 방지

function renderStream() {
  if (!tgStarted) {
    wordStream.textContent = '시작을 누르면 단어 세트가 보입니다.';
    return;
  }
  if (!stream.length || streamIdx >= stream.length) {
    wordStream.innerHTML = '<span class="muted">🎉 모든 세트를 완료했습니다!</span>';
    return;
  }

  const cur = stream[streamIdx];   // {en, ko}
  const phaseLabel = phase === 0 ? '학생 먼저 ! (영어)' : '교사 먼저 ! (한국어)';

wordStream.innerHTML = `
  <div style="margin-bottom:8px; text-align:center;">
    <div class="muted" style="margin-top:4px; font-size:1.2rem;">
      ${phaseLabel}
    </div>
    <div style="font-size:2.4rem; font-weight:800;">
      ${cur.en} / ${cur.ko}
    </div>
  </div>
`;

}

function updateTgStats() {
  const sec = tgStarted ? Math.max(1, (Date.now() - tgStartTs) / 1000) : 1;
  const wpmVal = Math.round(tgCorrectN / (sec / 60));           // 세트 기준 WPM
  const cpmVal = Math.round(tgKeystrokes / (sec / 60));         // 키 입력/분
  const left = Math.max(0, tgRemain);
  tgTime.textContent = `${pad2(Math.floor(left/60))}:${pad2(left%60)}`;
  tgWpm.textContent = `${wpmVal} / ${cpmVal}타`;
}

// ✅ 함께하기 점수 제출
async function submitTogetherScore(reason = 'done') {
  if (tgSubmitted) return;
  tgSubmitted = true;

  const user = getUser();
  const elapsed = tgStartTs ? Math.max(1, Math.floor((Date.now() - tgStartTs) / 1000)) : 1;
  const totalAttempts = tgCorrectN + tgWrongN;
  const accuracy = totalAttempts ? Math.round((tgCorrectN / totalAttempts) * 100) : 100;
  const wpm = Math.round(tgCorrectN / (elapsed / 60));  // "정답 세트/분" 기준

  if (window.TypingAPI && typeof window.TypingAPI.submitScore === 'function') {
    try {
      await window.TypingAPI.submitScore({
        sid: user.id,
        sname: user.pair,
        mode: 'together',   // 🔹 리더보드에서 함께하기 모드로 구분할 값
        wpm,
        accuracy,
        time_sec: elapsed,
        reason               // 선택사항: 'done' | 'time' 같은 메타정보
      });
      console.log('[together] Firebase 저장 완료');
    } catch (e) {
      console.error('[together] Firebase 저장 실패', e);
      alert('함께하기 점수 저장에 실패했습니다. firebase_init.js와 TypingAPI 설정을 확인하세요.');
    }
  } else {
    console.warn('[together] TypingAPI.submitScore 없음');
  }
}

function tickTogether() {
  tgRemain--;
  updateTgStats();
  if (tgRemain <= 0) {
    clearInterval(tgTimer);
    tgStarted = false;
    tgInput.disabled = true;
    wordStream.innerHTML = '<span class="muted">⏰ 시간이 종료되었습니다.</span>';
    submitTogetherScore('time');      // ⏰ 시간 종료 시 점수 저장
  }
}

// 단어 세트 불러오기 버튼
if (tgReady) {
  tgReady.addEventListener('click', () => {
    stream = makeRandomWordStream(5);  // 👉 세트 개수 (원하면 10으로 늘려도 됨)
    streamIdx = 0;
    phase = 0;
    tgCorrectN = 0;
    tgWrongN = 0;
    tgKeystrokes = 0;
    tgCorrect.textContent = '0';
    tgWrong.textContent = '0';
    tgWpm.textContent = '0';
    tgTime.textContent = '00:00';
    tgInput.value = '';
    tgInput.disabled = true;
    tgStarted = false;
    tgSubmitted = false;              // 새 라운드 시작이므로 초기화
    wordStream.textContent = '시작을 누르면 단어 세트가 보입니다.';
  });
}

// 시작 버튼
if (tgStart) {
  tgStart.addEventListener('click', () => {
    if (!stream.length) {
      stream = makeRandomWordStream(10);
    }
    tgRemain = parseInt((limitSec && limitSec.value) || '60', 10) || 60;
    tgStartTs = Date.now();
    tgKeystrokes = 0;
    tgStarted = true;
    tgInput.disabled = false;
    tgInput.value = '';
    tgInput.focus();
    clearInterval(tgTimer);
    tgTimer = setInterval(tickTogether, 1000);
    phase = 0;   // 항상 영어부터
    tgSubmitted = false;
    renderStream();
    updateTgStats();
  });
}

// 입력 이벤트
if (tgInput) {
  tgInput.addEventListener('keydown', (e) => {
    // 키 입력 수 집계
    if (e.key.length === 1 || ['Backspace','Space','Enter','Tab'].includes(e.key)) {
      tgKeystrokes++;
      updateTgStats();
    }

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!tgStarted) return;
      if (!stream.length || streamIdx >= stream.length) return;

      const cur = stream[streamIdx]; // {en, ko}
      const attempt = (tgInput.value || '').trim();
      if (!attempt) return;

      const expected = phase === 0 ? (cur.en || '') : (cur.ko || '');
      let isCorrect;

      // 영어일 때는 대소문자 무시, 한국어는 그대로 비교
      if (/^[A-Za-z]/.test(expected)) {
        isCorrect = attempt.toLowerCase() === expected.toLowerCase();
      } else {
        isCorrect = attempt === expected;
      }

      if (isCorrect) {
        tgCorrectN++;
        tgCorrect.textContent = String(tgCorrectN);
      } else {
        tgWrongN++;
        tgWrong.textContent = String(tgWrongN);
      }

      tgInput.value = '';

      // ⚡ phase: 0 → 1 (영→한), 1 → 다음 세트
      if (phase === 0) {
        phase = 1;          // 이제 한국어 입력 단계
        renderStream();
      } else {
        phase = 0;          // 다시 영어 단계로 리셋
        streamIdx++;        // 다음 세트로 이동

        if (streamIdx >= stream.length) {
          tgStarted = false;
          clearInterval(tgTimer);
          tgInput.disabled = true;
          wordStream.innerHTML = '<span class="muted">🎉 모든 세트를 완료했습니다!</span>';
          submitTogetherScore('done');   // 🎉 세트 완주 시 점수 저장
        } else {
          renderStream();
        }
      }

      updateTgStats();
    }
  });
}

// ---------- 혼자하기 버튼 이벤트 ----------
soloNew.addEventListener('click', pickSolo);
soloStart.addEventListener('click', ()=>{
  if (!soloText) pickSolo();
  soloInput.disabled=false; soloInput.focus(); soloStartTs=Date.now(); clearInterval(soloTimer); renderDecorated();
  soloTimer=setInterval(()=>{
    if (soloRemainSec>0) soloRemainSec--;
    updateSoloStats(); renderDecorated();
    if (soloRemainSec<=0){
      clearInterval(soloTimer);
      soloInput.disabled=true;
      submitSoloScore(); // 시간 종료 시 제출
    }
  },1000);
});
soloInput.addEventListener('input', ()=>{ updateSoloStats(); renderDecorated(); });
soloInput.addEventListener('keydown', (e)=>{ if (e.key.length===1 || ['Backspace','Space','Enter','Tab'].includes(e.key)) soloKeystrokes++; });

// 첫 로드 시 한 번 준비
pickSolo();
