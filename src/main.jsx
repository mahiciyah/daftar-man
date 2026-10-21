import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

/* ---------- helpers ---------- */
const KEY = 'daftar-man-v1';
const mem = {};
const store = {
  get(k){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }catch(e){ return mem[k] || null; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ mem[k] = v; } }
};
const uid = () => Math.random().toString(36).slice(2,10);
const pad = n => String(n).padStart(2,'0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const toD = s => new Date(s + 'T12:00:00');
const fmt = n => Math.round(n).toLocaleString('fa-IR');
const toEn = s => String(s).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g,'');
const jKey = d => { const p = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn',{year:'numeric',month:'numeric'}).formatToParts(d); return p.find(x=>x.type==='year').value+'-'+p.find(x=>x.type==='month').value; };
const jMonth = d => new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long'}).format(d);
const fmtDate = s => new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric',month:'long'}).format(toD(s));

const EXP_CATS = ['خوراک','حمل‌ونقل','مسکن','سلامت','تفریح','خرید','قبوض','سایر'];
const INC_CATS = ['حقوق','فریلنس','هدیه','سایر'];
const PALETTE = ['#fb7185','#f59e0b','#8b5cf6','#22d3ee','#34d399','#60a5fa','#f472b6','#a3a3c2'];

const seed = () => ({
  wallets:[{id:'w1',name:'نقد',initial:0},{id:'w2',name:'کارت بانکی',initial:0}],
  txs:[], debts:[],
  lists:[{id:'l1',name:'خرید سوپرمارکت',items:['سیب','برنج','قند','آرد'].map(n=>({id:uid(),name:n,done:false}))}],
  notes:[], todos:[]
});
const walletBal = (db,w) => w.initial + db.txs.filter(t=>t.walletId===w.id).reduce((s,t)=>s+(t.type==='income'?t.amount:-t.amount),0);

/* ---------- icons ---------- */
const P = {
  plus:'M5 12h14M12 5v14', x:'M18 6 6 18M6 6l12 12', check:'M20 6 9 17l-5-5',
  trash:'M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  pin:'M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z',
  cart:'M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12',
  dash:'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  swap:'M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4',
  note:'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z',
  wallet:'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4',
  up:'M7 7h10v10M7 17 17 7', down:'M17 17H7V7M7 7l10 10',
  coin:'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'
};
const Icon = ({n,size=20,sw=2}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={P[n]}/></svg>;

/* ---------- shared UI ---------- */
function Sheet({title,onClose,children}){
  useEffect(()=>{ const h=e=>e.key==='Escape'&&onClose(); window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h); },[]);
  return <div className="backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <div className="sheet stack" role="dialog" aria-modal="true" aria-label={title}>
      <div className="grab"/>
      <div className="row between"><h2 style={{margin:0,fontSize:'1.1rem'}}>{title}</h2><button className="icon-btn neu" onClick={onClose} aria-label="بستن"><Icon n="x" size={18}/></button></div>
      {children}
    </div>
  </div>;
}
function MoneyInput({value,onChange,autoFocus}){
  return <div style={{position:'relative'}}>
    <input className="field num" inputMode="numeric" autoFocus={autoFocus} placeholder="۰" value={value?fmt(value):''}
      onChange={e=>onChange(Number(toEn(e.target.value))||0)} style={{fontSize:'1.4rem',fontWeight:800,paddingLeft:70}}/>
    <span className="muted sm" style={{position:'absolute',left:16,top:'50%',transform:'translateY(-50%)'}}>تومان</span>
  </div>;
}
function Chips({options,value,onChange,color}){
  return <div className="chips">{options.map(o=>{
    const v=o.v??o, l=o.l??o;
    return <button key={v} type="button" className={'chip'+(value===v?' on':'')} style={{'--c':color}} onClick={()=>onChange(v)}>{l}</button>;
  })}</div>;
}
const Empty = ({children}) => <div className="empty">{children}</div>;

function WalletPick({db,value,onChange}){
  return <div><label className="lbl">کیف پول</label>
    <Chips options={db.wallets.map(w=>({v:w.id,l:`${w.name} · ${fmt(walletBal(db,w))}`}))} value={value} onChange={onChange} color="var(--cyan)"/></div>;
}

/* ---------- sheets ---------- */
function QuickEntry({db,preset={},onClose,onSave}){
  const [type,setType]=useState(preset.type||'expense');
  const [amount,setAmount]=useState(preset.amount||0);
  const cats = type==='income'?INC_CATS:EXP_CATS;
  const [category,setCategory]=useState(preset.category||cats[0]);
  const [walletId,setWalletId]=useState(db.wallets[0]?.id);
  const [note,setNote]=useState(preset.note||'');
  useEffect(()=>{ if(!cats.includes(category)) setCategory(cats[0]); },[type]);
  const c = type==='income'?'var(--emerald)':'var(--rose)';
  return <Sheet title={preset.title||'ثبت تراکنش'} onClose={onClose}>
    <div className="seg"><button className={type==='expense'?'on':''} style={type==='expense'?{color:'var(--rose)'}:{}} onClick={()=>setType('expense')}>هزینه</button>
      <button className={type==='income'?'on':''} style={type==='income'?{color:'var(--emerald)'}:{}} onClick={()=>setType('income')}>درآمد</button></div>
    <div><label className="lbl">مبلغ</label><MoneyInput value={amount} onChange={setAmount} autoFocus/></div>
    <div><label className="lbl">دسته‌بندی</label><Chips options={cats} value={category} onChange={setCategory} color={c}/></div>
    <WalletPick db={db} value={walletId} onChange={setWalletId}/>
    <div><label className="lbl">توضیح (اختیاری)</label><input className="field" value={note} onChange={e=>setNote(e.target.value)} placeholder="مثلاً ناهار با دوستان"/></div>
    <button className={'neu btn block '+(type==='income'?'emerald':'rose')} disabled={!amount||!walletId} onClick={()=>onSave({type,amount,category,walletId,note})}>
      {type==='income'?'ثبت درآمد':'ثبت هزینه'}</button>
  </Sheet>;
}
function BuySheet({db,item,onClose,onSave}){
  const [amount,setAmount]=useState(0); const [walletId,setWalletId]=useState(db.wallets[0]?.id);
  return <Sheet title={`خرید «${item.name}»`} onClose={onClose}>
    <div><label className="lbl">مبلغ پرداختی</label><MoneyInput value={amount} onChange={setAmount} autoFocus/></div>
    <WalletPick db={db} value={walletId} onChange={setWalletId}/>
    <button className="neu btn primary block" disabled={!amount||!walletId} onClick={()=>onSave(amount,walletId)}>ثبت خرید</button>
  </Sheet>;
}
function SettleSheet({db,debt,onClose,onSave}){
  const rest = debt.amount-debt.paid;
  const [amount,setAmount]=useState(rest); const [walletId,setWalletId]=useState(db.wallets[0]?.id);
  const borrowed = debt.kind==='borrowed';
  return <Sheet title={borrowed?`پرداخت به ${debt.person}`:`دریافت از ${debt.person}`} onClose={onClose}>
    <div className="muted sm">مانده: <b className="num" style={{color:'var(--text)'}}>{fmt(rest)}</b> تومان</div>
    <div><label className="lbl">مبلغ تسویه</label><MoneyInput value={amount} onChange={v=>setAmount(Math.min(v,rest))} autoFocus/></div>
    <div className="row"><button className="neu chip" onClick={()=>setAmount(rest)}>تسویه کامل</button><button className="neu chip" onClick={()=>setAmount(Math.round(rest/2))}>نصف مانده</button></div>
    <WalletPick db={db} value={walletId} onChange={setWalletId}/>
    <button className={'neu btn block '+(borrowed?'rose':'emerald')} disabled={!amount||!walletId} onClick={()=>onSave(amount,walletId)}>
      {amount>=rest?'تسویه کامل':'ثبت تسویه بخشی'}</button>
  </Sheet>;
}
function DebtSheet({onClose,onSave}){
  const [person,setPerson]=useState(''); const [amount,setAmount]=useState(0); const [kind,setKind]=useState('borrowed'); const [due,setDue]=useState('');
  return <Sheet title="ثبت قرض یا طلب" onClose={onClose}>
    <div className="seg"><button className={kind==='borrowed'?'on':''} style={kind==='borrowed'?{color:'var(--rose)'}:{}} onClick={()=>setKind('borrowed')}>قرض گرفتم</button>
      <button className={kind==='lent'?'on':''} style={kind==='lent'?{color:'var(--emerald)'}:{}} onClick={()=>setKind('lent')}>قرض دادم</button></div>
    <div><label className="lbl">شخص یا بانک</label><input className="field" value={person} onChange={e=>setPerson(e.target.value)} placeholder="مثلاً علی یا بانک ملی" autoFocus/></div>
    <div><label className="lbl">مبلغ</label><MoneyInput value={amount} onChange={setAmount}/></div>
    <div><label className="lbl">تاریخ سررسید (اختیاری)</label><input type="date" className="field" value={due} onChange={e=>setDue(e.target.value)} style={{colorScheme:'dark'}}/></div>
    <button className="neu btn primary block" disabled={!person.trim()||!amount} onClick={()=>onSave({person:person.trim(),amount,kind,due})}>ذخیره</button>
  </Sheet>;
}
function WalletSheet({onClose,onSave}){
  const [name,setName]=useState(''); const [initial,setInitial]=useState(0);
  return <Sheet title="کیف پول جدید" onClose={onClose}>
    <div><label className="lbl">نام</label><input className="field" value={name} onChange={e=>setName(e.target.value)} placeholder="مثلاً پس‌انداز" autoFocus/></div>
    <div><label className="lbl">موجودی اولیه</label><MoneyInput value={initial} onChange={setInitial}/></div>
    <button className="neu btn primary block" disabled={!name.trim()} onClick={()=>onSave(name.trim(),initial)}>افزودن</button>
  </Sheet>;
}
function TextSheet({title,label,placeholder,cta,onClose,onSave}){
  const [v,setV]=useState('');
  return <Sheet title={title} onClose={onClose}>
    <div><label className="lbl">{label}</label><input className="field" value={v} onChange={e=>setV(e.target.value)} placeholder={placeholder} autoFocus onKeyDown={e=>e.key==='Enter'&&v.trim()&&onSave(v.trim())}/></div>
    <button className="neu btn primary block" disabled={!v.trim()} onClick={()=>onSave(v.trim())}>{cta}</button>
  </Sheet>;
}

/* ---------- charts ---------- */
function Donut({data}){
  const total = data.reduce((s,d)=>s+d.v,0); let acc=0;
  return <svg className="donut" viewBox="0 0 42 42" role="img" aria-label="سهم هزینه‌ها">
    <circle cx="21" cy="21" r="15.915" fill="none" stroke="#0b0d1c" strokeWidth="5.5"/>
    {data.map((d,i)=>{ const p=d.v/total*100; const el=<circle key={d.k} cx="21" cy="21" r="15.915" fill="none" stroke={PALETTE[i%PALETTE.length]} strokeWidth="5" strokeLinecap="round"
      strokeDasharray={`${Math.max(p-1.6,0.4)} ${100-Math.max(p-1.6,0.4)}`} strokeDashoffset={25-acc-0.8}/>; acc+=p; return el; })}
  </svg>;
}
function ExpensePie({db}){
  const now=jKey(new Date());
  const map={}; db.txs.filter(t=>t.type==='expense'&&jKey(toD(t.date))===now).forEach(t=>map[t.category]=(map[t.category]||0)+t.amount);
  const data=Object.entries(map).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v); const total=data.reduce((s,d)=>s+d.v,0);
  return <div className="glass pad"><h2 className="sec">سهم هزینه‌ها در {jMonth(new Date())}</h2>
    {!data.length?<Empty>هنوز هزینه‌ای در این ماه ثبت نشده.</Empty>:
    <div className="row" style={{gap:18,flexWrap:'wrap',justifyContent:'center'}}>
      <Donut data={data}/>
      <div className="legend grow">{data.map((d,i)=><div key={d.k} className="row between"><span><i style={{background:PALETTE[i%PALETTE.length]}}/>{d.k}</span><span className="num muted">{Math.round(d.v/total*100).toLocaleString('fa-IR')}٪</span></div>)}</div>
    </div>}
  </div>;
}
function IncomeExpenseBars({db}){
  const months=useMemo(()=>{ const keys=[],list=[]; for(let i=0;keys.length<6&&i<400;i++){ const d=new Date(Date.now()-i*15*864e5); const k=jKey(d); if(!keys.includes(k)){keys.push(k);list.push({k,label:jMonth(d)});} } return list.reverse(); },[]);
  const rows=months.map(m=>{ const ts=db.txs.filter(t=>jKey(toD(t.date))===m.k); return {...m,inc:ts.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),exp:ts.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)}; });
  const max=Math.max(1,...rows.map(r=>Math.max(r.inc,r.exp)));
  return <div className="glass pad"><div className="row between"><h2 className="sec">درآمد و هزینه، ۶ ماه اخیر</h2>
    <span className="sm muted"><i className="dot" style={{'--c':'var(--emerald)',width:8,height:8}}/> درآمد &nbsp;<i className="dot" style={{'--c':'var(--rose)',width:8,height:8}}/> هزینه</span></div>
    <div className="bars">{rows.map(r=><div className="bar-col" key={r.k}>
      <div className="bar-pair">
        <div className="bar" title={fmt(r.inc)} style={{height:`${r.inc/max*100}%`,background:'linear-gradient(var(--emerald),#047857)',boxShadow:'0 0 14px -2px var(--emerald)'}}/>
        <div className="bar" title={fmt(r.exp)} style={{height:`${r.exp/max*100}%`,background:'linear-gradient(var(--rose),#9f1239)',boxShadow:'0 0 14px -2px var(--rose)'}}/>
      </div><span className="sm muted">{r.label}</span></div>)}</div>
  </div>;
}

/* ---------- tabs ---------- */
function useCountUp(v){
  const [x,setX]=useState(0); const ref=useRef(0);
  useEffect(()=>{ if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){ref.current=v;setX(v);return;}
    const from=ref.current,start=performance.now(); let raf;
    const step=t=>{const p=Math.min(1,(t-start)/700),e=1-Math.pow(1-p,3),val=from+(v-from)*e; ref.current=val;setX(val); if(p<1)raf=requestAnimationFrame(step);};
    raf=requestAnimationFrame(step); return()=>cancelAnimationFrame(raf); },[v]);
  return x;
}

function Dashboard({db,A}){
  const nowK=jKey(new Date());
  const month=db.txs.filter(t=>jKey(toD(t.date))===nowK);
  const inc=month.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const exp=month.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const lent=db.debts.filter(d=>d.kind==='lent').reduce((s,d)=>s+d.amount-d.paid,0);
  const owed=db.debts.filter(d=>d.kind==='borrowed').reduce((s,d)=>s+d.amount-d.paid,0);
  const walletsTotal=db.wallets.reduce((s,w)=>s+walletBal(db,w),0);
  const balance=walletsTotal+lent-owed; // موجودی کیف‌پول‌ها (= درآمد − هزینه) + طلب − بدهی
  const shown=useCountUp(balance); const net=lent-owed;
  return <div className="stack tabview">
    <div className="glass hero" style={{boxShadow:'0 30px 60px -30px rgba(96,165,250,.45),inset 0 1px 0 rgba(255,255,255,.07)'}}>
      <div className="row"><i className="dot" style={{'--c':'var(--blue)'}}/><span className="muted">تراز کل (موجودی واقعی)</span></div>
      <div className="big num" style={{color:shown<0?'var(--rose)':'var(--text)'}}>{fmt(shown)}<span className="unit">تومان</span></div>
      <div className="sm muted">کیف‌پول‌ها {fmt(walletsTotal)} + طلب {fmt(lent)} − بدهی {fmt(owed)}</div>
    </div>
    <div className="kpis">
      <div className="glass kpi"><div className="row sm muted"><i className="dot" style={{'--c':'var(--emerald)'}}/>درآمد این ماه</div><div className="v num" style={{color:'var(--emerald)'}}>{fmt(inc)}</div></div>
      <div className="glass kpi"><div className="row sm muted"><i className="dot" style={{'--c':'var(--rose)'}}/>هزینه این ماه</div><div className="v num" style={{color:'var(--rose)'}}>{fmt(exp)}</div></div>
      <div className="glass kpi wide"><div className="row sm muted"><i className="dot" style={{'--c':'var(--amber)'}}/>خالص قرض و طلب</div><div className="v num" style={{color:'var(--amber)'}}>{net<0?'−':''}{fmt(Math.abs(net))}</div></div>
    </div>
    <div>
      <div className="row between" style={{marginBottom:2}}><h2 className="sec" style={{margin:0}}>کیف پول‌ها</h2></div>
      <div className="wallets">
        {db.wallets.map(w=><div className="neu wallet" key={w.id}><div className="row sm muted"><Icon n="wallet" size={16}/>{w.name}</div><div className="num" style={{fontWeight:800,fontSize:'1.05rem'}}>{fmt(walletBal(db,w))}</div></div>)}
        <button className="neu wallet row" style={{justifyContent:'center',color:'var(--muted)',minWidth:64}} onClick={()=>A.open({kind:'wallet'})} aria-label="کیف پول جدید"><Icon n="plus"/></button>
      </div>
    </div>
    <div className="charts"><ExpensePie db={db}/><IncomeExpenseBars db={db}/></div>
    <div className="glass pad"><h2 className="sec">تراکنش‌های اخیر</h2>
      <div className="stack" style={{gap:10}}>
        {!db.txs.length&&<Empty>با دکمه سبز پایین صفحه، اولین تراکنش را ثبت کنید.</Empty>}
        {db.txs.slice(0,8).map(t=>{ const w=db.wallets.find(x=>x.id===t.walletId); const inc=t.type==='income';
          return <div className="item" key={t.id}>
            <div className="tx-ic" style={{background:inc?'rgba(52,211,153,.14)':'rgba(251,113,133,.14)',color:inc?'var(--emerald)':'var(--rose)'}}><Icon n={inc?'down':'up'} size={18}/></div>
            <div className="grow"><div style={{fontWeight:500}}>{t.note||t.category}</div><div className="sm muted">{t.category} · {w?w.name:'—'} · {fmtDate(t.date)}</div></div>
            <div className="num" style={{fontWeight:700,color:inc?'var(--emerald)':'var(--rose)'}}>{inc?'+':'−'}{fmt(t.amount)}</div>
            <button className="icon-btn" onClick={()=>A.delTx(t.id)} aria-label="حذف"><Icon n="trash" size={16}/></button>
          </div>; })}
      </div>
    </div>
  </div>;
}

function Shopping({db,A,state}){
  const [listId,setListId]=state; const list=db.lists.find(l=>l.id===listId)||db.lists[0];
  const [name,setName]=useState('');
  const add=()=>{ if(!name.trim())return; A.addItem(list.id,name.trim()); setName(''); };
  const done=list?list.items.filter(i=>i.done):[]; const spent=done.reduce((s,i)=>s+(i.price||0),0);
  return <div className="stack tabview">
    <div className="row" style={{gap:8}}>
      <div className="chips grow">{db.lists.map(l=><button key={l.id} className={'chip'+(list&&l.id===list.id?' on':'')} style={{'--c':'var(--violet)'}} onClick={()=>setListId(l.id)}>{l.name}</button>)}</div>
      <button className="neu btn" style={{padding:'9px 14px'}} onClick={()=>A.open({kind:'list'})}><Icon n="plus" size={16}/>لیست جدید</button>
    </div>
    {!list?<Empty>یک لیست خرید بسازید.</Empty>:<div className="glass pad stack">
      <div className="row between"><h2 className="sec" style={{margin:0}}>{list.name}</h2>
        <button className="icon-btn" onClick={()=>A.delList(list.id)} aria-label="حذف لیست"><Icon n="trash" size={17}/></button></div>
      <div>
        <div className="row between sm muted" style={{marginBottom:6}}><span>{done.length.toLocaleString('fa-IR')} از {list.items.length.toLocaleString('fa-IR')} خریداری شد</span><span className="num">{fmt(spent)} تومان</span></div>
        <div className="progress"><div style={{width:list.items.length?`${done.length/list.items.length*100}%`:0,background:'linear-gradient(90deg,var(--violet),#c084fc)'}}/></div>
      </div>
      <div className="row"><input className="field" value={name} placeholder="نام کالا؛ مثلاً شیر" onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/>
        <button className="neu btn primary" onClick={add} aria-label="افزودن"><Icon n="plus"/></button></div>
      <div className="stack" style={{gap:10}}>
        {!list.items.length&&<Empty>این لیست خالی است. اولین کالا را اضافه کنید.</Empty>}
        {list.items.map(it=><div className="item" key={it.id}>
          <button className={'check'+(it.done?' on':'')} style={{'--c':'var(--violet)'}} onClick={()=>it.done?A.undoBuy(list.id,it):A.open({kind:'buy',listId:list.id,item:it})} aria-label={it.done?'لغو خرید':'ثبت خرید'}><Icon n="check" size={16} sw={3}/></button>
          <div className="grow"><div className={it.done?'struck':''}>{it.name}</div>{it.done&&<div className="sm muted num">{fmt(it.price)} تومان · {(db.wallets.find(w=>w.id===it.walletId)||{}).name}</div>}</div>
          <button className="icon-btn" onClick={()=>A.delItem(list.id,it.id)} aria-label="حذف"><Icon n="trash" size={16}/></button>
        </div>)}
      </div>
    </div>}
  </div>;
}

function Debts({db,A}){
  const [f,setF]=useState('all');
  const lent=db.debts.filter(d=>d.kind==='lent').reduce((s,d)=>s+d.amount-d.paid,0);
  const owed=db.debts.filter(d=>d.kind==='borrowed').reduce((s,d)=>s+d.amount-d.paid,0);
  const list=db.debts.filter(d=>f==='all'||d.kind===f).sort((a,b)=>((a.amount-a.paid===0)-(b.amount-b.paid===0))||String(a.due||'9').localeCompare(String(b.due||'9')));
  return <div className="stack tabview">
    <div className="kpis" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="glass kpi"><div className="row sm muted"><i className="dot" style={{'--c':'var(--rose)'}}/>بدهی من</div><div className="v num" style={{color:'var(--rose)'}}>{fmt(owed)}</div></div>
      <div className="glass kpi"><div className="row sm muted"><i className="dot" style={{'--c':'var(--emerald)'}}/>طلب من</div><div className="v num" style={{color:'var(--emerald)'}}>{fmt(lent)}</div></div>
    </div>
    <div className="row"><div className="seg grow">{[['all','همه'],['borrowed','بدهی'],['lent','طلب']].map(([k,l])=><button key={k} className={f===k?'on':''} onClick={()=>setF(k)}>{l}</button>)}</div>
      <button className="neu btn primary" onClick={()=>A.open({kind:'debt'})}><Icon n="plus" size={16}/>ثبت جدید</button></div>
    <div className="stack" style={{gap:12}}>
      {!list.length&&<div className="glass"><Empty>موردی ثبت نشده. قرض‌ها و طلب‌های خود را اینجا دنبال کنید.</Empty></div>}
      {list.map(d=>{ const rest=d.amount-d.paid, b=d.kind==='borrowed', c=b?'var(--rose)':'var(--emerald)';
        let due=null; if(d.due&&rest>0){ const days=Math.round((toD(d.due)-new Date())/864e5); due=days<0?`${Math.abs(days).toLocaleString('fa-IR')} روز گذشته از سررسید`:days===0?'سررسید امروز':`${days.toLocaleString('fa-IR')} روز تا سررسید`; }
        return <div className="glass pad stack" style={{gap:12,opacity:rest===0?.55:1}} key={d.id}>
          <div className="row"><div className="tx-ic" style={{background:b?'rgba(251,113,133,.14)':'rgba(52,211,153,.14)',color:c}}><Icon n={b?'up':'down'} size={18}/></div>
            <div className="grow"><div style={{fontWeight:700}}>{d.person}</div><div className="sm muted">{b?'قرض گرفتم':'قرض دادم'}{d.due?` · سررسید ${fmtDate(d.due)}`:''}</div></div>
            <div style={{textAlign:'left'}}><div className="num" style={{fontWeight:800,color:c}}>{fmt(rest)}</div><div className="sm muted num">از {fmt(d.amount)}</div></div></div>
          <div className="progress"><div style={{width:`${d.paid/d.amount*100}%`,background:c}}/></div>
          <div className="row between">
            <span className="sm" style={{color:due&&due.includes('گذشته')?'var(--rose)':'var(--muted)'}}>{rest===0?'تسویه شد':due||''}</span>
            <div className="row">{rest>0&&<button className="neu btn" style={{padding:'8px 14px',color:c}} onClick={()=>A.open({kind:'settle',debt:d})}>{b?'پرداخت / تسویه':'دریافت / تسویه'}</button>}
              <button className="icon-btn" onClick={()=>A.delDebt(d.id)} aria-label="حذف"><Icon n="trash" size={16}/></button></div></div>
        </div>; })}
    </div>
  </div>;
}

function Notes({db,A}){
  const [sub,setSub]=useState('notes');
  const [text,setText]=useState(''); const [tags,setTags]=useState(''); const [tag,setTag]=useState(null);
  const [todo,setTodo]=useState(''); const [pri,setPri]=useState('normal');
  const allTags=[...new Set(db.notes.flatMap(n=>n.tags))];
  const notes=[...db.notes].filter(n=>!tag||n.tags.includes(tag)).sort((a,b)=>b.pinned-a.pinned);
  const todos=[...db.todos].sort((a,b)=>(a.done-b.done)||((a.pri==='urgent'?0:1)-(b.pri==='urgent'?0:1)));
  const addNote=()=>{ if(!text.trim())return; A.addNote(text.trim(),tags.split(/[\s,،#]+/).filter(Boolean)); setText('');setTags(''); };
  const addTodo=()=>{ if(!todo.trim())return; A.addTodo(todo.trim(),pri); setTodo(''); };
  const toExp=(src,id,text)=>A.open({kind:'quick',preset:{type:'expense',note:text,title:'تبدیل به هزینه'},convert:{src,id}});
  return <div className="stack tabview">
    <div className="seg"><button className={sub==='notes'?'on':''} onClick={()=>setSub('notes')} style={sub==='notes'?{color:'var(--cyan)'}:{}}>یادداشت‌ها</button>
      <button className={sub==='todos'?'on':''} onClick={()=>setSub('todos')} style={sub==='todos'?{color:'var(--cyan)'}:{}}>کارها</button></div>
    {sub==='notes'?<>
      <div className="glass pad stack" style={{gap:10}}>
        <textarea className="field" rows="3" placeholder="یادداشت تازه..." value={text} onChange={e=>setText(e.target.value)} style={{resize:'vertical'}}/>
        <div className="row"><input className="field" placeholder="تگ‌ها؛ مثلاً کار خانه" value={tags} onChange={e=>setTags(e.target.value)}/>
          <button className="neu btn" style={{color:'var(--cyan)'}} onClick={addNote} disabled={!text.trim()}>افزودن</button></div>
      </div>
      {allTags.length>0&&<div className="chips"><button className={'chip'+(!tag?' on':'')} style={{'--c':'var(--cyan)'}} onClick={()=>setTag(null)}>همه</button>
        {allTags.map(t=><button key={t} className={'chip'+(tag===t?' on':'')} style={{'--c':'var(--cyan)'}} onClick={()=>setTag(t)}>#{t}</button>)}</div>}
      <div className="stack" style={{gap:12}}>
        {!notes.length&&<div className="glass"><Empty>یادداشتی نیست.</Empty></div>}
        {notes.map(n=><div className="glass pad stack" style={{gap:10,borderColor:n.pinned?'rgba(34,211,238,.45)':undefined}} key={n.id}>
          <div style={{whiteSpace:'pre-wrap'}}>{n.text}</div>
          {(n.tags.length>0||n.converted)&&<div className="chips">{n.tags.map(t=><span className="tag" key={t}>#{t}</span>)}{n.converted&&<span className="badge">به هزینه تبدیل شد</span>}</div>}
          <div className="row between"><span className="sm muted">{fmtDate(n.date)}</span>
            <div className="row" style={{gap:4}}>
              <button className="icon-btn" style={{color:'var(--emerald)'}} onClick={()=>toExp('note',n.id,n.text.slice(0,60))} aria-label="تبدیل به هزینه"><Icon n="coin" size={17}/></button>
              <button className="icon-btn" style={{color:n.pinned?'var(--cyan)':undefined}} onClick={()=>A.pinNote(n.id)} aria-label="سنجاق"><Icon n="pin" size={17}/></button>
              <button className="icon-btn" onClick={()=>A.delNote(n.id)} aria-label="حذف"><Icon n="trash" size={17}/></button></div></div>
        </div>)}
      </div></>:<>
      <div className="glass pad stack" style={{gap:10}}>
        <input className="field" placeholder="کار تازه..." value={todo} onChange={e=>setTodo(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTodo()}/>
        <div className="row"><div className="seg grow"><button className={pri==='urgent'?'on':''} style={pri==='urgent'?{color:'var(--rose)'}:{}} onClick={()=>setPri('urgent')}>🔴 فوری</button>
          <button className={pri==='normal'?'on':''} style={pri==='normal'?{color:'var(--amber)'}:{}} onClick={()=>setPri('normal')}>🟡 معمولی</button></div>
          <button className="neu btn" style={{color:'var(--cyan)'}} onClick={addTodo} disabled={!todo.trim()}>افزودن</button></div>
      </div>
      <div className="stack" style={{gap:10}}>
        {!todos.length&&<div className="glass"><Empty>کاری برای امروز نیست.</Empty></div>}
        {todos.map(t=><div className="item" key={t.id}>
          <button className={'check'+(t.done?' on':'')} style={{'--c':t.pri==='urgent'?'var(--rose)':'var(--amber)'}} onClick={()=>A.toggleTodo(t.id)} aria-label="انجام شد"><Icon n="check" size={16} sw={3}/></button>
          <div className="grow"><div className={t.done?'struck':''}>{t.text}</div>
            <div className="sm muted">{t.pri==='urgent'?'🔴 فوری':'🟡 معمولی'}{t.converted?' · به هزینه تبدیل شد':''}</div></div>
          <button className="icon-btn" style={{color:'var(--emerald)'}} onClick={()=>toExp('todo',t.id,t.text)} aria-label="تبدیل به هزینه"><Icon n="coin" size={17}/></button>
          <button className="icon-btn" onClick={()=>A.delTodo(t.id)} aria-label="حذف"><Icon n="trash" size={16}/></button>
        </div>)}
      </div></>}
  </div>;
}

/* ---------- app ---------- */
function App(){
  const [db,setDb]=useState(()=>store.get(KEY)||seed());
  const [tab,setTab]=useState('dash'); const [sheet,setSheet]=useState(null); const [burst,setBurst]=useState(0);
  const listState=useState(db.lists[0]?.id);
  useEffect(()=>{ store.set(KEY,db); },[db]);
  const close=()=>setSheet(null);
  const celebrate=()=>{ setBurst(b=>b+1); setTimeout(()=>setBurst(0),1000); };
  const mkTx=t=>({id:uid(),date:todayStr(),...t});
  const mapList=(d,lid,fn)=>({...d,lists:d.lists.map(l=>l.id!==lid?l:{...l,items:fn(l.items)})});

  const A={
    open:setSheet,
    addTx:(t,conv)=>{ setDb(d=>{ let n={...d,txs:[mkTx(t),...d.txs]};
        if(conv){ const k=conv.src==='note'?'notes':'todos'; n[k]=d[k].map(x=>x.id===conv.id?{...x,converted:true}:x); } return n; }); close(); celebrate(); },
    delTx:id=>setDb(d=>({...d,txs:d.txs.filter(t=>t.id!==id)})),
    addWallet:(name,initial)=>{ setDb(d=>({...d,wallets:[...d.wallets,{id:uid(),name,initial}]})); close(); },
    addList:name=>{ const id=uid(); setDb(d=>({...d,lists:[...d.lists,{id,name,items:[]}]})); listState[1](id); close(); },
    delList:id=>{ setDb(d=>({...d,lists:d.lists.filter(l=>l.id!==id)})); listState[1](null); },
    addItem:(lid,name)=>setDb(d=>mapList(d,lid,its=>[...its,{id:uid(),name,done:false}])),
    delItem:(lid,iid)=>setDb(d=>mapList(d,lid,its=>its.filter(i=>i.id!==iid))),
    buy:(lid,item,amount,walletId)=>{ const tx=mkTx({type:'expense',amount,walletId,category:'خرید',note:item.name});
      setDb(d=>({...mapList(d,lid,its=>its.map(i=>i.id===item.id?{...i,done:true,price:amount,walletId,txId:tx.id}:i)),txs:[tx,...d.txs]})); close(); celebrate(); },
    undoBuy:(lid,item)=>setDb(d=>({...mapList(d,lid,its=>its.map(i=>i.id===item.id?{id:i.id,name:i.name,done:false}:i)),txs:d.txs.filter(t=>t.id!==item.txId)})),
    addDebt:x=>{ setDb(d=>({...d,debts:[{id:uid(),paid:0,...x},...d.debts]})); close(); },
    delDebt:id=>setDb(d=>({...d,debts:d.debts.filter(x=>x.id!==id)})),
    settle:(debt,amount,walletId)=>{ const b=debt.kind==='borrowed';
      const tx=mkTx({type:b?'expense':'income',amount,walletId,category:'تسویه قرض',note:(b?'پرداخت به ':'دریافت از ')+debt.person});
      setDb(d=>({...d,txs:[tx,...d.txs],debts:d.debts.map(x=>x.id===debt.id?{...x,paid:x.paid+amount}:x)})); close(); celebrate(); },
    addNote:(text,tags)=>setDb(d=>({...d,notes:[{id:uid(),text,tags,pinned:false,date:todayStr()},...d.notes]})),
    pinNote:id=>setDb(d=>({...d,notes:d.notes.map(n=>n.id===id?{...n,pinned:!n.pinned}:n)})),
    delNote:id=>setDb(d=>({...d,notes:d.notes.filter(n=>n.id!==id)})),
    addTodo:(text,pri)=>setDb(d=>({...d,todos:[{id:uid(),text,pri,done:false},...d.todos]})),
    toggleTodo:id=>setDb(d=>({...d,todos:d.todos.map(t=>t.id===id?{...t,done:!t.done}:t)})),
    delTodo:id=>setDb(d=>({...d,todos:d.todos.filter(t=>t.id!==id)}))
  };

  const tabs=[['dash','داشبورد','dash','var(--blue)'],['shop','خرید','cart','var(--violet)'],['debt','قرض و طلب','swap','var(--amber)'],['notes','یادداشت','note','var(--cyan)']];
  return <div className="app">
    <header className="top"><div><h1>دفتر من</h1><small>{new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date())}</small></div></header>
    <main key={tab}>
      {tab==='dash'&&<Dashboard db={db} A={A}/>}
      {tab==='shop'&&<Shopping db={db} A={A} state={listState}/>}
      {tab==='debt'&&<Debts db={db} A={A}/>}
      {tab==='notes'&&<Notes db={db} A={A}/>}
    </main>
    <button className="fab" onClick={()=>setSheet({kind:'quick'})} aria-label="ثبت سریع تراکنش"><Icon n="plus" size={26} sw={2.6}/></button>
    <nav className="tabs glass" aria-label="بخش‌ها">{tabs.map(([k,l,i,c])=><button key={k} className={tab===k?'on':''} style={{'--c':c}} onClick={()=>setTab(k)}><Icon n={i} size={22}/>{l}</button>)}</nav>

    {sheet?.kind==='quick'&&<QuickEntry db={db} preset={sheet.preset} onClose={close} onSave={t=>A.addTx(t,sheet.convert)}/>}
    {sheet?.kind==='buy'&&<BuySheet db={db} item={sheet.item} onClose={close} onSave={(a,w)=>A.buy(sheet.listId,sheet.item,a,w)}/>}
    {sheet?.kind==='settle'&&<SettleSheet db={db} debt={sheet.debt} onClose={close} onSave={(a,w)=>A.settle(sheet.debt,a,w)}/>}
    {sheet?.kind==='debt'&&<DebtSheet onClose={close} onSave={A.addDebt}/>}
    {sheet?.kind==='wallet'&&<WalletSheet onClose={close} onSave={A.addWallet}/>}
    {sheet?.kind==='list'&&<TextSheet title="لیست خرید جدید" label="نام لیست" placeholder="مثلاً میوه‌فروشی" cta="ساخت لیست" onClose={close} onSave={A.addList}/>}
    {burst>0&&<div className="burst" key={burst}><div className="ring"><Icon n="check" size={54} sw={3}/></div></div>}
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
