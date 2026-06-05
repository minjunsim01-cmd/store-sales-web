'use client';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Sale, UserProfile } from '@/lib/types';
import { clearSession, getSession } from '@/lib/localAuth';
import Link from 'next/link';

function saleTotal(s:Pick<Sale,'creditCard'|'starCard'|'dollar'|'won'>){return (s.creditCard||0)+(s.starCard||0)+(s.dollar||0)+(s.won||0)}
function num(v:string){return Number(String(v).replaceAll(',',''))||0}
function partsFromDate(date:string){ const d=new Date(`${date}T00:00:00`); return {date,year:d.getFullYear(),month:d.getMonth()+1,day:d.getDate()}; }
type FormState={date:string;creditCard:string;starCard:string;dollar:string;won:string;wonAmount:string};

export default function Dashboard(){
  const [me,setMe]=useState<UserProfile|null>(null);
  const [sales,setSales]=useState<Sale[]>([]);
  const [editing,setEditing]=useState<Sale|null>(null);
  const [form,setForm]=useState<FormState>({date:'',creditCard:'',starCard:'',dollar:'',won:'',wonAmount:''});
  const [msg,setMsg]=useState('');
  const today=new Date();
  const [viewYear,setViewYear]=useState(today.getFullYear());
  const [viewMonth,setViewMonth]=useState(today.getMonth()+1);

  useEffect(()=>{ const user=getSession(); if(!user){location.href='/login'; return;} setMe(user); },[]);
  useEffect(()=>onSnapshot(query(collection(db,'sales'),orderBy('date','desc')),snap=>setSales(snap.docs.map(d=>({id:d.id,...d.data()} as Sale)))),[]);

  const isAdmin = me?.role === 'admin' || me?.role === 'manager';
  const currentSales=sales.filter(s=>s.year===viewYear&&s.month===viewMonth);
  const prevDate = viewMonth === 1 ? {year:viewYear-1,month:12} : {year:viewYear,month:viewMonth-1};
  const prevSales=sales.filter(s=>s.year===prevDate.year&&s.month===prevDate.month);
  const total=(rows:Sale[],k:keyof Sale)=>rows.reduce((sum,s)=>sum+(Number(s[k])||0),0);
  const dailyTotal = (rows:Sale[])=>rows.reduce((sum,s)=>sum+saleTotal(s),0);
  const currentTotal=dailyTotal(currentSales);
  const prevTotal=dailyTotal(prevSales);
  const diff=currentTotal-prevTotal;

  const dailyCompare=useMemo(()=>Array.from({length:31},(_,i)=>{
    const day=i+1;
    const cur=dailyTotal(currentSales.filter(s=>s.day===day));
    const prev=dailyTotal(prevSales.filter(s=>s.day===day));
    return {day,cur,prev,diff:cur-prev};
  }),[currentSales,prevSales]);

  function logout(){ clearSession(); location.href='/login'; }
  function startEdit(s:Sale){
    if(!isAdmin) return;
    setEditing(s);
    setForm({date:s.date,creditCard:String(s.creditCard||''),starCard:String(s.starCard||''),dollar:String(s.dollar||''),won:String(s.won||''),wonAmount:String(s.wonAmount||'')});
    setMsg('');
  }
  function cancelEdit(){ setEditing(null); setMsg(''); }
  async function saveEdit(e:FormEvent){
    e.preventDefault();
    if(!editing?.id || !isAdmin) return;
    const p=partsFromDate(form.date);
    await updateDoc(doc(db,'sales',editing.id),{
      ...p,
      creditCard:num(form.creditCard),
      starCard:num(form.starCard),
      dollar:num(form.dollar),
      won:num(form.won),
      wonAmount:num(form.wonAmount),
      updatedAt:serverTimestamp()
    });
    setMsg('관리자 수정이 저장되었습니다.');
    setEditing(null);
  }
  async function removeSale(s:Sale){
    if(!s.id || !isAdmin) return;
    const ok = window.confirm(`${s.date} ${s.managerName} 기록을 삭제할까요?`);
    if(!ok) return;
    await deleteDoc(doc(db,'sales',s.id));
    setMsg('삭제되었습니다.');
  }

  return <main className="container">
    <div className="nav no-print"><Link href="/input">매출 입력</Link><Link href="/report">월별 매출표</Link>{me?.role !== 'staff' && <Link href="/admin/users">직원 관리</Link>}<button className="nav-button" onClick={logout}>로그아웃</button></div>
    <h1>{isAdmin ? '관리자 대시보드' : '대시보드'}</h1>
    <div className="card no-print">
      <div className="month-picker"><label>연도 <input type="number" value={viewYear} onChange={e=>setViewYear(Number(e.target.value))}/></label><label>월 <input type="number" min="1" max="12" value={viewMonth} onChange={e=>setViewMonth(Number(e.target.value))}/></label></div>
      <p className="muted">선택한 월과 바로 전월을 비교합니다.</p>
    </div>
    <div className="kpi"><div>{viewMonth}월 일별매출 합계<br/><b>{currentTotal.toLocaleString()}</b></div><div>전월 합계<br/><b>{prevTotal.toLocaleString()}</b></div><div>전월 대비<br/><b>{diff.toLocaleString()}</b></div><div>크레딧카드<br/><b>{total(currentSales,'creditCard').toLocaleString()}</b></div><div>스타카드<br/><b>{total(currentSales,'starCard').toLocaleString()}</b></div><div>달러<br/><b>{total(currentSales,'dollar').toLocaleString()}</b></div><div>원화<br/><b>{total(currentSales,'won').toLocaleString()}</b></div><div>원화금액<br/><b>{total(currentSales,'wonAmount').toLocaleString()}</b></div></div>
    {msg&&<p className="success">{msg}</p>}

    <div className="card"><h2>일별 전월 비교</h2><div className="table-scroll"><table className="sales-table compact-table"><thead><tr><th>일자</th><th>{viewMonth}월</th><th>{prevDate.month}월</th><th>차이</th></tr></thead><tbody>{dailyCompare.map(r=><tr key={r.day}><td>{r.day}일</td><td>{r.cur?r.cur.toLocaleString():''}</td><td>{r.prev?r.prev.toLocaleString():''}</td><td>{r.diff?r.diff.toLocaleString():''}</td></tr>)}</tbody></table></div></div>

    {editing && <div className="card no-print">
      <h2>매출 수정</h2>
      <p className="muted">담당자: {editing.managerName}</p>
      <form className="grid" onSubmit={saveEdit}>
        <label className="field">날짜<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
        <label className="field">크레딧카드<input inputMode="numeric" value={form.creditCard} onChange={e=>setForm({...form,creditCard:e.target.value})}/></label>
        <label className="field">스타카드<input inputMode="numeric" value={form.starCard} onChange={e=>setForm({...form,starCard:e.target.value})}/></label>
        <label className="field">달러<input inputMode="decimal" value={form.dollar} onChange={e=>setForm({...form,dollar:e.target.value})}/></label>
        <label className="field">원화<input inputMode="numeric" value={form.won} onChange={e=>setForm({...form,won:e.target.value})}/></label>
        <label className="field">원화금액 <span className="muted">합산 제외</span><input inputMode="numeric" value={form.wonAmount} onChange={e=>setForm({...form,wonAmount:e.target.value})}/></label>
        <div className="button-row"><button>수정 저장</button><button type="button" className="secondary" onClick={cancelEdit}>취소</button></div>
      </form>
    </div>}

    <div className="card"><h2>최근 입력 내역</h2><div className="table-scroll"><table className="sales-table compact-table"><thead><tr><th>날짜</th><th>담당자</th><th>크레딧카드</th><th>스타카드</th><th>달러</th><th>원화</th><th>원화금액</th><th>일별매출</th>{isAdmin&&<th className="no-print">관리</th>}</tr></thead><tbody>{sales.slice(0,80).map(s=><tr key={s.id}><td>{s.date}</td><td>{s.managerName}</td><td>{s.creditCard?.toLocaleString()}</td><td>{s.starCard?.toLocaleString()}</td><td>{s.dollar?.toLocaleString()}</td><td>{s.won?.toLocaleString()}</td><td>{s.wonAmount?.toLocaleString()}</td><td>{saleTotal(s).toLocaleString()}</td>{isAdmin&&<td className="no-print"><div className="table-actions"><button type="button" className="small-button" onClick={()=>startEdit(s)}>수정</button><button type="button" className="small-button danger" onClick={()=>removeSale(s)}>삭제</button></div></td>}</tr>)}</tbody></table></div></div>
  </main>
}
