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

// (상단 import/유틸/ensureUser 등 기존 코드 유지)

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

// ===== 점수 제출 관련 (Firebase만 사용) =====
let soloSubmitted = false;

function getUser() {
  const u = JSON.parse(localStorage.getItem('typing_user_v9') || localStorage.getItem('typing_user_v3') || 'null');
  return u && u.id && u.name ? u : { id: 'unknown', name: 'unknown' };
}

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
      console.log('[submit] Firebase 저장 완료');
    } catch (e) {
      console.error('[submit] Firebase 저장 실패', e);
      alert('점수 저장에 실패했습니다. firebase_init.js가 올바르게 연결되었는지 확인하세요.');
    }
  } else {
    alert('데이터 저장 준비가 안 되었습니다. firebase_init.js 로드 여부를 확인하세요.');
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

// 버튼 이벤트
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
