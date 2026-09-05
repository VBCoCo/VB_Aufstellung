(() => {
  "use strict";

  const install = () => {
    const api = window.VBTrainingAudioDiagnostics;
    if (!api || document.getElementById("vbAudioDiagnosticsButton")) return Boolean(api);

    const button = document.createElement("button");
    button.id = "vbAudioDiagnosticsButton";
    button.type = "button";
    button.textContent = "Audio-Diagnose";
    button.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;padding:9px 12px;border-radius:10px;border:1px solid #666;background:#fff;color:#111;font:600 13px system-ui;box-shadow:0 2px 8px #0004";

    const panel = document.createElement("div");
    panel.id = "vbAudioDiagnosticsPanel";
    panel.hidden = true;
    panel.style.cssText = "position:fixed;inset:8px;z-index:100000;background:#fff;color:#111;border-radius:12px;padding:12px;box-sizing:border-box;overflow:auto;font:12px ui-monospace,monospace;box-shadow:0 4px 20px #0008";
    panel.innerHTML = '<div style="display:flex;gap:8px;position:sticky;top:0;background:#fff;padding-bottom:8px"><button data-action="copy">Protokoll kopieren</button><button data-action="clear">Leeren</button><button data-action="close">Schliessen</button></div><pre data-log style="white-space:pre-wrap;word-break:break-word;margin:0"></pre>';

    const render = () => {
      const rows = typeof api.snapshot === "function" ? api.snapshot() : (api.events || []);
      panel.querySelector("[data-log]").textContent = JSON.stringify(rows, null, 2);
    };

    button.addEventListener("click", () => { render(); panel.hidden = false; });
    panel.addEventListener("click", async (event) => {
      const action = event.target?.dataset?.action;
      if (!action) return;
      if (action === "close") panel.hidden = true;
      if (action === "clear") {
        api.clear?.();
        render();
      }
      if (action === "copy") {
        render();
        const text = panel.querySelector("[data-log]").textContent;
        try {
          await navigator.clipboard.writeText(text);
          event.target.textContent = "Kopiert";
          setTimeout(() => { event.target.textContent = "Protokoll kopieren"; }, 1200);
        } catch (_) {
          const range = document.createRange();
          range.selectNodeContents(panel.querySelector("[data-log]"));
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    });

    document.body.append(button, panel);
    return true;
  };

  if (install()) return;
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (install() || attempts >= 50) clearInterval(timer);
  }, 100);
})();
