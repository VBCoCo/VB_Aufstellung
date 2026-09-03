window.APP_CONFIG = {
  SUPABASE_URL: "https://mvwwwkigsoaodllbtifj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_gwDoKpExqBfM4voiXncaaA_w61xcbO4"
};

// Feature-Releases bleiben vom Legacy-Core-Updater entkoppelt.
(() => {
  const version = "3.14.9.2";
  const asset = (tag, attrs) => {
    if (document.querySelector(`${tag}[data-vb-release="${attrs['data-vb-release']}"]`)) return;
    const el=document.createElement(tag); Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v)); (tag==='link'?document.head:document.body).appendChild(el);
  };
  const showLoadedVersion = () => {
    const club=document.getElementById('brandClubName'); if(!club)return;
    let line=document.getElementById('brandVersion'); if(!line){line=document.createElement('div');line.id='brandVersion';club.insertAdjacentElement('afterend',line)}
    line.textContent=version; line.setAttribute('aria-label',`Version ${version}`); line.style.cssText='font-size:.68rem;line-height:1.05;opacity:.68;margin-top:-1px';
  };
  const closeExerciseUi=()=>{
    document.body.classList.remove('exercise-library-open');
    document.getElementById('exerciseLibraryWorkspace')?.classList.add('hidden');
    document.querySelectorAll('.exercise-editor-overlay').forEach(el=>el.remove());
  };
  const reconcileEditorUi=()=>{
    const editPanel=document.getElementById('editPanel');
    const hub=document.getElementById('editorHub');
    const editing=!!editPanel && !editPanel.classList.contains('hidden');
    if(!editing){closeExerciseUi();document.body.classList.remove('editor-workspace-hub');hub?.classList.add('hidden');return;}
    if(!document.body.classList.contains('exercise-library-open')){document.body.classList.add('editor-workspace-hub');hub?.classList.remove('hidden');}
  };
  const installEditorModeReconcile=()=>{
    const editButton=document.getElementById('editButton'); if(!editButton||editButton.dataset.vbModeReconcile)return;
    editButton.dataset.vbModeReconcile='1';
    editButton.addEventListener('click',()=>setTimeout(reconcileEditorUi,0));
  };
  const installDensitySync=()=>{
    const sync=()=>{const list=document.getElementById('exerciseList'),ws=document.getElementById('exerciseLibraryWorkspace');if(list&&ws)ws.dataset.density=list.dataset.density||localStorage.getItem('volleyball-trainer-exercise-density')||'normal'};
    const observer=new MutationObserver(()=>{sync();const list=document.getElementById('exerciseList');if(list&&!list.dataset.densityObserved){list.dataset.densityObserved='1';new MutationObserver(sync).observe(list,{attributes:true,attributeFilter:['data-density']})}});
    observer.observe(document.body,{childList:true,subtree:true}); sync();
  };
  const load = () => {
    showLoadedVersion(); installEditorModeReconcile(); installDensitySync();
    asset('link',{rel:'stylesheet',href:`ui-3.14.4.css?v=${version}`,'data-vb-release':'ui-css'});
    asset('link',{rel:'stylesheet',href:`exercise-library.css?v=${version}`,'data-vb-release':'exercise-css'});
    asset('script',{src:`feature-admin.js?v=${version}`,'data-vb-release':'feature-admin'});
    asset('script',{src:`exercise-library.js?v=${version}`,'data-vb-release':'exercise-js'});
  };
  if(document.readyState==='complete')load();else window.addEventListener('load',load,{once:true});
})();