/* BACKGROUND */
(function(){
  const c=document.getElementById('bg-canvas'),x=c.getContext('2d')
  let W,H
  const COLS=['#f72585','#4361ee','#4cc9f0','#7ed957','#f9c74f','#f3722c','#7b2ff7','#55efc4','#ff9f43']
  const hex2rgba=(h,a)=>{const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`rgba(${r},${g},${b},${a})`}
  function resize(){W=c.width=innerWidth;H=c.height=innerHeight}
  addEventListener('resize',resize);resize()
  const blobs=Array.from({length:24},(_,i)=>({
    x:Math.random()*innerWidth,y:Math.random()*innerHeight,
    r:40+Math.random()*100,dx:(Math.random()-.5)*.35,dy:(Math.random()-.5)*.35,
    col:COLS[i%COLS.length],a:.05+Math.random()*.1,
    ph:Math.random()*Math.PI*2,ps:.008+Math.random()*.012
  }))
  function frame(){
    x.clearRect(0,0,W,H);x.fillStyle='#fff';x.fillRect(0,0,W,H)
    blobs.forEach(b=>{
      b.ph+=b.ps;b.x+=b.dx;b.y+=b.dy
      if(b.x<-120)b.x=W+80;if(b.x>W+120)b.x=-80
      if(b.y<-120)b.y=H+80;if(b.y>H+120)b.y=-80
      const r=b.r+Math.sin(b.ph)*12
      const g=x.createRadialGradient(b.x,b.y,0,b.x,b.y,r)
      g.addColorStop(0,hex2rgba(b.col,b.a+0.05));g.addColorStop(1,hex2rgba(b.col,0))
      x.beginPath();x.arc(b.x,b.y,r,0,Math.PI*2);x.fillStyle=g;x.fill()
    })
    requestAnimationFrame(frame)
  }
  frame()
})()

/* BALOK ENGINE */
const cv=document.getElementById('cv'),ctx=cv.getContext('2d')
const CW=cv.width,CH=cv.height

let P=4,L=3,T=2,filled=0,timer=null
let rotX=-0.5,rotY=0.6,dragging=false,lastX=0,lastY=0,velX=0,velY=0,rotMode=false
const hintEl=document.getElementById('rot-hint')

const COLORS=[
  ['#ff6b6b','#ff3333','#cc0000'],['#ff9f43','#ff7f00','#cc5500'],
  ['#ffd93d','#ffbb00','#cc8800'],['#6bcb77','#33aa44','#1a7730'],
  ['#4dd5ff','#00bbee','#0088bb'],['#a78bfa','#7c3aed','#5b21b6'],
  ['#f472b6','#ec4899','#be185d'],['#34d399','#10b981','#047857'],
  ['#fb923c','#f97316','#c2410c'],['#38bdf8','#0ea5e9','#0369a1'],
  ['#f9a8d4','#f472b6','#db2777'],['#86efac','#4ade80','#16a34a'],
  ['#fde68a','#fbbf24','#d97706'],['#c4b5fd','#a78bfa','#7c3aed'],
  ['#67e8f9','#22d3ee','#0891b2'],['#fca5a5','#f87171','#dc2626'],
]

function getCubeColor(col,row,layer){
  const idx=(layer*P*L+row*P+col)%COLORS.length
  return COLORS[idx]
}

// Konversi indeks -> posisi grid (col=x/panjang, row=y/lebar, layer=z/tinggi)
function indexToPos(i){
  const layer=Math.floor(i/(P*L))
  const rem=i%(P*L)
  const row=Math.floor(rem/P)
  const col=rem%P
  return {col,row,layer}
}

// Isometrik
function calcCS(){
  const padX=40,padY=50
  const availW=CW-padX*2,availH=CH-padY*2
  const ex=0.82,ey=0.42,h=0.9
  const csW=availW/((P+L)*ex)
  const csH=availH/((P+L)*ey+T*h)
  return Math.max(6,Math.min(csW,csH,55))
}

function gridToPx(gx,gy,gz,cs,ox,oy){
  const ex=cs*0.82,ey=cs*0.42,h=cs*0.9
  return {x:ox+(gx-gy)*ex, y:oy-gz*h+(gx+gy)*ey}
}

function getOrigin(cs){
  const ey=cs*0.42,h=cs*0.9
  const totalH=T*h+(P+L)*ey
  const ox=CW/2
  const oy=totalH+10
  return {ox,oy}
}

function drawFace(pts,color,stroke){
  ctx.beginPath()
  ctx.moveTo(pts[0].x,pts[0].y)
  for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y)
  ctx.closePath()
  ctx.fillStyle=color;ctx.fill()
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=0.6;ctx.stroke()}
}

function drawSmallCubeIso(col,row,layer,cs,ox,oy,alpha){
  const[top,right,left]=getCubeColor(col,row,layer)
  const dark=getCubeColor(col,row,layer)[2]
  ctx.globalAlpha=alpha
  const a=gridToPx(col,  row,  layer,  cs,ox,oy)
  const b=gridToPx(col+1,row,  layer,  cs,ox,oy)
  const c=gridToPx(col+1,row+1,layer,  cs,ox,oy)
  const d=gridToPx(col,  row+1,layer,  cs,ox,oy)
  const e=gridToPx(col,  row,  layer+1,cs,ox,oy)
  const f=gridToPx(col+1,row,  layer+1,cs,ox,oy)
  const g=gridToPx(col+1,row+1,layer+1,cs,ox,oy)
  const h=gridToPx(col,  row+1,layer+1,cs,ox,oy)
  const s='rgba(0,0,0,0.18)'
  drawFace([a,b,c,d],dark,s)
  drawFace([b,c,g,f],dark,s)
  drawFace([d,c,g,h],dark,s)
  drawFace([a,d,h,e],left,s)
  drawFace([a,b,f,e],right,s)
  drawFace([e,f,g,h],top,s)
  ctx.globalAlpha=1
}

function drawGhost(cs,ox,oy){
  const A=gridToPx(0,0,0,cs,ox,oy),B=gridToPx(P,0,0,cs,ox,oy)
  const C=gridToPx(P,L,0,cs,ox,oy),D=gridToPx(0,L,0,cs,ox,oy)
  const E=gridToPx(0,0,T,cs,ox,oy),F=gridToPx(P,0,T,cs,ox,oy)
  const G=gridToPx(P,L,T,cs,ox,oy),H=gridToPx(0,L,T,cs,ox,oy)
  ctx.globalAlpha=.28
  ctx.beginPath();ctx.moveTo(E.x,E.y);ctx.lineTo(F.x,F.y);ctx.lineTo(G.x,G.y);ctx.lineTo(H.x,H.y);ctx.closePath();ctx.fillStyle='#ffe566';ctx.fill()
  ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.lineTo(F.x,F.y);ctx.lineTo(E.x,E.y);ctx.closePath();ctx.fillStyle='#4cc9f0';ctx.fill()
  ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(D.x,D.y);ctx.lineTo(H.x,H.y);ctx.lineTo(E.x,E.y);ctx.closePath();ctx.fillStyle='#f72585';ctx.fill()
  ctx.globalAlpha=1
  const EC=['#ffe566','#f72585','#4cc9f0','#7ed957','#c77dff','#ff9f43']
  const edges=[[E,F],[F,G],[G,H],[H,E],[A,B],[B,C],[C,D],[D,A],[A,E],[B,F],[C,G],[D,H]]
  ctx.lineWidth=1.8;ctx.setLineDash([5,4])
  edges.forEach(([a,b],i)=>{ctx.strokeStyle=EC[i%EC.length];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()})
  ctx.setLineDash([])
}

// 3D rotation mode
function rotate3D(x,y,z,rx,ry){
  const cosY=Math.cos(ry),sinY=Math.sin(ry)
  const x1=x*cosY+z*sinY,z1=-x*sinY+z*cosY
  const cosX=Math.cos(rx),sinX=Math.sin(rx)
  const y2=y*cosX-z1*sinX,z2=y*sinX+z1*cosX
  return {x:x1,y:y2,z:z2}
}
function project(x,y,z,scale,ox,oy){return{x:ox+x*scale,y:oy-y*scale}}
function calcScale3D(){
  const pad=50,avail=Math.min(CW,CH)-pad*2
  return Math.max(6,Math.min(avail/(Math.max(P,L,T)*2.2),50))
}

function drawSmallCube3D(col,row,layer,scale,ox,oy){
  const[topC,rightC,leftC]=getCubeColor(col,row,layer)
  const dark=getCubeColor(col,row,layer)[2]
  const hx=P/2,hy=L/2,hz=T/2
  function pt(dx,dy,dz){
    const lx=(col+dx)-hx,ly=(row+dy)-hy,lz=(layer+dz)-hz
    const r=rotate3D(lx,lz,ly,rotX,rotY)
    return project(r.x,r.y,r.z,scale,ox,oy)
  }
  const a=pt(0,0,0),b=pt(1,0,0),c=pt(1,1,0),d=pt(0,1,0)
  const e=pt(0,0,1),f=pt(1,0,1),g=pt(1,1,1),h=pt(0,1,1)
  const faces=[
    {pts:[e,f,g,h],base:topC},{pts:[a,b,c,d],base:dark},
    {pts:[a,b,f,e],base:rightC},{pts:[d,c,g,h],base:leftC},
    {pts:[b,c,g,f],base:leftC},{pts:[a,d,h,e],base:rightC},
  ]
  faces.sort((a,b)=>{
    const za=a.pts.reduce((s,p)=>s+p.z,0)/4
    const zb=b.pts.reduce((s,p)=>s+p.z,0)/4
    return zb-za
  })
  faces.forEach(f=>drawFace(f.pts,f.base,'rgba(0,0,0,0.15)'))
}

function drawAll3D(){
  ctx.clearRect(0,0,CW,CH)
  const scale=calcScale3D()
  const ox=CW/2,oy=CH/2+10
  const cubes=[]
  for(let i=0;i<filled;i++){
    const{col,row,layer}=indexToPos(i)
    const hx=P/2,hy=L/2,hz=T/2
    const lx=(col+.5)-hx,ly=(row+.5)-hy,lz=(layer+.5)-hz
    const r=rotate3D(lx,lz,ly,rotX,rotY)
    cubes.push({col,row,layer,z:r.z})
  }
  cubes.sort((a,b)=>b.z-a.z)
  cubes.forEach(({col,row,layer})=>drawSmallCube3D(col,row,layer,scale,ox,oy))
}

function drawAll(){
  if(rotMode){drawAll3D();return}
  ctx.clearRect(0,0,CW,CH)
  const cs=calcCS()
  const{ox,oy}=getOrigin(cs)
  drawGhost(cs,ox,oy)
  const order=[]
  for(let i=0;i<filled;i++) order.push(i)
  order.sort((a,b)=>{
    const pa=indexToPos(a),pb=indexToPos(b)
    if(pa.layer!==pb.layer)return pa.layer-pb.layer
    return(pa.row+pa.col)-(pb.row+pb.col)
  })
  for(const i of order){
    const{col,row,layer}=indexToPos(i)
    drawSmallCubeIso(col,row,layer,cs,ox,oy,1)
  }
  const tot=P*L*T
  if(filled<tot){
    const{col,row,layer}=indexToPos(filled)
    drawSmallCubeIso(col,row,layer,cs,ox,oy,0.25)
  }
}

function inertiaLoop(){
  if(!rotMode)return
  if(!dragging&&(Math.abs(velX)>.001||Math.abs(velY)>.001)){
    rotY+=velX;rotX+=velY;velX*=.92;velY*=.92;drawAll()
  }
  requestAnimationFrame(inertiaLoop)
}

cv.addEventListener('mousedown',e=>{if(!rotMode)return;dragging=true;velX=0;velY=0;lastX=e.clientX;lastY=e.clientY;cv.style.cursor='grabbing'})
window.addEventListener('mousemove',e=>{
  if(!dragging||!rotMode)return
  const dx=e.clientX-lastX,dy=e.clientY-lastY
  velX=dx*.012;velY=dy*.012;rotY+=velX;rotX+=velY;lastX=e.clientX;lastY=e.clientY;drawAll()
})
window.addEventListener('mouseup',()=>{dragging=false;if(rotMode)cv.style.cursor='grab'})
cv.addEventListener('touchstart',e=>{if(!rotMode)return;e.preventDefault();const t=e.touches[0];dragging=true;velX=0;velY=0;lastX=t.clientX;lastY=t.clientY},{passive:false})
cv.addEventListener('touchmove',e=>{
  if(!dragging||!rotMode)return;e.preventDefault()
  const t=e.touches[0],dx=t.clientX-lastX,dy=t.clientY-lastY
  velX=dx*.012;velY=dy*.012;rotY+=velX;rotX+=velY;lastX=t.clientX;lastY=t.clientY;drawAll()
},{passive:false})
cv.addEventListener('touchend',()=>{dragging=false})

function enableRotMode(){
  rotMode=true;cv.style.cursor='grab'
  rotX=-0.5;rotY=0.6;velX=0.008;velY=0
  drawAll();inertiaLoop()
  if(hintEl)hintEl.style.display='block'
}
function disableRotMode(){
  rotMode=false;cv.style.cursor='default';velX=0;velY=0
  if(hintEl)hintEl.style.display='none'
}

function updateFormula(){
  const tot=P*L*T
  const f=`V = ${P} × ${L} × ${T} = ${tot} cm³`
  document.getElementById('formula-bar').textContent=f
  document.getElementById('st-t').textContent=tot
}

function updateUI(){
  const tot=P*L*T
  const pct=Math.round(filled/tot*100)
  const layDisplay=filled===0?0:(filled===tot?T:Math.min(T,Math.floor((filled-1)/(P*L))+1))
  document.getElementById('st-n').textContent=filled
  document.getElementById('st-l').textContent=`${layDisplay} / ${T}`
  document.getElementById('st-p').textContent=pct+'%'
  document.getElementById('pg').style.width=pct+'%'
  document.getElementById('pg-pct').textContent=pct+'%'
  const msg=document.getElementById('pg-msg')
  if(filled===0){msg.textContent='Belum ada kubus kecil yang masuk';msg.className='pg-msg'}
  else if(filled===tot){msg.textContent=`✅ Penuh! V = ${P} × ${L} × ${T} = ${tot} cm³`;msg.className='pg-msg done'}
  else{msg.textContent=`${filled} dari ${tot} kubus masuk (${pct}%)`;msg.className='pg-msg'}
  document.getElementById('btn-add').disabled=filled>=tot
  document.getElementById('btn-all').disabled=filled>=tot
}

function addOne(){
  const tot=P*L*T
  if(filled>=tot)return
  const prev=filled;filled++
  drawAll()
  const{col,row,layer}=indexToPos(prev)
  const log=document.getElementById('log')
  const d=document.createElement('div')
  d.className='log-item'
  d.innerHTML=`Kubus ke-<b>${filled}</b> → Lap ${layer+1}, baris ${row+1}, kolom ${col+1}`
  log.appendChild(d);log.scrollTop=log.scrollHeight
  updateUI()
  if(filled>=tot)setTimeout(showCel,350)
}

function fillAll(){
  const tot=P*L*T
  if(filled>=tot)return
  document.getElementById('btn-add').disabled=true
  document.getElementById('btn-all').disabled=true
  const delay=Math.max(8,Math.min(70,250/tot))
  function step(){if(filled>=tot){updateUI();showCel();return};addOne();timer=setTimeout(step,delay)}
  step()
}

function reset(){
  clearTimeout(timer);filled=0;disableRotMode()
  document.getElementById('log').innerHTML=''
  drawAll();updateUI()
}

function changeSize(){
  clearTimeout(timer)
  let p=parseInt(document.getElementById('inp-p').value)||1
  let l=parseInt(document.getElementById('inp-l').value)||1
  let t=parseInt(document.getElementById('inp-t').value)||1
  p=Math.max(1,Math.min(20,p));l=Math.max(1,Math.min(20,l));t=Math.max(1,Math.min(20,t))
  document.getElementById('inp-p').value=p
  document.getElementById('inp-l').value=l
  document.getElementById('inp-t').value=t
  P=p;L=l;T=t;filled=0
  disableRotMode()
  document.getElementById('log').innerHTML=''
  updateFormula();drawAll();updateUI()
}

function showCel(){
  document.getElementById('cel-formula').textContent=`V = ${P} × ${L} × ${T} = ${P*L*T} cm³`
  document.getElementById('cel').classList.add('show')
  spawnConfetti();enableRotMode()
}
function closeCel(){document.getElementById('cel').classList.remove('show')}
document.getElementById('cel').addEventListener('click',e=>{if(e.target===e.currentTarget)closeCel()})

function spawnConfetti(){
  const C=['#f9c74f','#f72585','#4cc9f0','#7ed957','#f3722c','#a29bfe','#55efc4','#ff8f3f']
  for(let i=0;i<75;i++){
    const p=document.createElement('div');p.className='prt'
    const sz=5+Math.random()*10
    p.style.cssText=`left:${Math.random()*100}vw;top:-20px;width:${sz}px;height:${sz}px;background:${C[~~(Math.random()*C.length)]};border-radius:${Math.random()>.5?'50%':'3px'};animation-duration:${1.5+Math.random()*2.5}s;animation-delay:${Math.random()*.9}s`
    document.body.appendChild(p);setTimeout(()=>p.remove(),5000)
  }
}

updateFormula();drawAll();updateUI()
