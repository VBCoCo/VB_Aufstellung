window.APP_CONFIG = {
  SUPABASE_URL: "https://mvwwwkigsoaodllbtifj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_gwDoKpExqBfM4voiXncaaA_w61xcbO4"
};

// Feature-Releases bleiben vom Legacy-Core-Updater entkoppelt.
(() => {
  const version = "3.14.7";
  const asset = (tag, attrs) => {
    if (document.querySelector(`${tag}[data-vb-release="${attrs['data-vb-release']}"]`)) return;
    const el=document.createElement(tag); Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v)); (tag==='link'?document.head:document.body).appendChild(el);
  };
  const showLoadedVersion = () => {
    const club=document.getElementById('brandClubName'); if(!club)return;
    let line=document.getElementById('brandVersion'); if(!line){line=document.createElement('div');line.id='brandVersion';club.insertAdjacentElement('afterend',line)}
    line.textContent=version; line.setAttribute('aria-label',`Version ${version}`); line.style.cssText='font-size:.68rem;line-height:1.05;opacity:.68;margin-top:-1px';
  };
  const closeFeatureWorkspacesOutsideEditor=()=>{
    const cleanup=()=>{
      const editButton=document.getElementById('editModeToggle')||document.getElementById('editModeBtn')||document.getElementById('editButton');
      const editorActive=document.body.classList.contains('edit-mode')||document.body.classList.contains('editor-mode')||document.body.classList.contains('editing')||editButton?.classList.contains('active')||editButton?.getAttribute('aria-pressed')==='true';
      if(editorActive)return;
      document.body.classList.remove('exercise-library-open','editor-workspace-hub');
      document.getElementById('exerciseLibraryWorkspace')?.classList.add('hidden');
      document.getElementById('editorHub')?.classList.add('hidden');
      document.querySelectorAll('.exercise-editor-overlay').forEach(el=>el.remove());
    };
    document.addEventListener('click',()=>setTimeout(cleanup,0),true);
    new MutationObserver(cleanup).observe(document.body,{attributes:true,attributeFilter:['class']});
  };
  const load = () => {
    showLoadedVersion(); closeFeatureWorkspacesOutsideEditor();
    asset('link',{rel:'stylesheet',href:`ui-3.14.4.css?v=${version}`,'data-vb-release':'ui-css'});
    asset('link',{rel:'stylesheet',href:`exercise-library.css?v=${version}`,'data-vb-release':'exercise-css'});
    asset('script',{src:`feature-admin.js?v=${version}`,'data-vb-release':'feature-admin'});
    asset('script',{src:`exercise-library.js?v=${version}`,'data-vb-release':'exercise-js'});
  };
  if(document.readyState==='complete')load();else window.addEventListener('load',load,{once:true});
})();