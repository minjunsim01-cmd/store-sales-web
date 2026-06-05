'use client';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Sale, UserProfile } from '@/lib/types';
import { getKoreaDateParts } from '@/lib/date';
import { clearSession, getSession } from '@/lib/localAuth';
import Link from 'next/link';

function num(v:string){return Number(String(v).replaceAll(',',''))||0}
function money(n:number){return n?Math.round(n).toLocaleString():'0'}
function saleTotal(s:Pick<Sale,'creditCard'|'starCard'|'dollar'|'won'>){return (s.creditCard||0)+(s.starCard||0)+(s.dollar||0)+(s.won||0)}
function partsFromDate(date:string){ const d=new Date(`${date}T00:00:00`); return {date,year:d.getFullYear(),month:d.getMonth()+1,day:d.getDate()}; }

type FormState={creditCard:string;starCard:string;dollar:string;won:string;wonAmount:string};
const emptyForm:FormState={creditCard:'',starCard:'',dollar:'',won:'',wonAmount:''};
type DetailKind = 'dollar' | 'wonAmount' | null;

export default function InputPage(){
  const [profile,setProfile]=useState<UserProfile|null>(null);
  const [msg,setMsg]=useState('');
  const [toast,setToast]=useState('');
  const [now,setNow]=useState(getKoreaDateParts());
  const [adminDate,setAdminDate]=useState(getKoreaDateParts().date);
  const [form,setForm]=useState<FormState>(emptyForm);
  const [mySales,setMySales]=useState<Sale[]>([]);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [pw,setPw]=useState({current:'',next:'',confirm:''});
  const [pwMsg,setPwMsg]=useState('');
  const [detail,setDetail]=useState<DetailKind>(null);

  useEffect(()=>{
    const user = getSession();
    if(!user){ location.href='/login'; return; }
    setProfile(user);
    const timer = setInterval(()=>setNow(getKoreaDateParts()), 30000);
    return () => clearInterval(timer);
  },[]);

  useEffect(()=>{
    if(!profile) return;
    const q = profile.role === 'staff'
      ? query(collection(db,'sales'),where('userId','==',profile.uid))
      : query(collection(db,'sales'));
    return onSnapshot(q,snap=>{
      const rows = snap.docs.map(d=>({id:d.id,...d.data()} as Sale)).sort((a,b)=>(b.date || '').localeCompare(a.date || ''));
      setMySales(rows);
    });
  },[profile]);

  const isAdmin = profile?.role !== 'staff';
  const currentMonthSales = useMemo(()=>mySales.filter(s=>s.year===now.year && s.month===now.month),[mySales,now.year,now.month]);
  const monthDollar = currentMonthSales.reduce((sum,s)=>sum+(Number(s.dollar)||0),0);
  const monthWonAmount = currentMonthSales.reduce((sum,s)=>sum+(Number(s.wonAmount)||0),0);
  const detailRows = useMemo(()=>{
    const key = detail === 'dollar' ? 'dollar' : 'wonAmount';
    const grouped = new Map<number, number>();
    currentMonthSales.forEach(s=>grouped.set(s.day,(grouped.get(s.day)||0)+(Number(s[key])||0)));
    return Array.from(grouped.entries()).sort((a,b)=>a[0]-b[0]).map(([day,total])=>({day,total}));
  },[currentMonthSales,detail]);
  const detailTotal = detail === 'dollar' ? monthDollar : monthWonAmount;

  async function save(e:FormEvent){
    e.preventDefault();
    if(!profile)return;
    const dateParts = isAdmin ? partsFromDate(adminDate) : getKoreaDateParts();
    const payload={
      date:dateParts.date,
      year:dateParts.year,
      month:dateParts.month,
      day:dateParts.day,
      creditCard:num(form.creditCard),
      starCard:num(form.starCard),
      dollar:num(form.dollar),
      won:num(form.won),
      wonAmount:num(form.wonAmount),
      managerName:profile.name,
      userId:profile.uid,
      storeName:profile.storeName,
      updatedAt:serverTimestamp()
    };
    if(editingId){
      await updateDoc(doc(db,'sales',editingId),payload);
      setMsg('수정되었습니다.');
      setToast('수정이 완료되었습니다.');
      setEditingId(null);
    }else{
      await addDoc(collection(db,'sales'),{...payload,createdAt:serverTimestamp()});
      setMsg('저장되었습니다. 봉투 작성용 누적 금액도 갱신됩니다.');
      setToast('저장이 완료되었습니다.');
    }
    setForm(emptyForm);
    window.setTimeout(()=>setToast(''), 2200);
  }

  function startEdit(s:Sale){
    setEditingId(s.id || null);
    setAdminDate(s.date);
    setForm({
      creditCard:String(s.creditCard||''),
      starCard:String(s.starCard||''),
      dollar:String(s.dollar||''),
      won:String(s.won||''),
      wonAmount:String(s.wonAmount||'')
    });
    setMsg('수정할 내용을 입력한 뒤 저장하세요.');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  async function changePassword(e:FormEvent){
    e.preventDefault();
    if(!profile) return;
    setPwMsg('');
    if(pw.next.length < 4){ setPwMsg('새 비밀번호는 4자리 이상으로 입력해주세요.'); return; }
    if(pw.next !== pw.confirm){ setPwMsg('새 비밀번호 확인이 일치하지 않습니다.'); return; }
    const ref=doc(db,'users',profile.uid);
    const snap=await getDoc(ref);
    const current=snap.data()?.password;
    if(current !== pw.current){ setPwMsg('현재 비밀번호가 맞지 않습니다.'); return; }
    await updateDoc(ref,{password:pw.next,updatedAt:serverTimestamp()});
    setPw({current:'',next:'',confirm:''});
    setPwMsg('비밀번호가 변경되었습니다.');
  }

  function cancelEdit(){ setEditingId(null); setForm(emptyForm); setMsg(''); setAdminDate(getKoreaDateParts().date); }
  function logout(){ clearSession(); location.href='/login'; }

  return <main className="container">
    {toast && <div className="save-toast no-print" role="status" aria-live="polite"><b>✓</b><span>{toast}</span></div>}
    <section className="brand-shell no-print">
      <div className="brand-row">
        <div><img src="/logo.png" alt="BBQ Outpost" className="brand-logo" /><h1 className="brand-title">매장세일즈</h1><p className="brand-sub">{profile?.name || ''}님 · {now.month}/{now.day}</p></div>
        <button type="button" className="logout-link" onClick={logout}>로그아웃</button>
      </div>
    </section>

    <div className="nav no-print"><Link href="/dashboard">대시보드</Link><Link href="/report">월별 매출표</Link>{isAdmin && <Link href="/admin/users">직원 관리</Link>}<button type="button" className="nav-button" onClick={logout}>로그아웃</button></div>

    <section className="card hero-card mobile-card">
      <div className="summary-grid no-print">
        <button type="button" className="summary-card" onClick={()=>setDetail('dollar')}><strong>📦 이번달 누적 달러</strong><b>${money(monthDollar)}</b><span>자세히 보기</span></button>
        <button type="button" className="summary-card" onClick={()=>setDetail('wonAmount')}><strong>📦 이번달 누적 원화금액</strong><b>₩{money(monthWonAmount)}</b><span>자세히 보기</span></button>
      </div>
    </section>

    <section className="card mobile-card">
      <div className="mini-meta"><span></span></div>
      <h2 className="section-title">{editingId ? '매출 수정' : '오늘 매출 입력'}</h2>
      {isAdmin ? <label className="field admin-date">날짜 선택 <span className="muted">관리자는 지난달/누락일 입력 가능</span><input type="date" value={adminDate} onChange={e=>setAdminDate(e.target.value)} /></label> : <p className="muted">날짜는 한국 시간 기준으로 자동 적용됩니다. <b>{now.date}</b></p>}
      <p className="muted">담당자: <b>{profile?.name}</b></p>
      <form onSubmit={save} className="quick-form input-grid">
        <label className="field">크레딧카드<input inputMode="numeric" value={form.creditCard} onChange={e=>setForm({...form,creditCard:e.target.value})}/></label>
        <label className="field">스타카드<input inputMode="numeric" value={form.starCard} onChange={e=>setForm({...form,starCard:e.target.value})}/></label>
        <label className="field">달러<input inputMode="decimal" value={form.dollar} onChange={e=>setForm({...form,dollar:e.target.value})}/></label>
        <label className="field">원화<input inputMode="numeric" value={form.won} onChange={e=>setForm({...form,won:e.target.value})}/></label>
        <label className="field wide">원화금액 <span className="muted">일별매출 합산 제외</span><input inputMode="numeric" value={form.wonAmount} onChange={e=>setForm({...form,wonAmount:e.target.value})}/></label>
        <button className="primary">{editingId ? '수정 저장' : '저장하기'}</button>
        {editingId && <button type="button" className="secondary" onClick={cancelEdit}>수정 취소</button>}
      </form>
      {msg&&<p className="success">{msg}</p>}
    </section>

    <section className="card">
      <h2 className="section-title">{isAdmin ? '최근 입력 내역' : '내 기록'}</h2>
      <div className="record-list desktop-card-list">{mySales.slice(0,20).map(s=><article className="record-card" key={s.id}>
        <div className="record-head"><b>{s.month}/{s.day}</b><span className="record-total">일별매출 {money(saleTotal(s))}</span></div>
        <div className="record-values"><span>카드 {money(s.creditCard)}</span><span>스타 {money(s.starCard)}</span><span>달러 {money(s.dollar)}</span><span>원화 {money(s.won)}</span><span>원화금액 {money(s.wonAmount)}</span><span>담당자 {s.managerName}</span></div>
        <button type="button" className="small-button" style={{marginTop:10}} onClick={()=>startEdit(s)}>수정</button>
      </article>)}</div>
    </section>

    <details className="card account-card">
      <summary>내 비밀번호 변경</summary>
      <form className="grid" onSubmit={changePassword}>
        <label className="field">현재 비밀번호<input type="password" value={pw.current} onChange={e=>setPw({...pw,current:e.target.value})}/></label>
        <label className="field">새 비밀번호<input type="password" value={pw.next} onChange={e=>setPw({...pw,next:e.target.value})}/></label>
        <label className="field">새 비밀번호 확인<input type="password" value={pw.confirm} onChange={e=>setPw({...pw,confirm:e.target.value})}/></label>
        <button>비밀번호 변경</button>
      </form>
      {pwMsg&&<p className={pwMsg.includes('변경')?'success':'error'}>{pwMsg}</p>}
    </details>

    {detail && <div className="modal-backdrop no-print" onClick={()=>setDetail(null)}><div className="modal-card" onClick={e=>e.stopPropagation()}>
      <div className="modal-title"><h2>{detail==='dollar'?'이번달 달러 상세':'이번달 원화금액 상세'}</h2><button className="secondary small-button" onClick={()=>setDetail(null)}>닫기</button></div>
      {detailRows.length===0 ? <p className="muted">이번달 입력된 내역이 없습니다.</p> : detailRows.map(r=><div className="detail-row" key={r.day}><span>{now.month}/{r.day}</span><b>{detail==='dollar'?'$':'₩'}{money(r.total)}</b></div>)}
      <div className="detail-total"><span>합계</span><span>{detail==='dollar'?'$':'₩'}{money(detailTotal)}</span></div>
    </div></div>}

    <nav className="bottom-nav no-print">
      <Link href="/input" className="active">🏠<span>입력</span></Link>
      <Link href="/dashboard">📊<span>{isAdmin?'대시보드':'내기록'}</span></Link>
      {isAdmin ? <Link href="/admin/users">👥<span>직원</span></Link> : <a href="#" onClick={(e)=>{e.preventDefault(); document.querySelector('details')?.scrollIntoView({behavior:'smooth'});}}>⚙️<span>설정</span></a>}
      <Link href="/report">🧾<span>매출표</span></Link>
    </nav>
  </main>
}
