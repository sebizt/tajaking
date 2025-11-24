// typing_site_v_3_content.js
export const PRELOAD_TXT = {
  enabled: true,
  files: [
    {name: 'kor_eng_1.txt', 
  text: `Indeed, the taxi driver and the construction worker are willing to accept money as payment only because a network of other agents is committed to taking various measures to sustain the currency in question. +{^o_<^)= 月 Ii11li|Il| Moreover, commitments make people willing to perform actions that they would not otherwise perform. 사실, 택시 기사와 건설 노동자가 돈을 보수로 기꺼이 받아들이는 것은 오로지 다른 주체들의 네트워크가 해당 통화를 유지하기 위한 다양한 조치를 취할 것을 약속했기 때문이다. 게다가, 약속은 사람들이 그렇지 않으면 수행하지 않을 행동을 기꺼이 수행하도록 만든다.` },
  {name: 'kor_eng_2.txt', 
  text: `사실, 택시 기사와 건설 노동자가 돈을 보수로 기꺼이 받아들이는 것은 오로지 다른 주체들의 네트워크가 해당 통화를 유지하기 위한 다양한 조치를 취할 것을 약속했기 때문이다. 게다가, 약속은 사람들이 그렇지 않으면 수행하지 않을 행동을 기꺼이 수행하도록 만든다. Ii11li|Il| 火 +{^o_<^)= Indeed, the taxi driver and the construction worker are willing to accept money as payment only because a network of other agents is committed to taking various measures to sustain the currency in question. Moreover, commitments make people willing to perform actions that they would not otherwise perform.` }
  ]
};

export function parseTxt(raw){
  const paragraphs = raw.replace(/\r\n/g,'\n').split(/\n{2,}/).map(s=>s.trim()).filter(s=>s.length>=120 && s.length<=4000).slice(0,2000);
  const words = [

  '月火水', '木金土日',
  'lIi11|!iIl', ':):-):(;^)',
  'practice', '연습',
  'typing', '타자왕이될거야',   // 대응 한국어가 없어서 기본 번역으로 넣음
  '속도', 'speeEeeeEed',
  '인공지능', 'ArtificialIntelligence',
  '선생님', 'teacher',
  'cheonanohsunghighschool', '천안오성고등학교',
  'focus', '집중하세욧',
  '▷쌤jaja.왕', '너두타자king◀'


  ];
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
