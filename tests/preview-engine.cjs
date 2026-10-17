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
console.log('PASS: continuous brightness/color/motion, cycle bounds and timing, fade-in/out, deterministic flicker, group offsets, movement filtering and DMX values, pause/resume with blackout, tempo continuity, animated scene recall and export, invalid-data atomicity, live strobe and stop-all.');
`,{console,assert,performance,Set,Map,Math},{timeout:6000});
