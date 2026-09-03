window.APP_CONFIG = {
  SUPABASE_URL: "https://mvwwwkigsoaodllbtifj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_gwDoKpExqBfM4voiXncaaA_w61xcbO4"
};

// 3.14.3 bleibt vom Legacy-Updater entkoppelt. app.js/version.json bleiben bis zur
// spaeteren Core-Migration synchron auf 3.13.0; die sichtbare Release-Version kommt hierher.
(() => {
  const version = "3.14.3";
  const showLoadedVersion = () => {
    const club = document.getElementById('brandClubName');
    if (!club || document.getElementById('brandVersion')) return;
    const line = document.createElement('div');
    line.id = 'brandVersion';
    line.textContent = version;
    line.setAttribute('aria-label', `Version ${version}`);
    line.style.cssText = 'font-size:.68rem;line-height:1.05;opacity:.68;margin-top:-1px';
    club.insertAdjacentElement('afterend', line);
  };
  const loadExerciseLibrary = () => {
    showLoadedVersion();
    if (!document.querySelector('link[data-exercise-library]')) {
      const link=document.createElement('link'); link.rel='stylesheet'; link.href=`exercise-library.css?v=${version}`; link.dataset.exerciseLibrary=version; document.head.appendChild(link);
    }
    if (!document.querySelector('script[data-exercise-library]')) {
      const script=document.createElement('script'); script.src=`exercise-library.js?v=${version}`; script.async=false; script.dataset.exerciseLibrary=version; document.body.appendChild(script);
    }
  };
  if (document.readyState === 'complete') loadExerciseLibrary();
  else window.addEventListener('load', loadExerciseLibrary, {once:true});
})();