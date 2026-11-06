'use strict';
// Ver.1.7: camera capture for an existing 9-hole section. Photo data stays in the Ver.1.5 IndexedDB.
const pg17Css=document.createElement('style');
pg17Css.textContent=`.pg17-camera-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.pg17-camera-actions button{flex:1;min-width:135px}.pg17-camera-help{font-size:12px;color:#567164;margin:6px 0}.pg17-camera-input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}`;
document.head.appendChild(pg17Css);
const pg17PrevSectionEditor=sectionEditor;
sectionEditor=function(s,i){
  const html=pg17PrevSectionEditor(s,i);
  const controls=`<div class="pg17-camera-actions"><button type="button" class="secondary" onclick="pg17OpenCamera('${esc(s.id)}','editor')">📷 カメラで撮影</button></div><p class="pg17-camera-help">撮影後は「マスター保存」で登録が確定します。既存の写真を差し替える場合は確認します。</p>`;
  return html.replace('<input type="file" accept="image/*" data-photo-section=',controls+'<input type="file" accept="image/*" data-photo-section=');
};
const pg17PrevHome=home;
home=function(){
  const html=pg17PrevHome();
  if(!cur())return html;
  const id=round()?.sectionId;
  if(!id||!findSection(id))return html;
  const controls=`<div class="pg17-camera-actions"><button type="button" class="secondary" onclick="pg17OpenCamera('${esc(id)}','play')">📷 このコースを撮影して登録</button></div>`;
  return html.replace('<div class="progress">',controls+'<div class="progress">');
};
function pg17OpenCamera(sectionId,mode){
  if(mode==='play'&&(!cur()||round()?.sectionId!==sectionId)){
    alert('プレー中のコースが切り替わりました。画面を開き直してください。');return;
  }
  if(mode==='editor'&&(!editor||!editor.sections.some(s=>s.id===sectionId))){
    alert('登録先のコースが見つかりません。');return;
  }
  // The capture hint asks iOS/Android for the rear camera. Some devices show a picker instead.
  const input=document.createElement('input');
  input.type='file';input.accept='image/*';input.setAttribute('capture','environment');
  input.className='pg17-camera-input';input.setAttribute('aria-label','カメラでコースを撮影');
  document.body.appendChild(input);
  input.addEventListener('change',async()=>{
    const file=input.files?.[0];
    input.remove();
    if(!file)return; // Camera cancelled; never alter the existing photo.
    try{
      if(mode==='play'&&(!cur()||round()?.sectionId!==sectionId)){
        alert('撮影中にプレー中のコースが切り替わりました。写真は保存していません。');return;
      }
      if(mode==='editor'&&(!editor||!editor.sections.some(s=>s.id===sectionId))){
        alert('編集中のコースが変更されたため、写真は保存していません。');return;
      }
      const blob=await pg15Compress(file);
      const pending=pg15Pending.has(sectionId)?pg15Pending.get(sectionId):undefined;
      const existing=pending===undefined?await pg15Photo(sectionId,'get'):pending;
      if(existing&&!confirm('このコースには写真が登録されています。新しい写真に差し替えますか？'))return;
      if(mode==='editor'){
        // Match existing course-editor behavior: commit together with master save.
        pg15Pending.set(sectionId,blob);
        syncEditor();render();
        alert('写真を準備しました。「マスター保存」を押すと登録されます。');
      }else{
        // A successful IndexedDB transaction is required before reporting completion.
        await pg15Photo(sectionId,'put',blob);
        alert('現在のコースに写真を登録しました。');
      }
    }catch(e){alert('写真を登録できませんでした：'+(e?.message||String(e)))}
  },{once:true});
  input.click();
  // Cancel may not emit change on some browsers. Remove abandoned inputs when focus returns.
  window.addEventListener('focus',()=>setTimeout(()=>{if(input.isConnected&&!input.files?.length)input.remove()},1500),{once:true});
}
const pg17Version=document.querySelector('header .small');
if(pg17Version)pg17Version.textContent='Ver.1.7';
render();
