const {chromium,webkit,devices}=require('playwright');
const fs=require('fs'),assert=require('node:assert/strict');
const fixtures=require('./athletics-media-fixtures.json');
const root=require('path').resolve(__dirname,'..');
const server=require('http').createServer((req,res)=>{const file=require('path').join(root,decodeURIComponent(req.url.split('?')[0]));try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
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
async function run(browserType,name,options){
 const browser=await browserType.launch({headless:true, ...(process.env.TEST_CHROMIUM_PATH ? {executablePath:process.env.TEST_CHROMIUM_PATH,args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]}: {})});const page=await browser.newPage(options);const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});page.on('requestfailed',r=>console.log('REQUEST FAILED',r.url(),r.failure()));page.setDefaultTimeout(10000);
 await page.route('**/harness',route=>route.fulfill({contentType:'text/html',body:harness}));
 await page.route('**/storage/v1/test-image.jpg',route=>route.fulfill({contentType:'image/jpeg',body:fs.readFileSync(root+'/assets/athletics/bird-dog.jpg')}));
 await page.goto('http://127.0.0.1:8765/harness');await page.locator('#editorTileAthletics').click();
 await page.locator('.exercise-card-image').first().waitFor();assert.equal(await page.locator('.exercise-card').count(),3);
 await page.waitForFunction(()=>[...document.querySelectorAll('.exercise-card-image img')].every(x=>x.complete&&x.naturalWidth));
 await page.locator('[data-exercise-image="a2ca1dcb-e34f-40bc-abe3-dc1f3237c102"]').click();
 await page.locator('.exercise-image-nav [data-next]').click();assert.equal(await page.locator('.exercise-image-nav span').textContent(),'2 / 2');
 await page.waitForFunction(()=>{const img=document.querySelector('.exercise-image-stage img');return img&&!img.hidden&&img.complete&&img.naturalWidth>0;});await page.screenshot({path:`/tmp/athletics-${name}-viewer.png`});
 assert(await page.evaluate(()=>document.querySelector('.exercise-image-viewer').scrollWidth<=document.querySelector('.exercise-image-viewer').clientWidth+2));
 await page.locator('.exercise-image-viewer [data-close]').click();
 await page.locator('[data-action="view"]').first().click();assert.equal(await page.locator('.exercise-image-upload').count(),0);assert(await page.locator('input[name="name"]').isDisabled());await page.locator('.exercise-editor-head [data-close]').click();
 await page.locator('[data-action="clone"][data-id="a2ca1dcb-e34f-40bc-abe3-dc1f3237c102"]').click();
 await page.locator('.exercise-media-item').nth(1).locator('[data-move="-1"]').click();
 await page.locator('.exercise-media-item').first().locator('[data-field="caption"]').fill('Neue Beschriftung');
 await page.locator('.exercise-editor button[type="submit"]').click();await page.locator('.exercise-editor').waitFor({state:'detached'});
 let copy=await page.evaluate(()=>window.testRows.at(-1));assert.equal(copy.media_items[0].asset_path,'assets/athletics/side-plank-hold.png');assert.equal(copy.media_items[0].caption,'Neue Beschriftung');
 await page.locator(`[data-action="edit"][data-id="${copy.id}"]`).click();
 await page.locator('.exercise-image-upload input').setInputFiles(root+'/assets/athletics/bird-dog.jpg');
 await page.waitForFunction(()=>document.querySelectorAll('.exercise-media-item').length===3);
 await page.screenshot({path:`/tmp/athletics-${name}-editor.png`});
 assert(await page.evaluate(()=>document.querySelector('.exercise-editor').scrollWidth<=document.querySelector('.exercise-editor').clientWidth+2));
 await page.evaluate(()=>window.failPatch=true);await page.locator('.exercise-editor button[type="submit"]').click();
 await page.locator('.exercise-editor-status').filter({hasText:'Test Speicherfehler'}).waitFor();
 assert.equal(await page.evaluate(()=>window.deletes.length),1);assert.equal(await page.locator('.exercise-media-item').count(),3);
 await page.locator('.exercise-editor button[type="submit"]').click();await page.locator('.exercise-editor').waitFor({state:'detached'});
 copy=await page.evaluate(()=>window.testRows.at(-1));assert.equal(copy.media_items.length,3);assert(copy.media_items[2].storage_path.startsWith(copy.id+'/'));
 // Cloning uploaded media copies the bytes to the new exercise folder.
 await page.evaluate(id=>{const x=window.testRows.find(x=>x.id===id);x.owner_id='other';x.club_id=null;},copy.id);
 await page.locator('#exerciseSearch').fill('Seitstütz');
 await page.evaluate(()=>document.querySelector('#exerciseSearch').dispatchEvent(new Event('input',{bubbles:true})));
 await page.locator(`[data-action="clone"][data-id="${copy.id}"]`).click();
 await page.locator('.exercise-editor button[type="submit"]').click();await page.locator('.exercise-editor').waitFor({state:'detached'});
 const second=await page.evaluate(()=>window.testRows.at(-1));assert.notEqual(second.id,copy.id);assert(second.media_items[2].storage_path.startsWith(second.id+'/'));
 // Replacement and removal stay local until saved; cancellation never uploads.
 await page.locator('#exerciseSearch').fill('');await page.locator(`[data-action="edit"][data-id="${second.id}"]`).click();
 const uploadCount=await page.evaluate(()=>window.uploads.length);
 await page.locator('.exercise-media-item').first().locator('[data-remove]').click();assert.equal(await page.locator('.exercise-media-item').count(),2);
 await page.locator('.exercise-editor-head [data-close]').click();assert.equal(await page.evaluate(()=>window.uploads.length),uploadCount);
 assert.equal((await page.evaluate(()=>window.testRows.at(-1))).media_items.length,3);
 // Replacing a saved upload preserves the caption and removes only this exercise's old object.
 await page.locator(`[data-action="edit"][data-id="${second.id}"]`).click();
 const chooserPromise=page.waitForEvent('filechooser');await page.locator('.exercise-media-item').nth(2).locator('[data-replace]').click();const chooser=await chooserPromise;await chooser.setFiles(root+'/assets/athletics/bridge.png');
 await page.locator('.exercise-media-status').filter({hasText:'Bilder vorbereitet'}).waitFor();
 await page.locator('.exercise-editor button[type="submit"]').click();await page.locator('.exercise-editor').waitFor({state:'detached'});
 const replaced=await page.evaluate(()=>window.testRows.at(-1));assert.notEqual(replaced.media_items[2].storage_path,second.media_items[2].storage_path);assert.equal(replaced.media_items[2].caption,second.media_items[2].caption);assert(await page.evaluate(path=>window.deletes.includes(path),second.media_items[2].storage_path));
 assert.equal(await page.evaluate(id=>window.testRows.find(x=>x.id===id).media_items[2].storage_path,copy.id),copy.media_items[2].storage_path);
 // Photo processing preserves shape and strips EXIF through canvas export.
 const processed=await page.evaluate(async()=>{const b=await fetch('/assets/athletics/bird-dog.jpg').then(x=>x.blob());const out=await VBExerciseMedia.prepareFile(new File([b],'photo.jpg',{type:'image/jpeg'}));const img=await createImageBitmap(out);return {width:img.width,height:img.height,size:out.size};});
 assert(processed.width<=1600&&processed.height<=1600&&processed.size<5*1048576);
 assert.deepEqual(errors,[]);console.log(`${name}: gallery, readonly, order, captions, upload rollback/retry, independent clone, cancellation and compression passed`);await browser.close();
}
(async()=>{await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));await run(chromium,'chromium-mobile',{viewport:{width:430,height:932},isMobile:true});if(!process.env.TEST_CHROMIUM_PATH)await run(webkit,'webkit-iphone',devices['iPhone 15 Pro Max']);await run(process.env.TEST_CHROMIUM_PATH ? chromium : webkit,'mobile-landscape',{viewport:{width:932,height:430},isMobile:true,deviceScaleFactor:2});})().then(()=>server.close()).catch(e=>{console.error(e);server.close();process.exit(1);});
