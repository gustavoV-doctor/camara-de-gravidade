export const KEY = 'camara-gravidade-v1';
export const LEVELS = [
  [6,120,120],[6,150,120],[6,180,120],[5,240,120],[4,300,120],
  [3,420,120],[3,480,120],[2,720,120],[1,1200,0],[1,1500,0],[1,1800,0]
];
const ex = (id,name,reps,rest,cue,alt) => ({id,name,reps,rest,cue,alt});
export const PLAN = [
  {id:'strength-a',short:'Força A',name:'Construa sua base.',type:'strength',tag:'CORPO INTEIRO',minutes:'45–55',icon:'↗',desc:'Pernas, peito e costas. Um exercício por vez, com atenção em cada repetição.',exercises:[
    ex('legpress','Leg press horizontal','8–12',120,'Pés firmes, amplitude confortável e lombar apoiada. Não trave os joelhos.','Agachamento no Smith, com travas'),
    ex('chest','Supino no Smith','8–12',120,'Use travas e ajuste o banco. Controle a descida, sem buscar falha sozinho.','Supino com halteres ou chest press'),
    ex('row','Remada na polia','10–12',90,'Tronco estável. Puxe com os cotovelos sem embalar o corpo.','Remada unilateral com halter'),
    ex('curlleg','Cadeira flexora','10–15',75,'Ajuste o eixo no joelho e mantenha o quadril apoiado.','Flexão de joelhos em outra máquina'),
    ex('triceps','Tríceps na polia','10–15',60,'Cotovelos junto ao corpo. Movimento controlado e sem balanço.','Extensão de tríceps com halter')
  ]},
  {id:'run-a',short:'Corrida A',name:'Encontre seu ritmo.',type:'run',tag:'BASE AERÓBICA',minutes:'34–40',icon:'≈',desc:'Trote e caminhada na esteira. Termine com a sensação de que conseguiria um pouco mais.'},
  {id:'strength-b',short:'Força B',name:'Força em equilíbrio.',type:'strength',tag:'CORPO INTEIRO',minutes:'45–55',icon:'↗',desc:'Outra exposição de corpo inteiro. Técnica estável, carga honesta e descanso completo.',exercises:[
    ex('squat','Agachamento no Smith','8–12',120,'Ajuste as travas. Desça somente até onde mantém controle e conforto.','Leg press horizontal'),
    ex('pulldown','Puxada na polia alta','8–12',90,'Puxe à frente do corpo, sem levar a barra atrás da nuca.','Puxada com outra pegada confortável'),
    ex('incline','Supino inclinado com halteres','8–12',120,'Banco levemente inclinado, punhos alinhados e pés apoiados.','Supino inclinado no Smith com travas'),
    ex('hip','Elevação pélvica','10–15',90,'Pode começar no chão com halter. Suba pelo quadril sem hiperestender a lombar.','Cadeira flexora'),
    ex('biceps','Rosca na polia','10–15',60,'Mantenha os cotovelos estáveis e controle a descida.','Rosca com halteres')
  ]},
  {id:'run-b',short:'Corrida B',name:'Repita. Evolua.',type:'run',tag:'CONSISTÊNCIA',minutes:'34–40',icon:'≈',desc:'Repita o nível com qualidade. Evolução vem de duas boas sessões, não de um teste de limite.'}
];
export function initialState(){return {version:1,cursor:0,level:0,history:[],active:null,settings:{name:'',sound:false}};}
export function phases(level){
  const [rounds,run,walk]=LEVELS[level];
  const list=[{label:'Aquecimento',detail:'Caminhada confortável · aumente gradualmente',seconds:300,kind:'walk'}];
  for(let i=0;i<rounds;i++){
    list.push({label:rounds===1?'Corrida contínua':`Trote ${i+1} de ${rounds}`,detail:'RPE 3–4 · você consegue falar uma frase',seconds:run,kind:'run'});
    if(walk)list.push({label:'Recupere caminhando',detail:'Respire e retome o conforto antes de correr',seconds:walk,kind:'walk'});
  }
  list.push({label:'Desaquecimento',detail:'Reduza o ritmo progressivamente',seconds:300,kind:'walk'});
  return list;
}
export function levelText(level){const [n,r,w]=LEVELS[level];return n===1?`${r/60} min contínuos`:`${n} × ${String(r/60).replace('.',',')} min trote + ${w/60} min caminhada`;}
export function secondsTotal(level){return phases(level).reduce((a,x)=>a+x.seconds,0);}
export function elapsed(active,now=Date.now()){return Math.max(0,active.accumulated+(active.runningSince===null?0:(now-active.runningSince)/1000));}
export function phaseAt(level,seconds){let position=0;const list=phases(level);for(let i=0;i<list.length;i++){const p=list[i];if(seconds<position+p.seconds)return {...p,index:i,total:list.length,remaining:Math.ceil(position+p.seconds-seconds)};position+=p.seconds;}return {label:'Sessão completa',detail:'Caminhe se precisar e registre como foi.',kind:'done',remaining:0,index:list.length,total:list.length};}
export function setsFor(state,session){const n=state.history.filter(h=>h.sessionId===session.id&&h.status==='complete').length;return session.exercises.map((_,i)=>n<2?2:(i<3?3:2));}
export function progressionReady(state){const recent=state.history.filter(h=>h.type==='run'&&h.level===state.level).slice(-2);return recent.length===2&&recent.every(h=>h.status==='complete'&&h.rpe>=1&&h.rpe<=4&&h.pain<=2&&h.talk===true&&h.nextDay==='good');}
export function validateState(s){
  const num=(x,min,max)=>Number.isFinite(x)&&x>=min&&x<=max;
  const check=(v,msg)=>{if(!v)throw new Error(msg);};
  check(s&&s.version===1,'Formato de backup incompatível.');
  check(Number.isInteger(s.cursor)&&num(s.cursor,0,3),'Sequência inválida.');
  check(Number.isInteger(s.level)&&num(s.level,0,LEVELS.length-1),'Nível inválido.');
  check(Array.isArray(s.history)&&s.history.length<=10000,'Histórico inválido.');
  check(s.settings&&typeof s.settings.name==='string'&&s.settings.name.length<=40&&typeof s.settings.sound==='boolean','Preferências inválidas.');
  const ids=new Set();
  const checkSets=(sets,session)=>{
    check(sets&&typeof sets==='object'&&!Array.isArray(sets),'Séries inválidas.');
    for(const [key,rows] of Object.entries(sets)){
      check(session.exercises?.some(e=>e.id===key)&&Array.isArray(rows)&&rows.length<=3,'Exercício inválido.');
      for(const row of rows){check(row&&num(row.kg,0,1000)&&num(row.reps,0,100)&&typeof row.done==='boolean','Carga ou repetição inválida.');}
    }
  };
  for(const h of s.history){
    const session=PLAN.find(p=>p.id===h.sessionId);
    check(session&&h.type===session.type&&typeof h.id==='string'&&!ids.has(h.id),'Sessão inválida ou duplicada.');ids.add(h.id);
    check(typeof h.date==='string'&&Number.isFinite(Date.parse(h.date)),'Data inválida.');
    check(['complete','partial'].includes(h.status)&&num(h.duration,0,604800)&&num(h.rpe,0,10)&&num(h.pain,0,10),'Resumo inválido.');
    check(typeof h.notes==='string'&&h.notes.length<=1000&&typeof h.talk==='boolean'&&['pending','good','bad'].includes(h.nextDay),'Check-in inválido.');
    check(Number.isInteger(h.level)&&num(h.level,0,LEVELS.length-1),'Nível do registro inválido.');checkSets(h.sets,session);
  }
  if(s.active!==null){
    const a=s.active;const session=PLAN.find(p=>p.id===a.sessionId);
    check(session&&session.id===PLAN[s.cursor].id&&typeof a.id==='string'&&!ids.has(a.id),'Treino em andamento inválido.');
    check(typeof a.started==='string'&&Number.isFinite(Date.parse(a.started))&&num(a.accumulated,0,604800),'Tempo inválido.');
    check(a.runningSince===null||num(a.runningSince,0,Date.now()+60000),'Relógio inválido.');
    check(a.restEnd===null||num(a.restEnd,0,Date.now()+86400000),'Descanso inválido.');
    check(Number.isInteger(a.level)&&num(a.level,0,LEVELS.length-1)&&Number.isInteger(a.exercise)&&num(a.exercise,0,(session.exercises?.length||1)-1),'Etapa inválida.');checkSets(a.sets,session);
    if(session.exercises)for(const e of session.exercises)check(Array.isArray(a.sets[e.id])&&a.sets[e.id].length>=2,'Séries ausentes.');
  }
  return s;
}
