(() => {
"use strict";
const VERSION="3.0.1",DATA_SCHEMA=6,KEY="volleyball-trainer-v2-2",TEST_PASSWORD="";
const OFFLINE_META_KEY=`${KEY}-offline-meta`;
function loadOfflineMeta(){try{return{deviceId:"",lastOnlineLoadAt:"",lastSuccessfulSyncAt:"",lastLocalSaveAt:"",pendingLocalChanges:false,...JSON.parse(localStorage.getItem(OFFLINE_META_KEY)||"{}")}}catch{return{deviceId:"",lastOnlineLoadAt:"",lastSuccessfulSyncAt:"",lastLocalSaveAt:"",pendingLocalChanges:false}}}
let offlineMeta=loadOfflineMeta();
if(!offlineMeta.deviceId)offlineMeta.deviceId=(globalThis.crypto?.randomUUID?.()||`device-${Date.now()}-${Math.random().toString(16).slice(2)}`);
function persistOfflineMeta(){localStorage.setItem(OFFLINE_META_KEY,JSON.stringify(offlineMeta))}
function isoNow(){return new Date().toISOString()}
function formatStamp(value){if(!value)return"noch nie";const d=new Date(value);return Number.isNaN(d.getTime())?"unbekannt":new Intl.DateTimeFormat("de-DE",{dateStyle:"short",timeStyle:"short"}).format(d)}
persistOfflineMeta();
const ownRoster=[{id:"a1",base:1,team:"own"},{id:"z1",base:2,team:"own"},{id:"m1",base:3,team:"own"},{id:"a2",base:4,team:"own"},{id:"z2",base:5,team:"own"},{id:"m2",base:6,team:"own"}];
const defaultRoles={a1:"AA",z1:"Z",m1:"MB",a2:"AA",z2:"Z",m2:"MB"};
const opponentRoster=[{id:"oa1",role:"AA",base:1,team:"opponent"},{id:"oz1",role:"Z",base:2,team:"opponent"},{id:"om1",role:"MB",base:3,team:"opponent"},{id:"oa2",role:"AA",base:4,team:"opponent"},{id:"oz2",role:"Z",base:5,team:"opponent"},{id:"om2",role:"MB",base:6,team:"opponent"}];
const allPlayers=[...ownRoster,...opponentRoster];
const ownSlots={1:{x:520,y:735},2:{x:520,y:545},3:{x:350,y:545},4:{x:180,y:545},5:{x:180,y:735},6:{x:350,y:735}};
const opponentSlots={1:{x:180,y:165},2:{x:180,y:355},3:{x:350,y:355},4:{x:520,y:355},5:{x:520,y:165},6:{x:350,y:165}};
const ids=["authGate","appMain","loginForm","loginEmail","loginPassword","loginSubmit","invitePasswordForm","invitePassword","invitePasswordRepeat","forgotPassword","authStatus","platformOnlyGate","platformOnlyAdminOpen","platformOnlyLogout","accountButton","accountDialog","closeAccount","accountName","accountEmail","accountRoles","clubSwitcherWrap","teamContextSelect","platformAdminOpen","clubAdminOpen","platformAdminDialog","closePlatformAdmin","platformAdminContent","platformAdminRefresh","clubAdminDialog","closeClubAdmin","clubAdminContent","clubAdminRefresh","logoutButton","teamNameInput","teamConfigClose","teamConfigPanel","teamConfigToggle","deleteTeam","addTeam","teamSelect","infoButton","editButton","rotationSelect","situationConfigToggle","situationConfigPanel","situationConfigClose","situationBaseNameWrap","situationBaseName","situationNameLabel","situationNameEdit","situationNameHint","situationNameInput","saveSituation","addSituation","deleteSituation","stepNumber","stepTotal","prevStep","playButton","nextStep","stepEditPanel","stepNameWrap","stepNamePreset","stepNameInput","newStepNaming","saveStep","addStep","deleteStep","actionMenuToggle","actionMenuClose","editPanel","currentStepTitle","court","validationLayer","movementLayer","ballPathLayer","playerLayer","ballObject","tapNotice","status","infoDialog","closeInfo","closeInfoBottom","infoSituation","infoDataSource","lineupEditor","lineupGrid","liberoToggle","syncBadge","jsBuildBadge","passwordDialog","closePassword","cancelPassword","confirmPassword","passwordInput","passwordStatus","migrationPanel","dataSourceStatus","migrateLocalButton","migrationHint","syncTimeStatus","infoSyncStatus","viewToggle","view2d","view25d","positionInfoToggle","court25d","court25Floor","movement25Layer","ballPath25Layer","action25Layer","player25Layer","ball25Object","actionPanel","actionType","actionActorWrap","actionActor","actionTechniqueWrap","actionTechnique","actionHelperWrap","actionHelper","actionOutcomeWrap","actionOutcome","actionReasonWrap","actionReason","attackBlockWrap","attackBlocker1","attackBlocker2","snapBallToActor","clearAction","actionHint","actionSummary","actionLayer","ruleCheck","ruleCheckToggle","ruleCheckSummary","ruleCheckChevron","ruleCheckDetails","stepStrip","tacticLaunch","tacticPanel","tacticPrev","tacticNext","tacticReset","tacticExit","tacticTitle","tacticContext","tacticStepTitle"];
const e=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
if(e.jsBuildBadge)e.jsBuildBadge.textContent=`JS ${VERSION} geladen`;window.addEventListener("error",ev=>{if(e.jsBuildBadge)e.jsBuildBadge.textContent=`JS-Fehler ${VERSION}: ${ev.message||"unbekannt"}`});
const roleNames={AA:"Außen",MB:"Mitte",Z:"Zuspiel",D:"Diagonal",L:"Libero"};
const rot=(p,n)=>{let r=p;for(let i=0;i<n;i++)r=r===1?6:r-1;return r};
const initialStep=r=>{const positions={};ownRoster.forEach(p=>positions[p.id]={...ownSlots[rot(p.base,r)]});opponentRoster.forEach(p=>positions[p.id]={...opponentSlots[p.base]});return{name:"Grundposition",positions,ball:{x:450,y:650},action:{type:"",actorId:"",technique:"",helperId:"",blocker1Id:"",blocker2Id:"",outcome:"",reason:""}}};
const defaultSituationName=i=>i===0?"GA":`GA +${i}`;
const legacySituationName=i=>i===0?"Grundaufstellung":`Grundaufstellung +${i}`;
const situationDisplayName=rotation=>{if(rotation?.baseName){const suffix=(rotation.nameSuffix||"").trim();return suffix?`${rotation.baseName} – ${suffix}`:rotation.baseName}return rotation?.name||"Spielsituation"};
const freshTeam=(name="Hauptaufstellung")=>({name,teamConfig:{roles:{...defaultRoles},libero:false},rotations:Array.from({length:6},(_,r)=>({name:defaultSituationName(r),baseName:defaultSituationName(r),nameSuffix:"",rotationOffset:r,steps:[initialStep(r)]}))});
const fresh=()=>({schemaVersion:DATA_SCHEMA,teamIndex:0,rotation:0,step:0,teams:[freshTeam()]});
const hadLocalStateAtStartup=Boolean(localStorage.getItem(KEY));
let state;try{state=JSON.parse(localStorage.getItem(KEY)||"null")||fresh()}catch{state=fresh()}
function normalizeStep(step,rotation){
  let changed=false;step.positions=step.positions||{};
  ownRoster.forEach(p=>{if(!step.positions[p.id]){step.positions[p.id]={...ownSlots[rot(p.base,rotation.rotationOffset)]};changed=true}});
  opponentRoster.forEach(p=>{if(!step.positions[p.id]){step.positions[p.id]={...opponentSlots[p.base]};changed=true}});
  if(!step.ball){step.ball={x:450,y:650};changed=true}
  if(!step.name){step.name="Grundposition";changed=true}
  if(Object.prototype.hasOwnProperty.call(step,"situation")){delete step.situation;changed=true}
  const old=step.action||{};const type=old.type||"",actorId=old.actorId||"",helperId=old.helperId||"",blocker1Id=old.blocker1Id||"",blocker2Id=old.blocker2Id||"",outcome=old.outcome||"",reason=old.reason||"";
  let technique=old.technique||"";if(technique==="oben")technique="upper";if(technique==="unten")technique="lower";
  if(["receive","set","defense"].includes(type)&&!["upper","lower"].includes(technique))technique="upper";if(!["receive","set","defense"].includes(type))technique="";
  const normalized={type,actorId:type==="point"?"":actorId,technique,helperId:type==="block"?helperId:"",blocker1Id:type==="attack"?blocker1Id:"",blocker2Id:type==="attack"?blocker2Id:"",outcome:type==="point"?(outcome||"own"):"",reason:type==="point"?(reason||"ground"):""};
  if(JSON.stringify(normalized)!==JSON.stringify({type:old.type||"",actorId:old.actorId||"",technique:old.technique||"",helperId:old.helperId||"",blocker1Id:old.blocker1Id||"",blocker2Id:old.blocker2Id||"",outcome:old.outcome||"",reason:old.reason||""}))changed=true;
  step.action=normalized;return changed;
}
function normalizeTeam(team,index){
  let changed=false;if(!team.name){team.name=index===0?"Hauptaufstellung":`Teamaufstellung ${index+1}`;changed=true}
  if(!team.teamConfig){team.teamConfig={roles:{...defaultRoles},libero:false};changed=true}
  const mergedRoles={...defaultRoles,...(team.teamConfig.roles||{})};if(JSON.stringify(mergedRoles)!==JSON.stringify(team.teamConfig.roles||{}))changed=true;team.teamConfig.roles=mergedRoles;team.teamConfig.libero=Boolean(team.teamConfig.libero);
  if(!Array.isArray(team.rotations)||!team.rotations.length){team.rotations=freshTeam(team.name).rotations;changed=true}
  team.rotations.forEach((rotation,r)=>{if(!rotation.name){rotation.name=defaultSituationName(r);changed=true}const offset=Number.isFinite(Number(rotation.rotationOffset))?Number(rotation.rotationOffset)%6:r%6;if(rotation.rotationOffset!==offset){rotation.rotationOffset=offset;changed=true}const canonical=defaultSituationName(offset),legacy=legacySituationName(offset);if(!rotation.baseName&&(rotation.name===canonical||rotation.name===legacy)){rotation.baseName=canonical;rotation.nameSuffix="";changed=true}if(rotation.baseName){if(rotation.baseName!==canonical){rotation.baseName=canonical;changed=true}if(typeof rotation.nameSuffix!=="string"){rotation.nameSuffix="";changed=true}const display=situationDisplayName(rotation);if(rotation.name!==display){rotation.name=display;changed=true}}if(!Array.isArray(rotation.steps)||!rotation.steps.length){rotation.steps=[initialStep(offset)];changed=true}rotation.steps.forEach(step=>{if(normalizeStep(step,rotation))changed=true})});
  return changed;
}
function migrate(){
  let changed=false;
  if(!state||typeof state!=="object"){state=fresh();return true}
  // 2.6.x -> 2.7.0: bisherige Hauptaufstellung unverändert als erste Teamaufstellung übernehmen.
  if(!Array.isArray(state.teams)||!state.teams.length){
    if(Array.isArray(state.rotations)&&state.rotations.length){state.teams=[{name:"Hauptaufstellung",teamConfig:state.teamConfig||{roles:{...defaultRoles},libero:false},rotations:state.rotations}];}
    else state.teams=[freshTeam()];
    delete state.rotations;delete state.teamConfig;state.teamIndex=0;changed=true;
  }
  if(Number(state.schemaVersion)!==DATA_SCHEMA){state.schemaVersion=DATA_SCHEMA;changed=true}
  state.teams.forEach((team,i)=>{if(normalizeTeam(team,i))changed=true});
  const teamIndex=Math.max(0,Math.min(state.teams.length-1,Number(state.teamIndex)||0));if(teamIndex!==state.teamIndex){state.teamIndex=teamIndex;changed=true}else state.teamIndex=teamIndex;
  const rotations=state.teams[state.teamIndex].rotations;const rotation=Math.max(0,Math.min(rotations.length-1,Number(state.rotation)||0));if(rotation!==state.rotation){state.rotation=rotation;changed=true}else state.rotation=rotation;
  const step=Math.max(0,Math.min(rotations[state.rotation].steps.length-1,Number(state.step)||0));if(step!==state.step){state.step=step;changed=true}else state.step=step;
  return changed;
}
const localMigrationApplied=migrate();if(localMigrationApplied)localStorage.setItem(KEY,JSON.stringify(state));
let editing=false,selected=null,dragging=null,playing=false,animations=[],editorPassword=null,lineupOpen=false,teamConfigOpen=false,situationConfigOpen=false,committedState=structuredClone(state),dirty=false,namingNewStep=false,actionMenuOpen=false,tacticMode=false,tacticSourceState=null,tacticPreviousView="2d",tacticChanged=false;
let remoteHasData=false,dataSource=hadLocalStateAtStartup?"browser":"default";
let preferredView=localStorage.getItem("volleyball-trainer-view")||"2d";if(!["2d","25d"].includes(preferredView))preferredView="2d";
let showPositionInfo=localStorage.getItem("volleyball-trainer-position-info")!=="off";
const td=()=>state.teams[state.teamIndex],rd=()=>td().rotations[state.rotation],sd=()=>rd().steps[state.step],rname=n=>situationDisplayName(td().rotations[n])||defaultSituationName(n),prot=p=>rot(p.base,rd().rotationOffset||0),pat=n=>ownRoster.find(p=>prot(p)===n);
const supabaseKey=()=>window.APP_CONFIG?.SUPABASE_PUBLISHABLE_KEY||window.APP_CONFIG?.SUPABASE_ANON_KEY||"";
const supabaseConfigured=()=>Boolean(window.APP_CONFIG?.SUPABASE_URL&&supabaseKey());
const AUTH_KEY="volleyball-trainer-auth-v3";
const ACCESS_KEY="volleyball-trainer-access-v3";
const TEAM_KEY="volleyball-trainer-team-v3";
let authSession=null,userAccess=null,currentTeamId=localStorage.getItem(TEAM_KEY)||"";
function authHeaders(token=authSession?.access_token){const h={"Content-Type":"application/json",apikey:supabaseKey()};if(token)h.Authorization=`Bearer ${token}`;return h}
function persistSession(session){authSession=session||null;if(session)localStorage.setItem(AUTH_KEY,JSON.stringify(session));else localStorage.removeItem(AUTH_KEY)}
function readSession(){try{return JSON.parse(localStorage.getItem(AUTH_KEY)||"null")}catch{return null}}
function jwtExp(token){try{return Number(JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).exp||0)}catch{return 0}}
async function refreshSession(){if(!authSession?.refresh_token||!navigator.onLine)return authSession;const base=window.APP_CONFIG.SUPABASE_URL.replace(/\/$/,"");const r=await fetch(`${base}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:authHeaders(null),body:JSON.stringify({refresh_token:authSession.refresh_token})});if(!r.ok){persistSession(null);throw new Error("Sitzung abgelaufen")};persistSession(await r.json());return authSession}
async function ensureSession(){authSession=readSession();if(!authSession)return null;if(navigator.onLine&&jwtExp(authSession.access_token)*1000<Date.now()+60000)await refreshSession();return authSession}
async function signIn(email,password){const base=window.APP_CONFIG.SUPABASE_URL.replace(/\/$/,"");const r=await fetch(`${base}/auth/v1/token?grant_type=password`,{method:"POST",headers:authHeaders(null),body:JSON.stringify({email,password})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.msg||j.message||"Anmeldung fehlgeschlagen");persistSession(j);return j}
async function authUserUpdate(body,token=authSession?.access_token){const base=window.APP_CONFIG.SUPABASE_URL.replace(/\/$/,"");const r=await fetch(`${base}/auth/v1/user`,{method:"PUT",headers:authHeaders(token),body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.msg||j.message||"Konto konnte nicht aktualisiert werden");return j}
async function sendRecovery(email){const base=window.APP_CONFIG.SUPABASE_URL.replace(/\/$/,"");const redirectTo=location.origin+location.pathname;const r=await fetch(`${base}/auth/v1/recover`,{method:"POST",headers:authHeaders(null),body:JSON.stringify({email,redirect_to:redirectTo})});if(!r.ok)throw new Error("E-Mail konnte nicht gesendet werden")}
function parseAuthHash(){const h=new URLSearchParams(location.hash.replace(/^#/,''));const type=h.get('type');const access_token=h.get('access_token'),refresh_token=h.get('refresh_token');if(access_token&&(type==='invite'||type==='recovery')){persistSession({access_token,refresh_token,token_type:'bearer'});history.replaceState(null,'',location.pathname+location.search);return type}return null}
async function authedRpc(name,body={}){if(!authSession?.access_token)throw new Error("Nicht angemeldet");const base=window.APP_CONFIG.SUPABASE_URL.replace(/\/$/,"");const res=await fetch(`${base}/rest/v1/rpc/${name}`,{method:"POST",headers:authHeaders(),body:JSON.stringify(body)});if(res.status===401&&navigator.onLine){await refreshSession();return authedRpc(name,body)}if(!res.ok)throw new Error((await res.text())||`HTTP ${res.status}`);const text=await res.text();return text?JSON.parse(text):null}
function allTeams(access=userAccess){const out=[];(access?.clubs||[]).forEach(c=>(c.teams||[]).forEach(t=>out.push({...t,club_id:c.id,club_name:c.name,roles:c.roles||[]})));return out}
function selectedTeam(){const teams=allTeams();return teams.find(t=>t.id===currentTeamId)||teams[0]||null}
function hasRole(role){return Boolean(selectedTeam()?.roles?.includes(role))}
function canView(){return hasRole('viewer')||hasRole('editor')}
function canEdit(){return hasRole('editor')}
function esc(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
function roleLabel(role){return role==='club_admin'?'Vereinsadmin':role==='editor'?'Bearbeiter':role==='viewer'?'Viewer':role}
function currentClub(){const t=selectedTeam();return (userAccess?.clubs||[]).find(c=>c.id===t?.club_id)||null}
function isClubAdmin(){return Boolean(currentClub()?.roles?.includes('club_admin'))}
function renderAccount(){if(!e.accountRoles)return;const t=selectedTeam();e.accountName.textContent=userAccess?.display_name||authSession?.user?.email||"Konto";e.accountEmail.textContent=authSession?.user?.email||"";const roles=[];if(userAccess?.platform_admin)roles.push(`Superadmin${userAccess.platform_admin_code?` · ${userAccess.platform_admin_code}`:''}`);(t?.roles||[]).forEach(r=>roles.push(roleLabel(r)));e.accountRoles.innerHTML=roles.map(r=>`<span class="role-chip">${esc(r)}</span>`).join('');const teams=allTeams();e.clubSwitcherWrap.classList.toggle('hidden',teams.length<2);e.teamContextSelect.innerHTML=teams.map(x=>`<option value="${esc(x.id)}" ${x.id===t?.id?'selected':''}>${esc(x.club_name)} · ${esc(x.name)}</option>`).join('');e.platformAdminOpen?.classList.toggle('hidden',!userAccess?.platform_admin);e.clubAdminOpen?.classList.toggle('hidden',!isClubAdmin())}
function renderRoleChips(roles=[]){return roles.map(r=>`<span class="admin-role ${esc(r)}">${esc(roleLabel(r))}</span>`).join('')||'<span class="admin-role muted">keine Rolle</span>'}
function memberRow(m){const name=m.display_name||m.email||'Benutzer';return `<div class="admin-member"><div class="admin-member-main"><strong>${esc(name)}</strong><span>${esc(m.email||'')}</span></div><div class="admin-member-roles">${renderRoleChips(m.roles||[])}</div>${m.active===false?'<span class="admin-state inactive">inaktiv</span>':''}</div>`}
function renderPlatformOverview(data){const clubs=data?.clubs||[],admins=data?.platform_admins||[];const memberCount=clubs.reduce((n,c)=>n+(c.members?.length||0),0);e.platformAdminContent.innerHTML=`<div class="admin-summary"><div><strong>${clubs.length}</strong><span>Vereine</span></div><div><strong>${memberCount}</strong><span>Mitgliedschaften</span></div><div><strong>${admins.length}</strong><span>Superadmins</span></div></div><section class="admin-section"><h3>Superadmins</h3>${admins.map(a=>`<div class="admin-member"><div class="admin-member-main"><strong>${esc(a.admin_code)}</strong><span>${esc(a.display_name||a.email||'')}</span><small>${esc(a.email||'')}</small></div>${a.active===false?'<span class="admin-state inactive">inaktiv</span>':'<span class="admin-state">aktiv</span>'}</div>`).join('')||'<p class="hint">Keine Superadmins gefunden.</p>'}</section><section class="admin-section"><h3>Vereine</h3>${clubs.map(c=>`<article class="admin-club"><div class="admin-club-head"><div><strong>${esc(c.name)}</strong><span>${esc(c.slug)}</span></div><span class="admin-state ${c.active===false?'inactive':''}">${c.active===false?'inaktiv':'aktiv'}</span></div><div class="admin-club-meta">${Number(c.team_count)||0} Mannschaft(en) · ${c.members?.length||0} Benutzer</div><div class="admin-member-list">${(c.members||[]).map(memberRow).join('')||'<p class="hint">Noch keine Benutzer.</p>'}</div></article>`).join('')||'<p class="hint">Keine Vereine vorhanden.</p>'}</section>`}
function renderClubOverview(data){const c=data?.club||{},teams=data?.teams||[],members=data?.members||[];e.clubAdminContent.innerHTML=`<div class="admin-club-title"><strong>${esc(c.name||'Verein')}</strong><span>${esc(c.slug||'')}</span></div><div class="admin-summary"><div><strong>${teams.length}</strong><span>Mannschaften</span></div><div><strong>${members.length}</strong><span>Benutzer</span></div></div><section class="admin-section"><h3>Mannschaften</h3><div class="admin-team-list">${teams.map(t=>`<div class="admin-team"><strong>${esc(t.name)}</strong><span class="admin-state ${t.active===false?'inactive':''}">${t.active===false?'inaktiv':'aktiv'}</span></div>`).join('')||'<p class="hint">Keine Mannschaften vorhanden.</p>'}</div></section><section class="admin-section"><h3>Benutzer & Rollen</h3><div class="admin-member-list">${members.map(memberRow).join('')||'<p class="hint">Noch keine Benutzer.</p>'}</div></section>`}
async function openPlatformAdmin(){if(!navigator.onLine){e.platformAdminContent.innerHTML='<p class="admin-error">Die Plattformverwaltung ist nur online verfügbar.</p>';e.platformAdminDialog.showModal();return}e.platformAdminContent.innerHTML='<p class="hint">Wird geladen …</p>';e.accountDialog.close();e.platformAdminDialog.showModal();try{renderPlatformOverview(await authedRpc('get_platform_overview'))}catch(err){e.platformAdminContent.innerHTML=`<p class="admin-error">${esc(err.message)}</p>`}}
async function openClubAdmin(){const club=currentClub();if(!club)return;if(!navigator.onLine){e.clubAdminContent.innerHTML='<p class="admin-error">Die Vereinsverwaltung ist nur online verfügbar.</p>';e.clubAdminDialog.showModal();return}e.clubAdminContent.innerHTML='<p class="hint">Wird geladen …</p>';e.accountDialog.close();e.clubAdminDialog.showModal();try{renderClubOverview(await authedRpc('get_club_overview',{p_club_id:club.id}))}catch(err){e.clubAdminContent.innerHTML=`<p class="admin-error">${esc(err.message)}</p>`}}
async function loadAccess(){if(!navigator.onLine){try{userAccess=JSON.parse(localStorage.getItem(ACCESS_KEY)||'null')}catch{};return userAccess}userAccess=await authedRpc('get_my_access');localStorage.setItem(ACCESS_KEY,JSON.stringify(userAccess));const teams=allTeams();if(!teams.some(t=>t.id===currentTeamId)){currentTeamId=teams[0]?.id||'';if(currentTeamId)localStorage.setItem(TEAM_KEY,currentTeamId)}return userAccess}
function showApp(){document.body.classList.remove('auth-pending');e.authGate.classList.add('hidden');e.platformOnlyGate?.classList.add('hidden');e.appMain.classList.remove('auth-hidden');e.editButton.classList.toggle('hidden',!canEdit());renderAccount()}
function showPlatformOnly(){document.body.classList.remove('auth-pending');e.authGate.classList.add('hidden');e.appMain.classList.add('auth-hidden');e.platformOnlyGate?.classList.remove('hidden')}
function showLogin(msg=''){e.platformOnlyGate?.classList.add('hidden');e.authGate.classList.remove('hidden');e.appMain.classList.add('auth-hidden');e.authStatus.textContent=msg}

function updateMigrationUI(){
  if(!e.dataSourceStatus)return;
  const online=navigator.onLine;
  let sourceText;
  if(!online)sourceText="Offline – lokal";
  else if(offlineMeta.pendingLocalChanges)sourceText="Lokale Altänderung aus 2.8.0 – nicht synchronisiert";
  else sourceText=dataSource==="supabase"?"Supabase":dataSource==="browser"?"Browser – lokale Daten":"Standarddaten – noch nicht gespeichert";
  e.dataSourceStatus.textContent=sourceText;
  if(e.syncTimeStatus){
    const parts=[];
    if(offlineMeta.lastSuccessfulSyncAt)parts.push(`Sync: ${formatStamp(offlineMeta.lastSuccessfulSyncAt)}`);
    else if(offlineMeta.lastOnlineLoadAt)parts.push(`Online geladen: ${formatStamp(offlineMeta.lastOnlineLoadAt)}`);
    if(offlineMeta.lastLocalSaveAt)parts.push(`Lokal: ${formatStamp(offlineMeta.lastLocalSaveAt)}`);
    e.syncTimeStatus.textContent=parts.join(" · ")||"Noch keine Synchronisierung protokolliert";
  }
  const canMigrate=editing&&online&&supabaseConfigured()&&!remoteHasData&&hadLocalStateAtStartup&&dataSource!=="supabase"&&!offlineMeta.pendingLocalChanges;
  e.migrateLocalButton.classList.toggle("hidden",!canMigrate);
  e.migrationHint.classList.toggle("hidden",!canMigrate);
}
function rpcHeaders(){return authHeaders()}
async function rpc(name,body={}){return authedRpc(name,body)}
async function loadRemote(){
  if(!navigator.onLine){e.syncBadge.textContent="Offline – lokale Daten";dataSource=hadLocalStateAtStartup?"browser":"default";updateMigrationUI();return}
  if(!supabaseConfigured()){e.syncBadge.textContent="Speicherung: Browser (Supabase noch nicht konfiguriert)";dataSource=hadLocalStateAtStartup?"browser":"default";updateMigrationUI();return}
  if(offlineMeta.pendingLocalChanges){
    dataSource="browser";e.syncBadge.textContent="Lokale Änderungen warten auf Abgleich";e.status.textContent="Lokale Offline-Änderungen wurden geschützt und nicht durch Supabase überschrieben.";updateMigrationUI();return;
  }
  e.syncBadge.textContent="Speicherung: Supabase verbunden";
  try{
    const remote=await rpc("load_team_state",{p_team_id:currentTeamId});
    offlineMeta.lastOnlineLoadAt=isoNow();persistOfflineMeta();
    if(remote&&(Array.isArray(remote.teams)||Array.isArray(remote.rotations))){
      remoteHasData=true;dataSource="supabase";state=remote;const remoteMigrationApplied=migrate();committedState=structuredClone(state);localStorage.setItem(KEY,JSON.stringify(state));buildLineupEditor();render();if(remoteMigrationApplied)e.status.textContent="Ältere gespeicherte Schritte wurden automatisch auf das aktuelle Darstellungsformat gebracht.";
    }else{
      remoteHasData=false;dataSource=hadLocalStateAtStartup?"browser":"default";
    }
    updateMigrationUI();
  }catch(err){e.syncBadge.textContent="Offline/Browser – Supabase nicht erreichbar";dataSource=hadLocalStateAtStartup?"browser":"default";updateMigrationUI()}
}
async function save(msg){
  if(!navigator.onLine||!supabaseConfigured()||!canEdit()){e.status.textContent="Speichern nicht möglich: Zum Bearbeiten und Speichern wird eine Supabase-Verbindung benötigt.";updateMigrationUI();render();return}
  try{await rpc("save_team_state",{p_team_id:currentTeamId,p_payload:state});remoteHasData=true;dataSource="supabase";committedState=structuredClone(state);dirty=false;localStorage.setItem(KEY,JSON.stringify(committedState));offlineMeta.lastSuccessfulSyncAt=isoNow();offlineMeta.lastOnlineLoadAt=offlineMeta.lastSuccessfulSyncAt;offlineMeta.lastLocalSaveAt=offlineMeta.lastSuccessfulSyncAt;offlineMeta.pendingLocalChanges=false;persistOfflineMeta();e.syncBadge.textContent="Speicherung: Supabase synchron";e.status.textContent=msg}
  catch(err){e.syncBadge.textContent="Supabase nicht erreichbar";e.status.textContent=`Nicht gespeichert. Supabase-Fehler: ${err.message}`}
  updateMigrationUI();render();
}
function ownRole(p){return td().teamConfig.roles[p.id]||defaultRoles[p.id]||"AA"}
function effectiveRole(p){if(p.team==="opponent")return p.role;const role=ownRole(p);return td().teamConfig.libero&&role==="MB"&&[1,5,6].includes(prot(p))?"L":role}
function svg(name,a={}){const x=document.createElementNS("http://www.w3.org/2000/svg",name);Object.entries(a).forEach(([k,v])=>x.setAttribute(k,v));return x}

const METRE_2D=510/9;
function project25(pos){
  const d=clamp((850-pos.y)/800,0,1);
  const xScale=1.08-.50*d;
  let y;
  if(pos.y>=450){const u=(pos.y-450)/400;y=472+338*Math.pow(clamp(u,0,1),.92)}
  else{const u=(450-pos.y)/400;y=472-218*Math.pow(clamp(u,0,1),.78)}
  const scale=1.02-.43*d;
  return{x:350+(pos.x-350)*xScale,y,scale};
}
function create25Floor(){
  const q=(x,y)=>project25({x,y}), pts=(arr)=>arr.map(([x,y])=>{const z=q(x,y);return `${z.x},${z.y}`}).join(" ");
  e.court25Floor.innerHTML="";
  e.court25Floor.appendChild(svg("polygon",{points:pts([[95,850],[605,850],[605,50],[95,50]]),fill:"url(#court25Gradient)",stroke:"#fff","stroke-width":4}));
  [583.333,450,316.667].forEach((y,i)=>{const a=q(95,y),b=q(605,y);e.court25Floor.appendChild(svg("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:"#fff","stroke-width":i===1?5:2,opacity:i===1?1:.8}))});
  const n1=q(95,450),n2=q(605,450),netTopY=n1.y-58,postL=n1.x-20,postR=n2.x+20;
  e.court25Floor.appendChild(svg("polygon",{points:`${postL},${n1.y} ${postR},${n2.y} ${postR},${netTopY} ${postL},${netTopY}`,fill:"#f8fafc",opacity:.22,stroke:"#fff","stroke-width":2}));
  for(let i=1;i<7;i++){const x=postL+(postR-postL)*i/7;e.court25Floor.appendChild(svg("line",{x1:x,y1:n1.y,x2:x,y2:netTopY,stroke:"#fff","stroke-width":1,opacity:.55}))}
  e.court25Floor.appendChild(svg("line",{x1:postL,y1:netTopY,x2:postR,y2:netTopY,stroke:"#fff","stroke-width":4}));
  e.court25Floor.appendChild(svg("line",{x1:postL,y1:n1.y+10,x2:postL,y2:netTopY-12,stroke:"#26384b","stroke-width":6}));
  e.court25Floor.appendChild(svg("line",{x1:postR,y1:n2.y+10,x2:postR,y2:netTopY-12,stroke:"#26384b","stroke-width":6}));
}
function create25Players(){
  e.player25Layer.innerHTML="";
  allPlayers.forEach(p=>{
    const g=svg("g",{class:`player25-object ${p.team}`,"data-id25":p.id});
    const foot=svg("ellipse",{"data-footprint":"1",cx:0,cy:0,rx:METRE_2D/2,ry:METRE_2D/5.2,fill:"none",stroke:p.team==="opponent"?"#b91c1c":"#0752c7","stroke-width":3,opacity:.72});
    const shadow=svg("ellipse",{"data-shadow":"1",cx:0,cy:-2,rx:20,ry:7,fill:"#000",opacity:.2});
    const body=svg("path",{"data-body":"1",d:"M-9 -12 Q0 -20 9 -12 L13 -48 Q0 -60 -13 -48 Z",fill:p.team==="opponent"?"#e32828":"#0b4fc6",stroke:"#fff","stroke-width":2,filter:"url(#shadow25)"});
    const armL=svg("path",{"data-arm-left":"1",d:"M-9 -44 L-20 -25",fill:"none",stroke:"#f3caa3","stroke-width":7,"stroke-linecap":"round"});
    const armR=svg("path",{"data-arm-right":"1",d:"M9 -44 L20 -25",fill:"none",stroke:"#f3caa3","stroke-width":7,"stroke-linecap":"round"});
    const head=svg("circle",{"data-head":"1",cx:0,cy:-63,r:12,fill:"#f3caa3",stroke:"#fff","stroke-width":2});
    const badge=svg("circle",{"data-badge":"1",cx:0,cy:-34,r:17,fill:p.team==="opponent"?"#b91c1c":"#073b9a",stroke:"#fff","stroke-width":2});
    const role=svg("text",{"data-role25":"1","text-anchor":"middle",x:0,y:-28,fill:"#fff","font-size":13,"font-weight":800});
    const label=svg("text",{"data-label25":"1","text-anchor":"middle",x:0,y:30,fill:"#17324d","font-size":14,"font-weight":800,"paint-order":"stroke","stroke":"#dbe8f8","stroke-width":5,"stroke-linejoin":"round"});
    g.append(foot,shadow,body,armL,armR,head,badge,role,label);e.player25Layer.appendChild(g)
  })
}
function line25(layer,a,b,cls){const A=project25(a),B=project25(b);layer.appendChild(svg("line",{x1:A.x,y1:A.y,x2:B.x,y2:B.y,class:cls}))}
const actionNames={serve:"Aufschlag",receive:"Annahme",set:"Zuspiel",attack:"Angriff",block:"Block",defense:"Abwehr",point:"Punkt / Fehler"};
function actionData(){const a=sd().action||{};return{type:a.type||"",actorId:a.actorId||"",technique:a.technique||"",helperId:a.helperId||"",blocker1Id:a.blocker1Id||"",blocker2Id:a.blocker2Id||"",outcome:a.outcome||"",reason:a.reason||""}}
const ballMotion={
  serve:{duration:1280,lift2d:84,lift25:70,easing:"cubic-bezier(.22,.61,.36,1)"},
  receive:{duration:1340,lift2d:190,lift25:202,easing:"ease-in-out"},
  set:{duration:1450,lift2d:205,lift25:190,easing:"ease-in-out"},
  attack:{duration:760,lift2d:0,lift25:0,easing:"linear"},
  block:{duration:860,lift2d:0,lift25:0,easing:"linear"},
  defense:{duration:1340,lift2d:178,lift25:188,easing:"ease-in-out"},
  default:{duration:1320,lift2d:82,lift25:68,easing:"ease-in-out"}
};
function motionFor(step){
  const base=ballMotion[step?.action?.type]||ballMotion.default,a=step?.action||{};
  if(a.type==="receive")return{...base,lift2d:a.technique==="upper"?228:206,lift25:a.technique==="upper"?236:214};
  if(a.type==="defense")return{...base,lift2d:a.technique==="upper"?210:190,lift25:a.technique==="upper"?220:198};
  return base;
}
function jumpParticipantIds(step){
  const a=step?.action||{},ids=new Set();
  if(a.type==="attack"){if(a.actorId)ids.add(a.actorId);if(a.blocker1Id)ids.add(a.blocker1Id);if(a.blocker2Id)ids.add(a.blocker2Id)}
  if(a.type==="block"){if(a.actorId)ids.add(a.actorId);if(a.helperId)ids.add(a.helperId)}
  return ids;
}
function sustainedAttackBlockState(stepIndex){
  const curr=rd().steps[stepIndex],prev=stepIndex>0?rd().steps[stepIndex-1]:null;
  if(!curr||!prev)return null;
  const pa=prev.action||{},ca=curr.action||{};
  if(pa.type!=="attack"||ca.type!=="block")return null;
  const prevBlockers=[pa.blocker1Id,pa.blocker2Id].filter(Boolean);
  const currBlockers=[ca.actorId,ca.helperId].filter(Boolean);
  if(!prevBlockers.length||!currBlockers.length)return null;
  const linked=currBlockers.some(id=>prevBlockers.includes(id));
  if(!linked||!pa.actorId)return null;
  return {attackerId:pa.actorId,blockerIds:prevBlockers};
}
function contactLift25(step,playerId,stepIndex=state.step){
  const a=step?.action||{};
  const sustain=sustainedAttackBlockState(stepIndex);
  if(sustain){
    if(sustain.attackerId===playerId)return 42;
    if(sustain.blockerIds.includes(playerId))return 34;
  }
  if(a.type==="attack"){
    if(a.actorId===playerId)return 42;
    if([a.blocker1Id,a.blocker2Id].includes(playerId))return 34;
  }
  if(a.type==="block"&&[a.actorId,a.helperId].includes(playerId))return 34;
  return 0;
}
function contactRole25(step,playerId,stepIndex=state.step){
  const a=step?.action||{};
  const sustain=sustainedAttackBlockState(stepIndex);
  if(sustain){
    if(sustain.attackerId===playerId)return "attack";
    if(sustain.blockerIds.includes(playerId))return "block";
  }
  if(a.type==="attack"&&a.actorId===playerId)return "attack";
  if(a.type==="attack"&&[a.blocker1Id,a.blocker2Id].includes(playerId))return "block";
  if(a.type==="block"&&[a.actorId,a.helperId].includes(playerId))return "block";
  return "move";
}
function player25Frames(A,B,{startLift=0,endLift=0,endRole="move"}={}){
  const p=t=>({x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t,scale:A.scale+(B.scale-A.scale)*t});
  const frame=(P,lift,offset)=>({transform:`translate(${P.x}px,${P.y-lift*P.scale}px) scale(${P.scale})`,offset});
  const P0=p(0),P1=p(.15),P2=p(.36),P3=p(.62),P4=p(1);
  if(!startLift&&!endLift)return[frame(P0,0,0),frame(P4,0,1)];
  if(startLift&&endLift){
    return[frame(P0,startLift,0),frame(P1,Math.max(startLift,endLift),.15),frame(P2,Math.max(startLift,endLift)+2,.36),frame(P4,endLift,1)];
  }
  if(startLift&&!endLift){
    return[frame(P0,startLift,0),frame(P1,startLift,.15),frame(P2,startLift*.86,.36),frame(P3,startLift*.42,.62),frame(P4,0,1)];
  }
  if(endRole==="attack"){
    return[frame(P0,0,0),frame(P1,endLift*.28,.15),frame(P2,endLift*.82,.36),frame(P3,endLift*1.02,.62),frame(P4,endLift,1)];
  }
  if(endRole==="block"){
    return[frame(P0,0,0),frame(P1,endLift*.18,.15),frame(P2,endLift*.82,.36),frame(P3,endLift*1.01,.62),frame(P4,endLift,1)];
  }
  return[frame(P0,0,0),frame(P2,endLift*.72,.36),frame(P4,endLift,1)];
}
function supportsTechnique(type){return ["receive","set","defense"].includes(type)}
function techniqueName(v){return v==="upper"?"oben":v==="lower"?"unten":""}
function contactHeight25(step){
  const a=step?.action||{};
  if(!a.actorId)return 25;
  if(supportsTechnique(a.type)){
    if(a.technique==="upper")return a.type==="set"?164:170;
    if(a.technique==="lower")return 34;
  }
  if(a.type==="attack")return 160;
  if(a.type==="block")return 146;
  if(a.type==="serve")return 118;
  return 50;
}
function ballVisual25(step){
  const a=step?.action||{};
  const actorPos=a.actorId?step?.positions?.[a.actorId]:null;
  const actorP=actorPos?project25(actorPos):null;
  const baseP=project25(step.ball);
  if(actorP&&a.type==="set"&&a.technique==="upper")return{x:actorP.x,y:actorP.y-132*actorP.scale,scale:actorP.scale};
  if(actorP&&(a.type==="receive"||a.type==="defense")&&a.technique==="upper")return{x:actorP.x,y:actorP.y-168*actorP.scale,scale:actorP.scale};
  let dx=0,dy=0;
  if(a.type==="attack"){dx=10*baseP.scale;dy=-2*baseP.scale}
  if(a.type==="block")dy=-4*baseP.scale;
  return{x:baseP.x+dx,y:baseP.y-contactHeight25(step)*baseP.scale+dy,scale:baseP.scale};
}
function ballTrajectoryKind(step){
  const type=step?.action?.type||"";
  if(type==="attack")return "attack-line";
  if(type==="block")return "block-line";
  return "arc";
}
function quadPoint(A,C,B,t){const u=1-t;return{x:u*u*A.x+2*u*t*C.x+t*t*B.x,y:u*u*A.y+2*u*t*C.y+t*t*B.y}}
function ballPath2d(Astep,Bstep,motion){
  const A=Astep.ball,B=Bstep.ball,kind=ballTrajectoryKind(Astep);
  if(kind!=="arc")return `M ${A.x} ${A.y} L ${B.x} ${B.y}`;
  const C={x:(A.x+B.x)/2,y:Math.min(A.y,B.y)-motion.lift2d};
  return `M ${A.x} ${A.y} Q ${C.x} ${C.y} ${B.x} ${B.y}`;
}
function ballPath25(Astep,Bstep,motion){
  const A=ballVisual25(Astep),B=ballVisual25(Bstep),kind=ballTrajectoryKind(Astep);
  if(kind!=="arc")return `M ${A.x} ${A.y} L ${B.x} ${B.y}`;
  const C={x:(A.x+B.x)/2,y:Math.min(A.y,B.y)-motion.lift25};
  return `M ${A.x} ${A.y} Q ${C.x} ${C.y} ${B.x} ${B.y}`;
}
function drawBallCurve(layer,A,B,cls,is25,motion,Astep=null,Bstep=null){
  if(Astep&&Bstep){layer.appendChild(svg("path",{d:is25?ballPath25(Astep,Bstep,motion):ballPath2d(Astep,Bstep,motion),class:cls}));return}
  const fakeA={ball:A,action:{}},fakeB={ball:B,action:{}};
  layer.appendChild(svg("path",{d:is25?ballPath25(fakeA,fakeB,motion):ballPath2d(fakeA,fakeB,motion),class:cls}));
}
function ballFrames25(Astep,Bstep,motion){
  const A=ballVisual25(Astep),B=ballVisual25(Bstep),kind=ballTrajectoryKind(Astep),rot=[0,95,190,285,380];
  if(kind!=="arc")return[
    {transform:`translate(${A.x}px,${A.y}px) scale(${A.scale}) rotate(0deg)`,offset:0},
    {transform:`translate(${B.x}px,${B.y}px) scale(${B.scale}) rotate(380deg)`,offset:1}
  ];
  const C={x:(A.x+B.x)/2,y:Math.min(A.y,B.y)-motion.lift25};
  return[0,.25,.5,.75,1].map((t,i)=>{const P=quadPoint(A,C,B,t),s=A.scale+(B.scale-A.scale)*t;return{transform:`translate(${P.x}px,${P.y}px) scale(${s}) rotate(${rot[i]}deg)`,offset:t}});
}
function ballFrames2d(Astep,Bstep,motion){
  const A=Astep.ball,B=Bstep.ball,kind=ballTrajectoryKind(Astep),rot=[0,95,190,285,380];
  if(kind!=="arc")return[
    {transform:`translate(${A.x}px,${A.y}px) rotate(0deg)`,offset:0},
    {transform:`translate(${B.x}px,${B.y}px) rotate(380deg)`,offset:1}
  ];
  const C={x:(A.x+B.x)/2,y:Math.min(A.y,B.y)-motion.lift2d};
  return[0,.25,.5,.75,1].map((t,i)=>{const P=quadPoint(A,C,B,t);return{transform:`translate(${P.x}px,${P.y}px) rotate(${rot[i]}deg)`,offset:t}});
}
function playerLabel(p){if(!p)return"";const role=effectiveRole(p);return p.team==="opponent"?`Gegner ${role} · P${p.base}`:`${roleNames[role]||role} · Position ${prot(p)}`}
function syncContactBall(){const a=actionData();if(!a.actorId)return;const pos=sd().positions[a.actorId];if(pos)sd().ball={x:pos.x,y:pos.y}}
function renderActionLinks(){
  e.actionLayer.innerHTML="";e.action25Layer.innerHTML="";if(tacticMode)return;const a=actionData();if(!a.type||!a.actorId)return;
  const actor=allPlayers.find(p=>p.id===a.actorId),helper=allPlayers.find(p=>p.id===a.helperId);if(!actor)return;
  const A=sd().positions[actor.id],B=sd().ball;
  if(Math.hypot(A.x-B.x,A.y-B.y)>8){line(e.actionLayer,A,B,"action-link");line25(e.action25Layer,A,B,"action25-link")}
  if(helper){const H=sd().positions[helper.id];line(e.actionLayer,A,H,"action-link helper");line25(e.action25Layer,A,H,"action25-link helper")}
  if(a.type==="attack"){[a.blocker1Id,a.blocker2Id].filter(Boolean).forEach(id=>{const H=sd().positions[id];if(!H)return;line(e.actionLayer,A,H,"action-link helper block-attempt-link");line25(e.action25Layer,A,H,"action25-link helper block-attempt-link")})}
}
function populatePlayerSelect(select,{allowNone=true,label="– auswählen –"}={}){
  const current=select.value;select.innerHTML="";if(allowNone){const o=document.createElement("option");o.value="";o.textContent=label;select.appendChild(o)}
  [ownRoster,opponentRoster].forEach((group,gi)=>{const og=document.createElement("optgroup");og.label=gi===0?"Eigene Mannschaft":"Gegner";group.forEach(p=>{const o=document.createElement("option");o.value=p.id;o.textContent=playerLabel(p);og.appendChild(o)});select.appendChild(og)});if([...select.options].some(o=>o.value===current))select.value=current
}
function populateBlockerSelect(select,actorId){
  const current=select.value;select.innerHTML="";const none=document.createElement("option");none.value="";none.textContent="– kein Spieler –";select.appendChild(none);
  const actor=allPlayers.find(p=>p.id===actorId);if(!actor){select.value="";return}
  const group=actor.team==="own"?opponentRoster:ownRoster;group.forEach(p=>{const o=document.createElement("option");o.value=p.id;o.textContent=playerLabel(p);select.appendChild(o)});if([...select.options].some(o=>o.value===current))select.value=current
}
function ensureServeActorOutside(){
  const a=actionData();if(a.type!=="serve"||!a.actorId)return;const actor=allPlayers.find(p=>p.id===a.actorId);if(!actor)return;const pos=sd().positions[a.actorId];
  if(actor.team==="own"&&pos.y<=850)sd().positions[a.actorId]={x:clamp(pos.x,124,576),y:870};
  if(actor.team==="opponent"&&pos.y>=50)sd().positions[a.actorId]={x:clamp(pos.x,124,576),y:30};
  syncContactBall();
}
function renderActionEditor(){
  if(!e.actionType)return;
  const a=actionData(),isPoint=a.type==="point";
  populatePlayerSelect(e.actionActor);populatePlayerSelect(e.actionHelper,{label:"– kein zweiter Spieler –"});populateBlockerSelect(e.attackBlocker1,a.actorId);populateBlockerSelect(e.attackBlocker2,a.actorId);
  e.actionType.value=a.type;e.actionActor.value=a.actorId;e.actionActorWrap.classList.toggle("hidden",isPoint||!a.type);
  e.actionTechniqueWrap.classList.toggle("hidden",!supportsTechnique(a.type));e.actionTechnique.value=a.technique||"upper";
  e.actionHelper.value=a.helperId;e.actionHelperWrap.classList.toggle("hidden",a.type!=="block");
  e.attackBlockWrap.classList.toggle("hidden",a.type!=="attack");e.attackBlocker1.value=a.blocker1Id;e.attackBlocker2.value=a.blocker2Id;
  e.actionOutcomeWrap.classList.toggle("hidden",!isPoint);e.actionReasonWrap.classList.toggle("hidden",!isPoint);e.actionOutcome.value=a.outcome||"own";e.actionReason.value=a.reason||"ground";
  e.snapBallToActor.classList.toggle("hidden",isPoint||!a.type);e.clearAction.classList.toggle("hidden",!a.type);
  const actor=allPlayers.find(p=>p.id===a.actorId),helper=allPlayers.find(p=>p.id===a.helperId),b1=allPlayers.find(p=>p.id===a.blocker1Id),b2=allPlayers.find(p=>p.id===a.blocker2Id);
  let txt="";
  if(a.type==="point"){
    const outcome=a.outcome==="opponent"?"Punkt Gegner":"Punkt eigene Mannschaft";
    const reasonNames={ground:"Ball im Feld/Boden",out:"Ball aus",net:"Netzfehler",other:"sonstiger Fehler"};
    txt=`Punkt / Fehler · ${outcome} · ${reasonNames[a.reason]||reasonNames.ground}`;
  }else if(a.type){
    txt=`${actionNames[a.type]||a.type}`;if(supportsTechnique(a.type)&&a.technique)txt+=` (${techniqueName(a.technique)})`;if(actor)txt+=` · ${playerLabel(actor)}`;if(helper)txt+=` + ${playerLabel(helper)}`;if(a.type==="attack"&&b1){txt+=` · Blockversuch: ${playerLabel(b1)}`;if(b2)txt+=` + ${playerLabel(b2)}`}
  }
  const next=rd().steps[state.step+1];
  if(isPoint)e.actionHint.textContent="Ballwechsel endet hier. Den Ball kannst du frei an die Endposition im Feld, auf den Boden oder ins Aus setzen.";
  else e.actionHint.textContent=a.type?(next?`Beim Übergang zu Schritt ${state.step+2} fliegt der Ball zum dort gespeicherten Kontaktpunkt; alle Spieler bewegen sich gleichzeitig.`:"Letzter Schritt: Kontakt gespeichert. Für einen weiteren Übergang einen neuen Schritt anlegen."):"Aktion für diesen Schritt auswählen.";
  e.actionSummary.textContent=txt||" ";e.actionSummary.classList.remove("hidden");
  e.actionPanel.classList.toggle("hidden",!editing||!actionMenuOpen);e.actionMenuToggle?.classList.toggle("needs-action",editing&&!a.type);e.actionMenuToggle?.setAttribute("aria-expanded",String(editing&&actionMenuOpen));
}
function render25(){
  if(tacticMode&&preferredView!=="2d"){preferredView="2d";}
  const visible=!editing&&preferredView==="25d";
  e.court.classList.toggle("hidden",visible);e.court25d.classList.toggle("hidden",!visible);
  e.view2d.classList.toggle("active",preferredView==="2d");e.view25d.classList.toggle("active",preferredView==="25d");if(e.positionInfoToggle){e.positionInfoToggle.classList.toggle("active",showPositionInfo);e.positionInfoToggle.textContent=`Positionen: ${showPositionInfo?"an":"aus"}`;e.positionInfoToggle.setAttribute("aria-pressed",String(showPositionInfo))}
  if(!visible)return;
  e.movement25Layer.innerHTML="";e.ballPath25Layer.innerHTML="";e.action25Layer.innerHTML="";
  [...allPlayers].sort((a,b)=>sd().positions[a.id].y-sd().positions[b.id].y).forEach(p=>{const node=e.player25Layer.querySelector(`[data-id25="${p.id}"]`);e.player25Layer.appendChild(node)});
  const sustain=sustainedAttackBlockState(state.step),ca=actionData();
  allPlayers.forEach(p=>{const node=e.player25Layer.querySelector(`[data-id25="${p.id}"]`),pos=sd().positions[p.id],P=project25(pos),role=effectiveRole(p),contactLift=contactLift25(sd(),p.id,state.step);node.setAttribute("transform",`translate(${P.x} ${P.y-contactLift*P.scale}) scale(${P.scale})`);node.querySelector("[data-role25]").textContent=role;const label25=node.querySelector("[data-label25]");if(label25){label25.textContent=p.team==="opponent"?`P${p.base}`:`P${prot(p)}`;label25.style.display=showPositionInfo?"":"none"}const isLib=role==="L";node.querySelector("[data-body]").setAttribute("fill",p.team==="opponent"?"#e32828":isLib?"#111827":"#0b4fc6");node.querySelector("[data-badge]").setAttribute("fill",p.team==="opponent"?"#b91c1c":isLib?"#111827":"#073b9a");const active=ca.actorId===p.id&&supportsTechnique(ca.type),upper=active&&ca.technique==="upper",lower=active&&ca.technique==="lower";const attackActor=contactRole25(sd(),p.id,state.step)==="attack",blocker=contactRole25(sd(),p.id,state.step)==="block";let armL="M-9 -44 L-20 -25",armR="M9 -44 L20 -25";if(upper){armL="M-9 -44 Q-18 -70 -8 -108";armR="M9 -44 Q18 -70 8 -108"}else if(lower){armL="M-9 -42 Q-14 -30 -8 -19";armR="M9 -42 Q14 -30 8 -19"}else if(blocker){armL="M-9 -44 Q-16 -78 -10 -116";armR="M9 -44 Q16 -78 10 -116"}else if(attackActor){armL="M-9 -44 Q-1 -60 9 -88";armR="M9 -44 Q18 -76 24 -114"}node.querySelector("[data-arm-left]").setAttribute("d",armL);node.querySelector("[data-arm-right]").setAttribute("d",armR)});
  const bp=ballVisual25(sd());e.ball25Object.setAttribute("transform",`translate(${bp.x} ${bp.y}) scale(${bp.scale})`);e.ball25Object.setAttribute("visibility","visible");
  if(state.step>0){const a=rd().steps[state.step-1],b=sd();allPlayers.forEach(p=>{const A=a.positions[p.id],B=b.positions[p.id];if(A&&B&&(A.x!==B.x||A.y!==B.y))line25(e.movement25Layer,A,B,"movement25-path")});if(a.ball.x!==b.ball.x||a.ball.y!==b.ball.y)drawBallCurve(e.ballPath25Layer,a.ball,b.ball,"ball25-path",true,motionFor(a),a,b)}
}
function currentCourtIs25(){return !editing&&preferredView==="25d"}
function createPlayers(){e.playerLayer.innerHTML="";allPlayers.forEach(p=>{const g=svg("g",{class:`player-object ${p.team}`,"data-id":p.id}),c=svg("circle",{r:29,fill:p.team==="opponent"?"#e32828":"#0b4fc6",stroke:"#fff","stroke-width":3,filter:"url(#shadow)"}),t=svg("text",{"text-anchor":"middle",y:7,fill:"#fff","font-size":19,"font-weight":800,"data-role":"1"}),l=svg("text",{"text-anchor":"middle",y:50,fill:"#fff","font-size":13,"font-weight":700,"data-label":"1"});g.append(c,t,l);e.playerLayer.appendChild(g)})}
function line(layer,a,b,cls){layer.appendChild(svg("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:cls}))}
function playerById(id){return allPlayers.find(p=>p.id===id)||null}
function playerTeam(id){return playerById(id)?.team||""}
function sideOfPosition(pos){if(!pos)return "";return pos.y>=450?"ownSide":"opponentSide"}
function distance(a,b){return a&&b?Math.hypot(a.x-b.x,a.y-b.y):Infinity}
function ruleIssues(rotation=rd()){
  const issues=[],steps=rotation.steps;
  const add=(severity,stepIndex,message)=>issues.push({severity,stepIndex,message});
  steps.forEach((step,i)=>{
    const a=step.action||{},actor=playerById(a.actorId),actorPos=a.actorId?step.positions?.[a.actorId]:null;
    if(a.type&&a.type!=="point"&&!actor)add("error",i,`${step.name}: Ballkontakt „${actionNames[a.type]||a.type}“ hat keinen Kontaktspieler.`);
    if(a.type==="serve"&&actor&&actorPos){
      const behind=actor.team==="own"?actorPos.y>850:actorPos.y<50;
      if(!behind)add("error",i,`${step.name}: Aufschläger ${playerLabel(actor)} steht nicht hinter der Grundlinie.`);
      const faults=receivingRotationFaults(step,rotation);if(faults.size){const receiver=actor.team==="own"?"Gegner":"eigene Mannschaft";add("error",i,`${step.name}: ${receiver} steht beim Aufschlag nicht rotationsgerecht.`)}
    }
    if(a.type&&a.type!=="block"&&a.type!=="point"&&actor&&actorPos&&step.ball&&distance(actorPos,step.ball)>65){
      add("warning",i,`${step.name}: Ballkontakt liegt sichtbar vom Kontaktspieler ${playerLabel(actor)} entfernt.`);
    }
    if(a.type==="attack"&&actor&&actorPos){
      const blockerIds=[a.blocker1Id,a.blocker2Id].filter(Boolean),blockers=blockerIds.map(playerById).filter(Boolean);
      blockerIds.forEach(id=>{
        const b=playerById(id),bp=step.positions?.[id];if(!b||!bp)return;
        if(b.team===actor.team)add("error",i,`${step.name}: Blockspieler ${playerLabel(b)} gehört zur gleichen Mannschaft wie der Angreifer.`);
        if(sideOfPosition(bp)===sideOfPosition(actorPos))add("error",i,`${step.name}: Blockspieler ${playerLabel(b)} steht auf derselben Netzseite wie der Angreifer.`);
        if(Math.abs(bp.y-450)>140)add("warning",i,`${step.name}: Blockspieler ${playerLabel(b)} steht ungewöhnlich weit vom Netz entfernt.`);
      });
      if(blockerIds.length===2){const p1=step.positions?.[blockerIds[0]],p2=step.positions?.[blockerIds[1]];if(p1&&p2&&distance(p1,p2)>150)add("warning",i,`${step.name}: Die beiden Blockspieler stehen sehr weit auseinander.`)}
      const next=steps[i+1],na=next?.action||{};
      if(next&&na.type==="block"){
        const attackBlockers=new Set(blockerIds),nextBlockers=[na.actorId,na.helperId].filter(Boolean);
        if(!attackBlockers.size||!nextBlockers.some(id=>attackBlockers.has(id)))add("warning",i,`${step.name} → ${next.name}: Block-Schritt passt nicht zu den beim Angriff verknüpften Blockspielern.`);
      }
    }
    if(a.type==="block"){
      [a.actorId,a.helperId].filter(Boolean).forEach(id=>{const b=playerById(id),bp=step.positions?.[id];if(b&&bp&&Math.abs(bp.y-450)>140)add("warning",i,`${step.name}: Blockspieler ${playerLabel(b)} steht ungewöhnlich weit vom Netz entfernt.`)});
    }
  });
  let lastRegularTeam="",count=0;
  steps.forEach((step,i)=>{
    const a=step.action||{};
    if(a.type==="point"){lastRegularTeam="";count=0;return}
    if(!a.type||!a.actorId)return;
    const team=playerTeam(a.actorId);if(!team)return;
    if(a.type==="block"){
      // Der Block zählt nicht zu den drei regulären Kontakten, ist aber eine Berührung
      // der blockenden Mannschaft und startet deren Kontaktserie neu.
      lastRegularTeam=team;
      count=0;
      return;
    }
    if(team!==lastRegularTeam){lastRegularTeam=team;count=1}else count++;
    if(count>3){const teamName=team==="own"?"eigene Mannschaft":"Gegner";add("error",i,`${step.name}: ${teamName} hat ${count} reguläre Ballkontakte seit der letzten gegnerischen Berührung. Erlaubt sind maximal 3; ein Block zählt nicht als Kontakt, setzt die Zählung für die blockende Mannschaft aber neu.`)}
  });
  return issues;
}
function renderRuleCheck(){
  if(tacticMode){e.ruleCheck.classList.add("hidden");return;}
  if(!e.ruleCheck)return;
  const issues=editing?ruleIssues():[];
  if(!editing||!issues.length){
    e.ruleCheck.classList.add("hidden");
    e.ruleCheckDetails.classList.add("hidden");
    e.ruleCheckToggle?.setAttribute("aria-expanded","false");
    if(e.ruleCheckChevron)e.ruleCheckChevron.textContent="▾";
    return;
  }
  e.ruleCheck.classList.remove("hidden","rule-ok","rule-warning","rule-error");
  const errors=issues.filter(x=>x.severity==="error").length,warnings=issues.filter(x=>x.severity==="warning").length;
  e.ruleCheck.classList.add(errors?"rule-error":"rule-warning");
  e.ruleCheckSummary.textContent=errors?`⛔ ${errors} Fehler${warnings?` · ${warnings} Warnung${warnings===1?"":"en"}`:""}`:`⚠ ${warnings} Warnung${warnings===1?"":"en"}`;
  e.ruleCheckDetails.innerHTML="";
  const ul=document.createElement("ul");issues.forEach(issue=>{const li=document.createElement("li");li.className=`rule-item-${issue.severity}`;li.textContent=`Schritt ${issue.stepIndex+1}: ${issue.message}`;ul.appendChild(li)});e.ruleCheckDetails.appendChild(ul);
}
const ROTATION_STAND_OVERLAP=58; // ca. eine Spieler-Standbreite: solange die Standbereiche sich noch überlappen, ist die Reihenfolge zulässig.
function receivingRotationCheck(step,rotation=rd()){
  const a=step?.action||{},actor=playerById(a.actorId);
  if(a.type!=="serve"||!actor)return {bad:new Set(),horizontal:[],vertical:[]};
  const receiverTeam=actor.team==="own"?"opponent":"own",bad=new Set(),badHorizontal=[],badVertical=[];
  const ownAt=n=>ownRoster.find(p=>rot(p.base,rotation.rotationOffset||0)===n);
  const playerAt=n=>receiverTeam==="own"?ownAt(n):opponentRoster.find(p=>p.base===n),pos=n=>step.positions[playerAt(n)?.id];
  const horizontal=[[4,3],[3,2],[5,6],[6,1]],vertical=[[4,5],[3,6],[2,1]];
  horizontal.forEach(([left,right])=>{
    const L=pos(left),R=pos(right),lp=playerAt(left),rp=playerAt(right);if(!L||!R||!lp||!rp)return;
    const wrongDistance=receiverTeam==="own"?L.x-R.x:R.x-L.x;
    if(wrongDistance>ROTATION_STAND_OVERLAP){bad.add(lp.id);bad.add(rp.id);badHorizontal.push([left,right])}
  });
  vertical.forEach(([front,back])=>{
    const F=pos(front),B=pos(back),fp=playerAt(front),bp=playerAt(back);if(!F||!B||!fp||!bp)return;
    const wrongDistance=receiverTeam==="own"?F.y-B.y:B.y-F.y;
    if(wrongDistance>ROTATION_STAND_OVERLAP){bad.add(fp.id);bad.add(bp.id);badVertical.push([front,back])}
  });
  return {bad,horizontal:badHorizontal,vertical:badVertical};
}
function receivingRotationFaults(step,rotation=rd()){return receivingRotationCheck(step,rotation).bad}
function validate(){
  e.validationLayer.innerHTML="";if(tacticMode)return new Set();
  const check=receivingRotationCheck(sd()),bad=check.bad,a=actionData(),actor=playerById(a.actorId);if(a.type!=="serve"||!actor||!bad.size)return bad;
  const receiverTeam=actor.team==="own"?"opponent":"own";const playerAt=n=>receiverTeam==="own"?pat(n):opponentRoster.find(p=>p.base===n),pos=n=>sd().positions[playerAt(n)?.id];
  check.horizontal.forEach(([l,r])=>{const L=pos(l),R=pos(r);if(!L||!R)return;const x=(L.x+R.x)/2;e.validationLayer.appendChild(svg("line",{x1:x,y1:receiverTeam==="own"?455:60,x2:x,y2:receiverTeam==="own"?840:445,class:"validation-invalid"}))});
  check.vertical.forEach(([f,b])=>{const F=pos(f),B=pos(b);if(!F||!B)return;const y=(F.y+B.y)/2;e.validationLayer.appendChild(svg("line",{x1:105,y1:y,x2:595,y2:y,class:"validation-invalid"}))});
  return bad;
}
function paths(){e.movementLayer.innerHTML="";e.ballPathLayer.innerHTML="";if(editing||tacticMode||state.step===0)return;const a=rd().steps[state.step-1],b=sd();allPlayers.forEach(p=>{const A=a.positions[p.id],B=b.positions[p.id];if(A&&B&&(A.x!==B.x||A.y!==B.y))line(e.movementLayer,A,B,"movement-path")});if(a.ball.x!==b.ball.x||a.ball.y!==b.ball.y)drawBallCurve(e.ballPathLayer,a.ball,b.ball,"ball-path",false,motionFor(a))}
function applySelectTextFit(select,text){
  if(!select)return;const len=Array.from(text||"").length;select.classList.remove("text-fit-medium","text-fit-small");
  if(len>28)select.classList.add("text-fit-small");else if(len>20)select.classList.add("text-fit-medium");
  select.title=text||"";
}
function renderTeamOptions(){
  if(!e.teamSelect)return;const current=String(state.teamIndex);e.teamSelect.innerHTML="";state.teams.forEach((team,i)=>{const o=document.createElement("option");o.value=String(i);o.textContent=team.name||`Teamaufstellung ${i+1}`;e.teamSelect.appendChild(o)});e.teamSelect.value=current;applySelectTextFit(e.teamSelect,td().name||"");
}
function stepNeedsWork(step,index,rotation){
  const a=step?.action||{},type=a.type||"";
  // Der erste reine Grundpositions-Schritt darf ohne Aktion als Startzustand dienen,
  // sobald die Spielsituation weitere Schritte enthält.
  if(!type)return !(index===0&&rotation.steps.length>1&&/grund(position|aufstellung)/i.test(step?.name||""));
  if(type==="point")return !a.outcome||!a.reason;
  if(!a.actorId)return true;
  if(supportsTechnique(type)&&!["upper","lower"].includes(a.technique))return true;
  return false;
}
function statusForStep(rotation,index,issues=null){
  const list=issues||ruleIssues(rotation),mine=list.filter(x=>x.stepIndex===index);
  if(mine.some(x=>x.severity==="error"))return "error";
  if(mine.some(x=>x.severity==="warning")||stepNeedsWork(rotation.steps[index],index,rotation))return "warning";
  return "ok";
}
function statusForSituation(rotation){
  const issues=ruleIssues(rotation);
  if(issues.some(x=>x.severity==="error"))return "error";
  if(issues.some(x=>x.severity==="warning")||rotation.steps.some((step,i)=>stepNeedsWork(step,i,rotation)))return "warning";
  return "ok";
}
function renderSituationOptions(){
  const current=String(state.rotation);e.rotationSelect.innerHTML="";
  td().rotations.forEach((situation,i)=>{
    const o=document.createElement("option"),status=editing?statusForSituation(situation):"ok";
    o.value=String(i);o.textContent=situationDisplayName(situation);o.dataset.status=status;
    if(status==="warning"){o.style.backgroundColor="#6b5318";o.style.color="#fff3bd"}
    if(status==="error"){o.style.backgroundColor="#702626";o.style.color="#ffe0e0"}
    e.rotationSelect.appendChild(o)
  });
  e.rotationSelect.value=current;e.situationNameInput.value=situationDisplayName(rd());applySelectTextFit(e.rotationSelect,situationDisplayName(rd()));
  const currentStatus=editing?statusForSituation(rd()):"ok";
  e.rotationSelect.classList.toggle("status-warning",currentStatus==="warning");
  e.rotationSelect.classList.toggle("status-error",currentStatus==="error");
}
function renderStepStrip(){
  if(!e.stepStrip)return;
  e.stepStrip.innerHTML="";
  const rotation=rd(),issues=editing?ruleIssues(rotation):[];
  rotation.steps.forEach((step,i)=>{
    const b=document.createElement("button");
    b.type="button";
    b.dataset.stepIndex=String(i);
    b.className=i===state.step?"active":"";
    if(editing){const status=statusForStep(rotation,i,issues);if(status==="warning")b.classList.add("status-warning");if(status==="error")b.classList.add("status-error")}
    b.textContent=`${i+1} · ${step.name||`Schritt ${i+1}`}`;
    const statusText=editing?(b.classList.contains("status-error")?" · Regelproblem":b.classList.contains("status-warning")?" · noch zu bearbeiten":" · vollständig"):"";
    b.title=`Schritt ${i+1}: ${step.name||`Schritt ${i+1}`}${statusText}`;
    b.setAttribute("aria-current",i===state.step?"step":"false");
    e.stepStrip.appendChild(b);
  });
  requestAnimationFrame(()=>{
    const active=e.stepStrip.querySelector("button.active");
    if(!active)return;
    const target=active.offsetLeft-(e.stepStrip.clientWidth-active.offsetWidth)/2;
    e.stepStrip.scrollTo({left:Math.max(0,target),behavior:"smooth"});
  });
}
function render(){
  document.body.classList.toggle("tactic-mode",tacticMode);
  e.tacticLaunch?.classList.toggle("hidden",!editing||tacticMode);
  e.tacticPanel?.classList.toggle("hidden",!tacticMode);
  e.tacticTitle?.classList.toggle("hidden",!tacticMode);
  if(tacticMode){
    if(e.tacticContext)e.tacticContext.textContent=`${td().name} · ${rname(state.rotation)}`;
    if(e.tacticStepTitle)e.tacticStepTitle.textContent=`Schritt ${state.step+1} · ${sd().name}`;
    if(e.tacticPrev)e.tacticPrev.disabled=state.step<=0;
    if(e.tacticNext)e.tacticNext.disabled=state.step>=rd().steps.length-1;
    if(e.tacticReset)e.tacticReset.disabled=!tacticChanged;
  }
  renderTeamOptions();renderSituationOptions();renderStepStrip();e.stepNumber.textContent=state.step+1;e.stepTotal.textContent=rd().steps.length;e.stepNameInput.value=sd().name;e.stepNamePreset.value=["Aufschlag","Annahme","Zuspiel","Angriff","Angriffssicherung","Block","Doppelblock","Abwehr"].includes(sd().name)?sd().name:"";e.currentStepTitle.textContent=sd().name;e.liberoToggle.checked=td().teamConfig.libero;document.body.classList.toggle("editing-mode",editing);e.editButton?.classList.toggle("hidden",!canEdit());updateMigrationUI();e.addTeam?.classList.toggle("hidden",!editing);e.deleteTeam?.classList.toggle("hidden",!editing);e.teamConfigToggle?.classList.toggle("hidden",!editing);e.addSituation.classList.toggle("hidden",!editing);e.deleteSituation.classList.toggle("hidden",!editing);e.addStep.classList.toggle("hidden",!editing);e.deleteStep.classList.toggle("hidden",!editing);e.actionMenuToggle.classList.toggle("hidden",!editing);e.saveStep.classList.toggle("hidden",!editing||!dirty);e.newStepNaming.classList.toggle("hidden",!editing||!namingNewStep);e.stepEditPanel.classList.toggle("hidden",!editing||!namingNewStep);e.teamConfigPanel?.classList.toggle("hidden",!editing||!teamConfigOpen);e.lineupEditor?.classList.toggle("hidden",!editing||!teamConfigOpen);e.situationConfigToggle?.classList.toggle("hidden",!editing);e.situationConfigPanel?.classList.toggle("hidden",!editing||!situationConfigOpen);if(e.teamNameInput)e.teamNameInput.value=td().name||"";if(e.situationNameEdit){const fixed=Boolean(rd().baseName);e.situationBaseNameWrap?.classList.toggle("hidden",!fixed);if(e.situationBaseName)e.situationBaseName.textContent=rd().baseName||"";if(e.situationNameLabel)e.situationNameLabel.textContent=fixed?"Zusatz (optional)":"Name der Spielsituation";e.situationNameEdit.value=fixed?(rd().nameSuffix||""):(rd().name||"");if(e.situationNameHint)e.situationNameHint.textContent=fixed?"Der feste Grundname bleibt erhalten; der Zusatz wird dahinter angezeigt.":"Der Name kann frei geändert werden."}renderActionEditor();paths();const bad=validate();
  allPlayers.forEach(p=>{const g=e.playerLayer.querySelector(`[data-id="${p.id}"]`),pos=sd().positions[p.id],role=effectiveRole(p);g.setAttribute("transform",`translate(${pos.x} ${pos.y})`);g.classList.toggle("editable",editing||tacticMode);g.classList.toggle("selected",selected?.type==="player"&&selected.id===p.id);g.classList.toggle("tactic-dragging",tacticMode&&dragging?.type==="player"&&dragging.id===p.id);g.classList.toggle("position-warning",editing&&bad.has(p.id));g.querySelector("[data-role]").textContent=role;g.querySelector("circle").setAttribute("fill",p.team==="opponent"?"#e32828":role==="L"?"#111827":"#0b4fc6");const label=g.querySelector("[data-label]");label.textContent=p.team==="opponent"?`Gegner · P${p.base}`:role==="L"?`Libero · Position ${prot(p)}`:`${roleNames[role]||role} · Position ${prot(p)}`;label.style.display=showPositionInfo?"":"none"});
  e.ballObject.setAttribute("visibility","visible");e.ballObject.setAttribute("transform",`translate(${sd().ball.x} ${sd().ball.y})`);e.ballObject.classList.toggle("editable",editing||tacticMode);e.ballObject.classList.toggle("selected",selected?.type==="ball");e.ballObject.classList.toggle("tactic-dragging",tacticMode&&dragging?.type==="ball");e.ballObject.classList.toggle("linked-contact",editing&&Boolean(actionData().actorId));
  render25();renderActionLinks();renderRuleCheck();
}
function buildLineupEditor(){
  e.lineupGrid.innerHTML="";ownRoster.forEach((p,i)=>{const label=document.createElement("label");label.className="player-role";label.textContent=`Spieler ${i+1} · Startposition ${p.base}`;const select=document.createElement("select");select.dataset.playerId=p.id;[["AA","Außen (AA)"],["MB","Mitte (MB)"],["Z","Zuspiel (Z)"],["D","Diagonal (D)"]].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;select.appendChild(o)});select.value=ownRole(p);select.addEventListener("change",()=>{td().teamConfig.roles[p.id]=select.value;dirty=true;render()});label.appendChild(select);e.lineupGrid.appendChild(label)});e.liberoToggle.checked=td().teamConfig.libero
}
function clearVisualAnimations(){
  e.playerLayer.querySelectorAll("[data-id]").forEach(node=>node.getAnimations().forEach(a=>a.cancel()));e.player25Layer?.querySelectorAll("[data-id25]").forEach(node=>node.getAnimations().forEach(a=>a.cancel()));e.ball25Object?.getAnimations().forEach(a=>a.cancel());
  e.ballObject.getAnimations().forEach(a=>a.cancel());
}
function stop(){playing=false;animations.forEach(a=>a.cancel());animations=[];clearVisualAnimations();e.playButton.textContent="▶"}
function edit(v){stop();clearVisualAnimations();if(v&&!editing){state=structuredClone(committedState);dirty=false}if(!v&&editing&&dirty){state=structuredClone(committedState);migrate();dirty=false}editing=v;selected=dragging=null;if(!v){namingNewStep=false;actionMenuOpen=false;teamConfigOpen=false;situationConfigOpen=false;}e.editButton.textContent=v?"✓":"✎";e.editButton.setAttribute("aria-label",v?"Bearbeitung beenden":"Bearbeiten");e.editButton.setAttribute("title",v?"Bearbeitung beenden":"Bearbeiten");e.editPanel.classList.toggle("hidden",!v);e.stepEditPanel.classList.toggle("hidden",!v||!namingNewStep);e.tapNotice.classList.add("hidden");if(!v){lineupOpen=false;teamConfigOpen=false;situationConfigOpen=false;e.lineupEditor.classList.add("hidden");e.teamConfigPanel?.classList.add("hidden");e.situationConfigPanel?.classList.add("hidden")}render()}
async function validatePassword(password){if(!supabaseConfigured())return password===TEST_PASSWORD;try{return Boolean(await rpc("validate_editor_password",{p_password:password}))}catch(err){e.passwordStatus.textContent=`Supabase nicht erreichbar: ${err.message}`;return null}}
async function requestEdit(){if(editing){edit(false);return}if(!navigator.onLine){e.status.textContent="Offline-Bearbeitung nicht möglich.";window.alert("Offline-Bearbeitung nicht möglich.\n\nZum Bearbeiten wird eine Internetverbindung benötigt.");return}if(!canEdit()){window.alert("Dein Konto hat keine Bearbeitungsberechtigung.");return}edit(true)}
async function confirmPassword(){const pwd=e.passwordInput.value;e.confirmPassword.disabled=true;e.passwordStatus.textContent="Prüfe Passwort …";const ok=await validatePassword(pwd);e.confirmPassword.disabled=false;if(ok===null){return}if(!ok){e.passwordStatus.textContent="Passwort ist nicht korrekt.";return}editorPassword=pwd;e.passwordDialog.close();edit(true)}
function enterTacticMode(){
  if(!editing||playing)return;
  stop();clearVisualAnimations();
  tacticSourceState=structuredClone(state);
  state=structuredClone(state);
  tacticPreviousView=preferredView;tacticMode=true;tacticChanged=false;selected=dragging=null;preferredView="2d";
  e.status.textContent="Taktiktafel im Bearbeitungsmodus: Änderungen werden nicht gespeichert.";
  render();
}
function restoreTacticStep(index=state.step){
  if(!tacticMode||!tacticSourceState)return;
  const max=tacticSourceState.teams[tacticSourceState.teamIndex].rotations[tacticSourceState.rotation].steps.length-1;
  const next=Math.max(0,Math.min(max,index));
  const sourceRotation=tacticSourceState.teams[tacticSourceState.teamIndex].rotations[tacticSourceState.rotation];
  const targetRotation=state.teams[state.teamIndex].rotations[state.rotation];
  targetRotation.steps[next]=structuredClone(sourceRotation.steps[next]);
  state.step=next;tacticChanged=false;selected=dragging=null;
  render();
}
function exitTacticMode(){
  if(!tacticMode)return;
  stop();clearVisualAnimations();
  if(tacticSourceState)state=structuredClone(tacticSourceState);
  tacticSourceState=null;tacticMode=false;tacticChanged=false;selected=dragging=null;preferredView=tacticPreviousView;
  e.status.textContent="Taktiktafel beendet. Keine Änderung wurde gespeichert.";
  render();
}
function point(ev){const p=e.court.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;return p.matrixTransform(e.court.getScreenCTM().inverse())}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function playerPoint(p,player){const a=actionData();if(a.type==="serve"&&a.actorId===player.id){if(player.team==="own")return{x:clamp(p.x,124,576),y:clamp(p.y,855,888)};return{x:clamp(p.x,124,576),y:clamp(p.y,12,45)}}if(a.type==="serve"){const yMin=player.team==="own"?479:79,yMax=player.team==="own"?821:421;return{x:clamp(p.x,124,576),y:clamp(p.y,yMin,yMax)}}return{x:clamp(p.x,32,668),y:clamp(p.y,32,868)}}
function keepServePlayersInside(){if(actionData().type!=="serve")return;const a=actionData();allPlayers.forEach(player=>{if(a.actorId===player.id)return;sd().positions[player.id]=playerPoint(sd().positions[player.id],player)})}
const cb=p=>({x:clamp(p.x,25,675),y:clamp(p.y,25,875)}),mode=()=>"tap";
e.court.addEventListener("pointerdown",ev=>{if((!editing&&!tacticMode)||playing)return;ev.preventDefault();const pe=ev.target.closest("[data-id]"),be=ev.target.closest("#ballObject");if(tacticMode){if(pe){dragging={type:"player",id:pe.dataset.id};e.court.setPointerCapture(ev.pointerId)}else if(be){dragging={type:"ball"};e.court.setPointerCapture(ev.pointerId)}return;}if(mode()==="tap"){if(selected){if(selected.type==="player"&&pe?.dataset.id===selected.id){selected=null;e.tapNotice.classList.add("hidden");render();return}const p=point(ev);if(selected.type==="player"){const player=allPlayers.find(x=>x.id===selected.id);sd().positions[selected.id]=playerPoint(p,player);if(actionData().actorId===selected.id)syncContactBall();dirty=true}else{sd().ball=cb(p);dirty=true}selected=null;e.tapNotice.classList.add("hidden");render();return}if(pe){selected={type:"player",id:pe.dataset.id};e.tapNotice.classList.remove("hidden");render();return}if(be){if(actionData().actorId){e.status.textContent="Der Ball ist in diesem Schritt an den Kontaktspieler gekoppelt. Zum freien Verschieben zuerst den Kontakt löschen.";return}selected={type:"ball"};e.tapNotice.classList.remove("hidden");render();return}return}if(pe){dragging={type:"player",id:pe.dataset.id};e.court.setPointerCapture(ev.pointerId)}else if(be){if(actionData().actorId){e.status.textContent="Der Ball ist in diesem Schritt an den Kontaktspieler gekoppelt. Zum freien Verschieben zuerst den Kontakt löschen.";return}dragging={type:"ball"};e.court.setPointerCapture(ev.pointerId)}},{passive:false});
e.court.addEventListener("pointermove",ev=>{if(!dragging||(!editing&&!tacticMode)||playing)return;ev.preventDefault();const p=point(ev);if(tacticMode){if(dragging.type==="player")sd().positions[dragging.id]={x:clamp(p.x,32,668),y:clamp(p.y,32,868)};else sd().ball=cb(p);tacticChanged=true;render();return;}if(dragging.type==="player"){const player=allPlayers.find(x=>x.id===dragging.id);sd().positions[dragging.id]=playerPoint(p,player);if(actionData().actorId===dragging.id)syncContactBall();dirty=true}else{sd().ball=cb(p);dirty=true}render()},{passive:false});["pointerup","pointercancel"].forEach(n=>e.court.addEventListener(n,()=>{dragging=null;if(tacticMode)render()}));
async function animate(target,{sequence=false}={}){
  target=Math.max(0,Math.min(rd().steps.length-1,target));
  if(target===state.step)return true;
  if(!sequence)stop();else{animations.forEach(a=>a.cancel());animations=[];clearVisualAnimations()}
  const a=sd(),b=rd().steps[target],motion=motionFor(a),duration=motion.duration;playing=true;e.playButton.textContent="■";e.movementLayer.innerHTML="";e.ballPathLayer.innerHTML="";
  allPlayers.forEach(p=>{const A=a.positions[p.id],B=b.positions[p.id];if(A&&B&&(A.x!==B.x||A.y!==B.y))line(e.movementLayer,A,B,"movement-path")});
  if(a.ball.x!==b.ball.x||a.ball.y!==b.ball.y)drawBallCurve(e.ballPathLayer,a.ball,b.ball,"ball-path",false,motion);
  let pa,ba;
  if(currentCourtIs25()){
    e.movement25Layer.innerHTML="";e.ballPath25Layer.innerHTML="";allPlayers.forEach(p=>{const A=a.positions[p.id],B=b.positions[p.id];if(A&&B&&(A.x!==B.x||A.y!==B.y))line25(e.movement25Layer,A,B,"movement25-path")});if(a.ball.x!==b.ball.x||a.ball.y!==b.ball.y)drawBallCurve(e.ballPath25Layer,a.ball,b.ball,"ball25-path",true,motion,a,b);
    const jumpers=jumpParticipantIds(a);
    pa=allPlayers.map(p=>{const A=project25(a.positions[p.id]),B=project25(b.positions[p.id]);const startLift=contactLift25(a,p.id,state.step),endLift=contactLift25(b,p.id,target),endRole=contactRole25(b,p.id,target);return e.player25Layer.querySelector(`[data-id25="${p.id}"]`).animate(player25Frames(A,B,{startLift,endLift,endRole}),{duration,easing:"ease-in-out",fill:"forwards"})});
    ba=e.ball25Object.animate(ballFrames25(a,b,motion),{duration,easing:motion.easing,fill:"forwards"});
  }else{
    pa=allPlayers.map(p=>e.playerLayer.querySelector(`[data-id="${p.id}"]`).animate([{transform:`translate(${a.positions[p.id].x}px,${a.positions[p.id].y}px)`},{transform:`translate(${b.positions[p.id].x}px,${b.positions[p.id].y}px)`}],{duration,easing:"ease-in-out",fill:"forwards"}));
    ba=e.ballObject.animate(ballFrames2d(a,b,motion),{duration,easing:motion.easing,fill:"forwards"});
  }
  const localAnimations=[...pa,ba];animations=localAnimations;
  await Promise.all(localAnimations.map(x=>x.finished.catch(()=>{})));
  if(!playing)return false;
  state.step=target;
  localAnimations.forEach(a=>a.cancel());
  animations=[];
  render();
  if(!sequence){playing=false;e.playButton.textContent="▶"}
  return true;
}
async function playAll(){
  if(editing){e.status.textContent="Animation ist im Anzeigemodus verfügbar.";return}
  if(playing){stop();render();return}
  if(rd().steps.length<2){e.status.textContent="Lege zuerst einen zweiten Schritt an.";return}
  stop();state.step=0;render();playing=true;e.playButton.textContent="■";
  await new Promise(resolve=>setTimeout(resolve,180));
  for(let target=1;target<rd().steps.length;target++){
    if(!playing)break;
    const ok=await animate(target,{sequence:true});
    if(!ok||!playing)break;
    if((rd().steps[target]?.action?.type||"")==="point")break;
    await new Promise(resolve=>setTimeout(resolve,160));
  }
  if(playing){playing=false;animations=[];clearVisualAnimations();e.playButton.textContent="▶";render()}
}
function goStep(target){target=Math.max(0,Math.min(rd().steps.length-1,target));if(target===state.step)return;if(editing){clearVisualAnimations();state.step=target;selected=dragging=null;namingNewStep=false;actionMenuOpen=false;render();return}animate(target)}
e.stepStrip?.addEventListener("click",ev=>{const b=ev.target.closest("button[data-step-index]");if(!b||playing)return;const target=Number(b.dataset.stepIndex);if(!Number.isFinite(target)||target===state.step)return;clearVisualAnimations();state.step=target;selected=dragging=null;namingNewStep=false;actionMenuOpen=false;render()});
e.prevStep.addEventListener("click",()=>goStep(state.step-1));e.nextStep.addEventListener("click",()=>goStep(state.step+1));e.playButton.addEventListener("click",playAll);
e.view2d.addEventListener("click",()=>{preferredView="2d";localStorage.setItem("volleyball-trainer-view",preferredView);clearVisualAnimations();render()});e.view25d.addEventListener("click",()=>{if(editing)return;preferredView="25d";localStorage.setItem("volleyball-trainer-view",preferredView);clearVisualAnimations();render()});e.positionInfoToggle.addEventListener("click",()=>{showPositionInfo=!showPositionInfo;localStorage.setItem("volleyball-trainer-position-info",showPositionInfo?"on":"off");render()});e.ruleCheckToggle?.addEventListener("click",()=>{const open=e.ruleCheckToggle.getAttribute("aria-expanded")==="true";e.ruleCheckToggle.setAttribute("aria-expanded",String(!open));e.ruleCheckDetails.classList.toggle("hidden",open);e.ruleCheckChevron.textContent=open?"▾":"▴"});
e.teamSelect?.addEventListener("change",ev=>{state.teamIndex=Number(ev.target.value);state.rotation=0;state.step=0;namingNewStep=false;actionMenuOpen=false;teamConfigOpen=false;situationConfigOpen=false;buildLineupEditor();render()});
e.addTeam?.addEventListener("click",()=>{if(!editing)return;const suggested=`Team ${state.teams.length+1}`;const entered=window.prompt("Name der neuen Teamaufstellung (max. 16 Zeichen):",suggested);if(entered===null)return;const rawName=entered.trim()||suggested;if(Array.from(rawName).length>16){window.alert("Der Name der Teamaufstellung darf maximal 16 Zeichen lang sein.");return}const name=rawName;const copyCurrent=window.confirm("Aktuelle Teamaufstellung als Vorlage kopieren?\n\nOK = aktuelle Aufstellung und Spielsituationen kopieren\nAbbrechen = neue Grundaufstellung anlegen");const team=copyCurrent?structuredClone(td()):freshTeam(name);team.name=name;state.teams.splice(state.teamIndex+1,0,team);state.teamIndex++;state.rotation=0;state.step=0;namingNewStep=false;actionMenuOpen=false;teamConfigOpen=false;dirty=true;buildLineupEditor();render()});
e.deleteTeam?.addEventListener("click",()=>{if(!editing)return;if(state.teams.length===1){e.status.textContent="Die einzige Teamaufstellung kann nicht gelöscht werden.";return}const name=td().name||`Teamaufstellung ${state.teamIndex+1}`;if(!window.confirm(`Teamaufstellung „${name}“ wirklich löschen?\n\nDabei werden alle Spielsituationen und Schritte dieser Teamaufstellung gelöscht.`))return;state.teams.splice(state.teamIndex,1);state.teamIndex=Math.max(0,state.teamIndex-1);state.rotation=0;state.step=0;teamConfigOpen=false;dirty=true;buildLineupEditor();render()});
e.teamConfigToggle?.addEventListener("click",()=>{if(!editing)return;teamConfigOpen=!teamConfigOpen;if(teamConfigOpen)situationConfigOpen=false;e.teamConfigPanel?.classList.toggle("hidden",!teamConfigOpen);e.lineupEditor?.classList.toggle("hidden",!teamConfigOpen);if(teamConfigOpen)buildLineupEditor();render();});
e.teamConfigClose?.addEventListener("click",()=>{teamConfigOpen=false;e.teamConfigPanel?.classList.add("hidden")});
e.teamNameInput?.addEventListener("input",()=>{if(!editing)return;const chars=Array.from(e.teamNameInput.value.trimStart());if(chars.length>16)e.teamNameInput.value=chars.slice(0,16).join("");td().name=e.teamNameInput.value||"Teamaufstellung";dirty=true;renderTeamOptions();e.saveStep.classList.remove("hidden")});
e.editButton.addEventListener("click",requestEdit);e.rotationSelect.addEventListener("change",x=>{state.rotation=Number(x.target.value);state.step=0;namingNewStep=false;actionMenuOpen=false;situationConfigOpen=false;buildLineupEditor();render()});e.situationConfigToggle?.addEventListener("click",()=>{if(!editing)return;situationConfigOpen=!situationConfigOpen;if(situationConfigOpen)teamConfigOpen=false;render()});e.situationConfigClose?.addEventListener("click",()=>{situationConfigOpen=false;render()});e.situationNameEdit?.addEventListener("input",()=>{if(!editing)return;const value=e.situationNameEdit.value;if(rd().baseName){rd().nameSuffix=value.trimStart();rd().name=situationDisplayName(rd())}else{rd().name=value.trimStart()||"Spielsituation"}dirty=true;renderSituationOptions();e.saveStep.classList.remove("hidden")});e.situationNameInput.addEventListener("input",()=>{});e.stepNamePreset.addEventListener("change",()=>{if(e.stepNamePreset.value){e.stepNameInput.value=e.stepNamePreset.value;dirty=true;actionMenuOpen=true;render()}});e.stepNameInput.addEventListener("input",()=>{e.stepNamePreset.value=["Aufschlag","Annahme","Zuspiel","Angriff","Angriffssicherung","Block","Doppelblock","Abwehr"].includes(e.stepNameInput.value.trim())?e.stepNameInput.value.trim():"";dirty=true});e.saveSituation.addEventListener("click",()=>{});e.addSituation.addEventListener("click",()=>{if(!editing)return;const suggested=`Neue Spielsituation ${td().rotations.length+1}`;const entered=window.prompt("Name der neuen Spielsituation:",suggested);if(entered===null)return;const name=entered.trim()||suggested;const copy=structuredClone(rd());delete copy.baseName;delete copy.nameSuffix;copy.name=name;td().rotations.splice(state.rotation+1,0,copy);state.rotation++;state.step=0;namingNewStep=false;actionMenuOpen=false;situationConfigOpen=false;dirty=true;buildLineupEditor();render()});e.deleteSituation.addEventListener("click",()=>{if(!editing)return;if(td().rotations.length===1){e.status.textContent="Die einzige Spielsituation kann nicht gelöscht werden.";return}const name=rd().name||defaultSituationName(state.rotation);if(!window.confirm(`Spielsituation „${name}“ wirklich löschen?\n\nDabei werden alle Schritte dieser Spielsituation gelöscht.`))return;td().rotations.splice(state.rotation,1);state.rotation=Math.max(0,state.rotation-1);state.step=0;namingNewStep=false;actionMenuOpen=false;situationConfigOpen=false;dirty=true;buildLineupEditor();render()});
// 2.9.4: Browser-Doppeltipp-Zoom auf den Spielfeldern verhindern.
[e.court,e.court25d].filter(Boolean).forEach(courtNode=>{
  courtNode.addEventListener("dblclick",ev=>ev.preventDefault(),{passive:false});
});

e.tacticLaunch?.addEventListener("click",enterTacticMode);
e.tacticReset?.addEventListener("click",()=>restoreTacticStep(state.step));
e.tacticPrev?.addEventListener("click",()=>restoreTacticStep(state.step-1));
e.tacticNext?.addEventListener("click",()=>restoreTacticStep(state.step+1));
e.tacticExit?.addEventListener("click",exitTacticMode);

e.saveStep.addEventListener("click",()=>{if(namingNewStep)sd().name=e.stepNameInput.value.trim()||`Schritt ${state.step+1}`;keepServePlayersInside();save("Änderungen gespeichert.");namingNewStep=false;render()});
e.addStep.addEventListener("click",()=>{keepServePlayersInside();const s=sd();rd().steps.splice(state.step+1,0,{name:`Schritt ${state.step+2}`,positions:structuredClone(s.positions),ball:structuredClone(s.ball),action:{type:"",actorId:"",technique:"",helperId:"",blocker1Id:"",blocker2Id:"",outcome:"",reason:""}});state.step++;namingNewStep=true;actionMenuOpen=false;dirty=true;render();setTimeout(()=>e.stepNamePreset.focus(),0)});
e.deleteStep.addEventListener("click",()=>{if(rd().steps.length===1){e.status.textContent="Der einzige Schritt kann nicht gelöscht werden.";return}const name=sd().name||`Schritt ${state.step+1}`;if(!window.confirm(`Schritt „${name}“ wirklich löschen?`))return;rd().steps.splice(state.step,1);state.step=Math.max(0,state.step-1);namingNewStep=false;actionMenuOpen=false;dirty=true;render()});

e.actionType.addEventListener("change",()=>{const type=e.actionType.value;sd().action={...actionData(),type};if(type==="point"){sd().action.actorId="";sd().action.technique="";sd().action.helperId="";sd().action.blocker1Id="";sd().action.blocker2Id="";sd().action.outcome=sd().action.outcome||"own";sd().action.reason=sd().action.reason||"ground"}else{sd().action.outcome="";sd().action.reason="";if(supportsTechnique(type)&&!sd().action.technique)sd().action.technique="upper";if(!supportsTechnique(type))sd().action.technique="";if(type!=="block")sd().action.helperId="";if(type!=="attack"){sd().action.blocker1Id="";sd().action.blocker2Id=""}}ensureServeActorOutside();keepServePlayersInside();dirty=true;render()});
e.actionMenuToggle.addEventListener("click",()=>{if(!editing)return;actionMenuOpen=!actionMenuOpen;render()});
e.actionMenuClose.addEventListener("click",()=>{actionMenuOpen=false;render()});
e.actionOutcome.addEventListener("change",()=>{sd().action={...actionData(),outcome:e.actionOutcome.value};dirty=true;render()});
e.actionReason.addEventListener("change",()=>{sd().action={...actionData(),reason:e.actionReason.value};dirty=true;render()});
e.actionActor.addEventListener("change",()=>{sd().action={...actionData(),actorId:e.actionActor.value,blocker1Id:"",blocker2Id:""};ensureServeActorOutside();keepServePlayersInside();syncContactBall();dirty=true;render()});
e.actionTechnique.addEventListener("change",()=>{sd().action={...actionData(),technique:e.actionTechnique.value};dirty=true;render()});
e.actionHelper.addEventListener("change",()=>{sd().action={...actionData(),helperId:e.actionHelper.value};dirty=true;render()});
e.attackBlocker1.addEventListener("change",()=>{sd().action={...actionData(),blocker1Id:e.attackBlocker1.value};if(sd().action.blocker2Id===sd().action.blocker1Id)sd().action.blocker2Id="";dirty=true;render()});
e.attackBlocker2.addEventListener("change",()=>{sd().action={...actionData(),blocker2Id:e.attackBlocker2.value};if(sd().action.blocker2Id===sd().action.blocker1Id)sd().action.blocker2Id="";dirty=true;render()});
e.snapBallToActor.addEventListener("click",()=>{const a=actionData();if(!a.actorId){e.actionHint.textContent="Bitte zuerst einen Akteur auswählen.";return}syncContactBall();dirty=true;render()});
e.clearAction.addEventListener("click",()=>{sd().action={type:"",actorId:"",technique:"",helperId:"",blocker1Id:"",blocker2Id:"",outcome:"",reason:""};dirty=true;render()});

e.liberoToggle.addEventListener("change",()=>{td().teamConfig.libero=e.liberoToggle.checked;dirty=true;render()});
e.confirmPassword.addEventListener("click",confirmPassword);e.passwordInput.addEventListener("keydown",ev=>{if(ev.key==="Enter")confirmPassword()});[e.closePassword,e.cancelPassword].forEach(x=>x.addEventListener("click",()=>e.passwordDialog.close()));
async function migrateLocalToSupabase(){
  if(!editing||!supabaseConfigured()||remoteHasData||!hadLocalStateAtStartup)return;
  e.migrateLocalButton.disabled=true;e.migrateLocalButton.textContent="Übertrage …";
  try{
    await rpc("save_team_state",{p_team_id:currentTeamId,p_payload:state});
    remoteHasData=true;dataSource="supabase";committedState=structuredClone(state);localStorage.setItem(KEY,JSON.stringify(state));dirty=false;
    offlineMeta.lastSuccessfulSyncAt=isoNow();offlineMeta.lastOnlineLoadAt=offlineMeta.lastSuccessfulSyncAt;offlineMeta.lastLocalSaveAt=offlineMeta.lastSuccessfulSyncAt;offlineMeta.pendingLocalChanges=false;persistOfflineMeta();
    e.syncBadge.textContent="Speicherung: Supabase synchron";e.dataSourceStatus.textContent="Supabase";
  }catch(err){e.dataSourceStatus.textContent="Browser – Übertragung fehlgeschlagen";e.migrationHint.textContent=`Übertragung fehlgeschlagen: ${err.message}`;e.migrationHint.classList.remove("hidden")}
  finally{e.migrateLocalButton.disabled=false;e.migrateLocalButton.textContent="Lokale Daten nach Supabase übertragen";updateMigrationUI()}
}
e.migrateLocalButton.addEventListener("click",migrateLocalToSupabase);
function info(){e.infoSituation.textContent=`Aktuell: ${td().name} · ${rname(state.rotation)} · Schritt ${state.step+1} · ${sd().name}`;if(e.infoDataSource){const source=!navigator.onLine?"Offline – lokale Ansicht":offlineMeta.pendingLocalChanges?"Lokale Altänderung aus 2.8.0 – nicht synchronisiert":dataSource==="supabase"?"Supabase":dataSource==="browser"?"Browser – lokale Daten":"Standarddaten – noch nicht gespeichert";e.infoDataSource.textContent=`Datenquelle: ${source}`;}if(e.infoSyncStatus)e.infoSyncStatus.textContent=`Letzter Supabase-Sync: ${formatStamp(offlineMeta.lastSuccessfulSyncAt)} · Letztes lokales Speichern: ${formatStamp(offlineMeta.lastLocalSaveAt)}`;e.infoDialog.showModal()}e.infoButton.addEventListener("click",info);e.closeInfo.addEventListener("click",()=>e.infoDialog.close());e.closeInfoBottom.addEventListener("click",()=>e.infoDialog.close());e.infoDialog.addEventListener("click",x=>{if(x.target===e.infoDialog)e.infoDialog.close()});
function compareVersions(a,b){const A=String(a).split(".").map(Number),B=String(b).split(".").map(Number);for(let i=0;i<Math.max(A.length,B.length);i++){const d=(A[i]||0)-(B[i]||0);if(d)return d}return 0}
async function checkForUpdate(){try{const res=await fetch(`version.json?_=${Date.now()}`,{cache:"no-store"});if(!res.ok)return;const remote=await res.json();if(remote?.version&&compareVersions(remote.version,VERSION)>0){if(e.jsBuildBadge)e.jsBuildBadge.textContent=`Neue Version ${remote.version} – wird geladen …`;if(e.status)e.status.textContent=`Neue Version ${remote.version} verfügbar – wird geladen …`;await new Promise(resolve=>setTimeout(resolve,350));const u=new URL(location.href);u.searchParams.set("v",remote.version);location.replace(u.toString())}}catch{}}
async function registerOfflineWorker(){if(!("serviceWorker" in navigator))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${VERSION}`,{scope:"./",updateViaCache:"none"});if(navigator.onLine)reg.update().catch(()=>{})}catch(err){console.warn("Offline-Service konnte nicht registriert werden",err)}}
window.addEventListener("offline",()=>{dataSource="browser";e.syncBadge.textContent="Offline – Ansicht lokaler Daten";if(editing){edit(false);e.status.textContent="Verbindung verloren. Bearbeitung wurde beendet; nicht gespeicherte Änderungen wurden verworfen."}updateMigrationUI()});
window.addEventListener("online",()=>{e.syncBadge.textContent=offlineMeta.pendingLocalChanges?"Online – lokale Altänderung vorhanden":"Online – Supabase wird geprüft";updateMigrationUI();if(!offlineMeta.pendingLocalChanges)loadRemote()});
async function bootV3(){registerOfflineWorker();checkForUpdate();createPlayers();create25Floor();create25Players();buildLineupEditor();edit(false);const flow=parseAuthHash();await ensureSession().catch(()=>null);if(flow){e.loginForm.classList.add('hidden');e.forgotPassword.classList.add('hidden');e.invitePasswordForm.classList.remove('hidden');showLogin(flow==='invite'?'Einladung bestätigt – bitte Passwort festlegen.':'Bitte neues Passwort festlegen.');return}if(!authSession){showLogin();return}try{await loadAccess();if(!selectedTeam()||!canView()){if(userAccess?.platform_admin){showPlatformOnly();return}showLogin('Für dieses Konto ist noch keine Mannschaft zum Anzeigen freigeschaltet.');return}showApp();await loadRemote()}catch(err){if(!navigator.onLine&&localStorage.getItem(ACCESS_KEY)){await loadAccess();if(selectedTeam()&&canView()){showApp();await loadRemote();return}}showLogin(`Anmeldung konnte nicht geprüft werden: ${err.message}`)}}
e.loginForm?.addEventListener('submit',async ev=>{ev.preventDefault();e.loginSubmit.disabled=true;e.authStatus.textContent='Anmeldung läuft …';try{await signIn(e.loginEmail.value.trim(),e.loginPassword.value);await loadAccess();if(!selectedTeam()||!canView()){if(userAccess?.platform_admin){showPlatformOnly();return}throw new Error('Keine Viewer- oder Bearbeiter-Berechtigung vorhanden.')}showApp();await loadRemote()}catch(err){showLogin(err.message)}finally{e.loginSubmit.disabled=false}});
e.invitePasswordForm?.addEventListener('submit',async ev=>{ev.preventDefault();const a=e.invitePassword.value,b=e.invitePasswordRepeat.value;if(a.length<8){e.authStatus.textContent='Bitte mindestens 8 Zeichen verwenden.';return}if(a!==b){e.authStatus.textContent='Die Passwörter stimmen nicht überein.';return}try{authSession=readSession();await authUserUpdate({password:a});await loadAccess();if(!selectedTeam()||!canView()){if(userAccess?.platform_admin){e.invitePasswordForm.classList.add('hidden');e.loginForm.classList.remove('hidden');e.forgotPassword.classList.remove('hidden');showPlatformOnly();return}throw new Error('Dein Zugang wurde angelegt, aber noch keiner Mannschaft zugeordnet.')}e.invitePasswordForm.classList.add('hidden');e.loginForm.classList.remove('hidden');e.forgotPassword.classList.remove('hidden');showApp();await loadRemote()}catch(err){e.authStatus.textContent=err.message}});
e.forgotPassword?.addEventListener('click',async()=>{const email=e.loginEmail.value.trim();if(!email){e.authStatus.textContent='Bitte zuerst deine E-Mail-Adresse eingeben.';return}try{await sendRecovery(email);e.authStatus.textContent='E-Mail zum Zurücksetzen wurde versendet.'}catch(err){e.authStatus.textContent=err.message}});
e.platformOnlyAdminOpen?.addEventListener('click',openPlatformAdmin);e.platformOnlyLogout?.addEventListener('click',()=>{persistSession(null);userAccess=null;localStorage.removeItem(ACCESS_KEY);showLogin('Du wurdest abgemeldet.')});e.accountButton?.addEventListener('click',()=>{renderAccount();e.accountDialog.showModal()});e.closeAccount?.addEventListener('click',()=>e.accountDialog.close());e.platformAdminOpen?.addEventListener('click',openPlatformAdmin);e.clubAdminOpen?.addEventListener('click',openClubAdmin);e.platformAdminRefresh?.addEventListener('click',openPlatformAdmin);e.clubAdminRefresh?.addEventListener('click',openClubAdmin);e.closePlatformAdmin?.addEventListener('click',()=>e.platformAdminDialog.close());e.closeClubAdmin?.addEventListener('click',()=>e.clubAdminDialog.close());e.platformAdminDialog?.addEventListener('click',ev=>{if(ev.target===e.platformAdminDialog)e.platformAdminDialog.close()});e.clubAdminDialog?.addEventListener('click',ev=>{if(ev.target===e.clubAdminDialog)e.clubAdminDialog.close()});e.logoutButton?.addEventListener('click',async()=>{persistSession(null);userAccess=null;localStorage.removeItem(ACCESS_KEY);e.accountDialog.close();showLogin('Du wurdest abgemeldet.')});e.teamContextSelect?.addEventListener('change',async ev=>{currentTeamId=ev.target.value;localStorage.setItem(TEAM_KEY,currentTeamId);e.accountDialog.close();edit(false);await loadRemote();renderAccount()});
bootV3();
})();
