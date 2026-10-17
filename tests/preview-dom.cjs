// Event integration smoke test. This is a DOM shim, not a visual browser test.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(process.argv[2],'utf8');let document;
const camel=s=>s.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
class Element{
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.dataset={};this.style={setProperty(k,v){this[k]=String(v)}};this.listeners={};this._value=undefined;this._text='';this.hidden=false;this.className='';this.classList={contains:c=>this.className.split(/\s+/).includes(c),add:(...cs)=>{this.className=[...new Set([...this.className.split(/\s+/),...cs])].join(' ').trim()},remove:(...cs)=>{this.className=this.className.split(/\s+/).filter(c=>!cs.includes(c)).join(' ')},toggle:(c,on)=>{on=on??!this.classList.contains(c);on?this.classList.add(c):this.classList.remove(c);return on}}}
 setAttribute(k,v){this.attributes[k]=String(v);if(k==='class')this.className=v;else if(k==='id')this.id=v;else if(k.startsWith('data-'))this.dataset[camel(k.slice(5))]=v;else if(k==='value')this.value=v;else if(k==='hidden')this.hidden=true;else if(k==='disabled')this.disabled=true}
 getAttribute(k){return this.attributes[k]??null} removeAttribute(k){delete this.attributes[k]}
 get value(){if(this._value!==undefined)return String(this._value);if(this.tagName==='SELECT')return this.children.find(c=>c.tagName==='OPTION')?.value||'';return this.attributes.value??(this.tagName==='OPTION'?this.textContent:'')}
 set value(v){this._value=String(v)}get valueAsNumber(){return Number(this.value)}scrollIntoView(){}get selectedOptions(){return this.children.filter(c=>c.tagName==='OPTION'&&c.value===this.value)}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('')}set textContent(s){this._text=String(s);this.children=[]}
 set innerHTML(s){this._text='';this.children=[];parse(s,this)}get innerHTML(){return this.children.length?'markup':''}
 get firstChild(){return this.children[0]||null}get lastChild(){return this.children.at(-1)||null}
 get offsetWidth(){return this.id==='fixture-popover'?280:800}get offsetHeight(){return this.id==='fixture-popover'?380:430}
 append(...cs){for(const c of cs){c.parentNode=this;this.children.push(c)}}prepend(c){c.parentNode=this;this.children.unshift(c)}before(c){const p=this.parentNode;c.parentNode=p;p.children.splice(p.children.indexOf(this),0,c)}after(c){const p=this.parentNode;c.parentNode=p;p.children.splice(p.children.indexOf(this)+1,0,c)}
 remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(c=>c!==this);this.parentNode=null}}
 replaceChildren(...cs){this.children=[];this._text='';this.append(...cs)}
 matches(selector){return selector.split(',').some(sel=>{sel=sel.trim();if(sel.startsWith('.'))return this.classList.contains(sel.slice(1));if(sel.startsWith('#'))return this.id===sel.slice(1);const m=sel.match(/^([a-zA-Z]+)?(?:\[([^=\]]+)(?:="?([^"\]]+)"?)?\])?$/);if(!m)return false;if(m[1]&&this.tagName!==m[1].toUpperCase())return false;if(m[2])return Object.hasOwn(this.attributes,m[2])&&(m[3]===undefined||this.attributes[m[2]]===m[3]);return !!m[1]})}
 querySelectorAll(s){return this.children.flatMap(c=>[...(c.matches(s)?[c]:[]),...c.querySelectorAll(s)])}querySelector(s){return this.querySelectorAll(s)[0]||null}closest(s){return this.matches(s)?this:this.parentNode?.closest(s)||null}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}dispatch(type,extra={}){const e={target:this,currentTarget:this,button:0,pointerId:1,clientX:200,clientY:180,preventDefault(){},stopPropagation(){},...extra};this['on'+type]?.(e);for(const fn of this.listeners[type]||[])fn(e)}click(){this.dispatch('click',{detail:1})}
 focus(){document.activeElement=this}showModal(){this.setAttribute('open','')}close(){this.removeAttribute('open')}
 setPointerCapture(){}releasePointerCapture(){}hasPointerCapture(){return false}
 getBoundingClientRect(){return{left:100,top:100,width:800,height:430,right:900,bottom:530}}
 getContext(){return{scale(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},drawImage(){}}}toDataURL(){return'data:image/jpeg;base64,YWJj'}
}
function parse(html,root){const stack=[root];for(const token of html.match(/<!--[^]*?-->|<![^>]*>|<[^>]+>|[^<]+/g)||[]){if(token.startsWith('<!'))continue;if(token.startsWith('</')){const tag=token.slice(2,-1).trim().toUpperCase();for(let i=stack.length-1;i>0;i--)if(stack[i].tagName===tag){stack.length=i;break}continue}if(token.startsWith('<')){const m=token.match(/^<([\w-]+)/);if(!m)continue;const e=new Element(m[1]);for(const a of token.slice(m[0].length,-1).matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))e.setAttribute(a[1],a[2]??a[3]??a[4]??'');stack.at(-1).append(e);if(!['META','INPUT','IMG','BR','HR','LINK'].includes(e.tagName)&&!token.endsWith('/>'))stack.push(e)}else stack.at(-1)._text+=token}}
document=new Element('document');parse(html.replace(/<style>[^]*?<\/style>/g,'').replace(/<script>[^]*?<\/script>/g,''),document);document.createElement=t=>new Element(t);document.createElementNS=(ns,t)=>new Element(t);document.getElementById=id=>document.querySelector('#'+id);document.body=document.querySelector('body');document.activeElement=document.body;
const window={innerWidth:1440,innerHeight:1000,devicePixelRatio:1,addEventListener(){}};
const ctx={document,window,console,performance,assert,Math,Set,Map,URL,Blob,requestAnimationFrame(){},setTimeout(){return 1},clearTimeout(){},ResizeObserver:class{constructor(fn){this.fn=fn}observe(){}},Image:class{naturalWidth=1000;naturalHeight=600;set src(v){this.onload?.()}}};vm.createContext(ctx);for(const s of html.matchAll(/<script>([^]*?)<\/script>/g))vm.runInContext(s[1],ctx,{timeout:4000});
vm.runInContext(`
assert.equal(fixtureElements.size,14);assert.equal(objectElements.size,1);assert.equal($('fixture-popover').hidden,true);
selectClick('f9',false);assert.equal($('fixture-popover').hidden,true);$('open-fixture-tools').click();assert.equal($('fixture-popover').hidden,false);assert.equal($('popover-title').textContent,'Spot 1');setControlTab('position');assert.equal(document.querySelector('[data-control-panel="position"]').hidden,false);
$('quick-pan').value='75';$('quick-pan').dispatch('input');assert.equal(localPreview.project.fixtures.find(f=>f.id==='f9').pan,.75);
selectClick('f1',false);assert.equal(controlTab,'light');assert.equal(document.querySelector('[data-control-tab="position"]').hidden,true);assert.equal($('popover-title').textContent,'Wash 1');
selectClick('f2',true);$('quick-level').value='32';$('quick-level').dispatch('input');assert.equal(localPreview.project.fixtures[0].level,.32);assert.equal(localPreview.project.fixtures[1].level,.32);assert.notEqual(localPreview.project.fixtures[2].level,.32);
setTool('space');assert.equal($('space-tools').hidden,false);assert.equal($('fixture-popover').hidden,true);$('object-kind').value='drums';$('add-stage-object').click();assert.equal(state.project.space.objects.length,2);assert.equal(state.project.space.objects.at(-1).kind,'drums');$('object-width').value='25';$('object-width').dispatch('change');assert.equal(state.project.space.objects.at(-1).width,25);
const object=objectElements.get(objectId);object.dispatch('pointerdown');object.dispatch('pointermove',{clientX:280,clientY:223});object.dispatch('pointerup');assert.equal(state.project.space.objects.at(-1).x,60);assert.equal(state.project.space.objects.at(-1).y,70);
$('remove-object').click();assert.equal(state.project.space.objects.length,1);
patchSpace({mesh:parseStageOBJ('v 0 0 0\\nv 1 0 0\\nv 0 1 0\\nf 1 2 3','triangle'),mode:'scan'});assert.equal($('space-mesh').hidden,false);$('scan-view').value='top';$('scan-view').dispatch('change');assert.equal(state.project.space.projection,'top');$('remove-backdrop').click();assert.equal(state.project.space.mesh,null);
$('blackout-seconds').value='4';$('blackout-seconds').dispatch('change');$('blackout').click();assert.equal(localPreview.project.blackoutSeconds,4);assert.equal(localPreview.blackout,true);assert.equal(localPreview.blackoutFade.duration,4);
switchTab('patch');$('auto-patch').click();assert.equal($('patch-proposal').children.length,14);$('apply-patch').click();assert.equal($('patch-dialog').getAttribute('open'),null);
console.log('PASS: all UI scripts initialize; contextual profile filtering, position and multi-edit controls, space object create/resize/drag/delete, scan rendering hooks, blackout controls and patch review event wiring.');
`,ctx,{timeout:4000});
vm.runInContext(`
performance={now:()=>100000};localPreview.act({op:'import',project:{...localPreview.copy(localPreview.project),effects:{}}},100);state=localPreview.snapshot(100);renderAll();
setSelection(['f1','f2','f9']);document.querySelector('[data-fx-preset="breathe"]').click();assert.equal(state.fx_count,3);assert.equal(localPreview.project.effects.f1.dimmer.pattern,'breathe');
state=localPreview.snapshot(102);update();const bright=fixtureElements.get('f1').style['--power'];state=localPreview.snapshot(104);update();assert.notEqual(fixtureElements.get('f1').style['--power'],bright);
performance={now:()=>104000};setFxKind('color');$('fx-pattern').value='rainbow';$('fx-apply').click();assert.equal(state.fx_count,6);setFxKind('motion');$('fx-apply').click();assert.equal(state.fx_count,7);assert.equal(localPreview.project.effects.f1.motion,undefined);assert.equal(localPreview.project.effects.f9.motion.pattern,'circle');
state=localPreview.snapshot(107);update();const pan=fixtureElements.get('f9').style['--pan-angle'];state=localPreview.snapshot(109);update();assert.notEqual(fixtureElements.get('f9').style['--pan-angle'],pan);
performance={now:()=>109000};$('fx-pause').click();assert.equal(state.fx_paused,true);assert.equal($('fx-pause').textContent,'Resume');const paused=state.looks.f9.pan;state=localPreview.snapshot(114);update();assert.equal(state.looks.f9.pan,paused);
performance={now:()=>114000};$('fx-pause').click();assert.equal(state.fx_paused,false);assert.equal(state.looks.f9.pan,paused);
$('fx-width').value='20';$('fx-width').dispatch('input');assert.equal(localPreview.project.effects.f9.motion.width,.2);
setFxKind('dimmer');$('fx-low').focus();$('fx-low').value='95';$('fx-high').value='20';$('fx-low').dispatch('input');assert.equal($('fx-high').value,'95');assert.equal(localPreview.project.effects.f1.dimmer.high,.95);
$('fx-stop-all').click();assert.equal(state.fx_count,0);state=localPreview.snapshot(120);update();assert.equal(state.fx_releasing,false);
act({op:'cue',id:'luma-living-light-demo'});state=localPreview.snapshot(120);update();assert.equal(state.fx_count,24);assert.equal(sceneElements.get('luma-living-light-demo').querySelector('.scene-meta').firstChild.textContent,'2s · Animated');
$('jump-effects').click();assert.equal(document.activeElement,$('fx-apply'));
console.log('PASS: preset start, live dimming and beam motion rendered, layer combination and profile filtering, pause/resume, live parameter edits, brightness bounds, fade stop, demo scene and studio navigation.');
`,ctx,{timeout:5000});
vm.runInContext(`
performance={now:()=>200000};localPreview.act({op:'import',project:{...localPreview.copy(localPreview.project),effects:{}}},200);state=localPreview.snapshot(200);switchTab('stage');renderAll();setSelection(['f9']);contextOpen=false;syncPopover();setDockView('both');
assert.equal($('dock-color').hidden,false);assert.equal($('dock-movement').hidden,false);assert.equal($('dock-motion-controls').hidden,false);assert.equal($('fixture-popover').hidden,true);
setDockView('movement');assert.equal($('dock-color').hidden,true);assert.equal($('dock-movement').hidden,false);setDockView('color');assert.equal($('dock-color').hidden,false);assert.equal($('dock-movement').hidden,true);setDockView('both');
$('dock-pan').value='30';$('dock-pan').dispatch('input');assert.equal(localPreview.project.fixtures.find(f=>f.id==='f9').pan,.3);$('dock-center').click();assert.equal(localPreview.project.fixtures.find(f=>f.id==='f9').pan,.5);
$('dock-pattern').value='figure8';$('dock-pattern').dispatch('change');assert.equal(localPreview.project.effects.f9.motion.pattern,'figure8');$('dock-cycle').value='8';$('dock-cycle').dispatch('change');
tick(202000);assert.equal(lastPreviewError,'');const initialAim=liveLightNodes.get('f9').group.getAttribute('data-target-x'),initialPath=liveLightNodes.get('f9').cone.getAttribute('d'),frame=liveSvg.getAttribute('data-frame');tick(204000);assert.notEqual(liveLightNodes.get('f9').group.getAttribute('data-target-x'),initialAim);assert.notEqual(liveLightNodes.get('f9').cone.getAttribute('d'),initialPath);assert.notEqual(liveSvg.getAttribute('data-frame'),frame);assert.equal(lastPreviewError,'');
const marker=$('dock-live-dot').style.left;tick(206000);assert.notEqual($('dock-live-dot').style.left,marker);assert.equal(liveLightNodes.get('f9').path.getAttribute('display'),'');$('stage-live-paths').click();assert.equal(liveLightNodes.get('f9').path.getAttribute('display'),'none');$('stage-live-paths').click();
performance={now:()=>206000};$('stage-live-pause').click();const targetPaused=liveLightNodes.get('f9').group.getAttribute('data-target-x');tick(210000);assert.equal(liveLightNodes.get('f9').group.getAttribute('data-target-x'),targetPaused);assert.equal($('stage-live-status').textContent,'Paused');performance={now:()=>210000};$('stage-live-pause').click();
$('dock-stop').click();tick(212000);assert.equal(state.project.effects.f9?.motion,undefined);assert.equal(liveLightNodes.get('f9').path.getAttribute('display'),'none');
performance={now:()=>212000};setSelection(['f1']);assert.equal($('dock-motion-empty').hidden,false);assert.equal($('dock-motion-controls').hidden,true);$('dock-color-pattern').value='rainbow';$('dock-color-pattern').dispatch('change');assert.equal(state.project.effects.f1.color.pattern,'rainbow');tick(214000);const color1=liveLightNodes.get('f1').spotCenter.getAttribute('stop-color');tick(216000);assert.notEqual(liveLightNodes.get('f1').spotCenter.getAttribute('stop-color'),color1);
performance={now:()=>216000};act({op:'fx_apply',ids:['f1'],kind:'dimmer',config:{pattern:'breathe',period:4,transition:0,low:0,high:1}});tick(218000);const output=Number(liveLightNodes.get('f1').group.getAttribute('opacity'));tick(220000);assert(output>Number(liveLightNodes.get('f1').group.getAttribute('opacity')));
performance={now:()=>220000};$('blackout').click();tick(224000);assert.equal(Number(liveLightNodes.get('f1').group.getAttribute('opacity')),0);assert.equal(lastPreviewError,'');
const g1=stageLightGeometry({x:50,y:40,profile:'Moving head · preview',zone:'Spots'},{pan:.2,tilt:.2,zoom:.3,iris:1}),g2=stageLightGeometry({x:50,y:40,profile:'Moving head · preview',zone:'Spots'},{pan:.8,tilt:.8,zoom:.3,iris:1});assert(g2.target.x>g1.target.x);assert(g2.target.y<g1.target.y);assert.notEqual(g1.cone,g2.cone);
console.log('PASS: dock Both/Color/Movement views, manual aiming, motion playback, real requestAnimationFrame tick updates SVG cone/spot positions and live markers, paths toggle, pause/resume, color animation, brightness animation, blackout darkness.');
`,ctx,{timeout:5000});
vm.runInContext(`
performance={now:()=>300000};act({op:'blackout',value:false,seconds:0});act({op:'cue',id:'luma-living-light-demo'});tick(304000);setTool('select');chooseZone('Vertical LEDs');
const bars=selectedFixtures();assert.equal(bars.length,5);assert.equal($('selected-appearance').value,'led-bar');assert.equal($('dock-motion-controls').hidden,true);
assert.deepEqual(bars.map(f=>f.x),[12,31,50,69,88]);assert(bars.every(f=>f.y===55&&f.profile==='RGBW'));assert.deepEqual(bars.map(f=>f.address),[49,53,57,61,65]);
for(const f of bars){assert.equal(fixtureElements.get(f.id).dataset.appearance,'led-bar');assert.equal(fixtureElements.get(f.id).querySelectorAll('.fixture-emitter').length,14);assert.equal(liveLightNodes.get(f.id).cone.getAttribute('display'),'none');assert(Number(liveLightNodes.get(f.id).source.getAttribute('ry'))>60);assert(state.project.scenes.every(s=>s.looks[f.id]));assert(state.project.effects[f.id].dimmer&&state.project.effects[f.id].color)}
const b0=bars[0],barNode=fixtureElements.get(b0.id),color=barNode.style['--light'],level=barNode.style['--power'];tick(306000);assert.notEqual(barNode.style['--light'],color);assert.notEqual(barNode.style['--power'],level);assert.equal(lastPreviewError,'');
const allSlots=state.project.fixtures.flatMap(f=>LumaPreviewEngine.channels[f.profile].map((_,i)=>f.address+i));assert.equal(allSlots.length,68);assert.equal(new Set(allSlots).size,68);
assert.equal(fixtureElements.get('f1').dataset.appearance,'wash');assert.equal(fixtureElements.get('f7').dataset.appearance,'fresnel');assert.equal(fixtureElements.get('f9').dataset.appearance,'moving-head');assert(fixtureElements.get('f9').querySelector('.fixture-head'));
const footprint=fixtureFootprint(b0),hit=marqueeSelection([{id:b0.id,x:100,y:100,width:footprint[0],height:footprint[1]}],{x:99,y:45,width:2,height:3});assert(hit.has(b0.id));assert(!marqueeSelection([{id:b0.id,x:100,y:100,width:footprint[0],height:footprint[1]}],{x:120,y:45,width:2,height:3}).has(b0.id));
// Exercise the actual drag-selection event path across the tops of all five bars.
setSelection([]);const stageRect=$('stage').getBoundingClientRect(),barTop=.55*stageRect.height-58;$('stage').dispatch('pointerdown',{clientX:stageRect.left+.08*stageRect.width,clientY:stageRect.top+barTop+3});$('stage').dispatch('pointermove',{clientX:stageRect.left+.92*stageRect.width,clientY:stageRect.top+barTop+9});$('stage').dispatch('pointerup');assert.deepEqual([...selected].sort(),bars.map(f=>f.id).sort());
performance={now:()=>306000};const fxBefore=JSON.stringify(localPreview.project.effects),addressBefore=bars[0].address;$('selected-appearance').value='par';$('selected-appearance').dispatch('change');assert.equal(fixtureElements.get('f10').dataset.appearance,'par');assert.equal(JSON.stringify(localPreview.project.effects),fxBefore);assert.equal(localPreview.project.fixtures.find(f=>f.id==='f10').address,addressBefore);$('selected-appearance').value='led-bar';$('selected-appearance').dispatch('change');
const reopened=new LumaPreviewEngine(JSON.parse(JSON.stringify(localPreview.project)));assert.equal(reopened.project.fixtures.filter(f=>f.appearance==='led-bar').length,5);const legacy=localPreview.copy(localPreview.project);legacy.fixtures.forEach(f=>delete f.appearance);const migrated=new LumaPreviewEngine(legacy);assert.equal(migrated.project.fixtures.find(f=>f.id==='f10').appearance,'led-bar');assert.equal(migrated.project.fixtures.find(f=>f.id==='f9').appearance,'moving-head');assert.throws(()=>localPreview.act({op:'fixture',ids:['f10'],patch:{appearance:'unknown'}}));
$('fixture-name').value='Extra PAR';$('fixture-zone').value='Stage wash';$('fixture-profile').value='RGBW';$('fixture-appearance').value='par';$('fixture-address').value=String(nextAddress());$('fixture-form').dispatch('submit');assert.equal(localPreview.project.fixtures.length,15);assert.equal(localPreview.project.fixtures.at(-1).appearance,'par');assert.equal(localPreview.project.fixtures.at(-1).address,69);assert.equal(localPreview.project.fixtures.at(-1).level,0);
console.log('PASS: five evenly spaced upright LED bars, distinct fixture SVGs, live emitter colors and brightness, diffused bar optics, full-height drag selection, non-overlapping patch, scene coverage, appearance editing without interrupting effects, shape persistence and legacy import, and Add Light shape selection.');
`,ctx,{timeout:6000});

vm.runInContext(`
{
 const savedProject=localPreview.copy(localPreview.project);performance={now:()=>400000};
 act({op:'cue',id:'luma-living-light-demo'});setTool('select');setSelection(['f1','f2']);
 const source=fixtureElements.get('f1');document.dispatch('contextmenu',{target:source.querySelector('.housing'),clientX:1400,clientY:950});
 assert.equal(lightMenu.hidden,false);assert.equal($('light-menu-name').textContent,'Wash 1');assert.deepEqual([...selected],['f1']);assert.equal(source.getAttribute('aria-expanded'),'true');
 assert.equal(contextOpen,false);assert.equal(gesture,null);
 const actions=()=>[...lightMenu.querySelectorAll('[role="menuitem"]')];const action=label=>actions().find(b=>b.textContent===label);
 assert.equal(document.activeElement,actions()[0]);document.dispatch('keydown',{key:'End',target:document.activeElement});assert.equal(document.activeElement,actions().at(-1));
 document.dispatch('keydown',{key:'Escape',target:document.activeElement});assert.equal(lightMenu.hidden,true);assert.deepEqual([...selected],['f1']);assert.equal(document.activeElement,source);
 document.dispatch('keydown',{key:'F10',shiftKey:true,target:source});assert.equal(lightMenu.hidden,false);action('Rename…').click();assert.equal($('fixture-dialog').getAttribute('open'),'');assert.equal(document.activeElement,$('fixture-name'));assert.equal($('fixture-name').value,'Wash 1');
 const effects=JSON.stringify(localPreview.project.effects);$('fixture-name').value='Choir <wash>';$('fixture-form').dispatch('submit');assert.equal(localPreview.project.fixtures[0].name,'Choir <wash>');assert.equal(JSON.stringify(localPreview.project.effects),effects);
 openLightMenu('f1',fixtureElements.get('f1'));action('Change light…').click();$('fixture-address').value='5';$('fixture-form').dispatch('submit');assert.equal($('fixture-form-error').hidden,false);assert.match($('fixture-form-error').textContent,/overlap/);assert.equal($('fixture-dialog').getAttribute('open'),'');assert.equal(localPreview.project.fixtures[0].address,1);
 $('fixture-address').value='1';$('fixture-appearance').value='par';$('fixture-form').dispatch('submit');assert.equal(fixtureElements.get('f1').dataset.appearance,'par');
 document.dispatch('contextmenu',{target:rowElements.get('f1')});action('Duplicate light').click();const copy=localPreview.project.fixtures.at(-1);assert.equal(copy.level,0);assert.deepEqual([...selected],[copy.id]);assert.equal(fixtureElements.get(copy.id).dataset.appearance,'par');
 openLightMenu(copy.id,fixtureElements.get(copy.id));assert.equal(action('Stop effects').disabled,true);action('Remove light…').click();assert.equal($('remove-light-dialog').getAttribute('open'),'');$('cancel-remove-light').click();assert(localPreview.project.fixtures.some(f=>f.id===copy.id));
 openLightMenu(copy.id,fixtureElements.get(copy.id));action('Remove light…').click();$('confirm-remove-light').click();assert(!localPreview.project.fixtures.some(f=>f.id===copy.id));assert.equal($('remove-light-dialog').getAttribute('open'),null);assert.equal(document.activeElement,$('stage'));
 openLightMenu('f1',fixtureElements.get('f1'));action('Select its group').click();assert.deepEqual([...selected].sort(),state.project.fixtures.filter(f=>f.zone==='Stage wash').map(f=>f.id).sort());
 openLightMenu('f1',fixtureElements.get('f1'));action('Move on stage').click();assert.equal(tool,'arrange');assert.deepEqual([...selected],['f1']);
 openLightMenu('f1',fixtureElements.get('f1'));action('Adjust light…').click();assert.equal(contextOpen,true);assert.equal($('fixture-popover').hidden,false);assert.equal(document.activeElement,$('quick-level'));
 openLightMenu('f1',fixtureElements.get('f1'));action('Stop effects').click();assert.equal(localPreview.project.effects.f1,undefined);assert(localPreview.project.effects.f2.color);
 openLightMenu('f1',fixtureElements.get('f1'));document.dispatch('pointerdown',{target:$('stage')});assert.equal(lightMenu.hidden,true);
 act({op:'import',project:savedProject},true);contextOpen=false;setTool('select');syncPopover();
 console.log('PASS: per-light context menu targets clicked light, keyboard navigation and dismissal, safe rename text, edit validation, sidebar menu, duplicate, cancel/confirm removal, group selection, move, adjust and isolated effect stop.');
}
`,ctx,{timeout:6000});

vm.runInContext(`
{
 const original=localPreview.copy(localPreview.project);setTool('space');
 assert.equal($('space-tools').hidden,false);assert.equal($('light-inspector').hidden,true);assert.equal($('stage-width-m').value,'');assert.equal($('fit-stage-size').disabled,true);
 $('stage-width-m').value='12';$('stage-width-m').dispatch('change');$('stage-depth-m').value='7';$('stage-depth-m').dispatch('change');$('stage-elevation-m').value='.8';$('stage-elevation-m').dispatch('change');
 assert.equal(state.project.space.widthM,12);assert.equal(state.project.space.depthM,7);assert.equal(state.project.space.elevationM,.8);assert.equal($('fit-stage-size').disabled,false);
 const fx=JSON.stringify(localPreview.project.effects);$('space-height-fixture').value='f9';$('space-height-fixture').dispatch('change');$('space-light-height').value='4.572';$('space-light-height').dispatch('change');
 assert.equal(state.project.fixtures.find(f=>f.id==='f9').mountHeightM,4.572);assert.equal(JSON.stringify(localPreview.project.effects),fx);
 document.querySelector('[data-space-unit="ft"]').click();assert.equal($('space-light-height').value,'15');assert.equal(state.project.space.widthM,12);assert.equal(state.project.space.elevationM,.8);
 for(let n=0;n<5;n++){setSpaceUnits('m');setSpaceUnits('ft')}assert.equal(state.project.space.widthM,12);assert.equal(state.project.fixtures.find(f=>f.id==='f9').mountHeightM,4.572);
 $('space-light-height').value='20';$('space-light-height').dispatch('change');assert.equal(state.project.fixtures.find(f=>f.id==='f9').mountHeightM,6.096);setSpaceUnits('m');
 $('stage-width-m').value='-2';$('stage-width-m').dispatch('change');assert.equal($('space-measure-error').hidden,false);assert.equal(state.project.space.widthM,12);$('stage-width-m').value='12';$('stage-width-m').dispatch('change');assert.equal($('space-measure-error').hidden,true);
 $('fit-stage-size').click();const main=mainStage(),rect=$('stage').getBoundingClientRect();assert(Math.abs(main.width*rect.width/(main.height*rect.height)-12/7)<1e-8);
 document.querySelector('[data-stage-shape="thrust"]').click();$('stage-floor').value='wood';$('stage-floor').dispatch('change');assert.equal(state.project.space.stageShape,'thrust');assert.equal(state.project.space.floor,'wood');assert(objectElements.get(main.id).classList.contains('stage-deck'));
 $('space-measurements').checked=false;$('space-measurements').dispatch('change');assert.equal($('space-measure-layer').hidden,true);assert.equal(fixtureElements.get('f9').querySelector('.fixture-height-label').hidden,true);
 $('space-measurements').checked=true;$('space-measurements').dispatch('change');assert.equal(fixtureElements.get('f9').querySelector('.fixture-height-label').textContent,'↑ 6.1 m');
 setSpaceTab('objects');document.querySelector('[data-add-object="lectern"]').click();const oid=objectId;assert.equal(state.project.space.objects.at(-1).kind,'lectern');
 $('object-label').value='Pulpit <front>';$('object-label').dispatch('change');assert.equal(state.project.space.objects.at(-1).name,'Pulpit <front>');assert.equal(objectElements.get(oid).querySelector('.object-caption').textContent,'Pulpit <front>');
 $('object-color').value='#ff9900';$('object-color').dispatch('change');$('object-x').value='41';$('object-x').dispatch('change');assert.equal(state.project.space.objects.at(-1).color,'#ff9900');assert.equal(state.project.space.objects.at(-1).x,41);
 $('object-locked').checked=true;$('object-locked').dispatch('change');assert.equal($('object-width').disabled,true);assert.equal($('remove-object').disabled,true);
 const locked=JSON.stringify(state.project.space.objects.at(-1));objectElements.get(oid).dispatch('pointerdown');assert.equal(objectGesture,null);objectElements.get(oid).dispatch('keydown',{key:'Delete'});assert.equal(JSON.stringify(state.project.space.objects.at(-1)),locked);
 $('duplicate-object').click();assert.notEqual(objectId,oid);assert.equal(state.project.space.objects.at(-1).locked,false);assert.equal(state.project.space.objects.at(-1).name,'Pulpit <front> copy');$('remove-object').click();assert.equal(state.project.space.objects.length,2);
 objectId=oid;syncObjectProperties();$('object-locked').checked=false;$('object-locked').dispatch('change');$('space-snap').checked=true;$('space-snap').dispatch('change');
 const object=objectElements.get(oid);object.dispatch('pointerdown');object.dispatch('pointermove',{clientX:227,clientY:197});object.dispatch('pointerup');const moved=state.project.space.objects.find(o=>o.id===oid);assert.equal(moved.x%5,0);assert.equal(moved.y%5,0);
 objectElements.get(oid).dispatch('keydown',{key:'ArrowRight'});assert.equal(state.project.space.objects.find(o=>o.id===oid).x,moved.x+5);
 $('clear-stage-size').click();assert.equal(state.project.space.widthM,null);assert.equal(state.project.fixtures.find(f=>f.id==='f9').mountHeightM,6.096);
 $('space-done').click();assert.equal(tool,'select');assert.equal($('space-tools').hidden,true);assert.equal($('light-inspector').hidden,false);
 openFixtureEditor('f9');assert.equal($('fixture-mount-height').value,'6.096');$('fixture-mount-height').value='';$('fixture-form').dispatch('submit');assert.equal(state.project.fixtures.find(f=>f.id==='f9').mountHeightM,null);
 const reopened=new LumaPreviewEngine(JSON.parse(JSON.stringify(localPreview.project)));assert.equal(reopened.project.space.objects.find(o=>o.id===oid).color,'#ff9900');assert.equal(reopened.project.space.stageShape,'thrust');
 act({op:'import',project:original},true);objectId=null;setTool('select');
 console.log('PASS: Space panel visibility, optional size controls, exact meters/feet round trips, mounting heights, validation, fit proportions, styles and guides, object naming/color/locking/copy/removal/snapping/keyboard movement, per-light height editor and cleared values.');
}
`,ctx,{timeout:7000});

vm.runInContext(`
{
 const saved=localPreview.copy(localPreview.project);setTool('space');setSpaceTab('objects');$('object-kind').value='screen';$('add-stage-object').click();
 const id=objectId;updateSpaceObject({x:50,y:50,width:20,height:20,rotation:0});
 assert.equal(objectTransform.hidden,false);assert.equal(objectQuickbar.hidden,false);assert.equal($('object-quick-name').textContent,'Screen');
 const se=objectTransform.querySelector('[data-resize-corner="se"]'),before=JSON.stringify(localPreview.project),effects=JSON.stringify(localPreview.project.effects);
 se.dispatch('pointerdown',{clientX:300,clientY:300});se.dispatch('pointermove',{clientX:380,clientY:343,pointerId:2});assert.equal(objectGesture.after,undefined);
 se.dispatch('pointermove',{clientX:380,clientY:343});assert.equal(JSON.stringify(localPreview.project),before);assert.equal(objectElements.get(id).style.width,'30%');
 se.dispatch('pointerup');assert.equal(objectGesture,null);assert.equal(state.project.space.objects.find(o=>o.id===id).width,30);assert.equal(state.project.space.objects.find(o=>o.id===id).height,30);assert.equal(JSON.stringify(localPreview.project.effects),effects);
 $('stage').dispatch('pointerdown');assert.equal(objectTransform.hidden,true);selectSpaceObject(id);document.dispatch('keydown',{key:'Escape',target:$('stage')});assert.equal(objectQuickbar.hidden,true);selectSpaceObject(id);
 const committed=JSON.stringify(localPreview.project);$('object-label').focus();const dragged=objectElements.get(id);dragged.dispatch('pointerdown');assert.equal(document.activeElement,dragged);dragged.dispatch('pointermove',{clientX:250,clientY:220});document.dispatch('keydown',{key:'Escape',target:document.activeElement});assert.equal(objectGesture,null);assert.equal(JSON.stringify(localPreview.project),committed);
 se.dispatch('pointerdown');se.dispatch('pointermove',{clientX:250,clientY:220});document.dispatch('keydown',{key:'Escape',target:se});assert.equal(objectGesture,null);assert.equal(JSON.stringify(localPreview.project),committed);
 se.dispatch('pointerdown');se.dispatch('pointermove',{clientX:250,clientY:220});se.dispatch('pointercancel');assert.equal(JSON.stringify(localPreview.project),committed);
 se.dispatch('pointerdown');se.dispatch('pointermove',{clientX:250,clientY:220});setTool('select');assert.equal(objectGesture,null);assert.equal(objectTransform.hidden,true);assert.equal(objectQuickbar.hidden,true);assert.equal(JSON.stringify(localPreview.project),committed);setTool('space');
 se.dispatch('pointerdown');se.dispatch('pointermove',{clientX:280,clientY:190,shiftKey:true});se.dispatch('pointerup');const resized=state.project.space.objects.find(o=>o.id===id);assert(Math.abs(resized.width/resized.height-1)<1e-8);
 $('object-quick-rotate').click();assert.equal(state.project.space.objects.find(o=>o.id===id).rotation,90);
 se.dispatch('keydown',{key:'ArrowDown'});assert(state.project.space.objects.find(o=>o.id===id).width>resized.width);
 $('object-quick-lock').click();assert.equal($('object-quick-lock').textContent,'Unlock');assert.equal($('object-quick-delete').disabled,true);assert.equal(se.hidden,true);se.dispatch('pointerdown');assert.equal(objectGesture,null);
 const count=state.project.space.objects.length;$('object-quick-delete').click();assert.equal(state.project.space.objects.length,count);
 $('object-quick-duplicate').click();const copy=objectId;assert.notEqual(copy,id);assert.equal(state.project.space.objects.at(-1).locked,false);assert.equal(se.hidden,false);
 $('object-quick-delete').click();assert.equal(state.project.space.objects.length,count);assert.equal(objectTransform.hidden,true);assert.equal(document.activeElement,$('stage'));assert(state.project.space.objects.find(o=>o.id===id).locked);
 selectSpaceObject(id);$('object-quick-lock').click();objectElements.get(id).dispatch('keydown',{key:'Delete'});assert(!state.project.space.objects.some(o=>o.id===id));
 act({op:'import',project:saved},true);objectId=null;setTool('select');
 console.log('PASS: visible corner handles and quick actions, draft-only resize previews, pointer isolation, commit/cancel/Escape/tool switching, Shift proportions, rotation and keyboard sizing, locked object protection, duplicate and delete targeting.');
}
`,ctx,{timeout:7000});

vm.runInContext(`
{
 const project=localPreview.copy(localPreview.project);act({op:'import',project:{...project,effects:{}}},true);switchTab('stage');setTool('select');setSelection(['f9']);renderLiveStage();
 const f=state.project.fixtures.find(f=>f.id==='f9');
 for(const forward of [0,90,180,270]){const fixed={...f,profile:'RGBW',zone:'Front light',forward},g=stageLightGeometry(fixed,state.looks.f9),angle=forward*Math.PI/180,dx=g.target.x-g.origin.x,dy=g.target.y-g.origin.y;assert(Math.abs(dx*Math.cos(angle)-dy*Math.sin(angle))<1e-6);assert(dx*Math.sin(angle)+dy*Math.cos(angle)>0)}
 for(const mounting of ['normal','upside-down'])for(const forward of [0,37,90,180,279,360])for(const x of [0,200,500,1000])for(const y of [0,150,650]){
  const fixture={...f,mounting,forward},look=stageAimLook(fixture,{x,y}),target=stageLightGeometry(fixture,{...state.looks.f9,...look}).target;
  assert(Math.abs(target.x-x)<1e-6);assert(Math.abs(target.y-y)<1e-6);assert(look.pan>=0&&look.pan<=1&&look.tilt>=0&&look.tilt<=1);
 }
 $('selected-mounting').value='upside-down';$('selected-mounting').dispatch('change');$('selected-forward').value='90';$('selected-forward').dispatch('change');assert.equal(state.project.fixtures.find(f=>f.id==='f9').mounting,'upside-down');assert.equal(state.project.fixtures.find(f=>f.id==='f9').forward,90);
 let h=aimHandles.get('f9').forward;h.dispatch('pointerdown');h.dispatch('pointermove',{clientX:500,clientY:100});assert(stageAimGesture.changed);assert.equal(state.project.fixtures.find(f=>f.id==='f9').forward,90);h.dispatch('pointercancel');assert.equal(stageAimGesture,null);assert.equal(state.project.fixtures.find(f=>f.id==='f9').forward,90);
 h.dispatch('keydown',{key:'ArrowRight'});assert.equal(state.project.fixtures.find(f=>f.id==='f9').forward,95);
 $('dock-pattern').value='circle';$('dock-pattern').dispatch('change');assert(state.project.effects.f9.motion);$('dock-color-pattern').value='rainbow';$('dock-color-pattern').dispatch('change');
 h=aimHandles.get('f9').aim;h.dispatch('pointerdown');h.dispatch('pointermove',{clientX:740,clientY:444});assert.equal(gesture,null);h.dispatch('pointerup');assert.equal(stageAimGesture,null);assert.equal(state.project.effects.f9.motion,undefined);assert.equal(state.project.effects.f9.color.pattern,'rainbow');assert.equal($('dock-pattern').value,'none');assert.equal($('dock-play').disabled,true);
 let point=stageLightGeometry(state.project.fixtures.find(f=>f.id==='f9'),state.looks.f9).target;assert(Math.abs(point.x-800)<1e-6);assert(Math.abs(point.y-520)<1e-6);
 h.dispatch('pointerdown');h.dispatch('pointermove',{clientX:200,clientY:150});setTool('space');assert.equal(stageAimGesture,null);renderLiveStage();assert(h.hidden);setTool('select');
 $('dock-pattern').value='sweep';$('dock-pattern').dispatch('change');$('dock-pattern').value='none';$('dock-pattern').dispatch('change');assert.equal(state.project.effects.f9.motion,undefined);assert.equal(state.project.effects.f9.color.pattern,'rainbow');
 contextOpen=true;syncPopover();const header=$('popover-drag');header.dispatch('pointerdown');header.dispatch('pointermove',{clientX:450,clientY:300});header.dispatch('pointerup');assert(popoverPosition);const left=$('fixture-popover').style.left;syncPopover();assert.equal($('fixture-popover').style.left,left);header.dispatch('dblclick');assert.equal(popoverPosition,null);header.dispatch('pointerdown');header.dispatch('pointermove',{clientX:300,clientY:350});header.dispatch('pointercancel');assert.equal(popoverPosition,null);
 act({op:'import',project},true);setSelection([]);contextOpen=false;syncPopover();
 console.log('PASS: full-stage aim inverse at all edges, rotation and flipped mounting; orientation controls, keyboard/drag/cancel targeting, tool changes, static motion selection, preserved color and persistent popup positioning.');
}
`,ctx,{timeout:5000});
vm.runInContext(`
{
 const original=localPreview.copy(localPreview.project),memory=new Map();window.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};
 assert.equal(restoreBrowserProject(),false);act({op:'edit_fixture',id:'f1',patch:{name:'Saved wash',forward:48,mounting:'upside-down'}});act({op:'aim',ids:['f9'],patch:{pan:.21,tilt:.87}});act({op:'save_scene',name:'Keep this scene',fade:1},true);
 const expected=JSON.stringify(localPreview.validate(localPreview.project));$('save-project').click();assert.equal(dirty,false);assert.equal($('project-subtitle').textContent,'Saved in this browser');const record=memory.get(PROJECT_SAVE_KEY);assert.equal(JSON.stringify(JSON.parse(record).project),expected);
 act({op:'edit_fixture',id:'f1',patch:{name:'Unsaved wash'}});assert(dirty);assert.equal(memory.get(PROJECT_SAVE_KEY),record);assert(restoreBrowserProject());assert.equal(JSON.stringify(localPreview.project),expected);
 const stable=JSON.stringify(localPreview.project);memory.set(PROJECT_SAVE_KEY,'broken JSON');assert.equal(restoreBrowserProject(),false);assert.equal(JSON.stringify(localPreview.project),stable);assert.equal(memory.get(PROJECT_SAVE_KEY),'broken JSON');memory.set(PROJECT_SAVE_KEY,record);
 window.localStorage.setItem=()=>{throw Error('QuotaExceededError')};markDirty();assert.equal(saveBrowserProject(),false);assert(dirty);assert.equal(memory.get(PROJECT_SAVE_KEY),record);assert.equal($('project-subtitle').textContent,'Not saved · Try Export');
 window.localStorage.setItem=(k,v)=>memory.set(k,v);document.dispatch('keydown',{key:'s',metaKey:true});assert.equal(dirty,false);
 $('fixture-dialog').showModal();markDirty();assert.equal(saveBrowserProject(),false);assert(dirty);$('fixture-dialog').close();
 act({op:'import',project:original},true);setSelection(['f1']);renderLiveStage();assert(aimHandles.get('f1').forward.querySelector('svg'));
 console.log('PASS: explicit Save, project/scene/aim round trips, unsaved edits remain separate, corrupt-data preservation, storage failure without false success, keyboard shortcut, dialog guard and SVG forward arrow.');
}
`,ctx,{timeout:5000});
vm.runInContext(`
{
 const saved=localPreview.copy(localPreview.project);act({op:'fx_stop',seconds:0});setTool('select');switchTab('stage');
 for(const [appearance,count]of [['pinspot-bar',6],['wash',6],['par',7]]){
  const frame=JSON.stringify(state.frame);act({op:'fixture',ids:['f1'],patch:{appearance}},true);assert.equal(JSON.stringify(state.frame),frame);
  const n=liveLightNodes.get('f1');assert.equal(n.emitters.length,count);assert.equal(n.cone.getAttribute('display'),'none');assert.equal(n.spot.getAttribute('display'),'none');assert.equal(n.source.getAttribute('display'),'none');
  assert.equal(new Set(n.emitters.map(e=>e.group.getAttribute('data-source-x')+','+e.group.getAttribute('data-source-y'))).size,count);
  assert.equal(new Set(n.emitters.map(e=>e.group.getAttribute('data-target-x')+','+e.group.getAttribute('data-target-y'))).size,count);
  const f=state.project.fixtures.find(f=>f.id==='f1'),rect={width:800,height:430},look=state.looks.f1,beams=fixtureEmitterGeometry(f,look,rect),g=stageLightGeometry(f,look);
  for(const b of beams){assert(Math.abs((b.target.x-b.origin.x)-(g.target.x-g.origin.x))<1e-8);assert(Math.abs((b.target.y-b.origin.y)-(g.target.y-g.origin.y))<1e-8);assert(b.radius>b.sourceRadius)}
  if(appearance==='pinspot-bar')assert(beams.every(b=>b.radius<20));else assert(beams.every(b=>b.radius>40));
  act({op:'fixture',ids:['f1'],patch:{r:1,g:0,b:0,level:.7}});assert(liveLightNodes.get('f1').softStops.every(stop=>stop.getAttribute('stop-color')===visual(state.project.fixtures.find(f=>f.id==='f1')).color));
  act({op:'fixture',ids:['f1'],patch:{level:0}});assert.equal(liveLightNodes.get('f1').group.getAttribute('opacity'),'0.0000');act({op:'fixture',ids:['f1'],patch:{level:.7}});
 }
 act({op:'fixture',ids:['f1'],patch:{appearance:'fresnel'}},true);assert.equal(liveLightNodes.get('f1').emitters.length,0);assert.equal(liveLightNodes.get('f1').cone.getAttribute('display'),'');
 act({op:'fixture',ids:['f1'],patch:{appearance:'led-bar'}},true);assert.equal(liveLightNodes.get('f1').emitters.length,0);assert.equal(liveLightNodes.get('f1').cone.getAttribute('display'),'none');
 act({op:'import',project:saved},true);
 console.log('PASS: individual lens origins/parallel targets, pinspot versus wash spread, no duplicate center optics, shared live color/brightness, appearance transitions and unchanged DMX output.');
}
`,ctx,{timeout:5000});
ctx.URL={createObjectURL(){return'blob:test'},revokeObjectURL(){}};
vm.runInContext(`importPhoto({name:'stage.jpg',type:'image/jpeg',size:3}).then(()=>{assert.equal(state.project.space.mode,'photo');assert.equal(tool,'arrange');assert.equal($('space-photo').hidden,false);console.log('PASS: photo decoding/canvas import workflow with a stub image decoder.');})`,ctx);
