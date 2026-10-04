const {chromium,webkit,devices}=require('playwright');
const fs=require('fs'),assert=require('node:assert/strict');
const fixtures=require('./athletics-library-fixtures.json');
const root=require('path').resolve(__dirname,'..');
const server=require('http').createServer((req,res)=>{const file=require('path').join(root,decodeURIComponent(req.url.split('?')[0]));try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
const harness=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/exercise-library.css"></head><body class="editing-mode editor-workspace-hub"><div id="editorHub"></div><div class="court-section"></div><script>
const user='10000000-0000-4000-8000-000000000001',club='20000000-0000-4000-8000-000000000001';
localStorage.setItem('volleyball-trainer-team-v3','team-test');localStorage.setItem('volleyball-trainer-access-v3',JSON.stringify({platform_admin:true,clubs:[{id:club,roles:['editor','club_admin']}]}));
window.APP_CONFIG={SUPABASE_URL:location.origin};window.testRows=${JSON.stringify(fixtures)};window.requests=[];window.uploads=[];window.deletes=[];
window.VBTrainingApi={request:async(path,opts={})=>{
 window.requests.push({path,method:opts.method,body:opts.body instanceof Blob ? {blob:true,type:opts.body.type,size:opts.body.size}:opts.body});
 if(path==='/auth/v1/user')return {id:user};if(path.startsWith('/rest/v1/vt_teams'))return [{id:'team-test',club_id:club}];
 if(path.startsWith('/rest/v1/vt_exercise_catalog_items'))return [{kind:'athletics_focus',code:'stability',label:'Stabilität'},{kind:'material',code:'none',label:'Kein Material'}];
 if(path.startsWith('/rest/v1/vt_exercise_favorites'))return [];
 if(path.startsWith('/storage/v1/object/sign/'))return {signedURL:'/test-image.jpg'};
 if(path==='/storage/v1/object/vt-exercise-images'){window.deletes.push(...opts.body.prefixes);return {};}
 if(path.startsWith('/storage/v1/object/vt-exercise-images/')){if(window.failUpload){window.failUpload=false;throw new Error('Test Uploadfehler');}window.uploads.push(path);return {};}
 if(path.startsWith('/rest/v1/vt_exercises')){
  if(opts.method==='POST'){const row={...opts.body,id:crypto.randomUUID(),media_items:[]};window.testRows.push(row);return [row];}
  if(opts.method==='PATCH'){if(window.failPatch){window.failPatch=false;throw new Error('Test Speicherfehler');}const row=window.testRows.find(x=>x.id===path.split('eq.')[1]);Object.assign(row,opts.body);return [row];}
  if(window.failLoad){window.failLoad=false;throw new Error('Test Ladefehler');}return window.testRows;
 }
 return [];
}};
</script><script src="/exercise-media.js"></script><script src="/exercise-library.js"></script></body></html>`;
async function run(options){
 const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});const page=await browser.newPage(options);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/harness',route=>route.fulfill({contentType:'text/html',body:harness}));await page.goto('http://127.0.0.1:8765/harness');await page.locator('#editorTileAthletics').click();await page.locator('.exercise-card').first().waitFor();
 assert.equal(await page.locator('.exercise-card').count(),66);assert.equal(await page.locator('.exercise-card-image').count(),38);
 // Resolve every approved source and load every sequence frame, including lazy images.
 const media=fixtures.flatMap(x=>x.media_items);const result=await page.evaluate(async items=>{const unique=[...new Map(items.map(x=>[x.asset_path,x])).values()];for(const it of unique){const url=await VBExerciseMedia.urlFor(it);await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>img.naturalWidth?resolve():reject(new Error(it.asset_path));img.onerror=()=>reject(new Error(it.asset_path));img.src=url;});}return unique.length;},media);assert(result>=60);
 for(const row of fixtures.filter(x=>x.media_items.length)){
  await page.evaluate(media=>VBExerciseMedia.view(media),row.media_items);await page.waitForFunction(()=>{const i=document.querySelector('.exercise-image-stage img');return i&&i.complete&&i.naturalWidth&&!i.hidden;});assert.equal(await page.locator('.exercise-image-viewer-caption p').textContent(),row.media_items[0].caption);
  if(row.media_items.length>1){await page.locator('.exercise-image-nav [data-next]').click();await page.waitForFunction(()=>{const i=document.querySelector('.exercise-image-stage img');return i.complete&&i.naturalWidth&&!i.hidden;});assert.equal(await page.locator('.exercise-image-nav span').textContent(),`2 / ${row.media_items.length}`);}
  if(row.media_items[0].notice)assert((await page.locator('.exercise-image-credit').textContent()).includes('endorsement'));
  await page.locator('.exercise-image-viewer [data-close]').click();await page.locator('.exercise-image-viewer').waitFor({state:'detached'});
 }
 await page.locator('#exerciseSearch').fill('Kurzhantel');assert((await page.locator('.exercise-card').count())>=8);await page.locator('#exerciseSearch').fill('Dead Bug');assert.equal(await page.locator('.exercise-card').count(),1);
 assert.deepEqual(errors,[]);await browser.close();console.log(`Full library: 66 public exercises, 38 galleries, ${result} images; search and mobile gallery checks passed (${options.viewport.width}px).`);
}
(async()=>{await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));await run({viewport:{width:430,height:932},isMobile:true});await run({viewport:{width:932,height:430},isMobile:true});})().then(()=>server.close()).catch(e=>{console.error(e);server.close();process.exit(1)});
