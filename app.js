(() => {
"use strict";
const VERSION="3.3.0",DATA_SCHEMA=8,KEY="volleyball-trainer-v2-2";
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
const ids=["authGate","appMain","loginForm","loginEmail","loginPassword","loginSubmit","invitePasswordForm","invitePassword","invitePasswordRepeat","forgotPassword","authStatus","platformOnlyGate","platformOnlyAdminOpen","platformOnlyLogout","accountButton","accountDialog","closeAccount","accountName","accountEmail","accountRoles","clubSwitcherWrap","teamContextSelect","platformAdminOpen","clubAdminOpen","platformAdminDialog","closePlatformAdmin","platformAdminContent","platformAdminRefresh","clubAdminDialog","closeClubAdmin","clubAdminContent","clubAdminRefresh","logoutButton","teamNameInput","teamConfigClose","teamConfigPanel","teamConfigToggle","deleteTeam","addTeam","teamSelect","infoButton","editButton","brandClubName","rotationSelect","situationConfigToggle","situationConfigPanel","situationConfigClose","situationBaseNameWrap","situationBaseName","situationNameLabel","situationNameEdit","situationNameHint","addSituation","deleteSituation","stepNumber","stepTotal","stepNameEdit","stepNameInlineEditor","stepNameInlineInput","stepNameSuggestions","prevStep","playButton","nextStep","resetStepPositions","saveStep","addStep","deleteStep","actionMenuToggle","actionMenuClose","editPanel","currentStepTitle","court","validationLayer","movementLayer","ballPathLayer","playerLayer","ballObject","tapNotice","tapNoticeText","resetSelectedPlayer","status","infoDialog","closeInfo","closeInfoBottom","infoGuideTitle","infoGuideList","infoSituation","infoDataSource","lineupEditor","lineupGrid","liberoToggle","opponentSystem","opponentLiberoToggle","syncBadge","jsBuildBadge","migrationPanel","dataSourceStatus","migrateLocalButton","migrationHint","invitePreviewDialog","closeInvitePreview","invitePreviewTitle","invitePreviewMeta","invitePreviewSubject","invitePreviewBody","inviteTemplateHint","invitePreviewStatus","invitePreviewCancel","invitePreviewSave","invitePreviewSend","syncTimeStatus","infoSyncStatus","viewToggle","view2d","view25d","positionInfoToggle","court25d","court25Floor","movement25Layer","ballPath25Layer","action25Layer","player25Layer","ball25Object","actionPanel","actionType","actionActorWrap","actionActor","actionTechniqueWrap","actionTechnique","actionHelperWrap","actionHelper","actionOutcomeWrap","actionOutcome","actionReasonWrap","actionReason","attackBlockWrap","attackBlocker1","attackBlocker2","snapBallToActor","clearAction","actionHint","actionSummary","actionLayer","ruleCheck","ruleCheckToggle","ruleCheckSummary","ruleCheckChevron","ruleCheckDetails","stepStrip","tacticLaunch","tacticPanel","tacticPrev","tacticNext","tacticReset","tacticUndo","tacticPlayerMove","tacticPlayerPath","tacticBallMove","tacticBallPath","tacticExit","tacticTitle","tacticContext","tacticStepTitle","questionsButton","questionsBadge","courtQuestionButton","courtQuestionBadge","questionContextPanel","questionsDialog","questionsTitle","closeQuestions","questionsContent","questionNewButton","questionComposer","questionText","questionCancel","questionSend","situationInfoButton","stepInfoButton","situationInfoInline","situationInfoEdit","stepInfoEdit","publishSituation","publishState","contextInfoDialog","closeContextInfo","contextInfoTitle","contextInfoBody","noPublishedNotice"];
const e=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
if(e.jsBuildBadge)e.jsBuildBadge.textContent=`JS ${VERSION} geladen`;window.addEventListener("error",ev=>{if(e.jsBuildBadge)e.jsBuildBadge.textContent=`JS-Fehler ${VERSION}: ${ev.message||"unbekannt"}`});
const roleNames={AA:"Außen",MB:"Mitte",Z:"Zuspiel",D:"Diagonal",L:"Libero"};
const rot=(p,n)=>{let r=p;for(let i=0;i<n;i++)r=r===1?6:r-1;return r};
const initialStep=r=>{const positions={};ownRoster.forEach(p=>positions[p.id]={...ownSlots[rot(p.base,r)]});opponentRoster.forEach(p=>positions[p.id]={...opponentSlots[p.base]});return{name:"Grundposition",positions,ball:{x:450,y:650},action:{type:"",actorId:"",technique:"",helperId:"",blocker1Id:"",blocker2Id:"",outcome:"",reason:"",ballLinked:false}}};
const defaultSituationName=i=>i===0?"GA":`GA +${i}`;
const legacySituationName=i=>i===0?"Grundaufstellung":`Grundaufstellung +${i}`;
const situationDisplayName=rotation=>{if(rotation?.baseName){const suffix=(rotation.nameSuffix||"").trim();return suffix?`${rotation.baseName} – ${suffix}`:rotation.baseName}return rotation?.name||"Spielsituation"};
const freshTeam=(name="Hauptaufstellung")=>({name,teamConfig:{roles:{...defaultRoles},libero:false,opponentSystem:"42",opponentLibero:false},rotations:Array.from({length:6},(_,r)=>({name:defaultSituationName(r),baseName:defaultSituationName(r),nameSuffix:"",rotationOffset:r,steps:[initialStep(r)]}))});
const fresh=()=>({schemaVersion:DATA_SCHEMA,teamIndex:0,rotation:0,step:0,teams:[freshTeam()]});
const hadLocalStateAtStartup=Boolean(localStorage.getItem(KEY));
let state;try{state=JSON.parse(localStorage.getItem(KEY)||"null")||fresh()}catch{state=fresh()}
function normalizeStep(step,rotation){
  let changed=false;step.positions=step.positions||{};
  ownRoster.forEach(p=>{if(!step.positions[p.id]){step.positions[p.id]={...ownSlots[rot(p.base,rotation.rotationOffset)]};changed=true}});
  opponentRoster.forEach(p=>{if(!step.positions[p.id]){step.positions[p.id]={...opponentSlots[p.base]};changed=true}});
  if(!step.ball){step.ball={x:450,y:650};changed=true}
  if(!step.name){step.name="Grundposition";changed=true}if(typeof step.info!=="string"){step.info="";changed=true}
  if(Object.prototype.hasOwnProperty.call(step,"situation")){delete step.situation;changed=true}
  const old=step.action||{};const type=old.type||"",actorId=old.actorId||"",helperId=old.helperId||"",blocker1Id=old.blocker1Id||"",blocker2Id=old.blocker2Id||"",outcome=old.outcome||"",reason=old.reason||"";
  let technique=old.technique||"";if(technique==="oben")technique="upper";if(technique==="unten")technique="lower";
  if(["receive","set","defense"].includes(type)&&!["upper","lower"].includes(technique))technique="upper";if(!["receive","set","defense"].includes(type))technique="";
  let ballLinked=Boolean(old.ballLinked);
  if(!Object.prototype.hasOwnProperty.call(old,"ballLinked")&&actorId&&step.positions?.[actorId]&&step.ball){const ap=step.positions[actorId];ballLinked=Math.hypot(ap.x-step.ball.x,ap.y-step.ball.y)<=10}
  if(type==="point"||!actorId)ballLinked=false;
  const normalized={type,actorId:type==="point"?"":actorId,technique,helperId:type==="block"?helperId:"",blocker1Id:type==="attack"?blocker1Id:"",blocker2Id:type==="attack"?blocker2Id:"",outcome:type==="point"?(outcome||"own"):"",reason:type==="point"?(reason||"ground"):"",ballLinked};
  if(JSON.stringify(normalized)!==JSON.stringify({type:old.type||"",actorId:old.actorId||"",technique:old.technique||"",helperId:old.helperId||"",blocker1Id:old.blocker1Id||"",blocker2Id:old.blocker2Id||"",outcome:old.outcome||"",reason:old.reason||"",ballLinked:Boolean(old.ballLinked)}))changed=true;
  step.action=normalized;return changed;
}
function normalizeTeam(team,index){
  let changed=false;if(!team.name){team.name=index===0?"Hauptaufstellung":`Teamaufstellung ${index+1}`;changed=true}
  if(!team.teamConfig){team.teamConfig={roles:{...defaultRoles},libero:false,opponentSystem:"42",opponentLibero:false};changed=true}
  const mergedRoles={...defaultRoles,...(team.teamConfig.roles||{})};if(JSON.stringify(mergedRoles)!==JSON.stringify(team.teamConfig.roles||{}))changed=true;team.teamConfig.roles=mergedRoles;team.teamConfig.libero=Boolean(team.teamConfig.libero);team.teamConfig.opponentSystem=team.teamConfig.opponentSystem==="51"?"51":"42";team.teamConfig.opponentLibero=Boolean(team.teamConfig.opponentLibero);
  if(!Array.isArray(team.rotations)||!team.rotations.length){team.rotations=freshTeam(team.name).rotations;changed=true}
  team.rotations.forEach((rotation,r)=>{if(typeof rotation.published!=="boolean"){rotation.published=false;changed=true}if(typeof rotation.info!=="string"){rotation.info="";changed=true}if(!rotation.name){rotation.name=defaultSituationName(r);changed=true}const offset=Number.isFinite(Number(rotation.rotationOffset))?Number(rotation.rotationOffset)%6:r%6;if(rotation.rotationOffset!==offset){rotation.rotationOffset=offset;changed=true}const canonical=defaultSituationName(offset),legacy=legacySituationName(offset);if(!rotation.baseName&&(rotation.name===canonical||rotation.name===legacy)){rotation.baseName=canonical;rotation.nameSuffix="";changed=true}if(rotation.baseName){if(rotation.baseName!==canonical){rotation.baseName=canonical;changed=true}if(typeof rotation.nameSuffix!=="string"){rotation.nameSuffix="";changed=true}const display=situationDisplayName(rotation);if(rotation.name!==display){rotation.name=display;changed=true}}if(!Array.isArray(rotation.steps)||!rotation.steps.length){rotation.steps=[initialStep(offset)];changed=true}rotation.steps.forEach(step=>{if(normalizeStep(step,rotation))changed=true})});
  return changed;
}
function migrate(){
  let changed=false;
  if(!state||typeof state!=="object"){state=fresh();return true}
  // 2.6.x -> 2.7.0: bisherige Hauptaufstellung unverändert als erste Teamaufstellung übernehmen.
  if(!Array.isArray(state.teams)||!state.teams.length){
    if(Array.isArray(state.rotations)&&state.rotations.length){state.teams=[{name:"Hauptaufstellung",teamConfig:state.teamConfig||{roles:{...defaultRoles},libero:false,opponentSystem:"42",opponentLibero:false},rotations:state.rotations}];}
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
let editing=false,selected=null,dragging=null,playing=false,animations=[],teamConfigOpen=false,situationConfigOpen=false,committedState=structuredClone(state),dirty=false,renamingStep=false,actionMenuOpen=false,tacticMode=false,tacticSourceState=null,tacticPreviousView="2d",tacticChanged=false,tacticUndoStack=[],tacticPaths=[],tacticPlayerMode="move",tacticBallMode="move";
let remoteHasData=false,dataSource=hadLocalStateAtStartup?"browser":"default";
let preferredView=localStorage.getItem("volleyball-trainer-view")||"2d";if(!["2d","25d"].includes(preferredView))preferredView="2d";
let showPositionInfo=localStorage.getItem("volleyball-trainer-position-info")!=="off";
const STEP_NAME_STANDARDS=["Aufschlag","Annahme","Zuspiel","Angriff","Angriffssicherung","Block","Doppelblock","Abwehr"];
const RECENT_STEP_NAMES_KEY="volleyball-trainer-recent-step-names";
function recentStepNames(){try{return (JSON.parse(localStorage.getItem(RECENT_STEP_NAMES_KEY)||"[]")||[]).filter(x=>typeof x==="string"&&x.trim()).slice(0,5)}catch{return[]}}
function rememberStepName(name){name=(name||"").trim();if(!name||STEP_NAME_STANDARDS.includes(name))return;const next=[name,...recentStepNames().filter(x=>x!==name)].slice(0,5);localStorage.setItem(RECENT_STEP_NAMES_KEY,JSON.stringify(next))}
function stepNameSuggestionHtml(){const recent=recentStepNames();return `<button type="button" class="step-name-choice free" data-step-name="">Freie Eingabe</button><div class="step-name-choice-label">Standard</div>${STEP_NAME_STANDARDS.map(x=>`<button type="button" class="step-name-choice" data-step-name="${esc(x)}">${esc(x)}</button>`).join("")}${recent.length?`<div class="step-name-choice-label">Zuletzt verwendet</div>${recent.map(x=>`<button type="button" class="step-name-choice" data-step-name="${esc(x)}">${esc(x)}</button>`).join("")}`:""}`}
function openStepNameEditor(){if(!editing)return;renamingStep=true;if(e.stepNameInlineInput)e.stepNameInlineInput.value=sd().name||"";if(e.stepNameSuggestions)e.stepNameSuggestions.innerHTML=stepNameSuggestionHtml();render();setTimeout(()=>{e.stepNameInlineInput?.focus();e.stepNameInlineInput?.setSelectionRange?.(0,e.stepNameInlineInput.value.length)},0)}
function applyInlineStepName(close=true){if(!renamingStep)return;const value=(e.stepNameInlineInput?.value||"").trim()||`Schritt ${state.step+1}`;sd().name=value;rememberStepName(value);dirty=true;if(close)renamingStep=false}
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
async function sendRecovery(email){const base=window.APP_CONFIG.SUPABASE_URL.replace(/\/$/,"");const redirectTo="https://vbcoco.github.io/VB_Aufstellung/";const r=await fetch(`${base}/auth/v1/recover`,{method:"POST",headers:authHeaders(null),body:JSON.stringify({email,redirect_to:redirectTo})});if(!r.ok)throw new Error("E-Mail konnte nicht gesendet werden")}
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
function roleEditor(m,mode){const roles=m.roles||[],isSelf=m.user_id===authSession?.user?.id;const checks=[['viewer','Viewer'],['editor','Bearbeiter'],['club_admin','Vereinsadmin']].map(([value,label])=>`<label class="admin-role-check"><input type="checkbox" value="${value}" ${roles.includes(value)?'checked':''}>${label}</label>`).join('');const reset=`<button class="admin-password-reset" type="button" data-membership-id="${esc(m.membership_id)}" data-email="${esc(m.email||'')}">Passwort-Mail</button>`;const removeMembership=`<button class="admin-remove-member" type="button" data-membership-id="${esc(m.membership_id)}" data-email="${esc(m.email||'')}" ${isSelf?'disabled title="Der eigene Vereinszugang kann hier nicht entfernt werden."':''}>Aus Verein entfernen</button>`;const remove=mode==='platform'?`<button class="admin-delete-user danger" type="button" data-user-id="${esc(m.user_id)}" data-email="${esc(m.email||'')}" ${isSelf?'disabled title="Das eigene Konto kann hier nicht gelöscht werden."':''}>Endgültig löschen</button>`:'';return `<div class="admin-member-editor hidden" data-member-editor="${esc(m.membership_id)}"><div class="admin-role-editor" data-membership-id="${esc(m.membership_id)}">${checks}<button class="admin-save-roles icon-only" type="button" aria-label="Rollen speichern" title="Rollen speichern" ${isSelf?'disabled title="Eigene Rollen werden aus Sicherheitsgründen hier nicht geändert."':''}>💾</button></div><div class="admin-member-buttons">${reset}<button class="admin-toggle-member ${m.active===false?'reactivate':''}" type="button" data-membership-id="${esc(m.membership_id)}" data-active="${m.active===false?'true':'false'}" ${isSelf?'disabled title="Der eigene Vereinszugang kann hier nicht deaktiviert werden."':''}>${m.active===false?'Reaktivieren':'Deaktivieren'}</button>${removeMembership}${remove}</div></div>`}
function memberRow(m,mode){const roles=renderRoleChips(m.roles||[]);const label=esc(m.display_name||m.email||'Benutzer');return `<div class="admin-member-wrap compact ${m.active===false?'is-inactive':'is-active'}"><div class="admin-member compact-row"><div class="admin-member-main"><strong>${label}</strong><span>${esc(m.email||'')}</span></div><div class="admin-member-roles">${roles}<button class="admin-member-settings" type="button" data-membership-id="${esc(m.membership_id)}" aria-label="Benutzer bearbeiten" title="Benutzer bearbeiten">⚙</button></div></div>${roleEditor(m,mode)}</div>`}
function memberPriority(m){const r=m.roles||[];return r.includes('club_admin')?0:r.includes('editor')?1:r.includes('viewer')?2:3}
function memberGroups(members=[],mode='club'){const groups=[['Vereinsadmins',members.filter(m=>(m.roles||[]).includes('club_admin'))],['Bearbeiter',members.filter(m=>!(m.roles||[]).includes('club_admin')&&(m.roles||[]).includes('editor'))],['Viewer',members.filter(m=>!(m.roles||[]).includes('club_admin')&&!(m.roles||[]).includes('editor')&&(m.roles||[]).includes('viewer'))],['Weitere',members.filter(m=>memberPriority(m)===3)]];return groups.filter(([,items])=>items.length).map(([title,items],i)=>`<details class="admin-member-group" ${i===0?'open':''}><summary><span>${esc(title)}</span><span class="admin-group-count">${items.length}</span></summary><div class="admin-member-list">${items.sort((a,b)=>String(a.display_name||a.email||'').localeCompare(String(b.display_name||b.email||''),'de')).map(m=>memberRow(m,mode)).join('')}</div></details>`).join('')||'<p class="hint">Noch keine Benutzer.</p>'}
function inviteForm(clubId,mode){const isPlatformAdmin=mode==='platform_admin';const roleOptions=isPlatformAdmin?'':mode==='platform'?`<label><input type="checkbox" name="roles" value="club_admin" checked> Vereinsadmin</label>`:`<label><input type="checkbox" name="roles" value="viewer" checked> Viewer</label><label><input type="checkbox" name="roles" value="editor"> Bearbeiter</label><label><input type="checkbox" name="roles" value="club_admin"> Vereinsadmin</label>`;const kind=isPlatformAdmin?'platform_admin':mode==='club'?'club_member':'club_admin';const title=isPlatformAdmin?'Superadmin einladen':mode==='club'?'Benutzer / Vereinsadmin einladen':'Vereinsadmin einladen';const templateScope=mode==='club'?'club':'platform';return `<form class="admin-invite-form" data-club-id="${esc(clubId||'')}" data-invite-kind="${kind}" data-template-scope="${templateScope}"><div class="admin-invite-title">${title}</div><input type="text" name="recipient_name" autocomplete="name" placeholder="Name des Empfängers"><input type="email" name="email" required autocomplete="email" placeholder="E-Mail-Adresse">${roleOptions?`<div class="admin-invite-roles">${roleOptions}</div>`:''}<button class="admin-template-button" type="button">Vorlage</button><button class="primary" type="submit">Vorschau &amp; senden</button><p class="admin-action-status" aria-live="polite"></p></form>`}
function renderPlatformOverview(data){const clubs=data?.clubs||[],admins=data?.platform_admins||[];const memberCount=clubs.reduce((n,c)=>n+(Number(c.member_count)||0),0);e.platformAdminContent.innerHTML=`<div class="admin-summary"><div><strong>${clubs.length}</strong><span>Vereine</span></div><div><strong>${memberCount}</strong><span>Mitgliedschaften</span></div><div><strong>${admins.length}</strong><span>Superadmins</span></div></div><section class="admin-section"><h3>Superadmins</h3>${inviteForm('', 'platform_admin')}${admins.map(a=>`<div class="admin-member"><div class="admin-member-main"><strong>${esc(a.admin_code)}</strong><span>${esc(a.display_name||a.email||'')}</span><small>${esc(a.email||'')}</small></div>${a.active===false?'<span class="admin-state inactive">inaktiv</span>':'<span class="admin-state">aktiv</span>'}</div>`).join('')||'<p class="hint">Keine Superadmins gefunden.</p>'}</section><section class="admin-section"><h3>Neuen Verein anlegen</h3><form class="admin-invite-form admin-create-club-form"><div class="admin-invite-title">Verein erstellen</div><input type="text" name="club_name" required maxlength="120" placeholder="Vereinsname"><input type="text" name="club_slug" maxlength="80" placeholder="Kurzname / Slug (optional)"><input type="text" name="team_name" maxlength="80" value="Volleyball" placeholder="Erste Mannschaft (optional)"><button class="primary" type="submit">Verein anlegen</button><p class="admin-action-status" aria-live="polite"></p></form><p class="hint">Der Superadmin erhält dadurch keinen Zugriff auf Volleyball-Inhalte. Nach dem Anlegen kann direkt der erste Vereinsadmin eingeladen werden.</p></section><section class="admin-section"><h3>Vereine</h3>${clubs.map(c=>`<article class="admin-club"><div class="admin-club-head"><div><strong>${esc(c.name)}</strong><span>${esc(c.slug)}</span></div><span class="admin-state ${c.active===false?'inactive':''}">${c.active===false?'inaktiv':'aktiv'}</span></div><div class="admin-club-meta">${Number(c.team_count)||0} Mannschaft(en) · ${Number(c.member_count)||0} Benutzer · sichtbar sind nur Vereinsadmins</div>${inviteForm(c.id,'platform')}<div class="admin-platform-admins">${memberGroups(c.members||[],'platform')}</div></article>`).join('')||'<p class="hint">Keine Vereine vorhanden.</p>'}</section>`;wireAdminActions(e.platformAdminContent,'platform')}
function renderClubOverview(data){const c=data?.club||{},teams=data?.teams||[],members=data?.members||[];e.clubAdminContent.innerHTML=`<div class="admin-club-title"><strong>${esc(c.name||'Verein')}</strong><span>${esc(c.slug||'')}</span></div><div class="admin-summary"><div><strong>${teams.length}</strong><span>Mannschaften</span></div><div><strong>${members.length}</strong><span>Benutzer</span></div></div><section class="admin-section"><h3>Mannschaften</h3><div class="admin-team-list">${teams.map(t=>`<div class="admin-team"><strong>${esc(t.name)}</strong><span class="admin-state ${t.active===false?'inactive':''}">${t.active===false?'inaktiv':'aktiv'}</span></div>`).join('')||'<p class="hint">Keine Mannschaften vorhanden.</p>'}</div></section><section class="admin-section"><h3>Benutzer & Rollen</h3>${inviteForm(c.id,'club')}<div class="admin-member-groups">${memberGroups(members,'club')}</div></section>`;wireAdminActions(e.clubAdminContent,'club')}
async function edgeAdminAction(action,payload={}){if(!navigator.onLine)throw new Error('Die Benutzerverwaltung ist nur online verfügbar.');if(!authSession?.access_token)throw new Error('Nicht angemeldet');const base=window.APP_CONFIG.SUPABASE_URL.replace(/\/$/,'');const call=()=>fetch(`${base}/functions/v1/admin-invite`,{method:'POST',headers:authHeaders(),body:JSON.stringify({action,...payload})});let res=await call();if(res.status===401){await refreshSession();res=await call()}const out=await res.json().catch(()=>({}));if(!res.ok||out.ok===false)throw new Error(out.error||`HTTP ${res.status}`);return out}
function checkedRoles(root){return [...root.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value)}
function templateKeyForForm(form){if(form.dataset.inviteKind==='platform_admin')return 'platform_admin';const roles=checkedRoles(form.querySelector('.admin-invite-roles')||form);return roles.includes('club_admin')?'club_admin':'club_member'}
function templateClubIdForForm(form,key){return form.dataset.templateScope==='club'&&key!=='platform_admin'?(form.dataset.clubId||''):''}
function templateVars(form){const roles=form.dataset.inviteKind==='platform_admin'?['Superadmin']:checkedRoles(form.querySelector('.admin-invite-roles')||form).map(roleLabel);const clubId=form.dataset.clubId||'';const clubName=clubId?(userAccess?.clubs||[]).find(c=>c.id===clubId)?.name||form.closest('.admin-club')?.querySelector('.admin-club-head strong')?.textContent||'Verein':'Volleyball Trainer';return {recipient_name:form.elements.recipient_name.value.trim()||'Teammitglied',sender_name:userAccess?.display_name||authSession?.user?.email||'Administration',sender_email:authSession?.user?.email||'',club_name:clubName,roles:roles.join(', ')||'Viewer'}}
function fillTemplate(text,vars){return String(text||'').replace(/\{\{\s*(recipient_name|sender_name|sender_email|club_name|roles)\s*\}\}/g,(_,k)=>vars[k]||'')}
let inviteDialogState=null;
function closeInviteDialog(){inviteDialogState=null;e.invitePreviewDialog?.close()}
async function openTemplateEditor(form){const key=templateKeyForForm(form),clubId=templateClubIdForForm(form,key);e.invitePreviewStatus.textContent='Vorlage wird geladen …';e.invitePreviewDialog.showModal();e.invitePreviewTitle.textContent='Einladungsvorlage bearbeiten';e.invitePreviewMeta.textContent=key==='club_member'?'Vorlage dieses Vereins':key==='club_admin'?(clubId?'Vereinsadmin-Vorlage dieses Vereins':'Plattformvorlage für neue Vereinsadmins'):'Vorlage für neue Superadmins';e.inviteTemplateHint.textContent='Platzhalter: {{recipient_name}}, {{sender_name}}, {{sender_email}}, {{club_name}}, {{roles}}';e.invitePreviewSend.classList.add('hidden');e.invitePreviewSave.classList.remove('hidden');try{const out=await edgeAdminAction('get_invite_template',{template_key:key,club_id:clubId});e.invitePreviewSubject.value=out.template.subject;e.invitePreviewBody.value=out.template.body;e.invitePreviewStatus.textContent=out.template.saved?'Gespeicherte Vorlage geladen.':'Standardvorlage geladen – noch nicht individuell gespeichert.';inviteDialogState={mode:'template',form,key,clubId}}catch(err){e.invitePreviewStatus.textContent=err.message}}
async function openInvitePreview(form,mode){const status=form.querySelector('.admin-action-status'),email=form.elements.email.value.trim(),recipientName=form.elements.recipient_name.value.trim();if(!email)return;const roles=form.dataset.inviteKind==='platform_admin'?['platform_admin']:checkedRoles(form.querySelector('.admin-invite-roles'));if(form.dataset.inviteKind!=='platform_admin'&&!roles.length){status.textContent='Bitte mindestens eine Rolle wählen.';return}const key=templateKeyForForm(form),clubId=templateClubIdForForm(form,key);status.textContent='Vorlage wird geladen …';try{const out=await edgeAdminAction('get_invite_template',{template_key:key,club_id:clubId});const vars=templateVars(form);e.invitePreviewTitle.textContent='Einladung prüfen';e.invitePreviewMeta.textContent=`An: ${recipientName?recipientName+' · ':''}${email} · ${vars.roles}`;e.invitePreviewSubject.value=fillTemplate(out.template.subject,vars);e.invitePreviewBody.value=fillTemplate(out.template.body,vars);e.inviteTemplateHint.textContent='Diese Änderungen gelten nur für diese eine Mail. Die gespeicherte Vorlage bleibt unverändert.';e.invitePreviewStatus.textContent='';e.invitePreviewSave.classList.add('hidden');e.invitePreviewSend.classList.remove('hidden');inviteDialogState={mode:'send',form,adminMode:mode,key,clubId,email,recipientName,roles};e.invitePreviewDialog.showModal();status.textContent=''}catch(err){status.textContent=err.message}}
async function saveCurrentTemplate(){if(!inviteDialogState||inviteDialogState.mode!=='template')return;const subject=e.invitePreviewSubject.value.trim(),body=e.invitePreviewBody.value.trim();if(!subject||!body){e.invitePreviewStatus.textContent='Betreff und Nachricht dürfen nicht leer sein.';return}e.invitePreviewSave.disabled=true;e.invitePreviewStatus.textContent='Vorlage wird gespeichert …';try{await edgeAdminAction('save_invite_template',{template_key:inviteDialogState.key,club_id:inviteDialogState.clubId,subject,body});e.invitePreviewStatus.textContent='Vorlage gespeichert.'}catch(err){e.invitePreviewStatus.textContent=err.message}finally{e.invitePreviewSave.disabled=false}}
async function sendCurrentInvite(){if(!inviteDialogState||inviteDialogState.mode!=='send')return;const st=inviteDialogState,subject=e.invitePreviewSubject.value.trim(),body=e.invitePreviewBody.value.trim();if(!subject||!body){e.invitePreviewStatus.textContent='Betreff und Nachricht dürfen nicht leer sein.';return}e.invitePreviewSend.disabled=true;e.invitePreviewStatus.textContent='Einladung wird gesendet …';try{let result;if(st.key==='platform_admin')result=await edgeAdminAction('invite_platform_admin',{email:st.email,recipient_name:st.recipientName,invite_subject:subject,invite_body:body});else result=await edgeAdminAction('invite_member',{club_id:st.form.dataset.clubId,email:st.email,recipient_name:st.recipientName,roles:st.roles,invite_subject:subject,invite_body:body,template_key:st.key});closeInviteDialog();alert(result.invited?'Einladung wurde gesendet.':'Benutzer existiert bereits. Die Berechtigung wurde zugeordnet; es wurde keine neue Einladungs-Mail versendet.');st.form.reset();if(st.adminMode==='platform')await refreshPlatformAdmin();else await refreshClubAdmin()}catch(err){e.invitePreviewStatus.textContent=err.message}finally{e.invitePreviewSend.disabled=false}}
function wireAdminActions(container,mode){container.querySelectorAll('.admin-member-settings').forEach(button=>button.addEventListener('click',()=>{const panel=container.querySelector(`[data-member-editor="${CSS.escape(button.dataset.membershipId)}"]`);if(!panel)return;const opening=panel.classList.contains('hidden');container.querySelectorAll('.admin-member-editor').forEach(x=>x.classList.add('hidden'));if(opening)panel.classList.remove('hidden')}));container.querySelectorAll('.admin-create-club-form').forEach(form=>form.addEventListener('submit',async ev=>{ev.preventDefault();const status=form.querySelector('.admin-action-status');const name=form.elements.club_name.value.trim(),slug=form.elements.club_slug.value.trim(),teamName=form.elements.team_name.value.trim();if(!name)return;status.textContent='Verein wird angelegt …';const button=form.querySelector('button[type="submit"]');button.disabled=true;try{const out=await edgeAdminAction('create_club',{name,slug,team_name:teamName});status.textContent=`${out.name} wurde angelegt.`;await refreshPlatformAdmin()}catch(err){status.textContent=err.message;button.disabled=false}}));container.querySelectorAll('.admin-invite-form:not(.admin-create-club-form)').forEach(form=>{form.addEventListener('submit',ev=>{ev.preventDefault();openInvitePreview(form,mode)});form.querySelector('.admin-template-button')?.addEventListener('click',()=>openTemplateEditor(form))});container.querySelectorAll('.admin-save-roles').forEach(button=>button.addEventListener('click',async()=>{const editor=button.closest('.admin-role-editor'),roles=checkedRoles(editor);if(!roles.length){alert('Mindestens eine Rolle muss aktiv bleiben.');return}button.disabled=true;try{await edgeAdminAction('set_roles',{membership_id:editor.dataset.membershipId,roles});if(mode==='platform')await refreshPlatformAdmin();else await refreshClubAdmin()}catch(err){alert(err.message);button.disabled=false}}));container.querySelectorAll('.admin-toggle-member').forEach(button=>button.addEventListener('click',async()=>{const activate=button.dataset.active==='true';if(!confirm(activate?'Diesen Vereinszugang wieder aktivieren?':'Diesen Vereinszugang wirklich deaktivieren?'))return;button.disabled=true;try{await edgeAdminAction('set_membership_active',{membership_id:button.dataset.membershipId,active:activate});if(mode==='platform')await refreshPlatformAdmin();else await refreshClubAdmin()}catch(err){alert(err.message);button.disabled=false}}));container.querySelectorAll('.admin-remove-member').forEach(button=>button.addEventListener('click',async()=>{const email=button.dataset.email||'';if(!confirm(`Vereinszugang von ${email||'diesem Benutzer'} wirklich entfernen?\n\nDas Benutzerkonto bleibt bestehen. Nur die Zuordnung zu diesem Verein wird gelöscht.`))return;button.disabled=true;try{await edgeAdminAction('remove_membership',{membership_id:button.dataset.membershipId});if(mode==='platform')await refreshPlatformAdmin();else await refreshClubAdmin()}catch(err){alert(err.message);button.disabled=false}}));container.querySelectorAll('.admin-password-reset').forEach(button=>button.addEventListener('click',async()=>{const email=button.dataset.email||'dieses Konto';if(!confirm(`Passwort-Mail an ${email} senden?`))return;button.disabled=true;try{await edgeAdminAction('send_password_reset',{membership_id:button.dataset.membershipId});alert(`Passwort-Mail wurde an ${email} angefordert.`)}catch(err){alert(err.message)}finally{button.disabled=false}}));container.querySelectorAll('.admin-delete-user').forEach(button=>button.addEventListener('click',async()=>{const email=button.dataset.email||'';if(!confirm(`Benutzerkonto ${email||''} wirklich ENDGÜLTIG löschen?\n\nDer Benutzer verliert alle Vereinszuordnungen. Diese Aktion kann nicht rückgängig gemacht werden.`))return;const typed=prompt(`Zur Sicherheit bitte die E-Mail-Adresse exakt eingeben:\n${email}`,'');if(typed!==email){if(typed!==null)alert('E-Mail-Adresse stimmt nicht überein. Benutzer wurde nicht gelöscht.');return}button.disabled=true;try{await edgeAdminAction('delete_user',{user_id:button.dataset.userId});alert(`Benutzer ${email} wurde endgültig gelöscht.`);await refreshPlatformAdmin()}catch(err){alert(err.message);button.disabled=false}}))}
async function refreshPlatformAdmin(){renderPlatformOverview(await authedRpc('get_platform_overview'));await loadAccess();renderAccount()}
async function refreshClubAdmin(){const club=currentClub();if(!club)return;renderClubOverview(await authedRpc('get_club_overview',{p_club_id:club.id}));await loadAccess();renderAccount()}
async function openPlatformAdmin(){if(!navigator.onLine){e.platformAdminContent.innerHTML='<p class="admin-error">Die Plattformverwaltung ist nur online verfügbar.</p>';e.platformAdminDialog.showModal();return}e.platformAdminContent.innerHTML='<p class="hint">Wird geladen …</p>';e.accountDialog.close();e.platformAdminDialog.showModal();try{await refreshPlatformAdmin()}catch(err){e.platformAdminContent.innerHTML=`<p class="admin-error">${esc(err.message)}</p>`}}
async function openClubAdmin(){const club=currentClub();if(!club)return;if(!navigator.onLine){e.clubAdminContent.innerHTML='<p class="admin-error">Die Vereinsverwaltung ist nur online verfügbar.</p>';e.clubAdminDialog.showModal();return}e.clubAdminContent.innerHTML='<p class="hint">Wird geladen …</p>';e.accountDialog.close();e.clubAdminDialog.showModal();try{await refreshClubAdmin()}catch(err){e.clubAdminContent.innerHTML=`<p class="admin-error">${esc(err.message)}</p>`}}
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
    updateMigrationUI();loadQuestions().catch(()=>{});
  }catch(err){e.syncBadge.textContent="Offline/Browser – Supabase nicht erreichbar";dataSource=hadLocalStateAtStartup?"browser":"default";updateMigrationUI()}
}
async function save(msg){
  if(!navigator.onLine||!supabaseConfigured()||!canEdit()){e.status.textContent="Speichern nicht möglich: Zum Bearbeiten und Speichern wird eine Supabase-Verbindung benötigt.";updateMigrationUI();render();return}
  try{await rpc("save_team_state",{p_team_id:currentTeamId,p_payload:state});remoteHasData=true;dataSource="supabase";committedState=structuredClone(state);dirty=false;localStorage.setItem(KEY,JSON.stringify(committedState));offlineMeta.lastSuccessfulSyncAt=isoNow();offlineMeta.lastOnlineLoadAt=offlineMeta.lastSuccessfulSyncAt;offlineMeta.lastLocalSaveAt=offlineMeta.lastSuccessfulSyncAt;offlineMeta.pendingLocalChanges=false;persistOfflineMeta();e.syncBadge.textContent="Speicherung: Supabase synchron";e.status.textContent=msg}
  catch(err){e.syncBadge.textContent="Supabase nicht erreichbar";e.status.textContent=`Nicht gespeichert. Supabase-Fehler: ${err.message}`}
  updateMigrationUI();render();
}
function ownRole(p){return td().teamConfig.roles[p.id]||defaultRoles[p.id]||"AA"}
function opponentRole(p){const cfg=td().teamConfig||{},sys=cfg.opponentSystem||"42";const map42={1:"AA",2:"Z",3:"MB",4:"AA",5:"Z",6:"MB"},map51={1:"D",2:"AA",3:"MB",4:"Z",5:"AA",6:"MB"};const role=(sys==="51"?map51:map42)[p.base]||p.role;return cfg.opponentLibero&&role==="MB"&&[1,5,6].includes(p.base)?"L":role}
function effectiveRole(p){if(p.team==="opponent")return opponentRole(p);const role=ownRole(p);return td().teamConfig.libero&&role==="MB"&&[1,5,6].includes(prot(p))?"L":role}
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
    const label=svg("text",{"data-label25":"1","text-anchor":"middle",x:0,y:30,fill:"#17324d","font-size":18,"font-weight":900,"paint-order":"stroke","stroke":"#dbe8f8","stroke-width":5,"stroke-linejoin":"round"});
    g.append(foot,shadow,body,armL,armR,head,badge,role,label);e.player25Layer.appendChild(g)
  })
}
function shortenLineEnd(a,b,distance=42){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(!len||len<=distance)return{x:b.x,y:b.y};return{x:b.x-dx/len*distance,y:b.y-dy/len*distance}}
function line25(layer,a,b,cls){const A=project25(a),B=project25(b),E=cls.includes("movement")?shortenLineEnd(A,B,34):B;layer.appendChild(svg("line",{x1:A.x,y1:A.y,x2:E.x,y2:E.y,class:cls}))}
const actionNames={serve:"Aufschlag",receive:"Annahme",set:"Zuspiel",attack:"Angriff",block:"Block",defense:"Abwehr",point:"Punkt / Fehler"};
function actionData(){const a=sd().action||{};return{type:a.type||"",actorId:a.actorId||"",technique:a.technique||"",helperId:a.helperId||"",blocker1Id:a.blocker1Id||"",blocker2Id:a.blocker2Id||"",outcome:a.outcome||"",reason:a.reason||"",ballLinked:Boolean(a.ballLinked)}}
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
function playerLabel(p){if(!p)return"";const role=effectiveRole(p);return p.team==="opponent"?`Gegner ${role}`:`${roleNames[role]||role} · ${prot(p)}`}
function syncContactBall(force=false){const a=actionData();if(!a.actorId||(!force&&!a.ballLinked))return;const pos=sd().positions[a.actorId];if(pos)sd().ball={x:pos.x,y:pos.y}}
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
  e.snapBallToActor.classList.toggle("hidden",isPoint||!a.type||!a.actorId);e.snapBallToActor.textContent=a.ballLinked?"🏐 Ball entkoppeln":"🏐 Ball koppeln";e.snapBallToActor.classList.toggle("is-linked",a.ballLinked);e.clearAction.classList.toggle("hidden",!a.type);
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
  e.view2d.classList.toggle("active",preferredView==="2d");e.view25d.classList.toggle("active",preferredView==="25d");e.view2d.setAttribute("aria-pressed",String(preferredView==="2d"));e.view25d.setAttribute("aria-pressed",String(preferredView==="25d"));if(e.positionInfoToggle){e.positionInfoToggle.classList.toggle("active",showPositionInfo);e.positionInfoToggle.textContent=`# ${showPositionInfo?"an":"aus"}`;e.positionInfoToggle.setAttribute("aria-pressed",String(showPositionInfo))}
  if(!visible)return;
  e.movement25Layer.innerHTML="";e.ballPath25Layer.innerHTML="";e.action25Layer.innerHTML="";
  [...allPlayers].sort((a,b)=>sd().positions[a.id].y-sd().positions[b.id].y).forEach(p=>{const node=e.player25Layer.querySelector(`[data-id25="${p.id}"]`);e.player25Layer.appendChild(node)});
  const sustain=sustainedAttackBlockState(state.step),ca=actionData();
  allPlayers.forEach(p=>{const node=e.player25Layer.querySelector(`[data-id25="${p.id}"]`),pos=sd().positions[p.id],P=project25(pos),role=effectiveRole(p),contactLift=contactLift25(sd(),p.id,state.step);node.setAttribute("transform",`translate(${P.x} ${P.y-contactLift*P.scale}) scale(${P.scale})`);node.querySelector("[data-role25]").textContent=role;const label25=node.querySelector("[data-label25]");if(label25){label25.textContent=p.team==="opponent"?"":String(prot(p));label25.style.display=showPositionInfo&&p.team!=="opponent"?"":"none"}const isLib=role==="L";node.querySelector("[data-body]").setAttribute("fill",p.team==="opponent"?"#e32828":isLib?"#111827":"#0b4fc6");node.querySelector("[data-badge]").setAttribute("fill",p.team==="opponent"?"#b91c1c":isLib?"#111827":"#073b9a");const active=ca.actorId===p.id&&supportsTechnique(ca.type),upper=active&&ca.technique==="upper",lower=active&&ca.technique==="lower";const attackActor=contactRole25(sd(),p.id,state.step)==="attack",blocker=contactRole25(sd(),p.id,state.step)==="block";let armL="M-9 -44 L-20 -25",armR="M9 -44 L20 -25";if(upper){armL="M-9 -44 Q-18 -70 -8 -108";armR="M9 -44 Q18 -70 8 -108"}else if(lower){armL="M-9 -42 Q-14 -30 -8 -19";armR="M9 -42 Q14 -30 8 -19"}else if(blocker){armL="M-9 -44 Q-16 -78 -10 -116";armR="M9 -44 Q16 -78 10 -116"}else if(attackActor){armL="M-9 -44 Q-1 -60 9 -88";armR="M9 -44 Q18 -76 24 -114"}node.querySelector("[data-arm-left]").setAttribute("d",armL);node.querySelector("[data-arm-right]").setAttribute("d",armR)});
  const bp=ballVisual25(sd());e.ball25Object.setAttribute("transform",`translate(${bp.x} ${bp.y}) scale(${bp.scale})`);e.ball25Object.setAttribute("visibility","visible");
  if(state.step>0){const a=rd().steps[state.step-1],b=sd();allPlayers.forEach(p=>{const A=a.positions[p.id],B=b.positions[p.id];if(A&&B&&(A.x!==B.x||A.y!==B.y))line25(e.movement25Layer,A,B,"movement25-path")});if(a.ball.x!==b.ball.x||a.ball.y!==b.ball.y)drawBallCurve(e.ballPath25Layer,a.ball,b.ball,"ball25-path",true,motionFor(a),a,b)}
}
function currentCourtIs25(){return !editing&&preferredView==="25d"}
function createPlayers(){e.playerLayer.innerHTML="";allPlayers.forEach(p=>{const g=svg("g",{class:`player-object ${p.team}`,"data-id":p.id}),c=svg("circle",{r:29,fill:p.team==="opponent"?"#e32828":"#0b4fc6",stroke:"#fff","stroke-width":3,filter:"url(#shadow)"}),t=svg("text",{"text-anchor":"middle",y:7,fill:"#fff","font-size":19,"font-weight":800,"data-role":"1"}),l=svg("text",{"text-anchor":"middle",y:50,fill:"#fff","font-size":18,"font-weight":900,"data-label":"1"});g.append(c,t,l);e.playerLayer.appendChild(g)})}
function line(layer,a,b,cls){const E=cls.includes("movement")?shortenLineEnd(a,b,42):b;layer.appendChild(svg("line",{x1:a.x,y1:a.y,x2:E.x,y2:E.y,class:cls}))}
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
function shortenTacticPoints(rawPoints,distance){
  const points=rawPoints.map(p=>({...p}));let total=0;
  for(let i=1;i<points.length;i++)total+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);
  if(total<=distance)return points;
  let remaining=distance;
  for(let i=points.length-2;i>=0;i--){
    const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(!len)continue;
    if(len>=remaining)return[...points.slice(0,i+1),{x:b.x-dx/len*remaining,y:b.y-dy/len*remaining}];
    remaining-=len;
  }
  return points;
}
function tacticPathD(rawPoints,kind){
  let points=(rawPoints||[]).map(p=>({x:Number(p.x)||0,y:Number(p.y)||0}));
  if(points.length<2)return"";
  points=shortenTacticPoints(points,kind==="player"?42:28);
  if(points.length===2)return`M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  let d=`M ${points[0].x} ${points[0].y}`;
  for(let i=1;i<points.length-2;i++){
    const p=points[i],next=points[i+1],mid={x:(p.x+next.x)/2,y:(p.y+next.y)/2};
    d+=` Q ${p.x} ${p.y} ${mid.x} ${mid.y}`;
  }
  const control=points[points.length-2],end=points[points.length-1];
  return`${d} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
}
function renderTacticPaths(){
  let active=null;
  if(dragging?.pathMode){const points=[...(dragging.points||[])];const live=dragging.livePoint,last=points[points.length-1];if(live&&(!last||live.x!==last.x||live.y!==last.y))points.push(live);if(points.length>1)active={kind:dragging.type,points}}
  [...tacticPaths,...(active?[active]:[])].forEach(item=>{
    const d=tacticPathD(item.points,item.kind);if(!d)return;
    const layer=item.kind==="ball"?e.ballPathLayer:e.movementLayer;
    layer.appendChild(svg("path",{d,class:`tactic-drawn-path tactic-${item.kind}-path`}));
  });
}
function paths(){e.movementLayer.innerHTML="";e.ballPathLayer.innerHTML="";if(tacticMode){renderTacticPaths();return}if(state.step===0)return;const a=rd().steps[state.step-1],b=sd();allPlayers.forEach(p=>{const A=a.positions[p.id],B=b.positions[p.id];if(A&&B&&(A.x!==B.x||A.y!==B.y))line(e.movementLayer,A,B,"movement-path")});if(a.ball.x!==b.ball.x||a.ball.y!==b.ball.y)drawBallCurve(e.ballPathLayer,a.ball,b.ball,"ball-path",false,motionFor(a))}
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
function visibleSituationIndexes(){return td().rotations.map((s,i)=>s.published?i:null).filter(i=>i!==null)}
function ensureVisibleSituation(){
  if(editing)return true;
  const visible=visibleSituationIndexes();
  if(!visible.length)return false;
  if(!td().rotations[state.rotation]?.published){state.rotation=visible[0];state.step=0}
  state.step=Math.max(0,Math.min((rd()?.steps?.length||1)-1,state.step));
  return true;
}
function renderSituationOptions(){
  const current=String(state.rotation);e.rotationSelect.innerHTML="";
  td().rotations.forEach((situation,i)=>{
    if(!editing&&!situation.published)return;
    const o=document.createElement("option"),status=editing?statusForSituation(situation):"ok";
    o.value=String(i);o.textContent=situationDisplayName(situation);o.dataset.status=status;
    if(status==="warning"){o.style.backgroundColor="#6b5318";o.style.color="#fff3bd"}
    if(status==="error"){o.style.backgroundColor="#702626";o.style.color="#ffe0e0"}
    e.rotationSelect.appendChild(o)
  });
  if(!e.rotationSelect.options.length){const o=document.createElement("option");o.textContent="Keine freigegebene Spielsituation";o.value="";e.rotationSelect.appendChild(o);e.rotationSelect.disabled=true;return}
  e.rotationSelect.disabled=false;e.rotationSelect.value=current;applySelectTextFit(e.rotationSelect,situationDisplayName(rd()));
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
    const hasStepInfo=Boolean((step.info||"").trim());
    const hasActiveQuestion=Array.isArray(questionCache)&&questionCache.some(q=>Number(q.situation_index)===state.rotation&&Number(q.step_index)===i&&q.status!=="resolved");
    const hasExtra=hasStepInfo||hasActiveQuestion;
    b.innerHTML=`<span class="step-strip-label">${i+1} · ${esc(step.name||`Schritt ${i+1}`)}</span>${hasExtra?`<span class="step-info-badge" title="${hasStepInfo&&hasActiveQuestion?'Info und aktive Frage(n)':hasStepInfo?'Info zu diesem Schritt':'Aktive Frage(n) zu diesem Schritt'}">ⓘ</span>`:""}`;
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
  window.VBTrainingPlayer?.setContext({visible:editing&&canEdit()&&!tacticMode,userId:authSession?.user?.id||"",teamId:currentTeamId});
  renderTeamOptions();
  const hasVisibleSituation=ensureVisibleSituation();
  document.body.classList.toggle("no-published-view",!editing&&!hasVisibleSituation);
  e.noPublishedNotice?.classList.toggle("hidden",editing||hasVisibleSituation);
  if(!editing&&!hasVisibleSituation){
    renderSituationOptions();
    document.body.classList.toggle("editing-mode",false);
    e.editButton?.classList.toggle("hidden",!canEdit());
    e.teamConfigToggle?.classList.add("hidden");e.addTeam?.classList.add("hidden");e.deleteTeam?.classList.add("hidden");
    e.situationConfigToggle?.classList.add("hidden");e.addSituation?.classList.add("hidden");e.deleteSituation?.classList.add("hidden");
    e.status.textContent=canEdit()?"Keine Spielsituation ist für Viewer freigegeben. Zum Freigeben auf ✎ wechseln.":"Aktuell ist noch keine Spielsituation freigegeben.";
    updateMigrationUI();
    return;
  }
  e.tacticLaunch?.classList.toggle("hidden",!editing||tacticMode);
  e.tacticPanel?.classList.toggle("hidden",!tacticMode);
  e.tacticTitle?.classList.toggle("hidden",!tacticMode);
  if(tacticMode){
    if(e.tacticContext)e.tacticContext.textContent=`${td().name} · ${rname(state.rotation)}`;
    if(e.tacticStepTitle)e.tacticStepTitle.textContent=`Schritt ${state.step+1} · ${sd().name}`;
    if(e.tacticPrev)e.tacticPrev.disabled=state.step<=0;
    if(e.tacticNext)e.tacticNext.disabled=state.step>=rd().steps.length-1;
    if(e.tacticReset)e.tacticReset.disabled=!tacticChanged;
    if(e.tacticUndo)e.tacticUndo.disabled=!tacticUndoStack.length;
    [[e.tacticPlayerMove,tacticPlayerMode==="move"],[e.tacticPlayerPath,tacticPlayerMode==="path"],[e.tacticBallMove,tacticBallMode==="move"],[e.tacticBallPath,tacticBallMode==="path"]].forEach(([button,active])=>{if(!button)return;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active))});
  }
  renderSituationOptions();renderStepStrip();e.stepNumber.textContent=state.step+1;e.stepTotal.textContent=rd().steps.length;e.currentStepTitle.textContent=sd().name;if(e.stepNameInlineEditor)e.stepNameInlineEditor.classList.toggle("hidden",!editing||!renamingStep);if(e.currentStepTitle)e.currentStepTitle.classList.toggle("hidden",editing&&renamingStep);if(e.stepNameInlineInput&&renamingStep&&document.activeElement!==e.stepNameInlineInput)e.stepNameInlineInput.value=sd().name||"";if(e.stepNameSuggestions&&renamingStep)e.stepNameSuggestions.innerHTML=stepNameSuggestionHtml();e.liberoToggle.checked=td().teamConfig.libero;if(e.opponentSystem)e.opponentSystem.value=td().teamConfig.opponentSystem||"42";if(e.opponentLiberoToggle)e.opponentLiberoToggle.checked=Boolean(td().teamConfig.opponentLibero);if(e.brandClubName){const club=currentClub();e.brandClubName.textContent=club?.name||"TTC Geltendorf e.V.";e.brandClubName.title=e.brandClubName.textContent}if(e.stepNameEdit)e.stepNameEdit.classList.toggle("hidden",!editing||renamingStep);document.body.classList.toggle("editing-mode",editing);e.editButton?.classList.toggle("hidden",!canEdit());
e.questionNewButton?.classList.toggle("hidden",editing);updateMigrationUI();e.addTeam?.classList.toggle("hidden",!editing);e.deleteTeam?.classList.toggle("hidden",!editing);e.teamConfigToggle?.classList.toggle("hidden",!editing);e.addSituation.classList.toggle("hidden",!editing);e.deleteSituation.classList.toggle("hidden",!editing);e.addStep.classList.toggle("hidden",!editing);e.deleteStep.classList.toggle("hidden",!editing);if(e.resetStepPositions)e.resetStepPositions.classList.toggle("hidden",!editing||state.step===0);e.actionMenuToggle.classList.toggle("hidden",!editing);e.saveStep.classList.toggle("hidden",!editing||!dirty);e.teamConfigPanel?.classList.toggle("hidden",!editing||!teamConfigOpen);e.lineupEditor?.classList.toggle("hidden",!editing||!teamConfigOpen);e.situationConfigToggle?.classList.toggle("hidden",!editing);e.situationConfigPanel?.classList.toggle("hidden",!editing||!situationConfigOpen);if(e.teamNameInput)e.teamNameInput.value=td().name||"";if(e.situationInfoEdit)e.situationInfoEdit.value=rd().info||"";if(e.stepInfoEdit)e.stepInfoEdit.value=sd().info||"";if(e.publishState){e.publishState.textContent=rd().published?"Freigegeben für Viewer":"In Bearbeitung – für Viewer verborgen";e.publishState.className=`publish-state ${rd().published?"published":"draft"}`;}if(e.publishSituation){e.publishSituation.textContent=rd().published?"Freigabe zurücknehmen":"✓ Für Viewer freigeben";}if(e.situationInfoButton)e.situationInfoButton.classList.add("hidden");if(e.stepInfoButton)e.stepInfoButton.classList.toggle("hidden",!(sd().info||"").trim());if(e.situationInfoInline)e.situationInfoInline.classList.toggle("hidden",!(rd().info||"").trim());if(e.situationNameEdit){const fixed=Boolean(rd().baseName);e.situationBaseNameWrap?.classList.toggle("hidden",!fixed);if(e.situationBaseName)e.situationBaseName.textContent=rd().baseName||"";if(e.situationNameLabel)e.situationNameLabel.textContent=fixed?"Zusatz (optional)":"Name der Spielsituation";e.situationNameEdit.value=fixed?(rd().nameSuffix||""):(rd().name||"");if(e.situationNameHint)e.situationNameHint.textContent=fixed?"Der feste Grundname bleibt erhalten; der Zusatz wird dahinter angezeigt.":"Der Name kann frei geändert werden."}renderQuestionContext();updateCourtQuestionBadge();renderActionEditor();paths();const bad=validate();
  allPlayers.forEach(p=>{const g=e.playerLayer.querySelector(`[data-id="${p.id}"]`),pos=sd().positions[p.id],role=effectiveRole(p);g.setAttribute("transform",`translate(${pos.x} ${pos.y})`);g.classList.toggle("editable",editing||tacticMode);g.classList.toggle("selected",selected?.type==="player"&&selected.id===p.id);g.classList.toggle("tactic-dragging",tacticMode&&dragging?.type==="player"&&dragging.id===p.id);g.classList.toggle("position-warning",editing&&bad.has(p.id));g.querySelector("[data-role]").textContent=role;g.querySelector("circle").setAttribute("fill",p.team==="opponent"?"#e32828":role==="L"?"#111827":"#0b4fc6");const label=g.querySelector("[data-label]");label.textContent=p.team==="opponent"?"":String(prot(p));label.style.display=showPositionInfo&&p.team!=="opponent"?"":"none"});
  e.ballObject.setAttribute("visibility","visible");e.ballObject.setAttribute("transform",`translate(${sd().ball.x} ${sd().ball.y})`);e.ballObject.classList.toggle("editable",editing||tacticMode);e.ballObject.classList.toggle("selected",selected?.type==="ball");e.ballObject.classList.toggle("tactic-dragging",tacticMode&&dragging?.type==="ball");e.ballObject.classList.toggle("linked-contact",editing&&Boolean(actionData().ballLinked));
  if(e.tapNoticeText)e.tapNoticeText.textContent=selected?.type==="player"?"Zielposition antippen":"Zielposition antippen";
  if(e.resetSelectedPlayer)e.resetSelectedPlayer.classList.toggle("hidden",!(editing&&state.step>0&&selected?.type==="player"));
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
function edit(v){stop();clearVisualAnimations();if(v&&!editing){state=structuredClone(committedState);dirty=false}if(!v&&editing&&dirty){state=structuredClone(committedState);migrate();dirty=false}editing=v;selected=dragging=null;if(!v){renamingStep=false;actionMenuOpen=false;teamConfigOpen=false;situationConfigOpen=false;}e.editButton.textContent=v?"✓":"✎";e.editButton.setAttribute("aria-label",v?"Bearbeitung beenden":"Bearbeiten");e.editButton.setAttribute("title",v?"Bearbeitung beenden":"Bearbeiten");e.editPanel.classList.toggle("hidden",!v);e.tapNotice.classList.add("hidden");if(!v){teamConfigOpen=false;situationConfigOpen=false;e.lineupEditor.classList.add("hidden");e.teamConfigPanel?.classList.add("hidden");e.situationConfigPanel?.classList.add("hidden")}render()}
async function requestEdit(){if(editing){edit(false);return}if(!navigator.onLine){e.status.textContent="Offline-Bearbeitung nicht möglich.";window.alert("Offline-Bearbeitung nicht möglich.\n\nZum Bearbeiten wird eine Internetverbindung benötigt.");return}if(!canEdit()){window.alert("Dein Konto hat keine Bearbeitungsberechtigung.");return}edit(true)}
function resetTacticWorkspace(){tacticUndoStack=[];tacticPaths=[];tacticChanged=false;selected=dragging=null}
function tacticSnapshot(){return{step:state.step,stepData:structuredClone(sd()),paths:structuredClone(tacticPaths),changed:tacticChanged}}
function setTacticTool(kind,value){
  if(!tacticMode||!['move','path'].includes(value))return;
  if(kind==="player")tacticPlayerMode=value;else if(kind==="ball")tacticBallMode=value;else return;
  const label=kind==="player"?(value==="path"?"Spieler: Laufweg zeichnen":"Spieler: ohne Laufweg verschieben"):(value==="path"?"Ball: Flugbahn zeichnen":"Ball: ohne Flugbahn verschieben");
  e.status.textContent=label;render();
}
function undoTactic(){
  if(!tacticMode||!tacticUndoStack.length)return;
  const previous=tacticUndoStack.pop();
  if(previous.step!==state.step){tacticUndoStack=[];render();return}
  rd().steps[state.step]=structuredClone(previous.stepData);tacticPaths=structuredClone(previous.paths);tacticChanged=previous.changed;selected=dragging=null;
  e.status.textContent="Letzte Änderung rückgängig gemacht.";render();
}
function enterTacticMode(){
  if(!editing||playing)return;
  stop();clearVisualAnimations();
  tacticSourceState=structuredClone(state);
  state=structuredClone(state);
  tacticPreviousView=preferredView;tacticMode=true;tacticPlayerMode="move";tacticBallMode="move";resetTacticWorkspace();preferredView="2d";
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
  state.step=next;resetTacticWorkspace();
  render();
}
function exitTacticMode(){
  if(!tacticMode)return;
  stop();clearVisualAnimations();
  if(tacticSourceState)state=structuredClone(tacticSourceState);
  tacticSourceState=null;tacticMode=false;resetTacticWorkspace();preferredView=tacticPreviousView;
  e.status.textContent="Taktiktafel beendet. Keine Änderung wurde gespeichert.";
  render();
}
function point(ev){const p=e.court.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;return p.matrixTransform(e.court.getScreenCTM().inverse())}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function playerPoint(p,player){const a=actionData();if(a.type==="serve"&&a.actorId===player.id){if(player.team==="own")return{x:clamp(p.x,124,576),y:clamp(p.y,855,888)};return{x:clamp(p.x,124,576),y:clamp(p.y,12,45)}}if(a.type==="serve"){const yMin=player.team==="own"?479:79,yMax=player.team==="own"?821:421;return{x:clamp(p.x,124,576),y:clamp(p.y,yMin,yMax)}}return{x:clamp(p.x,32,668),y:clamp(p.y,32,868)}}
function keepServePlayersInside(){if(actionData().type!=="serve")return;const a=actionData();allPlayers.forEach(player=>{if(a.actorId===player.id)return;sd().positions[player.id]=playerPoint(sd().positions[player.id],player)})}
const cb=p=>({x:clamp(p.x,25,675),y:clamp(p.y,25,875)}),mode=()=>"tap";
function beginTacticDrag(type,id=""){
  const start=type==="player"?structuredClone(sd().positions[id]):structuredClone(sd().ball);
  if(!start)return false;
  const pathMode=type==="player"?tacticPlayerMode==="path":tacticBallMode==="path";
  dragging={type,id,start,livePoint:start,lastSample:start,points:[start],pathMode,moved:false,before:tacticSnapshot()};
  return true;
}
function moveTacticDrag(p){
  if(!dragging||!tacticMode)return;
  const next=dragging.type==="player"?{x:clamp(p.x,32,668),y:clamp(p.y,32,868)}:cb(p);
  if(dragging.type==="player")sd().positions[dragging.id]=next;else sd().ball=next;
  dragging.livePoint=next;
  if(Math.hypot(next.x-dragging.start.x,next.y-dragging.start.y)>.75)dragging.moved=true;
  if(dragging.pathMode&&Math.hypot(next.x-dragging.lastSample.x,next.y-dragging.lastSample.y)>=8){dragging.points.push(next);dragging.lastSample=next}
  tacticChanged=tacticChanged||dragging.moved;
}
function finishTacticDrag(){
  if(!dragging)return;
  const completed=dragging;dragging=null;
  if(!tacticMode||!completed.moved){render();return}
  if(completed.pathMode){const points=[...completed.points],last=points[points.length-1],end=completed.livePoint;if(end&&(!last||end.x!==last.x||end.y!==last.y))points.push(end);if(points.length>1)tacticPaths.push({kind:completed.type,points})}
  tacticUndoStack.push(completed.before);if(tacticUndoStack.length>100)tacticUndoStack.shift();
  tacticChanged=true;render();
}
e.court.addEventListener("pointerdown",ev=>{
  if((!editing&&!tacticMode)||playing)return;
  ev.preventDefault();
  const pe=ev.target.closest("[data-id]"),be=ev.target.closest("#ballObject");
  if(tacticMode){if(pe&&beginTacticDrag("player",pe.dataset.id))e.court.setPointerCapture(ev.pointerId);else if(be&&beginTacticDrag("ball"))e.court.setPointerCapture(ev.pointerId);return}
  if(mode()==="tap"){
    if(selected){
      if(selected.type==="player"&&pe?.dataset.id===selected.id){selected=null;e.tapNotice.classList.add("hidden");render();return}
      const p=point(ev);
      if(selected.type==="player"){const player=allPlayers.find(x=>x.id===selected.id);sd().positions[selected.id]=playerPoint(p,player);if(actionData().actorId===selected.id)syncContactBall();dirty=true}else{sd().ball=cb(p);dirty=true}
      selected=null;e.tapNotice.classList.add("hidden");render();return;
    }
    if(pe){selected={type:"player",id:pe.dataset.id};e.tapNotice.classList.remove("hidden");render();return}
    if(be){if(actionData().ballLinked){e.status.textContent="Der Ball ist in diesem Schritt an den Kontaktspieler gekoppelt. Zum freien Verschieben zuerst den Ball entkoppeln.";return}selected={type:"ball"};e.tapNotice.classList.remove("hidden");render();return}
  }
},{passive:false});
e.court.addEventListener("pointermove",ev=>{
  if(!dragging||(!editing&&!tacticMode)||playing)return;
  ev.preventDefault();const p=point(ev);
  if(tacticMode){moveTacticDrag(p);render();return}
  if(dragging.type==="player"){const player=allPlayers.find(x=>x.id===dragging.id);sd().positions[dragging.id]=playerPoint(p,player);if(actionData().actorId===dragging.id)syncContactBall();dirty=true}else{sd().ball=cb(p);dirty=true}render();
},{passive:false});
["pointerup","pointercancel"].forEach(n=>e.court.addEventListener(n,()=>{if(tacticMode)finishTacticDrag();else dragging=null}));
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
  if(playing){stop();render();return}
  if(rd().steps.length<2){e.status.textContent="Lege zuerst einen zweiten Schritt an.";return}
  stop();activeQuestionId=null;questionContextOpen=false;playing=true;state.step=0;render();e.playButton.textContent="■";
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
function goStep(target){questionContextOpen=false;activeQuestionId=null;target=Math.max(0,Math.min(rd().steps.length-1,target));if(target===state.step)return;if(editing){clearVisualAnimations();state.step=target;selected=dragging=null;renamingStep=false;actionMenuOpen=false;render();return}animate(target)}
e.stepStrip?.addEventListener("click",ev=>{questionContextOpen=false;activeQuestionId=null;const b=ev.target.closest("button[data-step-index]");if(!b||playing)return;const target=Number(b.dataset.stepIndex);if(!Number.isFinite(target)||target===state.step)return;clearVisualAnimations();state.step=target;selected=dragging=null;renamingStep=false;actionMenuOpen=false;render()});
e.prevStep.addEventListener("click",()=>goStep(state.step-1));e.nextStep.addEventListener("click",()=>goStep(state.step+1));e.playButton.addEventListener("click",playAll);
e.view2d.addEventListener("click",()=>{preferredView="2d";localStorage.setItem("volleyball-trainer-view",preferredView);clearVisualAnimations();render()});e.view25d.addEventListener("click",()=>{if(editing)return;preferredView="25d";localStorage.setItem("volleyball-trainer-view",preferredView);clearVisualAnimations();render()});e.positionInfoToggle.addEventListener("click",()=>{showPositionInfo=!showPositionInfo;localStorage.setItem("volleyball-trainer-position-info",showPositionInfo?"on":"off");render()});e.ruleCheckToggle?.addEventListener("click",()=>{const open=e.ruleCheckToggle.getAttribute("aria-expanded")==="true";e.ruleCheckToggle.setAttribute("aria-expanded",String(!open));e.ruleCheckDetails.classList.toggle("hidden",open);e.ruleCheckChevron.textContent=open?"▾":"▴"});
e.teamSelect?.addEventListener("change",ev=>{state.teamIndex=Number(ev.target.value);state.rotation=0;state.step=0;actionMenuOpen=false;teamConfigOpen=false;situationConfigOpen=false;buildLineupEditor();render()});
e.addTeam?.addEventListener("click",()=>{if(!editing)return;const suggested=`Team ${state.teams.length+1}`;const entered=window.prompt("Name der neuen Teamaufstellung (max. 16 Zeichen):",suggested);if(entered===null)return;const rawName=entered.trim()||suggested;if(Array.from(rawName).length>16){window.alert("Der Name der Teamaufstellung darf maximal 16 Zeichen lang sein.");return}const name=rawName;const copyCurrent=window.confirm("Aktuelle Teamaufstellung als Vorlage kopieren?\n\nOK = aktuelle Aufstellung und Spielsituationen kopieren\nAbbrechen = neue Grundaufstellung anlegen");const team=copyCurrent?structuredClone(td()):freshTeam(name);team.name=name;state.teams.splice(state.teamIndex+1,0,team);state.teamIndex++;state.rotation=0;state.step=0;actionMenuOpen=false;teamConfigOpen=false;dirty=true;buildLineupEditor();render()});
e.deleteTeam?.addEventListener("click",()=>{if(!editing)return;if(state.teams.length===1){e.status.textContent="Die einzige Teamaufstellung kann nicht gelöscht werden.";return}const name=td().name||`Teamaufstellung ${state.teamIndex+1}`;if(!window.confirm(`Teamaufstellung „${name}“ wirklich löschen?\n\nDabei werden alle Spielsituationen und Schritte dieser Teamaufstellung gelöscht.`))return;state.teams.splice(state.teamIndex,1);state.teamIndex=Math.max(0,state.teamIndex-1);state.rotation=0;state.step=0;teamConfigOpen=false;dirty=true;buildLineupEditor();render()});
e.teamConfigToggle?.addEventListener("click",()=>{if(!editing)return;teamConfigOpen=!teamConfigOpen;if(teamConfigOpen)situationConfigOpen=false;e.teamConfigPanel?.classList.toggle("hidden",!teamConfigOpen);e.lineupEditor?.classList.toggle("hidden",!teamConfigOpen);if(teamConfigOpen)buildLineupEditor();render();});
e.teamConfigClose?.addEventListener("click",()=>{teamConfigOpen=false;e.teamConfigPanel?.classList.add("hidden")});
e.teamNameInput?.addEventListener("input",()=>{if(!editing)return;const chars=Array.from(e.teamNameInput.value.trimStart());if(chars.length>16)e.teamNameInput.value=chars.slice(0,16).join("");td().name=e.teamNameInput.value||"Teamaufstellung";dirty=true;renderTeamOptions();e.saveStep.classList.remove("hidden")});
e.editButton.addEventListener("click",requestEdit);e.rotationSelect.addEventListener("change",x=>{questionContextOpen=false;activeQuestionId=null;state.rotation=Number(x.target.value);state.step=0;actionMenuOpen=false;situationConfigOpen=false;buildLineupEditor();render()});e.situationConfigToggle?.addEventListener("click",()=>{if(!editing)return;situationConfigOpen=!situationConfigOpen;if(situationConfigOpen)teamConfigOpen=false;render()});e.situationConfigClose?.addEventListener("click",()=>{situationConfigOpen=false;render()});e.situationNameEdit?.addEventListener("input",()=>{if(!editing)return;const value=e.situationNameEdit.value;if(rd().baseName){rd().nameSuffix=value.trimStart();rd().name=situationDisplayName(rd())}else{rd().name=value.trimStart()||"Spielsituation"}dirty=true;renderSituationOptions();e.saveStep.classList.remove("hidden")});e.stepNameEdit?.addEventListener("click",openStepNameEditor);e.stepNameSuggestions?.addEventListener("click",ev=>{const b=ev.target.closest("button[data-step-name]");if(!b||!renamingStep)return;const value=b.dataset.stepName||"";if(value){e.stepNameInlineInput.value=value;sd().name=value;rememberStepName(value);dirty=true;renamingStep=false;render()}else{e.stepNameInlineInput.value="";e.stepNameInlineInput.focus()}});e.stepNameInlineInput?.addEventListener("input",()=>{if(!renamingStep)return;sd().name=e.stepNameInlineInput.value.trimStart()||`Schritt ${state.step+1}`;dirty=true;e.currentStepTitle.textContent=sd().name;e.saveStep.classList.remove("hidden")});e.stepNameInlineInput?.addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();applyInlineStepName(true);render()}else if(ev.key==="Escape"){ev.preventDefault();renamingStep=false;render()}});e.addSituation.addEventListener("click",()=>{if(!editing)return;const suggested=`Neue Spielsituation ${td().rotations.length+1}`;const entered=window.prompt("Name der neuen Spielsituation:",suggested);if(entered===null)return;const name=entered.trim()||suggested;const copy=structuredClone(rd());delete copy.baseName;delete copy.nameSuffix;copy.name=name;td().rotations.splice(state.rotation+1,0,copy);state.rotation++;state.step=0;actionMenuOpen=false;situationConfigOpen=false;dirty=true;buildLineupEditor();render()});e.deleteSituation.addEventListener("click",()=>{if(!editing)return;if(td().rotations.length===1){e.status.textContent="Die einzige Spielsituation kann nicht gelöscht werden.";return}const name=rd().name||defaultSituationName(state.rotation);if(!window.confirm(`Spielsituation „${name}“ wirklich löschen?\n\nDabei werden alle Schritte dieser Spielsituation gelöscht.`))return;td().rotations.splice(state.rotation,1);state.rotation=Math.max(0,state.rotation-1);state.step=0;actionMenuOpen=false;situationConfigOpen=false;dirty=true;buildLineupEditor();render()});
// 2.9.4: Browser-Doppeltipp-Zoom auf den Spielfeldern verhindern.
[e.court,e.court25d].filter(Boolean).forEach(courtNode=>{
  courtNode.addEventListener("dblclick",ev=>ev.preventDefault(),{passive:false});
});

e.tacticLaunch?.addEventListener("click",enterTacticMode);
e.tacticUndo?.addEventListener("click",undoTactic);
e.tacticReset?.addEventListener("click",()=>restoreTacticStep(state.step));
e.tacticPrev?.addEventListener("click",()=>restoreTacticStep(state.step-1));
e.tacticNext?.addEventListener("click",()=>restoreTacticStep(state.step+1));
e.tacticPlayerMove?.addEventListener("click",()=>setTacticTool("player","move"));
e.tacticPlayerPath?.addEventListener("click",()=>setTacticTool("player","path"));
e.tacticBallMove?.addEventListener("click",()=>setTacticTool("ball","move"));
e.tacticBallPath?.addEventListener("click",()=>setTacticTool("ball","path"));
e.tacticExit?.addEventListener("click",exitTacticMode);

e.saveStep.addEventListener("click",()=>{if(renamingStep)applyInlineStepName(true);keepServePlayersInside();selected=dragging=null;e.tapNotice.classList.add("hidden");save("Änderungen gespeichert.");renamingStep=false;render()});
e.addStep.addEventListener("click",()=>{keepServePlayersInside();const s=sd();rd().steps.splice(state.step+1,0,{name:`Schritt ${state.step+2}`,positions:structuredClone(s.positions),ball:structuredClone(s.ball),action:{type:"",actorId:"",technique:"",helperId:"",blocker1Id:"",blocker2Id:"",outcome:"",reason:"",ballLinked:false}});state.step++;renamingStep=true;actionMenuOpen=false;dirty=true;render();setTimeout(()=>{if(e.stepNameInlineInput){e.stepNameInlineInput.focus();e.stepNameInlineInput.select()}},0)});
e.deleteStep.addEventListener("click",()=>{if(rd().steps.length===1){e.status.textContent="Der einzige Schritt kann nicht gelöscht werden.";return}const name=sd().name||`Schritt ${state.step+1}`;if(!window.confirm(`Schritt „${name}“ wirklich löschen?`))return;rd().steps.splice(state.step,1);state.step=Math.max(0,state.step-1);actionMenuOpen=false;dirty=true;render()});

function copyPlayerPositionsFromPrevious(ids=allPlayers.map(p=>p.id)){
  if(!editing||state.step===0)return;
  const previous=rd().steps[state.step-1],linkedActor=actionData().ballLinked?actionData().actorId:"";
  ids.forEach(id=>{if(previous?.positions?.[id])sd().positions[id]=structuredClone(previous.positions[id])});
  if(linkedActor&&ids.includes(linkedActor))syncContactBall();
  dirty=true;selected=dragging=null;e.tapNotice.classList.add("hidden");render();
}
e.resetStepPositions?.addEventListener("click",()=>{if(!editing||state.step===0)return;const prev=state.step;if(!window.confirm(`Alle Spielerpositionen in Schritt ${state.step+1} exakt auf Schritt ${prev} setzen?\n\nBall, Aktion, Infos und Fragen bleiben unverändert. Ist der Ball an einen zurückgesetzten Spieler gekoppelt, folgt er diesem Spieler.`))return;copyPlayerPositionsFromPrevious();e.status.textContent=`Spielerpositionen aus Schritt ${prev} übernommen. Bitte speichern.`});
e.resetSelectedPlayer?.addEventListener("click",ev=>{ev.stopPropagation();if(!editing||state.step===0||selected?.type!=="player")return;const id=selected.id,player=allPlayers.find(p=>p.id===id);copyPlayerPositionsFromPrevious([id]);e.status.textContent=`${player?playerLabel(player):'Spieler'} auf die Position aus Schritt ${state.step} zurückgesetzt. Bitte speichern.`});

e.actionType.addEventListener("change",()=>{const type=e.actionType.value;sd().action={...actionData(),type};if(type==="point"){sd().action.actorId="";sd().action.ballLinked=false;sd().action.technique="";sd().action.helperId="";sd().action.blocker1Id="";sd().action.blocker2Id="";sd().action.outcome=sd().action.outcome||"own";sd().action.reason=sd().action.reason||"ground"}else{sd().action.outcome="";sd().action.reason="";if(supportsTechnique(type)&&!sd().action.technique)sd().action.technique="upper";if(!supportsTechnique(type))sd().action.technique="";if(type!=="block")sd().action.helperId="";if(type!=="attack"){sd().action.blocker1Id="";sd().action.blocker2Id=""}}ensureServeActorOutside();keepServePlayersInside();dirty=true;render()});
e.actionMenuToggle.addEventListener("click",()=>{if(!editing)return;actionMenuOpen=!actionMenuOpen;render()});
e.actionMenuClose.addEventListener("click",()=>{actionMenuOpen=false;render()});
e.actionOutcome.addEventListener("change",()=>{sd().action={...actionData(),outcome:e.actionOutcome.value};dirty=true;render()});
e.actionReason.addEventListener("change",()=>{sd().action={...actionData(),reason:e.actionReason.value};dirty=true;render()});
e.actionActor.addEventListener("change",()=>{sd().action={...actionData(),actorId:e.actionActor.value,blocker1Id:"",blocker2Id:"",ballLinked:Boolean(e.actionActor.value)};ensureServeActorOutside();keepServePlayersInside();syncContactBall();dirty=true;render()});
e.actionTechnique.addEventListener("change",()=>{sd().action={...actionData(),technique:e.actionTechnique.value};dirty=true;render()});
e.actionHelper.addEventListener("change",()=>{sd().action={...actionData(),helperId:e.actionHelper.value};dirty=true;render()});
e.attackBlocker1.addEventListener("change",()=>{sd().action={...actionData(),blocker1Id:e.attackBlocker1.value};if(sd().action.blocker2Id===sd().action.blocker1Id)sd().action.blocker2Id="";dirty=true;render()});
e.attackBlocker2.addEventListener("change",()=>{sd().action={...actionData(),blocker2Id:e.attackBlocker2.value};if(sd().action.blocker2Id===sd().action.blocker1Id)sd().action.blocker2Id="";dirty=true;render()});
e.snapBallToActor.addEventListener("click",()=>{const a=actionData();if(!a.actorId){e.actionHint.textContent="Bitte zuerst einen Akteur auswählen.";return}sd().action={...a,ballLinked:!a.ballLinked};if(sd().action.ballLinked)syncContactBall();dirty=true;render()});
e.clearAction.addEventListener("click",()=>{sd().action={type:"",actorId:"",technique:"",helperId:"",blocker1Id:"",blocker2Id:"",outcome:"",reason:"",ballLinked:false};dirty=true;render()});

e.liberoToggle.addEventListener("change",()=>{td().teamConfig.libero=e.liberoToggle.checked;dirty=true;render()});e.opponentSystem?.addEventListener("change",()=>{td().teamConfig.opponentSystem=e.opponentSystem.value==="51"?"51":"42";dirty=true;render()});e.opponentLiberoToggle?.addEventListener("change",()=>{td().teamConfig.opponentLibero=e.opponentLiberoToggle.checked;dirty=true;render()});

e.questionsButton?.addEventListener('click',()=>openQuestions());
e.courtQuestionButton?.addEventListener('click',()=>{if(currentContextQuestions().length){questionContextOpen=!questionContextOpen;activeQuestionId=null;renderQuestionContext()}else openQuestions(true,{currentStepOnly:true})});
e.closeQuestions?.addEventListener('click',()=>e.questionsDialog.close());e.questionsDialog?.addEventListener('close',()=>{questionDialogContext=null;e.questionComposer?.classList.add('hidden');if(e.questionText)e.questionText.value=''});e.questionNewButton?.addEventListener('click',()=>e.questionComposer.classList.toggle('hidden'));
e.questionCancel?.addEventListener('click',()=>{e.questionComposer.classList.add('hidden');e.questionText.value=''});
e.questionSend?.addEventListener('click',async()=>{const body=e.questionText.value.trim();if(!body)return;const target=questionDialogContext||{situation:state.rotation,step:state.step},rotation=td().rotations[target.situation],step=rotation?.steps[target.step];if(!rotation||!step)return;e.questionSend.disabled=true;try{await rpc('vt_create_question',{p_team_id:currentTeamId,p_situation_index:target.situation,p_step_index:target.step,p_situation_name:situationDisplayName(rotation),p_step_name:step.name,p_body:body});e.questionText.value='';e.questionComposer.classList.add('hidden');await loadQuestions()}catch(err){alert(err.message)}finally{e.questionSend.disabled=false}});
e.situationInfoButton?.addEventListener('click',()=>openContextInfo('situation'));e.situationInfoInline?.addEventListener('click',()=>openContextInfo('situation'));e.stepInfoButton?.addEventListener('click',()=>openContextInfo('step'));e.closeContextInfo?.addEventListener('click',()=>e.contextInfoDialog.close());e.situationInfoEdit?.addEventListener('input',()=>{if(editing){rd().info=e.situationInfoEdit.value;dirty=true}});e.stepInfoEdit?.addEventListener('input',()=>{if(editing){sd().info=e.stepInfoEdit.value;dirty=true}});e.publishSituation?.addEventListener('click',async()=>{if(!editing)return;const issues=ruleIssues(rd());if(issues.some(x=>x.severity==='error')){alert('Freigabe nicht möglich: Diese Spielsituation enthält noch rote Regelfehler.');return}if(!rd().published&&(issues.some(x=>x.severity==='warning')||rd().steps.some((s,i)=>stepNeedsWork(s,i,rd())))&&!confirm('Diese Spielsituation enthält noch gelbe Hinweise oder unvollständige Schritte. Trotzdem freigeben?'))return;rd().published=!rd().published;dirty=true;await save(rd().published?'Spielsituation für Viewer freigegeben.':'Freigabe zurückgenommen.');render()});
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

let questionCache=[],activeQuestionId=null,questionContextOpen=false,questionRefreshBusy=false,questionDialogContext=null;
async function loadQuestions({silent=false}={}){if(!navigator.onLine||!currentTeamId||questionRefreshBusy)return questionCache;questionRefreshBusy=true;try{questionCache=await rpc("vt_list_questions",{p_team_id:currentTeamId})||[];renderQuestions();renderQuestionContext();updateCourtQuestionBadge();if(editing||visibleSituationIndexes().length)renderStepStrip();return questionCache}finally{questionRefreshBusy=false}}
function unreadMessageCount(){return questionCache.reduce((sum,q)=>sum+Math.max(0,Number(q.unread_messages)||0),0)}
function questionAttentionCount(){return canEdit()?questionCache.filter(q=>q.status==='open').length:unreadMessageCount()}
function refreshQuestionTopBadge(){const attention=questionAttentionCount();if(e.questionsBadge){e.questionsBadge.textContent=attention;e.questionsBadge.classList.toggle('hidden',!attention);e.questionsButton?.classList.toggle('has-unread',attention>0);e.questionsButton?.setAttribute('title',canEdit()?`${attention} offene Frage(n) benötigen eine Antwort`:`${attention} neue Antwort(en)`);}}
function refreshQuestionsInBackground(){if(document.visibilityState==='hidden'||!authSession||!currentTeamId||!navigator.onLine||e.questionsDialog?.open)return;const keepContext=questionContextOpen,keepActive=activeQuestionId;loadQuestions({silent:true}).then(()=>{if(keepContext){questionContextOpen=true;activeQuestionId=keepActive;renderQuestionContext()}}).catch(()=>{})}
setInterval(refreshQuestionsInBackground,15000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshQuestionsInBackground()});
window.addEventListener('focus',refreshQuestionsInBackground);
async function markQuestionRead(id){const q=questionCache.find(x=>x.id===id);if(!q||!(Number(q.unread_messages)>0))return;try{await rpc('vt_mark_question_read',{p_question_id:id});q.unread_messages=0;refreshQuestionTopBadge();updateCourtQuestionBadge();if(editing||visibleSituationIndexes().length)renderStepStrip()}catch(err){console.warn('Frage konnte nicht als gelesen markiert werden',err)}}
function questionStatusLabel(s){return s==='resolved'?'Erledigt':s==='answered'?'Beantwortet':'Offen'}
function questionGroups(source=questionCache){return [['open','Neu / Offen'],['answered','Beantwortet'],['resolved','Erledigt']].map(([status,title])=>{const rows=source.filter(q=>q.status===status);return `<details class="question-group" ${status==='open'?'open':''}><summary>${title}<span>${rows.length}</span></summary><div>${rows.map(questionCard).join('')||'<p class="hint">Keine Einträge.</p>'}</div></details>`}).join('')}
function questionDeleteButton(q){return editing&&canEdit()?`<button class="question-delete danger" type="button" data-question-id="${esc(q.id)}" title="Frage löschen">🗑 Löschen</button>`:''}
function questionCard(q){const msgs=q.messages||[],first=msgs[0],preview=(first?.body||q.question||'').slice(0,110),unread=Math.max(0,Number(q.unread_messages)||0),viewerMode=!editing;const asker=viewerMode?'Deine Frage':(q.author_name||'Viewer');const messageHtml=msgs.map(m=>{const who=viewerMode?(m.author_is_editor?'Bearbeiter':'Du'):(m.author_name||(m.author_is_editor?'Bearbeiter':'Viewer'));return `<div class="question-message ${m.author_is_editor?'editor':'viewer'}"><strong>${esc(who)}</strong><p>${esc(m.body)}</p><small>${new Date(m.created_at).toLocaleString('de-DE')}</small>${editing&&canEdit()?`<button class="question-as-info" data-message-id="${esc(m.id)}" data-question-id="${esc(q.id)}" type="button">ⓘ Als Info übernehmen</button>`:''}</div>`}).join('');return `<details class="question-card ${unread?'has-unread':''}" data-question-id="${esc(q.id)}"><summary><div><strong>${esc(asker)}</strong><span>${esc(q.situation_name)} · Schritt ${Number(q.step_index)+1}</span><small>${esc(preview)}${preview.length>=110?' …':''}</small></div><div class="question-summary-state">${unread?`<span class="question-unread">${unread} neu</span>`:''}<b>${questionStatusLabel(q.status)}</b></div></summary><div class="question-thread">${messageHtml}<div class="question-context"><span>${esc(q.situation_name)} · Schritt ${Number(q.step_index)+1} · ${esc(q.step_name||'')}</span><button class="question-jump" data-question-id="${esc(q.id)}" data-situation="${q.situation_index}" data-step="${q.step_index}" type="button">Zur Situation</button></div>${q.status!=='resolved'?`<textarea class="question-reply" rows="3" maxlength="2000" placeholder="${editing&&canEdit()?'Antwort schreiben …':'Rückfrage schreiben …'}"></textarea><div class="question-actions"><button class="question-reply-send primary" type="button">Senden</button>${editing&&canEdit()?'<button class="question-resolve ghost" type="button">Als erledigt markieren</button>':''}${questionDeleteButton(q)}</div>`:`<div class="question-actions"><p class="hint">Dieser Thread ist erledigt.</p>${questionDeleteButton(q)}</div>`}</div></details>`}
function renderQuestions(){if(!e.questionsContent)return;const rows=questionDialogContext?questionCache.filter(q=>Number(q.situation_index)===questionDialogContext.situation&&Number(q.step_index)===questionDialogContext.step):questionCache;e.questionsContent.innerHTML=questionGroups(rows);refreshQuestionTopBadge();wireQuestionActions()}
async function deleteQuestion(id){const q=questionCache.find(x=>x.id===id);if(!q||!canEdit())return;if(!confirm(`Frage von ${q.author_name||'Viewer'} zu ${q.situation_name} · Schritt ${Number(q.step_index)+1} wirklich löschen?\n\nDer komplette Verlauf wird dauerhaft gelöscht.`))return;await rpc('vt_delete_question',{p_question_id:id});if(activeQuestionId===id)activeQuestionId=null;await loadQuestions();renderQuestionContext()}
function wireQuestionActions(root=e.questionsContent){root?.querySelectorAll('.question-card').forEach(card=>card.addEventListener('toggle',()=>{if(card.open)markQuestionRead(card.dataset.questionId)}));root?.querySelectorAll('.question-jump').forEach(b=>b.addEventListener('click',()=>{markQuestionRead(b.dataset.questionId);const target=Math.max(0,Math.min(td().rotations.length-1,Number(b.dataset.situation)));if(!editing&&!td().rotations[target]?.published){alert(canEdit()?'Diese Spielsituation ist aktuell nicht für Viewer freigegeben. Öffne sie im Bearbeiten-Modus.':'Diese Spielsituation ist aktuell nicht freigegeben.');return}activeQuestionId=b.dataset.questionId;questionContextOpen=true;state.rotation=target;state.step=Math.max(0,Math.min(td().rotations[target].steps.length-1,Number(b.dataset.step)));e.questionsDialog?.close();render();e.status.textContent='Frage und Spielsituation geöffnet.'}));root?.querySelectorAll('.question-reply-send').forEach(b=>b.addEventListener('click',async()=>{const card=b.closest('[data-question-id]'),ta=card.querySelector('.question-reply'),body=ta.value.trim();if(!body)return;b.disabled=true;try{await rpc('vt_add_question_message',{p_question_id:card.dataset.questionId,p_body:body});activeQuestionId=card.dataset.questionId;questionContextOpen=true;await loadQuestions()}catch(err){alert(err.message)}finally{b.disabled=false}}));root?.querySelectorAll('.question-resolve').forEach(b=>b.addEventListener('click',async()=>{const id=b.closest('[data-question-id]').dataset.questionId;await rpc('vt_set_question_status',{p_question_id:id,p_status:'resolved'});activeQuestionId=id;questionContextOpen=true;await loadQuestions()}));root?.querySelectorAll('.question-delete').forEach(b=>b.addEventListener('click',async()=>{try{await deleteQuestion(b.dataset.questionId)}catch(err){alert(err.message)}}));root?.querySelectorAll('.question-as-info').forEach(b=>b.addEventListener('click',()=>{const q=questionCache.find(x=>x.id===b.dataset.questionId),m=q?.messages?.find(x=>x.id===b.dataset.messageId);if(!q||!m)return;const target=confirm('OK = als Info zu diesem Schritt übernehmen.\nAbbrechen = als allgemeine Info zur Spielsituation übernehmen.')?'step':'situation';state.rotation=Number(q.situation_index);state.step=Number(q.step_index);if(target==='step')sd().info=m.body;else rd().info=m.body;dirty=true;activeQuestionId=q.id;e.questionsDialog?.close();edit(true);render();e.status.textContent='Antwort als Info übernommen. Bitte speichern.'}))}
function currentContextQuestions(){return questionCache.filter(q=>Number(q.situation_index)===state.rotation&&Number(q.step_index)===state.step&&q.status!=='resolved')}
function updateCourtQuestionBadge(){if(!e.courtQuestionButton)return;const qs=currentContextQuestions();e.courtQuestionButton.classList.toggle('has-questions',qs.length>0);if(e.courtQuestionBadge){e.courtQuestionBadge.textContent=qs.length;e.courtQuestionBadge.classList.toggle('hidden',!qs.length)}e.courtQuestionButton.classList.toggle('hidden',!td()?.rotations?.[state.rotation]||(!editing&&!rd().published))}
function compactContextQuestion(q){
  const msgs=q.messages||[],first=msgs[0],questionText=(first?.body||q.question||'Frage').trim(),viewerMode=!editing,unread=Math.max(0,Number(q.unread_messages)||0),manage=editing&&canEdit();
  const replies=msgs.slice(1);
  const replyHtml=replies.map(m=>{const who=viewerMode?(m.author_is_editor?'Bearbeiter':'Du'):(m.author_name||(m.author_is_editor?'Bearbeiter':'Viewer'));return `<div class="question-message ${m.author_is_editor?'editor':'viewer'}">${who?`<strong>${esc(who)}</strong>`:''}<p>${esc(m.body)}</p>${viewerMode?'':`<small>${new Date(m.created_at).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'})}</small>`}</div>`}).join('');
  const firstDate=first?.created_at?new Date(first.created_at).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'}):'';
  const header=viewerMode?`<div class="context-question-text">${esc(questionText)}</div>`:`<div class="context-question-author"><strong>${esc(q.author_name||'Viewer')}</strong>${firstDate?`<small> · ${esc(firstDate)}</small>`:''}</div><div class="context-question-text">${esc(questionText)}</div>`;
  const infoMessage=msgs[msgs.length-1]||first;
  const infoButton=manage&&infoMessage?`<button class="question-as-info compact-action" data-message-id="${esc(infoMessage.id)}" data-question-id="${esc(q.id)}" type="button" title="Als Info übernehmen">ⓘ Info</button>`:'';
  const resolveButton=manage?'<button class="question-resolve ghost compact-action" type="button" title="Erledigt markieren">✓ Erledigt</button>':'';
  const deleteButton=manage?`<button class="question-delete danger compact-action" type="button" data-question-id="${esc(q.id)}" title="Frage löschen">🗑</button>`:'';
  return `<details class="question-context-item ${viewerMode?'viewer-compact':'editor-compact'} ${replies.length?'has-replies':''} ${unread?'has-unread':''}" data-question-id="${esc(q.id)}"><summary>${header}${unread?`<b>${unread} neu</b>`:''}</summary><div class="question-context-thread">${replyHtml?`<div class="context-replies">${replyHtml}</div>`:''}<div class="context-reply-row"><textarea class="question-reply" rows="1" maxlength="2000" placeholder="${manage?'Antwort schreiben …':'Rückfrage schreiben …'}"></textarea><button class="question-reply-send primary compact-action" type="button">Senden</button></div>${manage?`<div class="question-actions compact-actions">${infoButton}${resolveButton}${deleteButton}</div>`:''}</div></details>`;
}
function renderQuestionContext(){
  if(!e.questionContextPanel)return;
  if(playing||!questionContextOpen){e.questionContextPanel.classList.add('hidden');e.questionContextPanel.innerHTML='';return}
  const openIds=[...e.questionContextPanel.querySelectorAll('.question-context-item[open]')].map(x=>x.dataset.questionId);
  const qs=currentContextQuestions();
  e.questionContextPanel.classList.remove('hidden');
  const head=!editing?`<div class="question-context-head viewer-head"><span>${qs.length} aktive Frage${qs.length===1?'':'n'} · Schritt ${state.step+1}</span><button class="question-context-close" type="button" aria-label="Fragen ausblenden">✕</button></div>`:`<div class="question-context-head"><div><span class="eyebrow">Fragen zu Schritt ${state.step+1}</span><strong>${qs.length?`${qs.length} aktive Frage${qs.length===1?'':'n'}`:'Noch keine Frage'}</strong></div><button class="question-context-close" type="button" aria-label="Fragen ausblenden">✕</button></div>`;
  e.questionContextPanel.innerHTML=`${head}<div class="question-context-items">${qs.map(compactContextQuestion).join('')||'<p class="hint">Zu diesem Schritt gibt es noch keine aktive Frage.</p>'}</div>${editing?'':`<div class="question-context-footer"><button class="question-context-new ghost" type="button">＋ Frage stellen</button></div>`}`;
  const idsToOpen=new Set(openIds);if(activeQuestionId)idsToOpen.add(String(activeQuestionId));idsToOpen.forEach(id=>{const item=e.questionContextPanel.querySelector(`[data-question-id="${CSS.escape(id)}"]`);if(item)item.open=true});
  e.questionContextPanel.querySelector('.question-context-close')?.addEventListener('click',()=>{questionContextOpen=false;activeQuestionId=null;renderQuestionContext()});
  e.questionContextPanel.querySelector('.question-context-new')?.addEventListener('click',()=>{questionContextOpen=false;renderQuestionContext();openQuestions(true,{currentStepOnly:true})});
  e.questionContextPanel.querySelectorAll('.question-context-item').forEach(card=>card.addEventListener('toggle',()=>{if(card.open)markQuestionRead(card.dataset.questionId)}));
  wireQuestionActions(e.questionContextPanel);
}
async function openQuestions(startComposer=false,{currentStepOnly=false}={}){questionDialogContext=currentStepOnly?{situation:state.rotation,step:state.step}:null;if(e.questionsTitle)e.questionsTitle.textContent=currentStepOnly?`Fragen · Schritt ${state.step+1}`:'Alle Fragen';e.questionsDialog.showModal();if(startComposer){e.questionComposer?.classList.remove('hidden');setTimeout(()=>e.questionText?.focus(),50)}e.questionsContent.innerHTML='<p class="hint">Fragen werden geladen …</p>';try{await loadQuestions();renderQuestions()}catch(err){e.questionsContent.innerHTML=`<p class="admin-error">${esc(err.message)}</p>`}}
function openContextInfo(kind){const text=kind==='step'?sd().info:rd().info;e.contextInfoTitle.textContent=kind==='step'?`Info · Schritt ${state.step+1}`:`Info · ${rname(state.rotation)}`;e.contextInfoBody.textContent=text||'Keine Info hinterlegt.';e.contextInfoDialog.showModal()}
function info(){const guide=editing?["Teamaufstellung und Spielsituation konfigurieren und für Viewer freigeben.","Schritte mit ✎ benennen/umbenennen; Standards oder zuletzt verwendete Namen wählen.","Spieler und Ball verschieben, Ball koppeln/entkoppeln und Positionen aus dem vorherigen Schritt übernehmen.","▶ spielt die Situation auch im Bearbeiten-Modus ab; Fragen können beantwortet, erledigt oder als Info übernommen werden.","Der Trainings-Player unter dem Spielfeld steuert Musik, Intervalle, Ansagen und eigene Vorlagen."]:["Teamaufstellung, freigegebene Spielsituation und Schritt auswählen.","▶ spielt die gespeicherte Situation ab; 2D/2,5D wechseln die Darstellung.","ⓘ zeigt vorhandene Erklärungen; ? öffnet Fragen zum aktuellen Schritt.","Über 💬 siehst du deine Fragen und neue Antworten."];if(e.infoGuideTitle)e.infoGuideTitle.textContent=editing?"Kurzanleitung Bearbeiten":"Kurzanleitung Viewer";if(e.infoGuideList)e.infoGuideList.innerHTML=guide.map(x=>`<li>${esc(x)}</li>`).join("");if(e.infoSituation){e.infoSituation.textContent="";e.infoSituation.classList.add("hidden");}if(e.infoDataSource){const source=!navigator.onLine?"Offline – lokale Ansicht":offlineMeta.pendingLocalChanges?"Lokale Altänderung aus 2.8.0 – nicht synchronisiert":dataSource==="supabase"?"Supabase":dataSource==="browser"?"Browser – lokale Daten":"Standarddaten – noch nicht gespeichert";e.infoDataSource.textContent=`Datenquelle: ${source}`;}if(e.infoSyncStatus)e.infoSyncStatus.textContent=`Letzter Supabase-Sync: ${formatStamp(offlineMeta.lastSuccessfulSyncAt)} · Letztes lokales Speichern: ${formatStamp(offlineMeta.lastLocalSaveAt)}`;e.infoDialog.showModal()}e.infoButton.addEventListener("click",info);e.closeInfo.addEventListener("click",()=>e.infoDialog.close());e.closeInfoBottom.addEventListener("click",()=>e.infoDialog.close());e.infoDialog.addEventListener("click",x=>{if(x.target===e.infoDialog)e.infoDialog.close()});
function compareVersions(a,b){const A=String(a).split(".").map(Number),B=String(b).split(".").map(Number);for(let i=0;i<Math.max(A.length,B.length);i++){const d=(A[i]||0)-(B[i]||0);if(d)return d}return 0}
async function checkForUpdate(){try{const res=await fetch(`version.json?_=${Date.now()}`,{cache:"no-store"});if(!res.ok)return;const remote=await res.json();if(remote?.version&&compareVersions(remote.version,VERSION)>0){if(e.jsBuildBadge)e.jsBuildBadge.textContent=`Neue Version ${remote.version} – wird geladen …`;if(e.status)e.status.textContent=`Neue Version ${remote.version} verfügbar – wird geladen …`;await new Promise(resolve=>setTimeout(resolve,350));const u=new URL(location.href);u.searchParams.set("v",remote.version);location.replace(u.toString())}}catch{}}
async function registerOfflineWorker(){if(!("serviceWorker" in navigator))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${VERSION}`,{scope:"./",updateViaCache:"none"});if(navigator.onLine)reg.update().catch(()=>{})}catch(err){console.warn("Offline-Service konnte nicht registriert werden",err)}}
window.addEventListener("offline",()=>{dataSource="browser";e.syncBadge.textContent="Offline – Ansicht lokaler Daten";if(editing){edit(false);e.status.textContent="Verbindung verloren. Bearbeitung wurde beendet; nicht gespeicherte Änderungen wurden verworfen."}updateMigrationUI()});
window.addEventListener("online",()=>{e.syncBadge.textContent=offlineMeta.pendingLocalChanges?"Online – lokale Altänderung vorhanden":"Online – Supabase wird geprüft";updateMigrationUI();if(!offlineMeta.pendingLocalChanges)loadRemote()});
async function bootV3(){registerOfflineWorker();checkForUpdate();createPlayers();create25Floor();create25Players();buildLineupEditor();edit(false);const flow=parseAuthHash();await ensureSession().catch(()=>null);if(flow){e.loginForm.classList.add('hidden');e.forgotPassword.classList.add('hidden');e.invitePasswordForm.classList.remove('hidden');showLogin(flow==='invite'?'Einladung bestätigt – bitte Passwort festlegen.':'Bitte neues Passwort festlegen.');return}if(!authSession){showLogin();return}try{await loadAccess();if(!selectedTeam()||!canView()){if(userAccess?.platform_admin){showPlatformOnly();return}showLogin('Für dieses Konto ist noch keine Mannschaft zum Anzeigen freigeschaltet.');return}showApp();await loadRemote()}catch(err){if(!navigator.onLine&&localStorage.getItem(ACCESS_KEY)){await loadAccess();if(selectedTeam()&&canView()){showApp();await loadRemote();return}}showLogin(`Anmeldung konnte nicht geprüft werden: ${err.message}`)}}
e.loginForm?.addEventListener('submit',async ev=>{ev.preventDefault();e.loginSubmit.disabled=true;e.authStatus.textContent='Anmeldung läuft …';try{await signIn(e.loginEmail.value.trim(),e.loginPassword.value);await loadAccess();if(!selectedTeam()||!canView()){if(userAccess?.platform_admin){showPlatformOnly();return}throw new Error('Keine Viewer- oder Bearbeiter-Berechtigung vorhanden.')}showApp();await loadRemote()}catch(err){showLogin(err.message)}finally{e.loginSubmit.disabled=false}});
e.invitePasswordForm?.addEventListener('submit',async ev=>{ev.preventDefault();const a=e.invitePassword.value,b=e.invitePasswordRepeat.value;if(a.length<8){e.authStatus.textContent='Bitte mindestens 8 Zeichen verwenden.';return}if(a!==b){e.authStatus.textContent='Die Passwörter stimmen nicht überein.';return}try{authSession=readSession();await authUserUpdate({password:a});await loadAccess();if(!selectedTeam()||!canView()){if(userAccess?.platform_admin){e.invitePasswordForm.classList.add('hidden');e.loginForm.classList.remove('hidden');e.forgotPassword.classList.remove('hidden');showPlatformOnly();return}throw new Error('Dein Zugang wurde angelegt, aber noch keiner Mannschaft zugeordnet.')}e.invitePasswordForm.classList.add('hidden');e.loginForm.classList.remove('hidden');e.forgotPassword.classList.remove('hidden');showApp();await loadRemote()}catch(err){e.authStatus.textContent=err.message}});
e.forgotPassword?.addEventListener('click',async()=>{const email=e.loginEmail.value.trim();if(!email){e.authStatus.textContent='Bitte zuerst deine E-Mail-Adresse eingeben.';return}try{await sendRecovery(email);e.authStatus.textContent='E-Mail zum Zurücksetzen wurde versendet.'}catch(err){e.authStatus.textContent=err.message}});
e.platformOnlyAdminOpen?.addEventListener('click',openPlatformAdmin);e.platformOnlyLogout?.addEventListener('click',()=>{persistSession(null);userAccess=null;localStorage.removeItem(ACCESS_KEY);showLogin('Du wurdest abgemeldet.')});e.accountButton?.addEventListener('click',()=>{renderAccount();e.accountDialog.showModal()});e.closeAccount?.addEventListener('click',()=>e.accountDialog.close());e.platformAdminOpen?.addEventListener('click',openPlatformAdmin);e.clubAdminOpen?.addEventListener('click',openClubAdmin);e.platformAdminRefresh?.addEventListener('click',async()=>{try{await refreshPlatformAdmin()}catch(err){e.platformAdminContent.innerHTML=`<p class="admin-error">${esc(err.message)}</p>`}});e.clubAdminRefresh?.addEventListener('click',async()=>{try{await refreshClubAdmin()}catch(err){e.clubAdminContent.innerHTML=`<p class="admin-error">${esc(err.message)}</p>`}});e.closePlatformAdmin?.addEventListener('click',()=>e.platformAdminDialog.close());e.closeInvitePreview?.addEventListener('click',closeInviteDialog);e.invitePreviewCancel?.addEventListener('click',closeInviteDialog);e.invitePreviewSave?.addEventListener('click',saveCurrentTemplate);e.invitePreviewSend?.addEventListener('click',sendCurrentInvite);e.invitePreviewDialog?.addEventListener('cancel',ev=>{ev.preventDefault();closeInviteDialog()});e.closeClubAdmin?.addEventListener('click',()=>e.clubAdminDialog.close());e.platformAdminDialog?.addEventListener('click',ev=>{if(ev.target===e.platformAdminDialog)e.platformAdminDialog.close()});e.clubAdminDialog?.addEventListener('click',ev=>{if(ev.target===e.clubAdminDialog)e.clubAdminDialog.close()});e.logoutButton?.addEventListener('click',async()=>{persistSession(null);userAccess=null;localStorage.removeItem(ACCESS_KEY);e.accountDialog.close();showLogin('Du wurdest abgemeldet.')});e.teamContextSelect?.addEventListener('change',async ev=>{currentTeamId=ev.target.value;localStorage.setItem(TEAM_KEY,currentTeamId);e.accountDialog.close();edit(false);await loadRemote();renderAccount()});
bootV3();
})();
