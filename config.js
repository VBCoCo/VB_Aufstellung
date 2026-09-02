window.APP_CONFIG = {
  SUPABASE_URL: "https://mvwwwkigsoaodllbtifj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_gwDoKpExqBfM4voiXncaaA_w61xcbO4"
};

// V1.1 hotfix: Die neue Uebungsbibliothek darf die Initialisierung der bestehenden
// Viewer-/Animationslogik nicht beeinflussen. Deshalb erst nach vollstaendigem Laden
// der bisherigen App nachladen.
(() => {
  const version = "3.14.1";
  const loadExerciseLibrary = () => {
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