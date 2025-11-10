// typing_site_v_3_content.js
export const PRELOAD_TXT = {
  enabled: true,
  files: [
    { name: 'kor_eng_1.txt', text: `정보의 양이 폭발적으로 증가하는 시대에는 읽고 쓰는 속도 자체가 학습 효율을 좌우합니다.

Keep practicing typing so that your hands can follow your thoughts. 꾸준한 연습은 긴 글을 읽고 요약하거나, 근거를 들어 설명하는 과정을 훨씬 수월하게 만들어 줍니다.` },
    { name: 'kor_eng_2.txt', text: `In an increasingly interconnected world, learning to type accurately and efficiently remains a foundational skill for students.

긴 글에서 핵심을 파악하고 구조화하여 표현하는 능력은 교과 전반의 이해도를 높입니다. With deliberate practice, you can focus on ideas rather than the keyboard.` }
  ]
};

export function parseTxt(raw){
  const paragraphs = raw.replace(/\r\n/g,'\n').split(/\n{2,}/).map(s=>s.trim()).filter(s=>s.length>=120 && s.length<=4000).slice(0,2000);
  const words = raw.replace(/\u3000/g,' ').split(/[^\p{L}\p{N}_]+/u).map(w=>w.trim()).filter(w=>w.length>=1 && w.length<=24).slice(0,40000);
  return { paragraphs, words };
}

export function buildFromPreload(preload=PRELOAD_TXT){
  if (!preload?.enabled || !preload.files?.length) return null;
  let paragraphs=[], words=[];
  for (const f of preload.files){
    const sets = parseTxt(f.text);
    paragraphs = paragraphs.concat(sets.paragraphs);
    words = words.concat(sets.words);
  }
  return { paragraphs: Array.from(new Set(paragraphs)), words: Array.from(new Set(words)) };
}
