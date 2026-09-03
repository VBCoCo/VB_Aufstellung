window.APP_CONFIG = {
  SUPABASE_URL: "https://mvwwwkigsoaodllbtifj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_gwDoKpExqBfM4voiXncaaA_w61xcbO4"
};

// V1.1 wird bewusst erst nach der bestehenden App initialisiert, damit Viewer,
// Authentifizierung und Animationen unveraendert zuerst hochfahren koennen.
(() => {
  const version = "3.14.2";

  const showLoadedVersion = () => {
    const club = document.getElementById('brandClubName');
    if (!club || document.getElementById('brandVersion')) return;
    const versionLine = document.createElement('div');
    versionLine.id = 'brandVersion';
    versionLine.textContent = version;
    versionLine.setAttribute('aria-label', `Version ${version}`);
    versionLine.style.fontSize = '0.68rem';
    versionLine.style.lineHeight = '1.05';
    versionLine.style.opacity = '0.68';
    versionLine.style.marginTop = '-1px';
    club.insertAdjacentElement('afterend', versionLine);
  };

  const loadExerciseLibrary = () => {
    showLoadedVersion();
    if (!document.querySelector('link[data-exercise-library]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `exercise-library.css?v=${version}`;
      link.dataset.exerciseLibrary = version;
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[data-exercise-library]')) {
      const script = document.createElement('script');
      script.src = `exercise-library.js?v=${version}`;
      script.async = false;
      script.dataset.exerciseLibrary = version;
      document.body.appendChild(script);
    }
  };

  if (document.readyState === 'complete') loadExerciseLibrary();
  else window.addEventListener('load', loadExerciseLibrary, { once: true });
})();