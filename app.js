const $ = id => document.getElementById(id);

const providers = [
  {id:'jma',name:'JMA MSM',endpoint:'https://api.open-meteo.com/v1/jma',model:'jma_msm',source:'気象庁 MSM',vars:['temperature_2m','relative_humidity_2m','precipitation','cloud_cover','wind_speed_10m','wind_direction_10m']},
  {id:'ecmwf',name:'ECMWF IFS',endpoint:'https://api.open-meteo.com/v1/ecmwf',model:null,source:'ECMWF IFS',vars:['temperature_2m','relative_humidity_2m','precipitation','cloud_cover','wind_speed_10m','wind_gusts_10m','wind_direction_10m','cape','visibility','freezing_level_height']},
  {id:'gfs',name:'GFS',endpoint:'https://api.open-meteo.com/v1/gfs',model:null,source:'NOAA GFS',vars:['temperature_2m','relative_humidity_2m','precipitation','cloud_cover','wind_speed_10m','wind_gusts_10m','wind_direction_10m','cape','visibility','freezing_level_height']},
  {id:'icon',name:'ICON',endpoint:'https://api.open-meteo.com/v1/dwd-icon',model:null,source:'DWD ICON',vars:['temperature_2m','relative_humidity_2m','precipitation','cloud_cover','wind_speed_10m','wind_gusts_10m','wind_direction_10m','cape','visibility','freezing_level_height']}
];

const TYPE_LABEL = {trailhead:'登山口',hut:'山小屋',camp:'テント場',pass:'乗越/峠',peak:'山頂',manual:'任意'};

const MOUNTAIN_PRESETS = {
  '槍ヶ岳': {latitude:36.3419, longitude:137.6476},
  '奥穂高岳': {latitude:36.2892, longitude:137.6480},
  '北穂高岳': {latitude:36.3028, longitude:137.6511},
  '前穂高岳': {latitude:36.2819, longitude:137.6606},
  '燕岳': {latitude:36.4069, longitude:137.7129},
  '常念岳': {latitude:36.3255, longitude:137.7273},
  '双六岳': {latitude:36.3723, longitude:137.5875},
  '白馬岳': {latitude:36.7585, longitude:137.7586},
  '唐松岳': {latitude:36.6874, longitude:137.7547},
  '鹿島槍ヶ岳': {latitude:36.6244, longitude:137.7467},
  '剱岳': {latitude:36.6233, longitude:137.6170},
  '立山': {latitude:36.5759, longitude:137.6197},
  '北岳': {latitude:35.6745, longitude:138.2389},
  '間ノ岳': {latitude:35.6461, longitude:138.2283},
  '甲斐駒ヶ岳': {latitude:35.7578, longitude:138.2368},
  '仙丈ヶ岳': {latitude:35.7201, longitude:138.1836},
  '富士山': {latitude:35.3606, longitude:138.7274},
  '赤岳': {latitude:35.9708, longitude:138.3701},
  '谷川岳': {latitude:36.8370, longitude:138.9300},
  '木曽駒ヶ岳': {latitude:35.7895, longitude:137.8047},
  '御嶽山': {latitude:35.8929, longitude:137.4803},
  '大山': {latitude:35.3711, longitude:133.5462},
  '石鎚山': {latitude:33.7679, longitude:133.1150},
  '宮之浦岳': {latitude:30.3362, longitude:130.5042}
};

const BUILTIN_ROUTE_CATALOG = {
  '槍ヶ岳': [
    // V4.8: 主要ポイントは座標・標高を内蔵し、名称検索に依存しない。
    {id:'builtin-yari-shinhotaka', type:'trailhead', name:'新穂高温泉', search:'新穂高温泉 登山口', lat:36.285405, lon:137.575014, elevation:1117},
    {id:'builtin-yari-kamikochi', type:'trailhead', name:'上高地', search:'上高地 バスターミナル', lat:36.246656, lon:137.635388, elevation:1505},
    {id:'builtin-yari-yokoo', type:'hut', name:'横尾山荘', search:'横尾山荘', lat:36.293444, lon:137.699175, elevation:1600},
    {id:'builtin-yari-yarisawa', type:'hut', name:'槍沢ロッヂ', search:'槍沢ロッヂ', lat:36.318056, lon:137.681111, elevation:1825},
    {id:'builtin-yari-yaridaira', type:'hut', name:'槍平小屋', search:'槍平小屋', lat:36.323220, lon:137.629910, elevation:1990},
    {id:'builtin-yari-yarigatake-sanso', type:'hut', name:'槍ヶ岳山荘', search:'槍ヶ岳山荘', lat:36.340939, lon:137.645795, elevation:3080},
    {id:'builtin-yari-yaridaira-camp', type:'camp', name:'槍平小屋テント場', search:'槍平小屋 テント場', lat:36.323220, lon:137.629910, elevation:1990},
    {id:'builtin-yari-yarigatake-camp', type:'camp', name:'槍ヶ岳山荘テント場', search:'槍ヶ岳山荘 テント場', lat:36.340939, lon:137.645795, elevation:3080},
    {id:'builtin-yari-senjo', type:'pass', name:'千丈乗越', search:'千丈乗越', lat:36.342275, lon:137.636036, elevation:2723},
    {id:'builtin-yari-hida', type:'pass', name:'飛騨乗越', search:'飛騨乗越', lat:36.338833, lon:137.645806, elevation:3020},
    {id:'builtin-yari-peak', type:'peak', name:'槍ヶ岳', search:'槍ヶ岳', lat:36.342009, lon:137.647735, elevation:3180}
  ],
  '奥穂高岳': [
    {id:'builtin-oku-kamikochi',type:'trailhead',name:'上高地',lat:36.246656,lon:137.635388,elevation:1505},
    {id:'builtin-oku-yokoo',type:'hut',name:'横尾山荘',lat:36.293444,lon:137.699175,elevation:1600},
    {id:'builtin-oku-karasawa',type:'hut',name:'涸沢ヒュッテ',lat:36.3008,lon:137.6668,elevation:2309},
    {id:'builtin-oku-hotaka',type:'hut',name:'穂高岳山荘',lat:36.2950,lon:137.6484,elevation:2996},
    {id:'builtin-oku-peak',type:'peak',name:'奥穂高岳',lat:36.2892,lon:137.6480,elevation:3190}
  ],
  '燕岳': [
    {id:'builtin-tsuba-nakabusa',type:'trailhead',name:'中房温泉登山口',lat:36.3929,lon:137.7485,elevation:1462},
    {id:'builtin-tsuba-kassen',type:'hut',name:'合戦小屋',lat:36.4009,lon:137.7258,elevation:2380},
    {id:'builtin-tsuba-enza',type:'hut',name:'燕山荘',lat:36.4073,lon:137.7152,elevation:2712},
    {id:'builtin-tsuba-peak',type:'peak',name:'燕岳',lat:36.4069,lon:137.7129,elevation:2763}
  ],
  '常念岳': [
    {id:'builtin-jonen-hito',type:'trailhead',name:'一ノ沢登山口',lat:36.3388,lon:137.7420,elevation:1320},
    {id:'builtin-jonen-nokkoshi',type:'pass',name:'常念乗越',lat:36.3305,lon:137.7272,elevation:2466},
    {id:'builtin-jonen-goya',type:'hut',name:'常念小屋',lat:36.3297,lon:137.7281,elevation:2450},
    {id:'builtin-jonen-peak',type:'peak',name:'常念岳',lat:36.3255,lon:137.7273,elevation:2857}
  ],
  '白馬岳': [
    {id:'builtin-hakuba-sarukura',type:'trailhead',name:'猿倉',lat:36.6974,lon:137.8182,elevation:1230},
    {id:'builtin-hakuba-shirouma',type:'hut',name:'白馬尻小屋跡',lat:36.7145,lon:137.7968,elevation:1560},
    {id:'builtin-hakuba-sanso',type:'hut',name:'白馬山荘',lat:36.7566,lon:137.7569,elevation:2832},
    {id:'builtin-hakuba-peak',type:'peak',name:'白馬岳',lat:36.7585,lon:137.7586,elevation:2932}
  ],
  '唐松岳': [
    {id:'builtin-kara-happo',type:'trailhead',name:'八方池山荘',lat:36.7030,lon:137.7893,elevation:1830},
    {id:'builtin-kara-happoike',type:'pass',name:'八方池',lat:36.6967,lon:137.7757,elevation:2060},
    {id:'builtin-kara-goya',type:'hut',name:'唐松岳頂上山荘',lat:36.6878,lon:137.7576,elevation:2620},
    {id:'builtin-kara-peak',type:'peak',name:'唐松岳',lat:36.6874,lon:137.7547,elevation:2696}
  ],
  '剱岳': [
    {id:'builtin-tsuru-murodo',type:'trailhead',name:'室堂',lat:36.5779,lon:137.5950,elevation:2450},
    {id:'builtin-tsuru-tsurugi',type:'hut',name:'剱澤小屋',lat:36.6047,lon:137.6177,elevation:2470},
    {id:'builtin-tsuru-kensanso',type:'hut',name:'剣山荘',lat:36.6108,lon:137.6208,elevation:2475},
    {id:'builtin-tsuru-peak',type:'peak',name:'剱岳',lat:36.6233,lon:137.6170,elevation:2999}
  ],
  '立山': [
    {id:'builtin-tate-murodo',type:'trailhead',name:'室堂',lat:36.5779,lon:137.5950,elevation:2450},
    {id:'builtin-tate-ichinokoshi',type:'hut',name:'一の越山荘',lat:36.5722,lon:137.6086,elevation:2700},
    {id:'builtin-tate-oyama',type:'peak',name:'雄山',lat:36.5759,lon:137.6197,elevation:3003}
  ],
  '北岳': [
    {id:'builtin-kita-hirokawara',type:'trailhead',name:'広河原',lat:35.6867,lon:138.2705,elevation:1520},
    {id:'builtin-kita-shiraneoike',type:'hut',name:'白根御池小屋',lat:35.6820,lon:138.2512,elevation:2236},
    {id:'builtin-kita-katanokoya',type:'hut',name:'北岳肩の小屋',lat:35.6771,lon:138.2405,elevation:3000},
    {id:'builtin-kita-peak',type:'peak',name:'北岳',lat:35.6745,lon:138.2389,elevation:3193}
  ],
  '富士山': [
    {id:'builtin-fuji-subaru',type:'trailhead',name:'富士スバルライン五合目',lat:35.3948,lon:138.7332,elevation:2305},
    {id:'builtin-fuji-yoshida7',type:'hut',name:'吉田口七合目',lat:35.3817,lon:138.7317,elevation:2700},
    {id:'builtin-fuji-hachigo',type:'hut',name:'八合目',lat:35.3719,lon:138.7315,elevation:3100},
    {id:'builtin-fuji-peak',type:'peak',name:'富士山（剣ヶ峰）',lat:35.3606,lon:138.7274,elevation:3776}
  ],
  '赤岳': [
    {id:'builtin-aka-minoto',type:'trailhead',name:'美濃戸口',lat:35.9978,lon:138.3079,elevation:1490},
    {id:'builtin-aka-akadakekosen',type:'hut',name:'赤岳鉱泉',lat:35.9861,lon:138.3504,elevation:2220},
    {id:'builtin-aka-gyojagoya',type:'hut',name:'行者小屋',lat:35.9772,lon:138.3572,elevation:2350},
    {id:'builtin-aka-peak',type:'peak',name:'赤岳',lat:35.9708,lon:138.3701,elevation:2899}
  ],
  '谷川岳': [
    {id:'builtin-tani-ropeway',type:'trailhead',name:'天神平',lat:36.8196,lon:138.9490,elevation:1319},
    {id:'builtin-tani-kumaano',type:'hut',name:'熊穴沢避難小屋',lat:36.8280,lon:138.9446,elevation:1465},
    {id:'builtin-tani-tomano',type:'peak',name:'トマノ耳',lat:36.8362,lon:138.9309,elevation:1963},
    {id:'builtin-tani-oki',type:'peak',name:'谷川岳 オキノ耳',lat:36.8370,lon:138.9300,elevation:1977}
  ],
  '木曽駒ヶ岳': [
    {id:'builtin-kiso-senjo',type:'trailhead',name:'千畳敷',lat:35.7797,lon:137.8147,elevation:2612},
    {id:'builtin-kiso-nokkoshi',type:'pass',name:'乗越浄土',lat:35.7837,lon:137.8077,elevation:2850},
    {id:'builtin-kiso-tengu',type:'hut',name:'天狗荘',lat:35.7861,lon:137.8065,elevation:2870},
    {id:'builtin-kiso-peak',type:'peak',name:'木曽駒ヶ岳',lat:35.7895,lon:137.8047,elevation:2956}
  ]
};

function builtinCandidates(mountain){
  const center=MOUNTAIN_PRESETS[mountain];
  return (BUILTIN_ROUTE_CATALOG[mountain]||[]).map((p,i)=>({
    ...p,
    lat:Number.isFinite(p.lat)?p.lat:null,
    lon:Number.isFinite(p.lon)?p.lon:null,
    elevation:Number.isFinite(p.elevation)?p.elevation:'',
    distance:center&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)?haversineMeters(center.latitude,center.longitude,p.lat,p.lon):100000+i
  }));
}

function haversineMeters(lat1,lon1,lat2,lon2){
  const R=6371000, r=Math.PI/180;
  const a=Math.sin((lat2-lat1)*r/2)**2+Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin((lon2-lon1)*r/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}


let pointSeq = 0;
let poiCandidates = [];
let map, poiLayer, routeLayer, markerLayer;
let analyzedPoints = null;
let trailRoute = null;
let trailSegments = [];
let routeProfile = [];
let routeSummary = null;
let overnightResults = [];

const APP_VERSION = '5.1';
const USAGE_SESSION_ID = (globalThis.crypto?.randomUUID?.() || `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`);

function logEvent(eventName, details={}){
  try{
    const payload={
      session_id:USAGE_SESSION_ID,
      app_version:APP_VERSION,
      event_name:eventName,
      success:details.success ?? true,
      duration_ms:Number.isFinite(details.duration_ms)?Math.round(details.duration_ms):null,
      mountain:details.mountain ?? currentMountainName() ?? '',
      route_points:Number.isFinite(details.route_points)?details.route_points:null,
      stay_count:Number.isFinite(details.stay_count)?details.stay_count:null,
      error_message:details.error_message ? String(details.error_message).slice(0,700) : null,
      metadata:details.metadata && typeof details.metadata==='object' ? details.metadata : {}
    };
    fetch('/api/event',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
      keepalive:true,
      cache:'no-store'
    }).catch(()=>{});
  }catch(_e){}
}

init();

function init(){
  $('date').value = new Date(Date.now() + 86400000).toISOString().slice(0,10);
  $('addPointBtn').addEventListener('click', () => addRoutePoint({type:'manual'}));
  $('analyzeBtn').addEventListener('click', analyze);
  $('fillExample').addEventListener('click', fillExample);
  $('loadPoiBtn').addEventListener('click', async () => {
    setLoadPoiState('ボタンを受け付けました。読み込みを開始します…', 'loading');
    await loadMountainPois();
  });
  $('poiType').addEventListener('change', renderPoiSelect);
  $('poiSelect').addEventListener('change', previewSelectedPoi);
  $('addPoiBtn').addEventListener('click', addSelectedPoi);
  $('fitMapBtn').addEventListener('click', fitMapToRoute);
  $('buildTrailBtn').addEventListener('click', buildTrailRoute);
  $('autoTimeBtn').addEventListener('click', autoFillArrivalTimes);
  $('paceMultiplier')?.addEventListener('change', handlePaceChange);
  $('mountainPreset').addEventListener('change', handleMountainPresetChange);
  $('addWizardWaypoint').addEventListener('click', () => addWizardWaypoint('hut'));
  $('sameTrailhead').addEventListener('change', syncSameTrailhead);
  $('startTrailhead').addEventListener('change', syncSameTrailhead);
  $('createWizardRoute').addEventListener('click', createRouteFromWizard);
  $('wizardStartTime').addEventListener('change', () => {
    const first=$('routePoints').querySelector('.point-time'); if(first) first.value=$('wizardStartTime').value;
  });
  initMap();
  logEvent('page_view',{success:true,metadata:{viewport_width:window.innerWidth,viewport_height:window.innerHeight}});
}


function currentMountainName(){
  const preset=$('mountainPreset').value;
  if(preset && preset!=='__other__') return preset;
  return $('mountain').value.trim();
}

async function handleMountainPresetChange(){
  const v=$('mountainPreset').value;
  const custom=v==='__other__';
  $('customMountainWrap').classList.toggle('hidden', !custom);
  if(!custom) $('mountain').value=v||'';
  poiCandidates=[];
  $('routeWizard').classList.add('hidden');
  $('poiPicker').classList.add('hidden');
  setLoadPoiState(v ? `「${currentMountainName()}」を選択しました。候補を読み込んでください。` : '山を選んで、候補を読み込んでください');
}

function wizardCandidates(type){
  return poiCandidates.filter(p=>p.type===type);
}
function stayEligibleCandidate(p){ return p && ['hut','camp'].includes(p.type); }

function candidateOptions(type, selected=''){
  const list=wizardCandidates(type);
  return '<option value="">候補を選択</option>'+list.slice(0,250).map(p=>`<option value="${esc(p.id)}" ${p.id===selected?'selected':''}>${esc(p.name)}${p.elevation!==''?` / ${p.elevation}m`:''}</option>`).join('');
}
function populateTrailheadSelects(){
  const opts=candidateOptions('trailhead');
  $('startTrailhead').innerHTML=opts;
  $('endTrailhead').innerHTML=opts;
}
function addWizardWaypoint(type='peak', selected='', stay=null){
  const row=document.createElement('div');
  row.className='wizard-step-card waypoint-card';
  row.innerHTML=`
    <div class="wizard-step-no">${$('waypointWizardRows').children.length+2}</div>
    <div class="wizard-step-main waypoint-main">
      <label>ポイント種類
        <select class="wizard-waypoint-type">
          <option value="hut" ${type==='hut'?'selected':''}>山小屋・避難小屋</option>
          <option value="camp" ${type==='camp'?'selected':''}>テント場</option>
          <option value="pass" ${type==='pass'?'selected':''}>乗越・峠・鞍部</option>
          <option value="peak" ${type==='peak'?'selected':''}>山頂</option>
        </select>
      </label>
      <label>ポイント
        <select class="wizard-waypoint-select">${candidateOptions(type,selected)}</select>
      </label>
      <button class="icon-btn wizard-remove" type="button" title="このポイントを削除">×</button>
      <div class="stay-inline">
        <label class="stay-toggle"><input class="wizard-stay" type="checkbox" ${stay?.enabled?'checked':''}/> ここで宿泊</label>
        <div class="stay-fields ${stay?.enabled?'':'hidden'}">
          <label>泊まり方
            <select class="wizard-stay-type">
              <option value="hut" ${stay?.type==='hut'?'selected':''}>山小屋泊</option>
              <option value="tent" ${stay?.type==='tent'?'selected':''}>テント泊</option>
            </select>
          </label>
          <label>翌朝の出発時刻<input class="wizard-next-start" type="time" value="${stay?.nextStart||'05:00'}" /></label>
        </div>
      </div>
    </div>`;
  $('waypointWizardRows').appendChild(row);
  const typeSel=row.querySelector('.wizard-waypoint-type');
  const pointSel=row.querySelector('.wizard-waypoint-select');
  const stayToggle=row.querySelector('.wizard-stay');
  const stayFields=row.querySelector('.stay-fields');
  const updateStayAvailability=()=>{
    const p=selectedCandidate(pointSel.value);
    const eligible=stayEligibleCandidate(p);
    stayToggle.disabled=!eligible;
    if(!eligible){stayToggle.checked=false;stayFields.classList.add('hidden');}
  };
  typeSel.addEventListener('change',()=>{pointSel.innerHTML=candidateOptions(typeSel.value); updateStayAvailability(); renumberWizardSteps();});
  pointSel.addEventListener('change',()=>{previewWizardPoi(pointSel.value);updateStayAvailability();});
  stayToggle.addEventListener('change',()=>stayFields.classList.toggle('hidden',!stayToggle.checked));
  row.querySelector('.wizard-remove').addEventListener('click',()=>{row.remove();renumberWizardSteps();});
  updateStayAvailability();
  renumberWizardSteps();
}
function renumberWizardSteps(){
  [...$('waypointWizardRows').children].forEach((row,i)=>row.querySelector('.wizard-step-no').textContent=i+2);
}
function previewWizardPoi(id){
  const p=poiCandidates.find(x=>x.id===id); if(!p)return;
  if(Number.isFinite(p.lat)&&Number.isFinite(p.lon)) map.setView([p.lat,p.lon],Math.max(map.getZoom(),14));
}
function resetWizardRows(){
  $('waypointWizardRows').innerHTML='';
  addWizardWaypoint('peak');
}
function syncSameTrailhead(){
  if($('sameTrailhead').checked){
    $('endTrailhead').value=$('startTrailhead').value;
    $('endTrailhead').disabled=true;
  }else $('endTrailhead').disabled=false;
}
function selectedCandidate(id){ return poiCandidates.find(p=>p.id===id); }
function collectWizardSelections(){
  const start=selectedCandidate($('startTrailhead').value);
  const end=selectedCandidate($('sameTrailhead').checked ? $('startTrailhead').value : $('endTrailhead').value);
  const vias=[...$('waypointWizardRows').children].map(row=>{
    const p=selectedCandidate(row.querySelector('.wizard-waypoint-select').value);
    if(!p) return null;
    const stayEnabled=row.querySelector('.wizard-stay')?.checked || false;
    return {...p, stay: stayEnabled ? {enabled:true,type:row.querySelector('.wizard-stay-type').value,nextStart:row.querySelector('.wizard-next-start').value||'05:00'} : null};
  }).filter(Boolean);
  if(!start) throw new Error('出発する登山口を選択してください。');
  if(!vias.length) throw new Error('山頂・山小屋・乗越などのポイントを1つ以上選択してください。');
  if(!end) throw new Error('下山する登山口を選択してください。');
  return [{...start,stay:null},...vias,{...end,stay:null}];
}
async function resolveCatalogPoint(p){
  if(Number.isFinite(p.lat)&&Number.isFinite(p.lon)) return p;
  const mountain=currentMountainName();
  const center=MOUNTAIN_PRESETS[mountain];
  const query=(p.search||p.name)+' '+mountain;
  const r=await proxyFetch(`https://nominatim.openstreetmap.org/search?format=json&limit=8&countrycodes=jp&q=${encodeURIComponent(query)}`);
  if(!r.ok) throw new Error(`${p.name} の位置検索に失敗しました。`);
  const results=await r.json();
  if(!results.length) throw new Error(`${p.name} の位置が見つかりませんでした。詳細設定から座標を入力してください。`);
  let hit=results[0];
  if(center){
    hit=[...results].sort((a,b)=>haversineMeters(center.latitude,center.longitude,Number(a.lat),Number(a.lon))-haversineMeters(center.latitude,center.longitude,Number(b.lat),Number(b.lon)))[0];
  }
  p.lat=Number(hit.lat); p.lon=Number(hit.lon);
  return p;
}
async function ensureWizardPointElevations(points){
  for(const p of points) await resolveCatalogPoint(p);
  const missing=points.filter(p=>!Number.isFinite(Number(p.elevation)) || p.elevation==='');
  if(!missing.length)return;
  const elev=await fetchElevations(missing.map(p=>({lat:p.lat,lon:p.lon})));
  missing.forEach((p,i)=>p.elevation=Math.round(elev[i]));
}
async function createRouteFromWizard(){
  const startedAt=performance.now();
  let selectedCount=0, stayCount=0;
  try{
    setWizardRouteState('① 選択内容を確認しています…','loading');
    const selected=collectWizardSelections();
    selectedCount=selected.length; stayCount=selected.filter(p=>p.stay?.enabled).length;
    $('createWizardRoute').disabled=true;

    setWizardRouteState('② 地点位置を確認しています…','loading');
    await ensureWizardPointElevations(selected);

    setWizardRouteState('③ ルート地点を地図へ登録しています…','loading');
    $('routePoints').innerHTML=''; pointSeq=0; invalidateTrailRoute(); analyzedPoints=null;
    const startTime=$('wizardStartTime').value||'05:00';
    selected.forEach((p,i)=>addRoutePoint({...p,date:$('date').value,time:i===0?startTime:startTime,stay:p.stay||null}));
    updateMap(); fitMapToRoute();

    setWizardRouteState('④ OpenStreetMapの登山道を探索しています…','loading');
    const ok=await buildTrailRoute({wizard:true});
    if(!ok) return;

    setWizardRouteState('⑤ 到達時刻を計算しています…','loading');
    if(trailSegments.length) autoFillArrivalTimes();
    const nights=selected.filter(p=>p.stay?.enabled).length;
    setWizardRouteState(`✓ ルート完成${nights?`（${nights}泊）`:''}：${selected.map(p=>p.name).join(' → ')}`,'success');
    logEvent('route_created',{success:true,duration_ms:performance.now()-startedAt,route_points:selected.length,stay_count:nights,metadata:{pace_multiplier:paceMultiplier()}});
  }catch(e){
    const msg=e.message||String(e);
    setWizardRouteState(`エラー：${msg}`,'error');
    setStatus(msg,true);
    logEvent('route_created',{success:false,duration_ms:performance.now()-startedAt,route_points:selectedCount,stay_count:stayCount,error_message:msg});
  }finally{$('createWizardRoute').disabled=false;}
}

function setWizardRouteState(text,kind=''){
  const el=$('wizardRouteState');
  if(!el) return;
  el.textContent=text;
  el.className='wizard-route-state'+(kind?` ${kind}`:'');
}

function initMap(){
  map = L.map('map', {zoomControl:true}).setView([36.2, 137.6], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  poiLayer = L.layerGroup().addTo(map);
  routeLayer = L.layerGroup().addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  // Leaflet must recalculate its pixel grid whenever the responsive layout settles.
  requestAnimationFrame(() => map.invalidateSize(false));
  setTimeout(() => map.invalidateSize(false), 150);
  if ('ResizeObserver' in window) {
    const mapEl = document.getElementById('map');
    let lastW = 0, lastH = 0;
    const ro = new ResizeObserver(entries => {
      const r = entries[0]?.contentRect;
      if (!r || (Math.abs(r.width-lastW)<1 && Math.abs(r.height-lastH)<1)) return;
      lastW = r.width; lastH = r.height;
      requestAnimationFrame(() => map.invalidateSize(false));
    });
    ro.observe(mapEl);
  }
  window.addEventListener('resize', () => map.invalidateSize(false));
  map.on('click', e => {
    const time = nextSuggestedTime();
    addRoutePoint({name:'地図上の地点',type:'manual',time,lat:e.latlng.lat,lon:e.latlng.lng,elevation:''});
    updateMap();
  });
}

function addRoutePoint(point = {}){
  pointSeq += 1;
  const id = `point-${pointSeq}`;
  const type = point.type || 'manual';
  const el = document.createElement('article');
  el.className = 'route-point';
  el.dataset.id = id;
  if(point.stay?.enabled) el.dataset.stay=JSON.stringify(point.stay);
  el.draggable = true;
  el.innerHTML = `
    <div class="point-handle" title="ドラッグして並べ替え">⋮⋮</div>
    <div class="point-index"></div>
    <div class="point-fields v3-fields">
      <label>種類
        <select class="point-type">
          ${Object.entries(TYPE_LABEL).map(([v,l])=>`<option value="${v}" ${v===type?'selected':''}>${l}</option>`).join('')}
        </select>
      </label>
      <label>地点名<input class="point-name" placeholder="例：槍平小屋" value="${esc(point.name || '')}" /></label>
      <label>日付<input class="point-date" type="date" value="${esc(point.date || $('date').value || '')}" /></label>
      <label>通過時刻<input class="point-time" type="time" value="${esc(point.time || nextSuggestedTime())}" /></label>
    </div>
    <input class="point-lat" type="hidden" value="${valueAttr(point.lat)}" />
    <input class="point-lon" type="hidden" value="${valueAttr(point.lon)}" />
    <input class="point-elevation" type="hidden" value="${valueAttr(point.elevation)}" />
    ${point.stay?.enabled?`<div class="route-stay-note">🌙 ${point.stay.type==='tent'?'テント泊':'山小屋泊'} / 翌朝 ${esc(point.stay.nextStart||'05:00')} 出発</div>`:''}
    <div class="point-actions">
      <button class="ghost geocode-point" type="button">位置を自動取得</button>
      <button class="icon-btn move-up" type="button" title="上へ">↑</button>
      <button class="icon-btn move-down" type="button" title="下へ">↓</button>
      <button class="icon-btn remove-point" type="button" title="削除">×</button>
    </div>`;

  $('routePoints').appendChild(el);
  el.querySelector('.remove-point').addEventListener('click', () => { el.remove(); invalidateTrailRoute(); ensureMinimumPoints(); updatePointIndices(); updateMap(); });
  el.querySelector('.move-up').addEventListener('click', () => { const prev=el.previousElementSibling; if(prev) el.parentNode.insertBefore(el,prev); invalidateTrailRoute(); updatePointIndices(); updateMap(); });
  el.querySelector('.move-down').addEventListener('click', () => { const next=el.nextElementSibling; if(next) el.parentNode.insertBefore(next,el); invalidateTrailRoute(); updatePointIndices(); updateMap(); });
  el.querySelector('.geocode-point').addEventListener('click', () => geocodePoint(el));
  el.querySelectorAll('input,select').forEach(x=>x.addEventListener('change', () => { invalidateTrailRoute(); updateMap(); }));
  el.querySelector('.point-name').addEventListener('input', updateMap);
  el.addEventListener('dragstart', e => { el.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; });
  el.addEventListener('dragend', () => { el.classList.remove('dragging'); invalidateTrailRoute(); updatePointIndices(); updateMap(); });
  el.addEventListener('dragover', e => {
    e.preventDefault();
    const dragging=document.querySelector('.route-point.dragging');
    if(!dragging || dragging===el) return;
    const rect=el.getBoundingClientRect();
    const before=e.clientY < rect.top + rect.height/2;
    el.parentNode.insertBefore(dragging, before ? el : el.nextSibling);
  });
  updatePointIndices();
  updateMap();
}

function ensureMinimumPoints(){ if(!$('routePoints').children.length) addRoutePoint({name:'地点1',type:'manual'}); }
function updatePointIndices(){ [...$('routePoints').children].forEach((el,i)=>{ el.querySelector('.point-index').textContent=String(i+1).padStart(2,'0'); }); }
function valueAttr(v){ return v===undefined || v===null ? '' : String(v); }
function esc(s){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function routeRecalcState(message, kind=''){
  const el=$('routeRecalcState'); if(!el) return;
  el.textContent=message; el.className=`route-recalc-state ${kind}`.trim();
}
function optionalNumber(value){
  if(value===undefined||value===null||String(value).trim()==='') return NaN;
  const n=Number(value); return Number.isFinite(n)?n:NaN;
}

function nextSuggestedTime(){
  const els=[...$('routePoints').querySelectorAll('.point-time')];
  if(!els.length) return '06:00';
  const last=els[els.length-1].value || '06:00';
  const [h,m]=last.split(':').map(Number); const mins=(h*60+m+120)%(24*60);
  return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
}

function fillExample(){
  $('mountainPreset').value='槍ヶ岳'; $('mountain').value='槍ヶ岳'; $('wizardStartTime').value='04:30';
  loadMountainPois().then(()=>{
    const find=(type,name)=>poiCandidates.find(p=>p.type===type && p.name.includes(name));
    const start=find('trailhead','新穂高') || wizardCandidates('trailhead')[0];
    const hut=find('hut','槍平'); const pass=find('pass','千丈'); const peak=find('peak','槍ヶ岳') || wizardCandidates('peak')[0];
    if(start) $('startTrailhead').value=start.id;
    $('waypointWizardRows').innerHTML='';
    if(hut) addWizardWaypoint('hut',hut.id);
    if(pass) addWizardWaypoint('pass',pass.id);
    if(peak) addWizardWaypoint('peak',peak.id); else addWizardWaypoint('peak');
    if(start){$('sameTrailhead').checked=true;syncSameTrailhead();}
    setStatus('槍ヶ岳の例を候補リストにセットしました。候補が不足する場合はプルダウンから変更してください。');
  });
}

function setLoadPoiState(message, kind='idle'){
  const el=$('loadPoiState');
  if(!el) return;
  el.textContent=message;
  el.className=`load-poi-state ${kind}`;
}

async function fetchOverpass(query, updatePoiStatus=true){
  if(updatePoiStatus) setLoadPoiState('周辺ポイントをローカルサーバー経由で取得中…', 'loading');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(), 65000);
  try{
    const r=await fetch('/api/overpass',{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:query,signal:controller.signal,cache:'no-store'});
    if(!r.ok){ const text=await r.text(); throw new Error(text || `HTTP ${r.status}`); }
    return await r.json();
  }finally{ clearTimeout(timer); }
}

async function proxyFetch(url, options={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(), 30000);
  try{
    return await fetch('/api/proxy?url='+encodeURIComponent(url),{...options,method:'GET',signal:controller.signal,cache:'no-store'});
  }finally{ clearTimeout(timer); }
}

async function loadMountainPois(){
  const startedAt=performance.now();
  const mountain=currentMountainName();
  if(!mountain) return setStatus('先に山域・山名を入力してください。', true);
  setStatus(`${mountain} の中心位置と周辺ポイントを検索しています…`);
  const loadBtn=$('loadPoiBtn');
  const originalLabel=loadBtn.textContent;
  loadBtn.disabled=true;
  loadBtn.textContent='読み込み中…';
  setLoadPoiState('山の中心位置を確認しています…', 'loading');
  try{
    const center=await geocodeMountain(mountain);
    map.setView([center.latitude,center.longitude], 12);
    const builtin=builtinCandidates(mountain);
    let osm=[]; let osmNote='';
    try{
      const q=`[out:json][timeout:25];(node["natural"="peak"](around:18000,${center.latitude},${center.longitude});nwr["tourism"~"alpine_hut|wilderness_hut|camp_site"](around:18000,${center.latitude},${center.longitude});node["mountain_pass"="yes"](around:18000,${center.latitude},${center.longitude});node["natural"="saddle"](around:18000,${center.latitude},${center.longitude});node["information"="trailhead"](around:18000,${center.latitude},${center.longitude});node["highway"="trailhead"](around:18000,${center.latitude},${center.longitude});nwr["name"~"登山口|登山道入口|登山道入り口"](around:18000,${center.latitude},${center.longitude});nwr["amenity"="parking"]["name"~"登山口"](around:18000,${center.latitude},${center.longitude});node["highway"="bus_stop"]["name"~"登山口"](around:18000,${center.latitude},${center.longitude}););out center tags;`;
      const data=await fetchOverpass(q);
      osm=(data.elements||[]).map(normalizePoi).filter(x=>x && x.name);
      osmNote=`OSM ${osm.length}件`;
    }catch(err){ osmNote='OSM補完は取得できませんでした'; }
    const uniq=new Map();
    [...builtin,...osm].forEach(p=>{
      const latKey=Number.isFinite(p.lat)?p.lat.toFixed(4):'pending';
      const lonKey=Number.isFinite(p.lon)?p.lon.toFixed(4):'pending';
      const k=`${p.type}:${p.name}:${latKey}:${lonKey}`;
      if(!uniq.has(k))uniq.set(k,p);
    });
    poiCandidates=[...uniq.values()].sort((a,b)=>(a.distance??999999)-(b.distance??999999) || a.name.localeCompare(b.name,'ja'));
    if(!poiCandidates.length) throw new Error('候補が見つかりませんでした。詳細設定から手入力してください。');
    $('poiPicker').classList.remove('hidden');
    $('routeWizard').classList.remove('hidden');
    populateTrailheadSelects(); resetWizardRows();
    $('poiMeta').textContent=`${center.name || mountain}: 内蔵候補 ${builtin.length}件 + ${osmNote}。未確定座標はルート作成時に検索します。`;
    renderPoiSelect(); renderPoiMarkers();
    $('wizardMeta').textContent=`登山口 ${wizardCandidates('trailhead').length} / 小屋 ${wizardCandidates('hut').length} / 乗越・峠 ${wizardCandidates('pass').length} / 山頂 ${wizardCandidates('peak').length}`;
    setStatus(`${poiCandidates.length} 件の候補を取得しました。出発登山口から順番に選んでください。`);
    setLoadPoiState(`✓ ${poiCandidates.length}件の候補を準備しました。下の「出発する登山口」から選べます。`, 'success');
    logEvent('route_candidates_loaded',{success:true,duration_ms:performance.now()-startedAt,mountain,metadata:{candidate_count:poiCandidates.length,builtin_count:builtin.length,osm_count:osm.length}});
    setTimeout(()=>{ $('routeWizard').scrollIntoView({behavior:'smooth',block:'start'}); }, 80);
  }catch(e){
    const msg=e.message || String(e);
    setStatus(msg, true);
    setLoadPoiState(`取得失敗：${msg}　もう一度押すと再試行します。`, 'error');
    logEvent('route_candidates_loaded',{success:false,duration_ms:performance.now()-startedAt,mountain,error_message:msg});
  }
  finally{
    loadBtn.disabled=false;
    loadBtn.textContent=originalLabel;
  }
}

async function geocodeMountain(name){
  if(MOUNTAIN_PRESETS[name]) return {name,...MOUNTAIN_PRESETS[name]};
  try{
    const r=await proxyFetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=ja&format=json`);
    if(r.ok){const j=await r.json();if(j.results?.length)return j.results[0];}
  }catch(_e){}
  const r2=await proxyFetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=jp&q=${encodeURIComponent(name+' 山')}`);
  if(!r2.ok) throw new Error('山名検索に失敗しました。');
  const j2=await r2.json();
  if(!j2.length) throw new Error('山名から中心位置を特定できませんでした。');
  return {name,latitude:Number(j2[0].lat),longitude:Number(j2[0].lon)};
}

function normalizePoi(el){
  const t=el.tags||{};
  const lat=el.lat ?? el.center?.lat, lon=el.lon ?? el.center?.lon;
  if(!Number.isFinite(lat)||!Number.isFinite(lon)) return null;
  let type='manual';
  if(t.natural==='peak') type='peak';
  else if(t.tourism==='camp_site') type='camp';
  else if(['alpine_hut','wilderness_hut'].includes(t.tourism)) type='hut';
  else if(t.mountain_pass==='yes'||t.natural==='saddle') type='pass';
  else if(t.information==='trailhead'||t.highway==='trailhead'||/登山口|登山道入口|登山道入り口/.test(t['name:ja']||t.name||'')) type='trailhead';
  const center=map.getCenter();
  return {id:`${el.type}-${el.id}`,type,name:t['name:ja']||t.name||t['name:en']||'',lat,lon,elevation:parseElevation(t.ele),distance:map.distance(center,[lat,lon])};
}
function parseElevation(v){ if(v==null) return ''; const n=parseFloat(String(v).replace(',','.')); return Number.isFinite(n)?Math.round(n):''; }

function renderPoiSelect(){
  const type=$('poiType').value;
  const list=poiCandidates.filter(p=>type==='all'||p.type===type);
  $('poiSelect').innerHTML='<option value="">候補を選択</option>'+list.slice(0,250).map(p=>`<option value="${esc(p.id)}">[${TYPE_LABEL[p.type]}] ${esc(p.name)}${p.elevation!==''?` / ${p.elevation}m`:''}</option>`).join('');
}
function previewSelectedPoi(){
  const p=poiCandidates.find(x=>x.id===$('poiSelect').value); if(!p)return;
  map.setView([p.lat,p.lon], Math.max(map.getZoom(),14));
}
function addSelectedPoi(){
  const p=poiCandidates.find(x=>x.id===$('poiSelect').value);
  if(!p) return setStatus('候補ポイントを選択してください。',true);
  addRoutePoint({...p,time:$('poiTime').value||nextSuggestedTime()});
  updateMap(); fitMapToRoute();
}

function renderPoiMarkers(){
  poiLayer.clearLayers();
  const type=$('poiType').value;
  poiCandidates.filter(p=>(type==='all'||p.type===type)&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)).slice(0,300).forEach(p=>{
    L.circleMarker([p.lat,p.lon],{radius:5,weight:1,fillOpacity:.75,color:poiColor(p.type),fillColor:poiColor(p.type)})
      .bindTooltip(`${TYPE_LABEL[p.type]}｜${p.name}${p.elevation!==''?` ${p.elevation}m`:''}`)
      .addTo(poiLayer);
  });
}
$('poiType').addEventListener('change', renderPoiMarkers);

function poiColor(type){ return ({trailhead:'#8ec5ff',hut:'#92e6b2',camp:'#80d6a6',pass:'#ffd36e',peak:'#ff8b7b',manual:'#c8f36b'})[type]||'#c8f36b'; }

async function geocodePoint(el){
  const name=el.querySelector('.point-name').value.trim();
  if(!name) return setStatus('検索する地点名を入力してください。',true);
  setStatus(`${name} の座標を検索しています…`);
  try{
    const r=await proxyFetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=8&language=ja&format=json`);
    if(!r.ok) throw new Error('検索APIエラー');
    const j=await r.json(); if(!j.results?.length) throw new Error('候補が見つかりませんでした。地図をクリックして地点を追加するか、地点名をより具体的にしてください。');
    const hit=j.results[0];
    el.querySelector('.point-lat').value=hit.latitude; el.querySelector('.point-lon').value=hit.longitude;
    if(Number.isFinite(hit.elevation)) el.querySelector('.point-elevation').value=Math.round(hit.elevation);
    updateMap(); map.setView([hit.latitude,hit.longitude],14);
    setStatus(`${name}: ${hit.latitude.toFixed(4)}, ${hit.longitude.toFixed(4)} を入力しました。`);
  }catch(e){setStatus(e.message||String(e),true);}
}

function collectPoints(){
  return [...$('routePoints').children].map((el,i)=>({
    index:i+1,type:el.querySelector('.point-type').value,name:el.querySelector('.point-name').value.trim(),date:el.querySelector('.point-date')?.value||$('date').value,time:el.querySelector('.point-time').value,
    lat:optionalNumber(el.querySelector('.point-lat').value),lon:optionalNumber(el.querySelector('.point-lon').value),elevation:optionalNumber(el.querySelector('.point-elevation').value),
    stay:el.dataset.stay?JSON.parse(el.dataset.stay):null
  }));
}
function validatePoints(points){
  if(points.length<2) throw new Error('ルート地点を2地点以上登録してください。');
  for(const p of points){
    if(!p.name||!p.date||!p.time) throw new Error(`${p.index}番目の地点名・日付・通過時刻を入力してください。`);
    if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon)) throw new Error(`${p.name} の位置情報がありません。『位置を自動取得』を押すか、地図から地点を追加してください。`);
    if(!Number.isFinite(p.elevation)||p.elevation<0) throw new Error(`${p.name} の標高を自動取得できませんでした。ルートを再生成してください。`);
  }
  if(!$('date').value) throw new Error('登山日を入力してください。');
}

function invalidateTrailRoute(){
  trailRoute=null; trailSegments=[]; routeProfile=[]; routeSummary=null;
  const auto=$('autoTimeBtn'); if(auto) auto.disabled=true;
  $('routeMetrics')?.classList.add('hidden'); $('segmentTableWrap')?.classList.add('hidden');
}

function updateMap(){
  if(!map) return;
  markerLayer.clearLayers(); routeLayer.clearLayers();
  const points=collectPoints().filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon));
  points.forEach((p,i)=>{
    const marker=L.circleMarker([p.lat,p.lon],{radius:8,weight:2,color:poiColor(p.type),fillColor:poiColor(p.type),fillOpacity:.9})
      .bindTooltip(`${i+1}. ${p.name}<br>${p.date||''} ${p.time||'--:--'} / ${Number.isFinite(p.elevation)?p.elevation+'m':'標高未入力'}`)
      .addTo(markerLayer);
    marker.on('click',()=>{ const el=$('routePoints').children[i]; el?.scrollIntoView({behavior:'smooth',block:'center'}); });
  });
  if(trailSegments.length){
    trailSegments.forEach((seg,i)=>{
      const grade=segmentWeatherGrade(i);
      const color=gradeColor(grade);
      L.polyline(seg.coords.map(x=>[x.lat,x.lon]),{color,weight:5,opacity:.86,className:'trail-route',dashArray:seg.fallback?'8 7':null}).addTo(routeLayer)
        .bindTooltip(`${seg.fromName} → ${seg.toName}<br>${(seg.distance/1000).toFixed(2)}km / ${Math.round(seg.ascent)}m↑ / ${formatDuration(seg.minutes)}${seg.fallback?'<br>登山道接続なし：直線フォールバック':''}`);
    });
  } else {
    for(let i=0;i<points.length-1;i++){
      const grade=analyzedPoints?.[i]?.grade || 'N';
      L.polyline([[points[i].lat,points[i].lon],[points[i+1].lat,points[i+1].lon]],{color:gradeColor(grade),weight:4,opacity:.55,dashArray:'6 7'}).addTo(routeLayer);
    }
  }
}
function segmentWeatherGrade(i){
  if(!analyzedPoints?.length) return 'N';
  const a=analyzedPoints[i]?.grade, b=analyzedPoints[i+1]?.grade;
  if(!a) return b||'N'; if(!b) return a;
  return gradeRank(a)>=gradeRank(b)?a:b;
}
function gradeColor(g){ return ({A:'#8fe7ae',B:'#c8f36b',C:'#ffd36e',D:'#ffad76',E:'#ff8175',N:'#667872'})[g]||'#667872'; }
function fitMapToRoute(){
  if(trailRoute?.length){ map.fitBounds(L.latLngBounds(trailRoute.map(p=>[p.lat,p.lon])),{padding:[30,30],maxZoom:15}); return; }
  const pts=collectPoints().filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)); if(!pts.length)return; map.fitBounds(L.latLngBounds(pts.map(p=>[p.lat,p.lon])),{padding:[30,30],maxZoom:15});
}

async function hydrateMissingCoordinates(){
  const rows=[...$('routePoints').children];
  for(let i=0;i<rows.length;i++){
    const el=rows[i];
    const lat=optionalNumber(el.querySelector('.point-lat').value);
    const lon=optionalNumber(el.querySelector('.point-lon').value);
    if(Number.isFinite(lat)&&Number.isFinite(lon)) continue;
    const name=el.querySelector('.point-name').value.trim();
    if(!name) throw new Error(`${i+1}番目の地点名を入力してください。`);
    routeRecalcState(`地点位置を確認中… ${i+1}/${rows.length} ${name}`,'loading');
    const known=poiCandidates.find(p=>p.name===name || p.name.includes(name) || name.includes(p.name));
    if(known && Number.isFinite(known.lat) && Number.isFinite(known.lon)){
      el.querySelector('.point-lat').value=known.lat; el.querySelector('.point-lon').value=known.lon;
      if(Number.isFinite(known.elevation)) el.querySelector('.point-elevation').value=known.elevation;
      continue;
    }
    const r=await proxyFetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=8&language=ja&format=json`);
    if(!r.ok) throw new Error(`${name} の位置検索に失敗しました。`);
    const j=await r.json();
    const hit=j.results?.[0];
    if(!hit) throw new Error(`${name} の位置が見つかりません。地点名を具体的にするか、地図クリックで追加してください。`);
    el.querySelector('.point-lat').value=hit.latitude; el.querySelector('.point-lon').value=hit.longitude;
    if(Number.isFinite(hit.elevation)) el.querySelector('.point-elevation').value=Math.round(hit.elevation);
  }
  updateMap();
}

async function buildTrailRoute(options={}){
  const wizard=Boolean(options.wizard);
  const startedAt=performance.now();
  let pointCount=0;
  try{
    routeRecalcState('① 再計算を開始しました。地点位置を確認しています…','loading');
    $('buildTrailBtn').disabled=true; $('autoTimeBtn').disabled=true;
    await hydrateMissingCoordinates();
    const points=collectPoints();
    pointCount=points.length;
    if(points.length<2) throw new Error('ルート地点を2地点以上登録してください。');
    for(const p of points) if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon)) throw new Error(`${p.name||p.index+'番目'} の位置情報を取得できませんでした。`);
    routeRecalcState(`① 登山道を探索中… 0/${points.length-1}`,'loading');
    setStatus(`OpenStreetMapの登山道から ${points.length-1} 区間を探索しています…`);
    const segments=[];
    for(let i=0;i<points.length-1;i++){
      const msg=`④ ${i+1}/${points.length-1} ${points[i].name} → ${points[i+1].name} の登山道を探索中…`;
      setStatus(msg);
      routeRecalcState(`① 登山道を探索中… ${i+1}/${points.length-1} ${points[i].name} → ${points[i+1].name}`,'loading');
      if(wizard) setWizardRouteState(msg,'loading');
      const seg=await routeTrailSegment(points[i],points[i+1]);
      segments.push(seg);
    }
    setStatus('ルート標高を取得して、累積標高とコースタイムを計算しています…');
    if(wizard) setWizardRouteState('④ ルート標高・距離・累積標高を計算しています…','loading');
    await addElevationAndStats(segments);
    syncRoutePointElevationsFromSegments(segments);
    trailSegments=segments;
    trailRoute=mergeSegmentCoords(segments);
    routeProfile=trailRoute;
    routeSummary=summarizeSegments(segments);
    renderRouteEngineering(); updateMap(); fitMapToRoute();
    $('autoTimeBtn').disabled=false;
    routeRecalcState('① 完了。続けて②「到達時刻を再計算」を押せます。','success');
    const fallback=segments.filter(x=>x.fallback).length;
    setStatus(`V5.1ルート生成完了：${(routeSummary.distance/1000).toFixed(2)}km / 登り${Math.round(routeSummary.ascent)}m / 推定${formatDuration(routeSummary.minutes)}${fallback?`。${fallback}区間は登山道接続が見つからず直線フォールバックです。`:''}`);
    logEvent('trail_route_calculated',{success:true,duration_ms:performance.now()-startedAt,route_points:points.length,metadata:{segments:segments.length,fallback_segments:fallback,distance_km:Number((routeSummary.distance/1000).toFixed(2)),ascent_m:Math.round(routeSummary.ascent),descent_m:Math.round(routeSummary.descent),course_minutes:Math.round(routeSummary.minutes),pace_multiplier:paceMultiplier()}});
    return true;
  }catch(e){
    const msg=e.message||String(e);
    setStatus(msg,true);
    routeRecalcState(`再計算エラー：${msg}`,'error');
    if(wizard) setWizardRouteState(`登山道生成エラー：${msg}`,'error');
    logEvent('trail_route_calculated',{success:false,duration_ms:performance.now()-startedAt,route_points:pointCount,error_message:msg,metadata:{wizard}});
    return false;
  }finally{$('buildTrailBtn').disabled=false;}
}

async function routeTrailSegment(a,b){
  const direct=haversine(a.lat,a.lon,b.lat,b.lon);
  const buffer=Math.min(0.075,Math.max(0.018,direct/111000*0.55));
  const south=Math.min(a.lat,b.lat)-buffer, north=Math.max(a.lat,b.lat)+buffer;
  const west=Math.min(a.lon,b.lon)-buffer/Math.max(.4,Math.cos((a.lat+b.lat)/2*Math.PI/180)), east=Math.max(a.lon,b.lon)+buffer/Math.max(.4,Math.cos((a.lat+b.lat)/2*Math.PI/180));
  const q=`[out:json][timeout:30];way["highway"~"path|footway|track|steps|bridleway"](${south},${west},${north},${east})["access"!="private"];(._;>;);out body;`;
  try{
    const data=await fetchOverpass(q,false);
    const graph=buildOsmGraph(data);
    const start=nearestGraphNode(graph,a.lat,a.lon), goal=nearestGraphNode(graph,b.lat,b.lon);
    if(!start||!goal) throw new Error('登山道ノードなし');
    const startGap=haversine(a.lat,a.lon,start.lat,start.lon), endGap=haversine(b.lat,b.lon,goal.lat,goal.lon);
    if(startGap>1800||endGap>1800) throw new Error('選択地点が登山道から離れています');
    const ids=aStar(graph,start.id,goal.id);
    if(!ids?.length) throw new Error('登山道が接続していません');
    let coords=[{lat:a.lat,lon:a.lon}].concat(ids.map(id=>({lat:graph.nodes.get(id).lat,lon:graph.nodes.get(id).lon}))).concat([{lat:b.lat,lon:b.lon}]);
    coords=simplifyCoords(coords,70);
    return {fromName:a.name,toName:b.name,coords,fallback:false,distance:polylineDistance(coords),ascent:0,descent:0,minutes:0};
  }catch(e){
    const coords=interpolateLine(a,b,Math.max(2,Math.ceil(direct/250)));
    return {fromName:a.name,toName:b.name,coords,fallback:true,reason:e.message,distance:direct,ascent:0,descent:0,minutes:0};
  }
}
function buildOsmGraph(data){
  const nodes=new Map(), adj=new Map();
  for(const el of data.elements||[]) if(el.type==='node'&&Number.isFinite(el.lat)&&Number.isFinite(el.lon)) nodes.set(el.id,{id:el.id,lat:el.lat,lon:el.lon});
  for(const el of data.elements||[]) if(el.type==='way'&&Array.isArray(el.nodes)){
    const tags=el.tags||{}; const penalty=tags.highway==='steps'?1.35:tags.highway==='track'?1.08:1;
    for(let i=1;i<el.nodes.length;i++){
      const u=nodes.get(el.nodes[i-1]),v=nodes.get(el.nodes[i]); if(!u||!v) continue;
      const w=haversine(u.lat,u.lon,v.lat,v.lon)*penalty;
      if(!adj.has(u.id))adj.set(u.id,[]); if(!adj.has(v.id))adj.set(v.id,[]);
      adj.get(u.id).push([v.id,w]); adj.get(v.id).push([u.id,w]);
    }
  }
  return {nodes,adj};
}
function nearestGraphNode(graph,lat,lon){ let best=null,bd=Infinity; for(const n of graph.nodes.values()){const d=haversine(lat,lon,n.lat,n.lon);if(d<bd){bd=d;best=n;}} return best; }
function aStar(graph,start,goal){
  const open=new Set([start]), came=new Map(), g=new Map([[start,0]]), f=new Map([[start,heur(start)]]);
  function heur(id){const n=graph.nodes.get(id),t=graph.nodes.get(goal);return haversine(n.lat,n.lon,t.lat,t.lon);}
  let guard=0;
  while(open.size&&guard++<200000){
    let cur=null,best=Infinity; for(const id of open){const v=f.get(id)??Infinity;if(v<best){best=v;cur=id;}}
    if(cur===goal){const path=[cur];while(came.has(cur)){cur=came.get(cur);path.push(cur);}return path.reverse();}
    open.delete(cur);
    for(const [n,w] of graph.adj.get(cur)||[]){const t=(g.get(cur)??Infinity)+w;if(t<(g.get(n)??Infinity)){came.set(n,cur);g.set(n,t);f.set(n,t+heur(n));open.add(n);}}
  }
  return null;
}
function simplifyCoords(coords,minM=60){ if(coords.length<=2)return coords; const out=[coords[0]]; let last=coords[0]; for(let i=1;i<coords.length-1;i++){if(haversine(last.lat,last.lon,coords[i].lat,coords[i].lon)>=minM){out.push(coords[i]);last=coords[i];}} out.push(coords.at(-1)); return out; }
function interpolateLine(a,b,n){ const arr=[]; for(let i=0;i<=n;i++){const t=i/n;arr.push({lat:a.lat+(b.lat-a.lat)*t,lon:a.lon+(b.lon-a.lon)*t});}return arr; }
function haversine(lat1,lon1,lat2,lon2){ const R=6371000,p=Math.PI/180,dlat=(lat2-lat1)*p,dlon=(lon2-lon1)*p; const x=Math.sin(dlat/2)**2+Math.cos(lat1*p)*Math.cos(lat2*p)*Math.sin(dlon/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }
function polylineDistance(coords){let d=0;for(let i=1;i<coords.length;i++)d+=haversine(coords[i-1].lat,coords[i-1].lon,coords[i].lat,coords[i].lon);return d;}
async function addElevationAndStats(segments){
  for(const seg of segments){
    const sample=resampleCoords(seg.coords,95);
    const elev=await fetchElevations(sample);
    sample.forEach((p,i)=>p.elevation=elev[i]);
    seg.coords=sample; seg.distance=polylineDistance(sample); let up=0,down=0;
    for(let i=1;i<sample.length;i++){const dz=(sample[i].elevation??0)-(sample[i-1].elevation??0);if(dz>0)up+=dz;else down-=dz;}
    seg.ascent=up;seg.descent=down;seg.minutes=estimateCourseMinutes(seg.distance,up,down);
  }
}
function resampleCoords(coords,maxPoints=95){
  if(coords.length<=maxPoints)return coords;
  const out=[]; for(let i=0;i<maxPoints;i++){const idx=Math.round(i*(coords.length-1)/(maxPoints-1));out.push(coords[idx]);} return out;
}
async function fetchElevations(coords){
  const all=[];
  for(let i=0;i<coords.length;i+=100){
    const batch=coords.slice(i,i+100); const lat=batch.map(x=>x.lat.toFixed(6)).join(','), lon=batch.map(x=>x.lon.toFixed(6)).join(',');
    const r=await proxyFetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`); if(!r.ok) throw new Error(`標高API HTTP ${r.status}`);
    const j=await r.json(); all.push(...(j.elevation||[]));
  }
  return all;
}
function paceMultiplier(){
  const v=Number($('paceMultiplier')?.value||1);
  return Number.isFinite(v)&&v>0?v:1;
}
function estimateCourseMinutes(distance,ascent,descent){
  const flat=distance/1000/4.0*60; const up=ascent/450*60; const down=descent/700*60;
  return Math.max(1,(flat+up+down)*paceMultiplier());
}
function handlePaceChange(){
  if(!trailSegments.length) return;
  trailSegments.forEach(s=>s.minutes=estimateCourseMinutes(s.distance,s.ascent,s.descent));
  routeSummary=summarizeSegments(trailSegments);
  renderRouteEngineering();
  $('autoTimeBtn').disabled=false;
  setStatus(`歩行ペースを ${$('paceMultiplier').selectedOptions[0]?.textContent||paceMultiplier()} に変更しました。到達時刻を再計算できます。`);
}
function mergeSegmentCoords(segs){const out=[];segs.forEach((s,i)=>out.push(...(i?s.coords.slice(1):s.coords)));return out;}
function summarizeSegments(segs){return {distance:segs.reduce((a,s)=>a+s.distance,0),ascent:segs.reduce((a,s)=>a+s.ascent,0),descent:segs.reduce((a,s)=>a+s.descent,0),minutes:segs.reduce((a,s)=>a+s.minutes,0)};}
function formatDuration(mins){if(!Number.isFinite(mins))return '–';const m=Math.round(mins),h=Math.floor(m/60),r=m%60;return h?`${h}時間${r?String(r).padStart(2,'0')+'分':''}`:`${r}分`;}
function renderRouteEngineering(){
  if(!routeSummary)return;
  $('routeMetrics').classList.remove('hidden'); $('segmentTableWrap').classList.remove('hidden');
  $('routeDistance').textContent=`${(routeSummary.distance/1000).toFixed(2)} km`; $('routeAscent').textContent=`${Math.round(routeSummary.ascent)} m`; $('routeDescent').textContent=`${Math.round(routeSummary.descent)} m`; $('routeCourseTime').textContent=formatDuration(routeSummary.minutes);
  $('segmentBody').innerHTML=trailSegments.map((s,i)=>`<tr><td>${esc(s.fromName)} → ${esc(s.toName)}</td><td>${(s.distance/1000).toFixed(2)} km</td><td>${Math.round(s.ascent)} m</td><td>${Math.round(s.descent)} m</td><td>${formatDuration(s.minutes)}</td><td class="${s.fallback?'route-fallback':'route-ok'}">${s.fallback?'直線補完':'登山道'}</td></tr>`).join('');
}
function syncRoutePointElevationsFromSegments(segments){
  const els=[...$('routePoints').children];
  if(!segments.length||!els.length)return;
  const elevations=[];
  elevations.push(segments[0].coords[0]?.elevation);
  segments.forEach(seg=>elevations.push(seg.coords[seg.coords.length-1]?.elevation));
  els.forEach((el,i)=>{
    const e=elevations[i];
    if(Number.isFinite(e)) el.querySelector('.point-elevation').value=Math.round(e);
  });
}

function autoFillArrivalTimes(){
  routeRecalcState('② 到達時刻を再計算しています…','loading');
  if(!trailSegments.length)return setStatus('先に「登山道ルートを生成」を実行してください。',true);
  const els=[...$('routePoints').children]; if(!els.length)return;
  let dayDate=els[0].querySelector('.point-date')?.value || $('date').value;
  let mins=timeToMinutes(els[0].querySelector('.point-time').value||'06:00');
  if(els[0].querySelector('.point-date')) els[0].querySelector('.point-date').value=dayDate;
  for(let i=1;i<els.length;i++){
    const prev=els[i-1];
    const stay=prev.dataset.stay?JSON.parse(prev.dataset.stay):null;
    if(stay?.enabled){
      dayDate=addDays(dayDate,1);
      mins=timeToMinutes(stay.nextStart||'05:00');
    }
    mins+=Math.round(trailSegments[i-1]?.minutes||0);
    const extraDays=Math.floor(mins/1440);
    if(extraDays){ dayDate=addDays(dayDate,extraDays); mins%=1440; }
    if(els[i].querySelector('.point-date')) els[i].querySelector('.point-date').value=dayDate;
    els[i].querySelector('.point-time').value=minutesToTime(mins);
  }
  const nights=els.filter(el=>el.dataset.stay).length;
  setStatus(`推定コースタイムから各地点の到達日時を自動入力しました${nights?`（${nights}泊を反映）`:''}。`); updateMap();
  logEvent('arrival_times_calculated',{success:true,route_points:els.length,stay_count:nights,metadata:{pace_multiplier:paceMultiplier()}});
}
function addDays(iso,days){const d=new Date(`${iso}T12:00:00`);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}
function timeToMinutes(s){const [h,m]=s.split(':').map(Number);return h*60+m;}
function minutesToTime(m){m=((m%1440)+1440)%1440;return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}

async function analyze(){
  const startedAt=performance.now();
  let pointCount=0, stayCount=0;
  try{
    const points=collectPoints(); validatePoints(points);
    pointCount=points.length;
    $('analyzeBtn').disabled=true; setStatus(`ルート ${points.length} 地点 × ${providers.length} モデルを取得しています…`);
    const results=[];
    for(let i=0;i<points.length;i++){
      setStatus(`${i+1}/${points.length} ${points[i].name} の予報を取得しています…`);
      results.push(await analyzePoint(points[i]));
    }
    const stayPoints=points.filter(p=>p.stay?.enabled);
    stayCount=stayPoints.length;
    overnightResults=[];
    for(let i=0;i<stayPoints.length;i++){
      setStatus(`宿泊 ${i+1}/${stayPoints.length} ${stayPoints[i].name} の夜〜翌朝を分析しています…`);
      try{ overnightResults.push(await analyzeOvernightStay(stayPoints[i], i+1)); }
      catch(e){ overnightResults.push({point:stayPoints[i],night:i+1,error:e.message||String(e)}); }
    }
    analyzedPoints=results; renderAll(results); updateMap();
    const stayMsg=stayPoints.length?` / 宿泊 ${stayPoints.length} 泊の夜間予報を分析` : '';
    setStatus(`分析完了：${points.length} 地点 × 最大 ${providers.length} モデル${stayMsg}。`);
    logEvent('weather_analysis',{success:true,duration_ms:performance.now()-startedAt,route_points:points.length,stay_count:stayPoints.length,metadata:{provider_count:providers.length}});
  }catch(e){ const msg=e.message||String(e); setStatus(msg,true); logEvent('weather_analysis',{success:false,duration_ms:performance.now()-startedAt,route_points:pointCount,stay_count:stayCount,error_message:msg}); }
  finally{$('analyzeBtn').disabled=false;}
}

async function analyzePoint(point){
  const settled=await Promise.allSettled(providers.map(p=>fetchProvider(p,point)));
  const rows=[];
  settled.forEach((s,i)=>{ if(s.status==='fulfilled'&&s.value) rows.push({provider:providers[i],row:s.value}); });
  if(!rows.length) throw new Error(`${point.name}: 予報データを取得できませんでした。`);
  const avgRow=averageRows(rows.map(x=>x.row));
  const grade=assessGrade(avgRow); const confidence=assessConfidence(rows.map(x=>x.row));
  return {point,providerRows:rows,...avgRow,grade,confidence,thunder:thunderLevel(avgRow)};
}


async function analyzeOvernightStay(point, nightNo){
  const arrivalM=timeToMinutes(point.time||'17:00');
  const windowStartM=Math.max(arrivalM,17*60);
  const startDate=point.date;
  const endDate=addDays(startDate,1);
  const nextStart=point.stay?.nextStart||'05:00';
  const startStamp=`${startDate}T${minutesToTime(windowStartM)}`;
  const endStamp=`${endDate}T${nextStart}`;
  const settled=await Promise.allSettled(providers.map(p=>fetchProviderWindow(p,point,startDate,endDate,startStamp,endStamp)));
  const modelRows=[];
  settled.forEach((x,i)=>{ if(x.status==='fulfilled'&&x.value) modelRows.push({provider:providers[i],...x.value}); });
  if(!modelRows.length) throw new Error(`${point.name}: 夜間予報を取得できませんでした。`);
  const minTemps=modelRows.map(x=>x.minTemp).filter(Number.isFinite);
  const totalRains=modelRows.map(x=>x.totalRain).filter(Number.isFinite);
  const maxWinds=modelRows.map(x=>x.maxWind).filter(Number.isFinite);
  const maxGusts=modelRows.map(x=>x.maxGust).filter(Number.isFinite);
  const meanClouds=modelRows.map(x=>x.meanCloud).filter(Number.isFinite);
  const capes=modelRows.map(x=>x.maxCape).filter(Number.isFinite);
  const vis=modelRows.map(x=>x.minVisibility).filter(Number.isFinite);
  const minTemp=minTemps.length?Math.min(...minTemps):NaN;
  const totalRain=totalRains.length?mean(totalRains):NaN;
  const maxHourlyRain=max(modelRows.map(x=>x.maxHourlyRain));
  const maxWind=max(maxWinds), maxGust=max(maxGusts), maxCape=max(capes);
  const meanCloud=mean(meanClouds), minVisibility=vis.length?Math.min(...vis):NaN;
  const feelsLike=windChillC(minTemp,maxWind);
  const thunder=thunderLevel({cape:maxCape,rain:maxHourlyRain});
  const risk=assessStayRisk({temp:minTemp,feelsLike,totalRain,maxHourlyRain,wind:maxWind,gust:maxGust,thunder},point.stay?.type);
  const confidence=assessStayConfidence(modelRows);
  return {point,night:nightNo,startStamp,endStamp,modelRows,minTemp,feelsLike,totalRain,maxHourlyRain,maxWind,maxGust,meanCloud,maxCape,minVisibility,thunder,risk,confidence};
}

async function fetchProviderWindow(provider,point,startDate,endDate,startStamp,endStamp){
  const params=new URLSearchParams({latitude:point.lat,longitude:point.lon,elevation:point.elevation,hourly:provider.vars.join(','),timezone:'Asia/Tokyo',start_date:startDate,end_date:endDate,wind_speed_unit:'ms'});
  if(provider.model) params.set('models',provider.model);
  const r=await proxyFetch(`${provider.endpoint}?${params}`);
  if(!r.ok) throw new Error(`${provider.name} HTTP ${r.status}`);
  const j=await r.json(); const h=j.hourly;
  if(!h?.time?.length) throw new Error(`${provider.name}: hourly dataなし`);
  const startMs=new Date(startStamp).getTime(), endMs=new Date(endStamp).getTime();
  const idx=[];
  h.time.forEach((t,i)=>{const ms=new Date(t).getTime(); if(ms>=startMs&&ms<=endMs) idx.push(i);});
  if(!idx.length) throw new Error(`${provider.name}: 宿泊時間帯データなし`);
  const vals=k=>idx.map(i=>numberOrNaN(h[k]?.[i])).filter(Number.isFinite);
  const temps=vals('temperature_2m'), rain=vals('precipitation'), winds=vals('wind_speed_10m'), gusts=vals('wind_gusts_10m'), clouds=vals('cloud_cover'), capes=vals('cape'), visibility=vals('visibility');
  return {
    minTemp:temps.length?Math.min(...temps):NaN,
    totalRain:rain.length?rain.reduce((a,b)=>a+b,0):NaN,
    maxHourlyRain:rain.length?Math.max(...rain):NaN,
    maxWind:winds.length?Math.max(...winds):NaN,
    maxGust:gusts.length?Math.max(...gusts):NaN,
    meanCloud:clouds.length?mean(clouds):NaN,
    maxCape:capes.length?Math.max(...capes):NaN,
    minVisibility:visibility.length?Math.min(...visibility):NaN
  };
}

function windChillC(temp,windMs){
  if(!Number.isFinite(temp)) return NaN;
  if(!Number.isFinite(windMs)||temp>10||windMs<1.3) return temp;
  const v=Math.max(4.8,windMs*3.6);
  return 13.12+0.6215*temp-11.37*Math.pow(v,0.16)+0.3965*temp*Math.pow(v,0.16);
}
function assessStayRisk(x,stayType){
  let score=0;
  const tent=stayType==='tent';
  if(x.feelsLike<=-5) score+=4; else if(x.feelsLike<=0) score+=3; else if(x.feelsLike<=5) score+=tent?2:1; else if(x.feelsLike<=10) score+=tent?1:0;
  if(x.totalRain>=15||x.maxHourlyRain>=5) score+=4; else if(x.totalRain>=7||x.maxHourlyRain>=2) score+=3; else if(x.totalRain>=2) score+=tent?2:1; else if(x.totalRain>=.5) score+=tent?1:0;
  if(x.gust>=20||x.wind>=15) score+=4; else if(x.gust>=15||x.wind>=10) score+=3; else if(x.gust>=10||x.wind>=7) score+=tent?2:1;
  if(x.thunder==='EXTREME') score+=4; else if(x.thunder==='HIGH') score+=3; else if(x.thunder==='MEDIUM') score+=1;
  return score>=9?'厳重':score>=6?'高':score>=3?'注意':'低';
}
function stayRiskRank(r){return ({'低':1,'注意':2,'高':3,'厳重':4})[r]||0;}
function assessStayConfidence(rows){
  const spread=k=>{const v=rows.map(x=>x[k]).filter(Number.isFinite);return v.length>1?Math.max(...v)-Math.min(...v):0;};
  if(spread('minTemp')>5||spread('totalRain')>8||spread('maxWind')>7) return 'LOW';
  if(spread('minTemp')>2.5||spread('totalRain')>3||spread('maxWind')>3.5) return 'MEDIUM';
  return 'HIGH';
}
function overnightAdvice(r){
  if(r.error) return '夜間予報を取得できませんでした。出発前に宿泊地の最新予報を再確認してください。';
  const tent=r.point.stay?.type==='tent'; const notes=[];
  if(r.feelsLike<=0) notes.push(tent?'防寒・シュラフ性能と濡れ対策を強く確認':'夜間の冷え込みに備えて防寒を強化');
  else if(r.feelsLike<=5) notes.push(tent?'シュラフとマットの保温力を確認':'早朝の冷え込みに注意');
  if(r.totalRain>=2) notes.push(tent?'テント設営場所の排水・浸水リスクを確認':'雨具・濡れ物の乾燥計画を用意');
  if(r.maxGust>=15) notes.push(tent?'強風時の設営・ペグ固定に注意':'建物周辺でも強風に注意');
  if(['HIGH','EXTREME'].includes(r.thunder)) notes.push('夕方〜夜の雷リスクが高ければ早めに安全な建物内へ');
  return notes.length?notes.join('。')+'。':'夜間条件は比較的落ち着く見込みです。出発直前の実況も確認してください。';
}
function formatStamp(s){return s?`${s.slice(5,10).replace('-','/')} ${s.slice(11,16)}`:'–';}
function renderOvernightCards(rows){
  const section=$('overnightSection'); if(!section) return;
  if(!rows?.length){ section.classList.add('hidden'); $('overnightCards').innerHTML=''; return; }
  section.classList.remove('hidden');
  $('overnightCards').innerHTML=rows.map(r=>{
    if(r.error) return `<article class="overnight-card overnight-error"><div class="overnight-head"><div><span class="moon-badge">🌙 ${r.night}泊目</span><h3>${esc(r.point.name)}</h3></div><span class="stay-risk risk-high">取得エラー</span></div><p>${esc(r.error)}</p></article>`;
    const cls=stayRiskRank(r.risk)>=4?'risk-severe':stayRiskRank(r.risk)>=3?'risk-high':stayRiskRank(r.risk)>=2?'risk-caution':'risk-low';
    const stayLabel=r.point.stay?.type==='tent'?'テント泊':'山小屋泊';
    return `<article class="overnight-card">
      <div class="overnight-head"><div><span class="moon-badge">🌙 ${r.night}泊目・${stayLabel}</span><h3>${esc(r.point.name)} <small>${r.point.elevation}m</small></h3><p>${formatStamp(r.startStamp)} → ${formatStamp(r.endStamp)}</p></div><span class="stay-risk ${cls}">${r.risk}</span></div>
      <div class="overnight-main-metrics"><div><small>最低気温</small><b>${num(r.minTemp)}℃</b></div><div><small>体感最低</small><b>${num(r.feelsLike)}℃</b></div><div><small>夜間降水</small><b>${num(r.totalRain)}mm</b></div><div><small>最大風</small><b>${num(r.maxWind)}m/s</b></div></div>
      <div class="overnight-sub-metrics"><span>突風 <b>${num(r.maxGust)}m/s</b></span><span>雲 <b>${num(r.meanCloud,0)}%</b></span><span>雷 <b>${r.thunder}</b></span><span>一致度 <b>${r.confidence}</b></span><span>${r.modelRows.length}/${providers.length}モデル</span></div>
      <div class="overnight-advice">${esc(overnightAdvice(r))}</div>
      <details class="overnight-models"><summary>モデル別の夜間値を見る</summary><div class="table-wrap"><table class="compact-table"><thead><tr><th>モデル</th><th>最低気温</th><th>夜間降水</th><th>最大風</th><th>突風</th><th>雲</th></tr></thead><tbody>${r.modelRows.map(x=>`<tr><td>${x.provider.name}</td><td>${num(x.minTemp)}℃</td><td>${num(x.totalRain)}mm</td><td>${num(x.maxWind)}m/s</td><td>${num(x.maxGust)}m/s</td><td>${num(x.meanCloud,0)}%</td></tr>`).join('')}</tbody></table></div></details>
    </article>`;
  }).join('');
}

async function fetchProvider(provider,point){
  const date=point.date||$('date').value;
  const params=new URLSearchParams({latitude:point.lat,longitude:point.lon,elevation:point.elevation,hourly:provider.vars.join(','),timezone:'Asia/Tokyo',start_date:date,end_date:date,wind_speed_unit:'ms'});
  if(provider.model) params.set('models',provider.model);
  const r=await proxyFetch(`${provider.endpoint}?${params}`); if(!r.ok) throw new Error(`${provider.name} HTTP ${r.status}`);
  const j=await r.json(); if(!j.hourly?.time) throw new Error(`${provider.name}: hourly dataなし`);
  const target=`${date}T${point.time}`; let idx=j.hourly.time.indexOf(target);
  if(idx<0){ idx=nearestTimeIndex(j.hourly.time,target); }
  if(idx<0) throw new Error(`${provider.name}: 指定時刻なし`);
  const h=j.hourly; const get=k=>Array.isArray(h[k])?numberOrNaN(h[k][idx]):NaN;
  return {time:h.time[idx],temp:get('temperature_2m'),rh:get('relative_humidity_2m'),rain:get('precipitation'),cloud:get('cloud_cover'),wind:get('wind_speed_10m'),gust:get('wind_gusts_10m'),windDir:get('wind_direction_10m'),cape:get('cape'),visibility:get('visibility'),freezing:get('freezing_level_height')};
}
function nearestTimeIndex(times,target){ const t=new Date(target).getTime(); let best=-1,d=Infinity; times.forEach((s,i)=>{const x=Math.abs(new Date(s).getTime()-t);if(x<d){d=x;best=i;}});return best; }
function numberOrNaN(v){ const n=Number(v); return Number.isFinite(n)?n:NaN; }
function mean(vals){ const x=vals.filter(Number.isFinite); return x.length?x.reduce((a,b)=>a+b,0)/x.length:NaN; }
function max(vals){ const x=vals.filter(Number.isFinite); return x.length?Math.max(...x):NaN; }
function averageRows(rows){ return {temp:mean(rows.map(x=>x.temp)),rain:mean(rows.map(x=>x.rain)),cloud:mean(rows.map(x=>x.cloud)),wind:mean(rows.map(x=>x.wind)),gust:max(rows.map(x=>x.gust)),cape:max(rows.map(x=>x.cape)),visibility:mean(rows.map(x=>x.visibility)),freezing:mean(rows.map(x=>x.freezing))}; }
function assessGrade(x){
  let score=0;
  if(x.wind>=20||x.gust>=25) score+=4; else if(x.wind>=15||x.gust>=20) score+=3; else if(x.wind>=10||x.gust>=15) score+=2; else if(x.wind>=7) score+=1;
  if(x.rain>=8) score+=4; else if(x.rain>=4) score+=3; else if(x.rain>=1.5) score+=2; else if(x.rain>=.3) score+=1;
  if(x.cape>=1000) score+=3; else if(x.cape>=500) score+=2; else if(x.cape>=200) score+=1;
  if(x.cloud>=95) score+=1; if(Number.isFinite(x.visibility)&&x.visibility<500) score+=2;
  if(x.temp<=-5) score+=2; else if(x.temp<=0) score+=1;
  return score>=8?'E':score>=6?'D':score>=4?'C':score>=2?'B':'A';
}
function thunderLevel(x){ if(x.cape>=1000&&x.rain>=1) return 'EXTREME'; if(x.cape>=500|| (x.cape>=200&&x.rain>=1)) return 'HIGH'; if(x.cape>=100||x.rain>=2) return 'MEDIUM'; return 'LOW'; }
function assessConfidence(rows){
  const spread=(key)=>{const v=rows.map(x=>x[key]).filter(Number.isFinite);return v.length>1?Math.max(...v)-Math.min(...v):0;};
  const wind=spread('wind'),rain=spread('rain'),temp=spread('temp');
  if(wind>7||rain>4||temp>6) return 'LOW'; if(wind>3.5||rain>1.5||temp>3) return 'MEDIUM'; return 'HIGH';
}

function renderAll(points){
  ['summary','routeForecastSection','timelineSection','modelsSection','decisionSection'].forEach(id=>$(id).classList.remove('hidden'));
  renderOvernightCards(overnightResults);
  const worst=points.reduce((a,b)=>gradeRank(b.grade)>gradeRank(a.grade)?b:a,points[0]);
  const best=points.reduce((a,b)=>gradeRank(b.grade)<gradeRank(a.grade)?b:a,points[0]);
  $('grade').textContent=worst.grade; $('verdict').textContent=verdictFor(worst.grade);
  $('bestWindow').textContent=`${best.point.date||''} ${best.point.time} ${best.point.name}`;
  $('maxWind').textContent=`${num(max(points.flatMap(x=>x.providerRows.map(y=>y.row.wind))))} m/s`;
  $('maxRain').textContent=`${num(max(points.flatMap(x=>x.providerRows.map(y=>y.row.rain))))} mm/h`;
  $('thunderRisk').textContent=maxThunder(points.map(x=>x.thunder));
  $('confidence').textContent=overallConfidence(points.map(x=>x.confidence));
  $('updatedAt').textContent=`更新 ${new Date().toLocaleString('ja-JP')}`;
  const severeNight=overnightResults.filter(x=>!x.error).sort((a,b)=>stayRiskRank(b.risk)-stayRiskRank(a.risk))[0];
  const nightNote=severeNight&&stayRiskRank(severeNight.risk)>=3?` 宿泊では <b>${esc(severeNight.point.name)}</b> の夜間リスクが <b>${severeNight.risk}</b> です。`:'';
  $('warningBox').innerHTML=`最も厳しい地点は <b>${esc(worst.point.name)}</b>（${worst.point.date||''} ${worst.point.time} / ${worst.point.elevation}m）で評価 <b>${worst.grade}</b>。${trailSegments.length?'実登山道ルート':'概略ルート'}を区間の厳しい側の評価で色分けします。${nightNote}`;
  if(routeSummary) renderRouteEngineering();
  renderRouteCards(points); renderTimeline(points); renderModelDetails(points); renderRetreat(points);
}
function gradeRank(g){return ({A:1,B:2,C:3,D:4,E:5})[g]||9;} function verdictFor(g){return ({A:'かなり良好',B:'概ね登山可能',C:'注意が必要',D:'かなり厳しい',E:'中止推奨'})[g]||'–';}
function maxThunder(levels){ const r={LOW:1,MEDIUM:2,HIGH:3,EXTREME:4}; return levels.sort((a,b)=>r[b]-r[a])[0]||'LOW'; }
function overallConfidence(vals){ return vals.includes('LOW')?'LOW':vals.includes('MEDIUM')?'MEDIUM':'HIGH'; }
function num(v,d=1){ return Number.isFinite(v)?v.toFixed(d):'–'; }

function renderRouteCards(points){
  $('routeForecastCards').innerHTML=points.map((r,i)=>`<article class="route-forecast-card">
    <div class="route-card-top"><div><span class="route-step">${String(i+1).padStart(2,'0')}</span><h3>${esc(r.point.name)}</h3><span class="type-chip">${TYPE_LABEL[r.point.type]}</span></div><span class="pill ${r.grade}">${r.grade}</span></div>
    <div class="route-meta"><b>${r.point.date||''} ${r.point.time}</b><span>${r.point.elevation}m</span><span>${r.providerRows.length}/${providers.length}モデル</span></div>
    <div class="forecast-metrics"><div><small>気温</small><b>${num(r.temp)}℃</b></div><div><small>風</small><b>${num(r.wind)} m/s</b></div><div><small>突風</small><b>${num(r.gust)} m/s</b></div><div><small>雨</small><b>${num(r.rain)} mm</b></div><div><small>雲</small><b>${num(r.cloud,0)}%</b></div><div><small>雷</small><b>${r.thunder}</b></div></div>
    <div class="confidence-line">モデル一致度 <b>${r.confidence}</b></div>
  </article>`).join('');
}
function renderTimeline(points){ $('timelineBody').innerHTML=points.map(r=>`<tr><td>${r.point.date||''}<br>${r.point.time}</td><td>${TYPE_LABEL[r.point.type]}</td><td>${esc(r.point.name)}</td><td>${r.point.elevation}m</td><td><span class="pill ${r.grade}">${r.grade}</span></td><td>${num(r.temp)}℃</td><td>${num(r.wind)} m/s</td><td>${num(r.gust)} m/s</td><td>${num(r.rain)} mm</td><td>${num(r.cloud,0)}%</td><td>${r.thunder}</td><td>${r.confidence}</td></tr>`).join(''); }
function renderModelDetails(points){
  $('modelDetails').innerHTML=points.map(r=>`<article class="model-detail-block"><div class="model-detail-title"><div><b>${r.point.date||''} ${r.point.time}</b><h3>${esc(r.point.name)}</h3><span>${TYPE_LABEL[r.point.type]} / ${r.point.elevation}m</span></div><span class="pill ${r.grade}">${r.grade}</span></div><div class="table-wrap"><table class="compact-table"><thead><tr><th>モデル</th><th>気温</th><th>風</th><th>突風</th><th>雨</th><th>雲</th><th>CAPE</th><th>視程</th></tr></thead><tbody>${r.providerRows.map(x=>`<tr><td>${x.provider.name}</td><td>${num(x.row.temp)}℃</td><td>${num(x.row.wind)} m/s</td><td>${num(x.row.gust)} m/s</td><td>${num(x.row.rain)} mm</td><td>${num(x.row.cloud,0)}%</td><td>${num(x.row.cape,0)}</td><td>${Number.isFinite(x.row.visibility)?Math.round(x.row.visibility)+'m':'–'}</td></tr>`).join('')}</tbody></table></div></article>`).join('');
}
function renderRetreat(points){
  const worstWind=max(points.map(x=>x.wind)),worstRain=max(points.map(x=>x.rain)),worstThunder=points.some(x=>['HIGH','EXTREME'].includes(x.thunder));
  const lines=[`稜線・高所の平均風が 15 m/s 以上${worstWind>=15?'（今回の平均値で到達）':''}`,`最大瞬間風速が 20 m/s 以上、または身体が煽られる状態が継続`,`雷鳴・落雷兆候を確認${worstThunder?'（今回の予報では雷リスク上昇地点あり）':''}`,`1時間降水量 5 mm 以上${worstRain>=5?'（今回の予報で到達）':''}`,`視程が100m前後まで低下し、ルートファインディングが困難`,`予報より悪化が早い・モデルのLOW一致度地点で実況が悪い`];
  $('retreatLines').innerHTML=lines.map(x=>`<li>${x}</li>`).join('');
}
function setStatus(text,error=false){ $('status').textContent=text; $('status').classList.remove('hidden'); $('status').classList.toggle('error',error); }
