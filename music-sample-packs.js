(() => {
  "use strict";

  const VERSION = 1;
  const DEFAULT_WORLD = "electronic";
  const packs = Object.freeze({
    electronic:Object.freeze({id:"electronic",name:"Elektronische Basis",bundled:true,roles:["beat","bass","harmony","hook","effects"],sampler:null,license:"Siehe assets/audio/LICENSE.md"}),
    accordion:Object.freeze({
      id:"accordion",name:"Hohner-Akkordeon",bundled:true,roles:["harmony","primary","accent"],
      sampler:Object.freeze({baseUrl:"assets/audio/packs/accordion/",release:0.22,urls:Object.freeze({A4:"A4.mp3",C5:"C5.mp3",E5:"E5.mp3",G5:"G5.mp3",C6:"C6.mp3"})}),
      license:"CC0 1.0 · FreePats Button Accordion HN"
    }),
    choir:Object.freeze({
      id:"choir",name:"Chorfläche",bundled:true,roles:["harmony","atmosphere","transition"],
      sampler:Object.freeze({baseUrl:"assets/audio/packs/choir/",attack:0.16,release:1.7,urls:Object.freeze({C3:"C3.mp3","F#3":"Fs3.mp3",C4:"C4.mp3","F#4":"Fs4.mp3",C5:"C5.mp3"})}),
      license:"CC0 1.0 · FreePats Synth Pad Choir"
    })
  });
  const worlds = Object.freeze([
    Object.freeze({id:"electronic",name:"Elektronisch",packs:["electronic"]}),
    Object.freeze({id:"accordion",name:"Akkordeon / Party",packs:["electronic","accordion"]}),
    Object.freeze({id:"mystic",name:"Mystisch / Chor",packs:["electronic","choir"]}),
    Object.freeze({id:"mixed",name:"Gemischt",packs:["electronic","accordion","choir"]})
  ]);
  const world=id=>worlds.find(item=>item.id===id)||worlds[0];
  const pack=id=>packs[id]||null;
  const isWorld=id=>worlds.some(item=>item.id===id);
  const label=id=>world(id).name;
  const samplerPacks=()=>Object.values(packs).filter(item=>item.bundled&&item.sampler);
  const assets=()=>samplerPacks().flatMap(item=>Object.values(item.sampler.urls).map(file=>`${item.sampler.baseUrl}${file}`));
  window.VBMusicSamplePacks=Object.freeze({VERSION,DEFAULT_WORLD,packs,worlds,world,pack,isWorld,label,samplerPacks,assets});
})();
