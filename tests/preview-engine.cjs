const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(process.argv[2],'utf8'),src=html.match(/<script>([\s\S]*?)<\/script>/)[1];
vm.runInNewContext(src+`
const fresh=()=>{const p=localPreview.copy(localPreview.project);p.effects={};return new LumaPreviewEngine(p)},close=(a,b)=>assert(Math.abs(a-b)<1e-8,a+' != '+b);
const apply=(e,kind,pattern,ids,config={},time=0,spread=0)=>e.act({op:'fx_apply',kind,ids,config:{pattern,period:4,transition:0,...config},spread},time);
const a=fresh(),base=a.project.fixtures[0].level;apply(a,'dimmer','breathe',['f1'],{low:.2,high:1});close(a.snapshot(0).looks.f1.level,base*.2);close(a.snapshot(2).looks.f1.level,base);close(a.snapshot(4).looks.f1.level,base*.2);assert.equal(a.snapshot(2).looks.f2.level,a.project.fixtures[1].level);
a.act({op:'fx_pause',value:true},2);close(a.snapshot(90).looks.f1.level,base);a.act({op:'blackout',value:true,seconds:2},90);assert.equal(a.snapshot(92).frame[0],0);close(a.snapshot(92).looks.f1.level,base);a.act({op:'fx_pause',value:false},100);close(a.snapshot(100).looks.f1.level,base);close(a.snapshot(102).looks.f1.level,base*.2);
const pausedEdit=fresh();apply(pausedEdit,'dimmer','pulse',['f1'],{transition:2},0);pausedEdit.act({op:'fx_pause',value:true},1);const pa=pausedEdit.snapshot(1).looks.f1.level;close(pausedEdit.snapshot(8).looks.f1.level,pa);apply(pausedEdit,'dimmer','breathe',['f1'],{transition:1},10);close(pausedEdit.snapshot(11).looks.f1.level,pa);pausedEdit.act({op:'fx_pause',value:false},12);close(pausedEdit.snapshot(12).looks.f1.level,pa);assert.equal(pausedEdit.fxRuns.get('f1:dimmer').blendStart,12);
const b=fresh();apply(b,'dimmer','pulse',['f1'],{fade:.5,low:0,high:1,transition:1});close(b.snapshot(0).looks.f1.level,base);close(b.snapshot(1).looks.f1.level,base);close(b.snapshot(2.5).looks.f1.level,0);const pre=b.snapshot(2.5).looks.f1.level;b.act({op:'fx_stop',ids:['f1'],kind:'dimmer',seconds:2},2.5);close(b.snapshot(2.5).looks.f1.level,pre);close(b.snapshot(3.5).looks.f1.level,base/2);close(b.snapshot(4.5).looks.f1.level,base);assert.equal(b.snapshot(4.5).fx_releasing,false);
const c=fresh();apply(c,'dimmer','flicker',['f1','f2'],{period:.25,fade:.1});const flickers=Array.from({length:8},(_,i)=>c.snapshot(i*.21).looks.f1.level);assert(new Set(flickers).size>4);assert.notEqual(c.snapshot(2).looks.f1.level,c.snapshot(2).looks.f2.level);assert(flickers.every(v=>v>=base*.2&&v<=base));
const d=fresh();apply(d,'dimmer','breathe',['f1','f2'],{},0,1);close(d.snapshot(0).looks.f1.level,base*.2);close(d.snapshot(0).looks.f2.level,base);assert.equal(d.project.effects.f2.dimmer.offset,.5);
apply(d,'color','palette',['f1'],{period:6,colors:['#ff0000','#00ff00','#0000ff']},0);close(d.snapshot(0).looks.f1.r,1);close(d.snapshot(2).looks.f1.g,1);close(d.snapshot(4).looks.f1.b,1);close(d.snapshot(6).looks.f1.r,1);assert.equal(Object.keys(d.project.effects.f1).length,2);
const m=fresh();apply(m,'motion','circle',['f1','f9'],{width:.6,height:.4},0);assert.equal(m.project.effects.f1,undefined);const center=m.project.fixtures.find(f=>f.id==='f9');close(m.snapshot(0).looks.f9.pan,center.pan);close(m.snapshot(1).looks.f9.pan,center.pan+.3);close(m.snapshot(2).looks.f9.tilt,center.tilt-.2);assert.notEqual(m.snapshot(0).frame[37],m.snapshot(1).frame[37]);
for(const pattern of FX_PATTERNS.motion){apply(m,'motion',pattern,['f9'],{width:1,height:1,period:.1},10);for(let n=0;n<100;n++){const l=m.snapshot(10+n*.013).looks.f9;assert(l.pan>=0&&l.pan<=1&&l.tilt>=0&&l.tilt<=1)}}
const continuous=fresh();apply(continuous,'dimmer','breathe',['f1'],{period:4},0);const value=continuous.snapshot(1).looks.f1.level;apply(continuous,'dimmer','breathe',['f1'],{period:12,transition:0},1);close(continuous.snapshot(1).looks.f1.level,value);
const scenes=fresh();apply(scenes,'dimmer','breathe',['f1'],{},0);apply(scenes,'motion','figure8',['f9'],{},0);scenes.act({op:'save_scene',name:'Motion saved',fade:2},1);const saved=scenes.project.scenes.at(-1);close(saved.looks.f1.level,base);assert.equal(saved.effects.f1.dimmer.pattern,'breathe');assert.equal(saved.effects.f9.motion.pattern,'figure8');
const round=new LumaPreviewEngine(JSON.parse(JSON.stringify(scenes.project)));assert.equal(round.project.effects.f9.motion.pattern,'figure8');assert.equal(round.project.scenes.at(-1).effects.f1.dimmer.period,4);
const before=scenes.snapshot(1).looks;scenes.act({op:'cue',id:saved.id},1);const after=scenes.snapshot(1).looks;for(const id of Object.keys(before))for(const key of Object.keys(before[id]))close(before[id][key],after[id][key]);assert.notEqual(scenes.snapshot(3).looks.f9.pan,scenes.snapshot(4).looks.f9.pan);scenes.act({op:'cue',id:scenes.project.scenes[0].id},5);assert.equal(scenes.snapshot(7).fx_count,0);assert.equal(Object.keys(scenes.project.effects).length,0);
const invalid=fresh(),orig=JSON.stringify(invalid.project);assert.throws(()=>apply(invalid,'motion','circle',['f1']));assert.throws(()=>apply(invalid,'dimmer','pulse',['f1'],{period:0}));assert.throws(()=>apply(invalid,'color','steps',['f1'],{colors:['javascript:x','#fff']}));assert.throws(()=>apply(invalid,'dimmer','breathe',['f1'],{low:.9,high:.1}));assert.equal(JSON.stringify(invalid.project),orig);
const st=fresh();st.act({op:'fixture',ids:['f9'],patch:{strobe:.1}},0);assert(st.snapshot(0).looks.f9.level>0);assert.equal(st.snapshot(.3).looks.f9.level,0);st.act({op:'fx_stop',seconds:1},.3);assert.equal(st.project.fixtures.find(f=>f.id==='f9').strobe,0);assert(st.snapshot(1.3).looks.f9.level>0);
// Fixture metadata, duplication and removal must keep scenes and running fades coherent.
{
 const e=fresh();e.act({op:'cue',id:'luma-living-light-demo'},10);
 const before=e.snapshot(10.5),phase=e.fxRuns.get('f1:color'),fade=e.fade;
 e.act({op:'edit_fixture',id:'f1',patch:{name:'Choir wash',zone:'Choir',appearance:'par'}},10.5);
 assert.equal(e.project.fixtures[0].name,'Choir wash');assert.equal(e.project.fixtures[0].profile,'RGBW');
 assert.equal(e.fxRuns.get('f1:color'),phase);assert.equal(e.fade,fade);assert.deepEqual(e.snapshot(10.5).looks,before.looks);
 const original=JSON.stringify(e.project),runs=JSON.stringify([...e.fxRuns]);
 for(const patch of [{address:5},{address:512},{appearance:'bad-shape'},{name:' '},{profile:'Unknown'},{level:.8}]){
  assert.throws(()=>e.act({op:'edit_fixture',id:'f1',patch},10.5));assert.equal(JSON.stringify(e.project),original);assert.equal(JSON.stringify([...e.fxRuns]),runs);
 }
 assert.throws(()=>e.act({op:'edit_fixture',id:'missing',patch:{name:'Lost'}},10.5));
 e.act({op:'edit_fixture',id:'f9',patch:{profile:'Dimmer'}},10.5);
 assert.equal(e.project.effects.f9,undefined);assert(!e.fxRuns.has('f9:motion'));assert(!e.fxRuns.has('f9:color'));assert.equal(e.fxRuns.get('f1:color'),phase);
 for(const s of e.project.scenes)assert.equal(s.effects.f9,undefined);
 assert.equal(new LumaPreviewEngine(e.copy(e.project)).project.fixtures[8].profile,'Dimmer');
 // The new dimmer leaves a 15-channel hole; the copy must use its first free block.
 const unaffected=e.snapshot(10.5).looks.f1;
 e.act({op:'duplicate_fixture',id:'f1'},10.5);const copy=e.project.fixtures.at(-1);
 assert.equal(copy.address,34);assert.equal(copy.name,'Choir wash copy');assert.equal(copy.zone,'Choir');assert.equal(copy.appearance,'par');
 assert.equal(copy.level,0);assert.equal(copy.strobe,0);assert.notEqual(copy.id,'f1');assert.notEqual(copy.x,e.project.fixtures[0].x);
 assert.equal(e.project.effects[copy.id],undefined);assert.equal(e.snapshot(10.5).looks[copy.id].level,0);
 for(const s of e.project.scenes){assert.equal(s.looks[copy.id].level,0);assert.equal(s.effects[copy.id],undefined)}
 assert.equal(e.fade,fade);assert.deepEqual(e.snapshot(10.5).looks.f1,unaffected);assert.equal(e.fxRuns.get('f1:color'),phase);
 const copied=e.copy(e.project);e.act({op:'remove_fixture',id:'f1'},10.5);
 assert(!e.project.fixtures.some(f=>f.id==='f1'));assert.equal(e.project.effects.f1,undefined);assert(!e.fxRuns.has('f1:color'));
 assert.equal(e.fade.before.f1,undefined);assert.equal(e.fade.after.f1,undefined);assert.equal(e.fade,fade);
 for(const s of e.project.scenes){assert.equal(s.looks.f1,undefined);assert.equal(s.effects.f1,undefined)}
 const restored=new LumaPreviewEngine(e.copy(e.project));for(const s of restored.project.scenes){restored.act({op:'cue',id:s.id},20);assert.equal(restored.snapshot(25).looks[copy.id].level,0)}
 e.act({op:'import',project:copied},30);assert(e.project.fixtures.some(f=>f.id==='f1'));
 e.act({op:'edit_fixture',id:copy.id,patch:{name:'x'.repeat(80)}},30);e.act({op:'duplicate_fixture',id:copy.id},30);const longName=e.project.fixtures.at(-1).name;
 e.act({op:'duplicate_fixture',id:copy.id},30);assert.equal(longName.length,80);assert.equal(e.project.fixtures.at(-1).name.length,80);assert.notEqual(e.project.fixtures.at(-1).name,longName);
 const full=fresh(),p=full.copy(full.project);p.fixtures=Array.from({length:32},(_,i)=>({...p.fixtures[8],id:'full-'+i,address:i*16+1}));p.scenes=[];p.effects={};full.act({op:'import',project:p},0);
 const packed=JSON.stringify(full.project);assert.throws(()=>full.act({op:'duplicate_fixture',id:'full-0'},0),/No free channel block/);assert.equal(JSON.stringify(full.project),packed);
 p.fixtures=Array.from({length:128},(_,i)=>({...p.fixtures[0],id:'limit-'+i,profile:'Dimmer',address:i+1}));full.act({op:'import',project:p},0);assert.throws(()=>full.act({op:'duplicate_fixture',id:'limit-0'},0),/128 lights/);
 p.fixtures=p.fixtures.slice(0,1);full.act({op:'import',project:p},0);assert.throws(()=>full.act({op:'remove_fixture',id:'limit-0'},0),/at least one/);assert.equal(full.project.fixtures.length,1);
 assert.throws(()=>full.act({op:'duplicate_fixture',id:'missing'},0));assert.throws(()=>full.act({op:'remove_fixture',id:'missing'},0));
 console.log('PASS: light edits preserve live effects; invalid edits are atomic; profile changes clean unsupported scene effects; duplicate starts off, fills patch holes and respects limits; removal preserves other lights and fades; edited projects round-trip.');
}
// Measurements are optional, validated independently of lighting channels, and persist with the space.
{
 const e=fresh(),legacy=e.copy(e.project);delete legacy.space.unit;delete legacy.space.widthM;delete legacy.space.depthM;delete legacy.space.elevationM;legacy.fixtures.forEach(f=>delete f.mountHeightM);
 const migrated=new LumaPreviewEngine(legacy);assert.equal(migrated.project.space.widthM,null);assert.equal(migrated.project.space.unit,'m');assert(migrated.project.fixtures.every(f=>f.mountHeightM===null));
 e.act({op:'cue',id:'luma-living-light-demo'},10);const fade=e.fade,run=e.fxRuns.get('f9:motion'),frame=e.snapshot(10.5).frame;
 e.act({op:'space',space:{...e.project.space,widthM:12,depthM:7,elevationM:.8,unit:'ft',stageShape:'thrust',floor:'wood',ambience:'warm',grid:false,snap:true,labels:false,measurements:true,accent:'#abcdef'}},10.5);
 e.act({op:'edit_fixture',id:'f9',patch:{mountHeightM:4.572}},10.5);
 assert.equal(e.fade,fade);assert.equal(e.fxRuns.get('f9:motion'),run);assert.deepEqual(e.snapshot(10.5).frame,frame);
 assert.equal(e.project.fixtures.find(f=>f.id==='f9').mountHeightM,4.572);
 for(const patch of [{widthM:0},{widthM:-1},{depthM:Infinity},{elevationM:-1},{widthM:501},{unit:'yards'},{floor:'bad'},{stageShape:'bad'},{ambience:'bad'},{snap:'yes'},{grid:1},{accent:'red'}]){
  const before=JSON.stringify(e.project);assert.throws(()=>e.act({op:'space',space:{...e.project.space,...patch}},10.5));assert.equal(JSON.stringify(e.project),before);
 }
 for(const mountHeightM of [-1,NaN,Infinity,101,'12']){const before=JSON.stringify(e.project);assert.throws(()=>e.act({op:'edit_fixture',id:'f9',patch:{mountHeightM}},10.5));assert.equal(JSON.stringify(e.project),before)}
 e.act({op:'duplicate_fixture',id:'f9'},10.5);const duplicate=e.project.fixtures.at(-1);assert.equal(duplicate.mountHeightM,4.572);assert.equal(duplicate.level,0);
 e.act({op:'edit_fixture',id:'f9',patch:{mountHeightM:0}},10.5);assert.equal(e.project.fixtures.find(f=>f.id==='f9').mountHeightM,0);
 e.act({op:'edit_fixture',id:'f9',patch:{mountHeightM:null}},10.5);assert.equal(e.project.fixtures.find(f=>f.id==='f9').mountHeightM,null);
 const objects=['lectern','keyboard','stairs','cross','table','rug'].map((kind,i)=>({id:'decor-'+i,kind,name:kind,x:40,y:50,width:15,height:20,rotation:12,color:'#9faacc',locked:i===0}));
 e.act({op:'space',space:{...e.project.space,objects:[...e.project.space.objects,...objects]}},10.5);
 const round=new LumaPreviewEngine(JSON.parse(JSON.stringify(e.project)));assert.deepEqual(round.project.space,e.project.space);assert.equal(round.project.fixtures.at(-1).mountHeightM,4.572);assert.equal(round.project.space.objects[1].locked,true);
 for(const patch of [{color:'javascript:bad'},{locked:'true'},{rotation:181},{name:' '},{kind:'unknown'}]){const before=JSON.stringify(e.project);assert.throws(()=>e.act({op:'space',space:{...e.project.space,objects:[{...objects[0],...patch}]}},10.5));assert.equal(JSON.stringify(e.project),before)}
 e.act({op:'space',space:{...e.project.space,widthM:null,depthM:null,elevationM:null}},10.5);assert.equal(e.project.space.widthM,null);assert.equal(e.project.space.objects.length,7);
 console.log('PASS: optional physical measurements and legacy defaults, zero versus unset height, metadata preserves output/effects/fades, bounds and style validation are atomic, extended objects and measured duplicate survive export/import.');
}
// Every corner anchors its opposite corner, including rotated objects and canvas bounds.
{
 const rect={width:800,height:430},base={id:'resize',kind:'screen',name:'Screen',x:50,y:50,width:20,height:20,rotation:0,color:'#91a5c3',locked:false};
 const anchor=(o,corner)=>{const sx=corner.endsWith('e')?1:-1,sy=corner.startsWith('s')?1:-1,c=Math.cos(o.rotation*Math.PI/180),s=Math.sin(o.rotation*Math.PI/180),x=-sx*o.width*rect.width/200,y=-sy*o.height*rect.height/200;return[o.x*rect.width/100+x*c-y*s,o.y*rect.height/100+x*s+y*c]};
 for(const rotation of [0,30,90,-135,180])for(const corner of ['nw','ne','sw','se']){
  const o={...base,rotation},sx=corner.endsWith('e')?1:-1,sy=corner.startsWith('s')?1:-1,c=Math.cos(rotation*Math.PI/180),s=Math.sin(rotation*Math.PI/180),dx=sx*70*c-sy*40*s,dy=sx*70*s+sy*40*c;
  for(const options of [{},{keepRatio:true},{snap:true},{keepRatio:true,snap:true}]){
   const next=resizeSpaceObject(o,corner,dx,dy,rect,options),a=anchor(o,corner),b=anchor(next,corner);close(a[0],b[0]);close(a[1],b[1]);assert(next.width>o.width&&next.height>o.height);
   if(options.keepRatio)close(next.width/next.height,o.width/o.height);
   assert.equal(next.rotation,rotation);assert.equal(next.name,o.name);
  }
 }
 for(const corner of ['nw','ne','sw','se'])for(const x of [0,50,100])for(const y of [0,50,100])for(const d of [-10000,10000]){
  const o={...base,x,y,rotation:35},next=resizeSpaceObject(o,corner,d,-d,rect);assert(next.width>=2&&next.width<=95&&next.height>=2&&next.height<=95&&next.x>=0&&next.x<=100&&next.y>=0&&next.y<=100);const a=anchor(o,corner),b=anchor(next,corner);close(a[0],b[0]);close(a[1],b[1]);
 }
 const snapped=resizeSpaceObject(base,'se',70,40,rect,{snap:true});close(snapped.width,30);close(snapped.height,30);
 const e=fresh(),before=e.snapshot(10).frame;e.act({op:'space',space:{...e.project.space,objects:[resizeSpaceObject(base,'se',80,43,rect)]}},10);assert.deepEqual(e.snapshot(10).frame,before);assert.equal(new LumaPreviewEngine(e.copy(e.project)).project.space.objects[0].width,30);
 assert.throws(()=>resizeSpaceObject(base,'bad',1,1,rect));assert.throws(()=>resizeSpaceObject(base,'se',NaN,1,rect));assert.throws(()=>resizeSpaceObject(base,'se',1,1,{width:0,height:430}));
 console.log('PASS: all four resize corners at multiple rotations, fixed opposite anchors, proportional resizing, snapping, crossing and size/center limits, invalid geometry, saved sizes and unchanged light output.');
}
// Physical metadata and manual aim are independent from color, dimmer and scene timing.
{
 const e=fresh(),legacy=e.copy(e.project);for(const f of legacy.fixtures){delete f.forward;delete f.mounting}
 const migrated=new LumaPreviewEngine(legacy);assert.equal(migrated.project.fixtures[0].mounting,'normal');assert.equal(migrated.project.fixtures[0].forward,0);assert.equal(migrated.project.fixtures.find(f=>f.id==='f7').forward,180);
 e.act({op:'edit_fixture',id:'f9',patch:{mounting:'upside-down',forward:137}},0);
 const exported=new LumaPreviewEngine(e.copy(e.project));assert.equal(exported.project.fixtures.find(f=>f.id==='f9').forward,137);assert.equal(exported.project.fixtures.find(f=>f.id==='f9').mounting,'upside-down');
 e.act({op:'duplicate_fixture',id:'f9'},0);assert.equal(e.project.fixtures.at(-1).forward,137);assert.equal(e.project.fixtures.at(-1).mounting,'upside-down');
 for(const patch of [{forward:NaN},{forward:-1},{forward:361},{mounting:'sideways'}]){const before=JSON.stringify(e.project);assert.throws(()=>e.act({op:'edit_fixture',id:'f9',patch},0));assert.equal(JSON.stringify(e.project),before)}
 apply(e,'motion','circle',['f9'],{width:.6,height:.4},0);apply(e,'color','rainbow',['f9'],{},0);apply(e,'dimmer','breathe',['f1','f9'],{},0);
 const before=e.snapshot(1),colorRun=e.fxRuns.get('f9:color'),dimmerRun=e.fxRuns.get('f9:dimmer');e.act({op:'aim',ids:['f9']},1);const held=e.snapshot(2);
 close(held.looks.f9.pan,before.looks.f9.pan);close(held.looks.f9.tilt,before.looks.f9.tilt);assert.equal(e.project.effects.f9.motion,undefined);assert.equal(e.fxRuns.has('f9:motion'),false);assert.equal(e.fxRuns.get('f9:color'),colorRun);assert.equal(e.fxRuns.get('f9:dimmer'),dimmerRun);assert.notEqual(held.looks.f9.r,before.looks.f9.r);
 apply(e,'motion','circle',['f9'],{},3);const pan=e.snapshot(4).looks.f9.pan;e.act({op:'aim',ids:['f9'],patch:{tilt:.8}},4);close(e.snapshot(5).looks.f9.pan,pan);close(e.snapshot(5).looks.f9.tilt,.8);
 const original=JSON.stringify(e.project);for(const body of [{ids:['f1']},{ids:['f9','unknown']},{ids:['f9'],patch:{pan:2}},{ids:['f9'],patch:{level:.5}}])assert.throws(()=>e.act({op:'aim',...body},5));assert.equal(JSON.stringify(e.project),original);
 e.act({op:'cue',id:'luma-living-light-demo'},10);const fading=e.fade,other=e.snapshot(10.5).looks.f1;e.act({op:'aim',ids:['f9'],patch:{pan:.12,tilt:.89}},10.5);assert.equal(e.fade,fading);assert.deepEqual(e.snapshot(10.5).looks.f1,other);close(e.snapshot(11).looks.f9.pan,.12);close(e.snapshot(20).looks.f9.tilt,.89);
 e.act({op:'save_scene',name:'Held target',fade:0},20);e.act({op:'aim',ids:['f9'],patch:{pan:.6,tilt:.4}},21);e.act({op:'cue',id:e.project.scenes.at(-1).id},22);close(e.snapshot(22).looks.f9.pan,.12);close(e.snapshot(22).looks.f9.tilt,.89);assert.equal(e.project.effects.f9.motion,undefined);
 console.log('PASS: orientation defaults/validation/export/duplicate; manual aim holds evaluated movement, preserves color/dimmer and other scene fades, validates atomically and saves static scene targets.');
}
{
 const e=fresh(),legacy=e.copy(e.project);legacy.fixtures.forEach(f=>{for(const k of ['aimEnabled','beamTarget','pinspotTargets','pinspotAimMode','pinspotLens','pinspotAngle'])delete f[k]});const imported=new LumaPreviewEngine(legacy);assert.equal(imported.project.fixtures[0].aimEnabled,false);assert.equal(imported.project.fixtures.find(f=>f.id==='f9').aimEnabled,true);
 const frame=e.snapshot(0).frame,scenes=JSON.stringify(e.project.scenes),targets=Array(6).fill(null);targets[2]={x:.23,y:.84};
 e.act({op:'edit_fixture',id:'f1',patch:{appearance:'pinspot-bar',aimEnabled:true,beamTarget:{x:0,y:1},pinspotTargets:targets,pinspotAimMode:'together',pinspotLens:'custom',pinspotAngle:17.5}},0);
 assert.deepEqual(e.snapshot(0).frame,frame);assert.equal(JSON.stringify(e.project.scenes),scenes);const copy=new LumaPreviewEngine(e.copy(e.project)).project.fixtures[0];assert.equal(copy.pinspotTargets[2].x,.23);assert.equal(copy.pinspotAngle,17.5);assert.equal(copy.pinspotAimMode,'together');assert.equal(imported.project.fixtures[0].pinspotAimMode,'individual');assert.equal(copy.aimEnabled,true);assert.deepEqual(copy.beamTarget,{x:0,y:1});
 e.act({op:'duplicate_fixture',id:'f1'},0);assert.deepEqual(e.project.fixtures.at(-1).pinspotTargets,targets);assert.notEqual(e.project.fixtures.at(-1).pinspotTargets,e.project.fixtures[0].pinspotTargets);
 e.act({op:'edit_fixture',id:'f1',patch:{aimEnabled:false}},0);assert(e.project.fixtures[0].pinspotTargets.every(p=>p===null));assert.equal(e.project.fixtures[0].beamTarget,null);assert.equal(e.project.fixtures[0].pinspotAimMode,'together');assert.equal(e.project.fixtures[0].pinspotAngle,17.5);assert.deepEqual(e.snapshot(0).frame.slice(0,4),frame.slice(0,4));
 for(const patch of [{pinspotAimMode:'bad'},{aimEnabled:1},{beamTarget:{x:-.1,y:.2}},{beamTarget:{x:0,y:NaN}},{pinspotTargets:[]},{pinspotTargets:Array(6).fill({x:1,y:2})},{pinspotLens:'unknown'},{pinspotAngle:0},{pinspotAngle:91}]){const before=JSON.stringify(e.project);assert.throws(()=>e.act({op:'edit_fixture',id:'f1',patch},0));assert.equal(JSON.stringify(e.project),before)}
 apply(e,'motion','circle',['f9'],{},1);apply(e,'color','rainbow',['f9'],{},1);const color=e.fxRuns.get('f9:color'),sceneCopy=JSON.stringify(e.project.scenes);e.act({op:'aim',ids:['f9'],patch:{pan:.1,tilt:.8}},2);apply(e,'motion','circle',['f9'],{},2);
 const prior=JSON.stringify(e.project);assert.throws(()=>e.act({op:'edit_fixture',id:'f9',patch:{aimEnabled:false,pinspotAimMode:'bad'}},3));assert.equal(JSON.stringify(e.project),prior);assert(e.fxRuns.has('f9:motion'));
 e.act({op:'edit_fixture',id:'f9',patch:{aimEnabled:false}},3);const home=e.snapshot(4);close(home.looks.f9.pan,LumaPreviewEngine.defaults.pan);close(home.looks.f9.tilt,LumaPreviewEngine.defaults.tilt);assert.equal(e.project.effects.f9.motion,undefined);assert(!e.fxRuns.has('f9:motion'));assert.equal(e.fxRuns.get('f9:color'),color);assert.equal(JSON.stringify(e.project.scenes),sceneCopy);
 console.log('PASS: static aim/lens metadata migration, bounds and atomic validation, no channel/scene changes, off resets targets, duplicate/export/import persistence.');
}
// Library recipes adapt to configured profiles and never touch unselected lights.
{
 for(const preset of LUMA_PRESETS){
  const e=fresh();e.act({op:'edit_fixture',id:'f1',patch:{profile:'Dimmer'}},0);apply(e,'color','rainbow',['f3'],{},0);const other=JSON.stringify(e.project.fixtures.find(f=>f.id==='f3')),run=e.fxRuns.get('f3:color'),scenes=JSON.stringify(e.project.scenes);
  e.act({op:'preset_apply',preset:preset.id,ids:['f1','f2','f9'],options:{transition:0}},1);
  assert.equal(JSON.stringify(e.project.fixtures.find(f=>f.id==='f3')),other);assert.equal(e.fxRuns.get('f3:color'),run);assert.equal(JSON.stringify(e.project.scenes),scenes);
  assert.equal(e.project.effects.f1?.color,undefined);assert.equal(e.project.effects.f1?.motion,undefined);assert.equal(e.project.effects.f2?.motion,undefined);
  const restored=new LumaPreviewEngine(e.copy(e.project));assert.deepEqual(restored.project.effects,e.project.effects);for(let t=1;t<6;t+=.37)assert(e.snapshot(t).frame.every(n=>Number.isInteger(n)&&n>=0&&n<=255));
 }
 const e=fresh();apply(e,'color','rainbow',['f9'],{},0);apply(e,'dimmer','breathe',['f9'],{},0);const colorRun=e.fxRuns.get('f9:color');e.act({op:'preset_apply',preset:'slow-sweep',ids:['f1','f9'],options:{transition:0}},1);assert.equal(e.fxRuns.get('f9:color'),colorRun);assert.equal(e.project.effects.f9.dimmer.pattern,'breathe');assert.equal(e.project.effects.f1,undefined);
 const f9=e.project.fixtures.find(f=>f.id==='f9');const held=e.snapshot(3).looks.f9.pan;e.act({op:'preset_apply',preset:'slow-sweep',ids:['f9'],options:{speed:2,transition:0},restart:false},3);close(e.snapshot(3).looks.f9.pan,held);assert.equal(e.project.effects.f9.motion.period,9);
 for(const body of [{preset:'missing',ids:['f9']},{preset:'orbit',ids:['f1']},{preset:'ocean',ids:['missing']},{preset:'ocean',ids:[]},...[-1,0,Infinity,5].map(speed=>({preset:'ocean',ids:['f9'],options:{speed}})),{preset:'welcome',ids:['f9'],options:{colors:['bad']}},{preset:'welcome',ids:['f9'],options:{brightness:2}},{preset:'welcome',ids:['f9'],options:{direction:'bad'}}]){const before=JSON.stringify(e.project),runs=JSON.stringify([...e.fxRuns]);assert.throws(()=>e.act({op:'preset_apply',...body},3));assert.equal(JSON.stringify(e.project),before);assert.equal(JSON.stringify([...e.fxRuns]),runs)}
 const initial=e.snapshot(4).looks.f9;e.act({op:'preset_apply',preset:'welcome',ids:['f9'],options:{transition:2}},4);assert.equal(e.project.effects.f9,undefined);close(e.snapshot(4).looks.f9.level,initial.level);close(e.snapshot(6).looks.f9.level,.75);close(e.snapshot(6).looks.f9.r,1);
 e.act({op:'cue',id:'luma-living-light-demo'},10);const fade=e.fade,before=e.snapshot(10.4).looks.f3;e.act({op:'preset_apply',preset:'pastels',ids:['f1'],options:{transition:0}},10.4);assert.equal(e.fade,fade);assert.deepEqual(e.snapshot(10.4).looks.f3,before);
 e.act({op:'save_scene',name:'Preset scene',fade:2},15);const scene=e.project.scenes.at(-1),id=scene.id;e.act({op:'preset_apply',preset:'celebration',ids:['f1','f9'],options:{colors:['#ff0000','#00ff00','#0000ff'],spread:.8,speed:1.5}},16);e.act({op:'update_scene',id,name:'Custom celebration',fade:1},18);assert.equal(e.project.scenes.at(-1).id,id);assert.equal(e.project.scenes.at(-1).effects.f9.motion.period,8/1.5);const count=e.project.scenes.length,unchanged=JSON.stringify(e.project.scenes);assert.throws(()=>e.act({op:'update_scene',id,name:'',fade:1},19));assert.equal(JSON.stringify(e.project.scenes),unchanged);assert.equal(e.project.scenes.length,count);e.act({op:'fx_stop',seconds:0},19);e.act({op:'cue',id},20);assert.equal(e.project.effects.f9.motion.pattern,'sweep');assert.deepEqual(e.project.effects.f1.color.colors,['#ff0000','#00ff00','#0000ff']);
 console.log('PASS: all 17 library recipes, mixed capabilities, isolated selection and layers, atomic invalid input, continuous speed edits, steady-look fade, preserved other scene fades and new/update scene round trips.');
}
// Live edits take control of their own channels without interrupting the rest of a cue.
{
 const demo='luma-living-light-demo',start=()=>{const e=fresh();e.act({op:'cue',id:demo},10);return e};
 const e=start(),reference=start(),savedScenes=JSON.stringify(e.project.scenes),fade=e.fade;
 const before=e.snapshot(10.4),runs=new Map(e.fxRuns);
 e.act({op:'aim',ids:['f9']},10.4);
 assert.equal(e.liveScene,demo);assert.equal(e.snapshot(10.4).scene_edited,true);assert.equal(e.fxPaused,false);assert.equal(e.fade,fade);
 assert.equal(e.project.effects.f9.motion,undefined);assert(!e.fxRuns.has('f9:motion'));
 e.act({op:'fixture',ids:['f1'],patch:{level:.4}},10.4);
 assert.equal(e.project.effects.f1.dimmer,undefined);assert(!e.fxRuns.has('f1:dimmer'));assert.equal(e.fxRuns.get('f1:color'),runs.get('f1:color'));
 for(const t of [10.4,10.8,11.6,13,20]){
  const live=e.snapshot(t),original=reference.snapshot(t);
  close(live.looks.f9.pan,before.looks.f9.pan);close(live.looks.f9.tilt,before.looks.f9.tilt);close(live.looks.f1.level,.4);
  for(const id of ['f2','f3','f10'])assert.deepEqual(live.looks[id],original.looks[id]);
  for(const k of ['r','g','b','w']){close(live.looks.f1[k],original.looks.f1[k]);close(live.looks.f9[k],original.looks.f9[k])}
 }
 assert.equal(JSON.stringify(e.project.scenes),savedScenes);
 e.act({op:'fx_pause',value:true},20);e.act({op:'fixture',ids:['f1'],patch:{level:.23}},21);close(e.snapshot(22).looks.f1.level,.23);assert.equal(e.fxPaused,true);
 e.act({op:'fx_pause',value:false},23);close(e.snapshot(24).looks.f9.pan,before.looks.f9.pan);close(e.snapshot(24).looks.f1.level,.23);
 e.act({op:'update_scene',id:demo,name:'Edited demo',fade:0},24);assert.equal(e.snapshot(24).scene_edited,false);assert.equal(e.project.scenes.find(s=>s.id===demo).effects.f9.motion,undefined);
 e.act({op:'fixture',ids:['f1'],patch:{level:.8}},25);e.act({op:'cue',id:demo},26);close(e.snapshot(27).looks.f1.level,.23);close(e.snapshot(27).looks.f9.pan,before.looks.f9.pan);
 const reopened=new LumaPreviewEngine(e.copy(e.project));close(reopened.snapshot(0).looks.f1.level,.23);assert.equal(reopened.liveScene,null);assert.equal(reopened.project.effects.f9.motion,undefined);
 e.act({op:'import',project:e.copy(e.project)},27);assert.equal(e.snapshot(27).live_scene,null);assert.equal(e.snapshot(27).scene_edited,false);
 // Color/beam edits during a fade are immediate and only cancel the matching layer.
 const color=start(),control=start(),current=color.snapshot(10.3).looks.f9;
 color.act({op:'fixture',ids:['f9'],patch:{w:.6,zoom:.12,gobo:1}},10.3);
 assert.equal(color.project.effects.f9.color,undefined);assert(color.project.effects.f9.motion);
 for(const t of [10.3,10.7,12.5]){const l=color.snapshot(t).looks.f9,ref=control.snapshot(t).looks.f9;close(l.w,.6);close(l.zoom,.12);close(l.gobo,1);for(const k of ['r','g','b'])close(l[k],current[k]);for(const k of ['pan','tilt','level'])close(l[k],ref[k])}
 // Taking manual control also cancels an in-progress release, including generic pan/tilt edits.
 color.act({op:'fx_stop',ids:['f9'],kind:'motion',seconds:3},13);const held=color.snapshot(14).looks.f9.tilt;
 color.act({op:'fixture',ids:['f9'],patch:{pan:.19}},14);assert(!color.fxRuns.has('f9:motion'));close(color.snapshot(20).looks.f9.pan,.19);close(color.snapshot(20).looks.f9.tilt,held);
 // Effect changes, removals and library recipes preserve other lights' fades and timing.
 for(const change of [
  {op:'fx_apply',ids:['f1'],kind:'dimmer',config:{pattern:'pulse',period:4,transition:0,low:.1,high:.8}},
  {op:'fx_stop',ids:['f1'],seconds:1},
  {op:'preset_apply',ids:['f1'],preset:'pastels',options:{transition:0}}
 ]){const live=start(),ref=start(),fading=live.fade;live.act(change,10.3);assert.equal(live.fade,fading);for(const t of [10.3,10.7,11.8,15])assert.deepEqual(live.snapshot(t).looks.f2,ref.snapshot(t).looks.f2)}
 const bad=start();bad.snapshot(10.3);const original=JSON.stringify(bad.project),runtime=JSON.stringify({fade:bad.fade,runs:[...bad.fxRuns]});
 for(const body of [{op:'fixture',ids:['f1'],patch:{level:.4,r:2}},{op:'fixture',ids:['f1','missing'],patch:{level:.4}},{op:'fx_apply',ids:['f1'],kind:'color',config:{pattern:'missing'}}]){assert.throws(()=>bad.act(body,20));assert.equal(JSON.stringify(bad.project),original);assert.equal(JSON.stringify({fade:bad.fade,runs:[...bad.fxRuns]}),runtime)}
 console.log('PASS: live Static holds only selected aim; manual brightness/color/beam overrides, independent cue fades and layers, pause/resume, release cancellation, scene identity, save/recall and atomic invalid live edits.');
}
console.log('PASS: continuous brightness/color/motion, cycle bounds and timing, fade-in/out, deterministic flicker, group offsets, movement filtering and DMX values, pause/resume with blackout, tempo continuity, animated scene recall and export, invalid-data atomicity, live strobe and stop-all.');
`,{console,assert,performance,Set,Map,Math},{timeout:6000});
