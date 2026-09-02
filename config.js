window.APP_CONFIG = {
  SUPABASE_URL: "https://mvwwwkigsoaodllbtifj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_gwDoKpExqBfM4voiXncaaA_w61xcbO4"
};

// V1.1: eigenständige Übungsbibliothek nachladen. Die stabile config.js bleibt bewusst
// der Bootstrap-Punkt, damit die bestehende 3.13-Oberfläche nur minimal angefasst wird.
(() => {
  const version = "3.14.0";
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
    script.defer = true;
    script.dataset.exerciseLibrary = version;
    document.head.appendChild(script);
  }
})();
