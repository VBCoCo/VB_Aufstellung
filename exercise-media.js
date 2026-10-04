(() => {
  "use strict";
  const BUCKET = "vt-exercise-images", MAX_IMAGES = 12;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const api = () => window.VBTrainingApi;
  const safeLink = value => { try { const url = new URL(value); return url.protocol === "https:" ? url.href : ""; } catch { return ""; } };
  const assetNames = new Set(["bridge.png", "side-plank-start.png", "side-plank-hold.png", "bird-dog.jpg", "ankle-circle-relaxation.png", "ankle-circle-tension.png", "bodyweight-squat-low.jpg", "bodyweight-squat-start.jpg", "dead-bug-extend.jpg", "dead-bug-start.jpg", "dvids-arms-1.jpg", "dvids-arms-2.jpg", "dvids-lateral-1.jpg", "dvids-lateral-2.jpg", "dvids-lunge-1.jpg", "dvids-shuffle-1.jpg", "dvids-shuffle-2.jpg", "ever-back-flys-exercise-band-1.webp", "ever-back-flys-exercise-band-2.webp", "ever-balance-board-1.webp", "ever-balance-board-2.webp", "ever-bent-knee-hip-raise-1.webp", "ever-bent-knee-hip-raise-2.webp", "ever-body-leg-lifts-1.webp", "ever-body-leg-lifts-2.webp", "ever-body-row-1.webp", "ever-body-row-2.webp", "ever-crunches-1.webp", "ever-crunches-2.webp", "ever-crunches-with-legs-on-stability-ball-1.webp", "ever-crunches-with-legs-on-stability-ball-2.webp", "ever-dumbbell-dead-lifts-1.webp", "ever-dumbbell-dead-lifts-2.webp", "ever-dumbbell-shoulder-press-1.webp", "ever-dumbbell-shoulder-press-2.webp", "ever-lateral-dumbbell-raises-1.webp", "ever-lateral-dumbbell-raises-2.webp", "ever-pile-squat-with-dumbbell-1.webp", "ever-pile-squat-with-dumbbell-2.webp", "ever-pull-ups-1.webp", "ever-pull-ups-2.webp", "ever-push-up-feet-elevated-1.webp", "ever-push-up-feet-elevated-2.webp", "ever-push-ups-1.webp", "ever-push-ups-2.webp", "ever-rear-deltoid-row-dumbbell-1.webp", "ever-rear-deltoid-row-dumbbell-2.webp", "ever-squat-to-bench-with-dumbbells-1.webp", "ever-squat-to-bench-with-dumbbells-2.webp", "ever-step-ups-with-dumbbells-1.webp", "ever-step-ups-with-dumbbells-2.webp", "ever-step-ups-with-dumbbells-3.webp", "ever-supermans-1.webp", "ever-supermans-2.webp", "overhead-hold.jpg", "scapular-push-start.jpg", "single-leg-hinge.jpg", "vertical-jump.jpg", "wger-1091-334.jpg", "wger-458-354.png", "wger-622-439.jpeg"]);
  const entries = item => Array.isArray(item?.media_items) ? item.media_items : [];
  const urls = new Map();
  async function urlFor(item) {
    if (item.localUrl) return item.localUrl;
    if (item.asset_path?.startsWith("assets/athletics/") && assetNames.has(item.asset_path.slice(17))) return item.asset_path;
    if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(item.storage_path || "")) throw new Error("Ungültige Bildquelle.");
    const cached = urls.get(item.storage_path);
    if (cached && cached.until > Date.now()) return cached.url;
    const signed = await api().request(`/storage/v1/object/sign/${BUCKET}/${item.storage_path}`, {method:"POST", body:{expiresIn:3600}});
    const url = `${window.APP_CONFIG.SUPABASE_URL.replace(/\/$/, "")}/storage/v1${signed.signedURL}`;
    urls.set(item.storage_path, {url, until:Date.now()+3300000});
    return url;
  }
  function creditHtml(item) {
    const source = safeLink(item.source_url), license = safeLink(item.license_url), author = safeLink(item.author_url);
    return `<small class="exercise-image-credit">${author ? `<a href="${esc(author)}" target="_blank" rel="noopener">${esc(item.credit)}</a>` : esc(item.credit)}${source ? ` · <a href="${esc(source)}" target="_blank" rel="noopener">Quelle</a>` : ""}${license ? ` · <a href="${esc(license)}" target="_blank" rel="noopener">${esc(item.license || "Lizenz")}</a>` : ""}${item.changes ? ` · ${esc(item.changes)}` : ""}${item.notice ? `<br>${esc(item.notice)}` : ""}</small>`;
  }
  async function loadImage(img, item, status) {
    try {
      img.src = await urlFor(item);
      img.onerror = () => { img.hidden = true; if (status) status.textContent = "Bild konnte nicht geladen werden."; };
    } catch { img.hidden = true; if (status) status.textContent = "Bild konnte nicht geladen werden. Bitte online erneut öffnen."; }
  }
  async function view(items, start = 0) {
    if (!items.length) return;
    const dialog = document.createElement("dialog");
    dialog.className = "exercise-image-viewer";
    let index = start, generation = 0;
    dialog.innerHTML = '<div class="exercise-image-viewer-inner"><div class="exercise-image-viewer-head"><strong>Bilder & Skizzen</strong><button type="button" data-close aria-label="Bildansicht schließen">✕</button></div><div class="exercise-image-stage"><img alt=""><p aria-live="polite"></p></div><div class="exercise-image-viewer-caption"></div><div class="exercise-image-nav"><button type="button" data-prev aria-label="Vorheriges Bild">←</button><span></span><button type="button" data-next aria-label="Nächstes Bild">→</button></div></div>';
    const render = async () => {
      const current = ++generation, item = items[index], img = dialog.querySelector("img"), status = dialog.querySelector(".exercise-image-stage p");
      img.removeAttribute("src"); img.hidden = true; status.textContent = "Bild wird geladen …";
      img.alt = item.caption || `Übungsbild ${index+1}`;
      dialog.querySelector(".exercise-image-viewer-caption").innerHTML = `<p>${esc(item.caption)}</p>${creditHtml(item)}`;
      dialog.querySelector(".exercise-image-nav span").textContent = `${index+1} / ${items.length}`;
      dialog.querySelector("[data-prev]").disabled = index === 0;
      dialog.querySelector("[data-next]").disabled = index === items.length-1;
      try { const url = await urlFor(item); if (current !== generation || !dialog.isConnected) return; img.hidden = false; img.src = url; status.textContent = ""; img.onerror = () => {status.textContent = "Bild konnte nicht geladen werden.";img.hidden=true;}; } catch { if (current === generation) status.textContent = "Bild konnte nicht geladen werden. Bitte online erneut öffnen."; }
    };
    dialog.querySelector("[data-close]").onclick = () => dialog.close();
    dialog.addEventListener("close", () => dialog.remove(), {once:true});
    dialog.addEventListener("click", e => {if (e.target === dialog) dialog.close();});
    const move = delta => {index = Math.max(0, Math.min(items.length-1,index+delta)); render();};
    dialog.querySelector("[data-prev]").onclick = () => move(-1);
    dialog.querySelector("[data-next]").onclick = () => move(1);
    dialog.addEventListener("keydown", e => {if (e.key === "ArrowLeft" || e.key === "ArrowRight") {e.preventDefault();move(e.key === "ArrowLeft" ? -1 : 1);}});
    document.body.appendChild(dialog);dialog.showModal();render();
  }
  function hydrateCards(root, items) {
    root.querySelectorAll("[data-exercise-image]").forEach(button => {
      const item = items.find(x => x.id === button.dataset.exerciseImage), media = entries(item);
      if (!media.length) return;
      loadImage(button.querySelector("img"), media[0], button.querySelector("small"));
      button.onclick = () => view(media);
    });
  }
  async function prepareFile(file) {
    if (file.size > 25*1048576) throw new Error("Ein Bild darf vor dem Verkleinern höchstens 25 MB groß sein.");
    if (!/^(image\/(jpeg|png|webp|heic|heif))$/i.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) throw new Error("Bitte JPG, PNG oder WebP auswählen. HEIC ist möglich, wenn dein Browser es öffnen kann.");
    const localUrl = URL.createObjectURL(file), img = new Image();
    try { await new Promise((resolve,reject) => {img.onload=resolve;img.onerror=()=>reject(new Error("Dieses Bildformat lässt sich nicht öffnen. Bitte als JPG, PNG oder WebP exportieren."));img.src=localUrl;}); }
    finally {URL.revokeObjectURL(localUrl);}
    if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth*img.naturalHeight > 80000000) throw new Error("Bild ist zu groß oder beschädigt.");
    const scale = Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight)), canvas = document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
    const mime = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
    const blob = await new Promise(resolve=>canvas.toBlob(resolve,mime,.85));
    if (!blob || blob.size>5*1048576) throw new Error("Bild konnte nicht ausreichend verkleinert werden.");
    return blob;
  }
  function mountEditor(overlay, exercise, readonly) {
    const original = entries(exercise).map(x=>({...x})), draft = original.map(x=>({...x}));
    const section = document.createElement("details"); section.className="exercise-form-section exercise-media-section";section.open=original.length>0;
    section.innerHTML = `<summary><span>Bilder & Skizzen</span><small data-count></small></summary><div class="exercise-section-body"><div class="exercise-media-list"></div>${readonly ? "" : '<label class="exercise-image-upload">＋ Bilder hinzufügen<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple></label><p class="hint">Bis zu 12 Bilder. Das erste Bild ist die Vorschau. Fotos werden automatisch verkleinert. Verwende eigene oder zur Nutzung freigegebene Bilder.</p>'}<p class="exercise-media-status" aria-live="polite"></p></div>`;
    overlay.querySelector(".exercise-editor-status").before(section);
    const list=section.querySelector(".exercise-media-list"), status=section.querySelector(".exercise-media-status");
    let busy=false;
    const render = () => {
      section.querySelector("[data-count]").textContent=`${draft.length} / ${MAX_IMAGES} Bilder`;
      list.innerHTML=draft.map((item,index)=>`<article class="exercise-media-item" data-index="${index}"><button type="button" class="exercise-media-preview" aria-label="Bild ${index+1} groß öffnen"><img alt="${esc(item.caption || `Übungsbild ${index+1}`)}"><span>${index===0 ? "Vorschau" : `Bild ${index+1}`}</span></button><div class="exercise-media-info">${readonly ? `<p>${esc(item.caption)}</p>` : `<label>Bildbeschreibung<textarea data-field="caption" rows="2" maxlength="500">${esc(item.caption)}</textarea></label><label>Urheber / Quelle<input data-field="credit" maxlength="500" value="${esc(item.credit)}"></label>`}${creditHtml(item)}${readonly ? "" : `<div class="exercise-media-actions"><button type="button" data-move="-1" ${index===0 ? "disabled" : ""} aria-label="Bild nach vorn">↑</button><button type="button" data-move="1" ${index===draft.length-1 ? "disabled" : ""} aria-label="Bild nach hinten">↓</button><button type="button" data-replace>Ersetzen</button><button type="button" data-remove>Entfernen</button></div>`}</div></article>`).join("") || '<p class="hint">Noch keine Bilder vorhanden.</p>';
      list.querySelectorAll("[data-index]").forEach(row=>{const index=Number(row.dataset.index);loadImage(row.querySelector("img"),draft[index],status);row.querySelector(".exercise-media-preview").onclick=()=>view(draft,index);});
    };
    list.addEventListener("input",e=>{const row=e.target.closest("[data-index]"),field=e.target.dataset.field;if(row && field) draft[Number(row.dataset.index)][field]=e.target.value;});
    const dispose = item => {if(item?.localUrl) URL.revokeObjectURL(item.localUrl);};
    const process = async (files, replaceIndex=null) => {
      if(busy)return;
      if(replaceIndex===null && files.length+draft.length>MAX_IMAGES){status.textContent="Maximal 12 Bilder pro Übung.";return;}
      busy=true;status.textContent="Bilder werden vorbereitet …";
      try {
        for (const file of files) {
          const blob=await prepareFile(file), item={blob,localUrl:URL.createObjectURL(blob),caption:replaceIndex===null ? "" : draft[replaceIndex].caption,credit:"Eigenes Bild / eigene Rechte"};
          if(replaceIndex!==null){dispose(draft[replaceIndex]);draft[replaceIndex]=item;}else draft.push(item);
        }
        status.textContent="Bilder vorbereitet. Mit der Übung speichern.";
      }catch(error){status.textContent=error.message;}
      finally{busy=false;render();}
    };
    section.querySelector('input[type="file"]')?.addEventListener("change",async e=>{await process([...e.target.files]);e.target.value="";});
    list.addEventListener("click",e=>{
      if(readonly || busy)return;const button=e.target.closest("button"),row=button?.closest("[data-index]");if(!row)return;const index=Number(row.dataset.index);
      if(button.hasAttribute("data-remove")){dispose(draft[index]);draft.splice(index,1);render();}
      if(button.dataset.move){const next=index+Number(button.dataset.move);if(next>=0&&next<draft.length){[draft[index],draft[next]]=[draft[next],draft[index]];render();}}
      if(button.hasAttribute("data-replace")){const input=document.createElement("input");input.type="file";input.accept="image/jpeg,image/png,image/webp,image/heic,image/heif";input.onchange=()=>process([...input.files],index);input.click();}
    });
    render();
    return {
      isBusy: () => busy,
      async prepare(exerciseId) {
        if(busy)throw new Error("Bitte warten, bis die Bilder vorbereitet sind.");
        const uploaded=[],items=[];
        try {
          for(const item of draft){
            let path=item.storage_path;
            if(item.blob || (path && !path.startsWith(`${exerciseId}/`))){
              let blob=item.blob;
              if(!blob){const response=await fetch(await urlFor(item));if(!response.ok)throw new Error("Bild konnte nicht in die eigene Übung kopiert werden.");blob=await response.blob();}
              const ext=blob.type==="image/png" ? "png" : blob.type==="image/webp" ? "webp" : "jpg";
              path=`${exerciseId}/${crypto.randomUUID()}.${ext}`;
              await api().request(`/storage/v1/object/${BUCKET}/${path}`,{method:"POST",body:blob,headers:{"Content-Type":blob.type,"x-upsert":"false"}});uploaded.push(path);
            }
            const out={...item};delete out.blob;delete out.localUrl;if(path){out.storage_path=path;delete out.asset_path;}items.push(out);
          }
          return {items,uploaded};
        }catch(error){await this.rollback(uploaded);throw error;}
      },
      async rollback(paths){if(paths.length)await api().request(`/storage/v1/object/${BUCKET}`,{method:"DELETE",body:{prefixes:paths}}).catch(()=>{});},
      async committed(items){const keep=new Set(items.map(x=>x.storage_path).filter(Boolean)),removed=original.map(x=>x.storage_path).filter(path=>path && path.startsWith(`${exercise?.id}/`) && !keep.has(path));if(removed.length)await api().request(`/storage/v1/object/${BUCKET}`,{method:"DELETE",body:{prefixes:removed}}).catch(error=>console.warn("Nicht mehr verwendetes Übungsbild blieb im Speicher",error));},
      dispose(){draft.forEach(dispose);}
    };
  }
  window.VBExerciseMedia={entries,urlFor,view,hydrateCards,mountEditor,prepareFile};
})();
