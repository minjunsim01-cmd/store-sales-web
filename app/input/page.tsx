'use client';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Sale, UserProfile } from '@/lib/types';
import { getKoreaDateParts } from '@/lib/date';
import { clearSession, getSession } from '@/lib/localAuth';
import Link from 'next/link';

function num(v:string){return Number(String(v).replaceAll(',',''))||0}
function saleTotal(s:Pick<Sale,'creditCard'|'starCard'|'dollar'|'won'>){return (s.creditCard||0)+(s.starCard||0)+(s.dollar||0)+(s.won||0)}

type FormState={creditCard:string;starCard:string;dollar:string;won:string;wonAmount:string};
const emptyForm:FormState={creditCard:'',starCard:'',dollar:'',won:'',wonAmount:''};

export default function InputPage(){
  const [profile,setProfile]=useState<UserProfile|null>(null);
  const [msg,setMsg]=useState('');
  const [now,setNow]=useState(getKoreaDateParts());
  const [form,setForm]=useState<FormState>(emptyForm);
  const [mySales,setMySales]=useState<Sale[]>([]);
  const [editingId,setEditingId]=useState<string|null>(null);

  useEffect(()=>{
    const user = getSession();
    if(!user){ location.href='/login'; return; }
    setProfile(user);
    const timer = setInterval(()=>setNow(getKoreaDateParts()), 30000);
    return () => clearInterval(timer);
  },[]);

  useEffect(()=>{
    if(!profile) return;
    return onSnapshot(query(collection(db,'sales'),where('userId','==',profile.uid)),snap=>{
      const rows = snap.docs.map(d=>({id:d.id,...d.data()} as Sale)).sort((a,b)=>(b.date || '').localeCompare(a.date || ''));
      setMySales(rows);
    });
  },[profile]);

  async function save(e:FormEvent){
    e.preventDefault();
    if(!profile)return;
    const kDate = getKoreaDateParts();
    const payload={
      date:kDate.date,
      year:kDate.year,
      month:kDate.month,
      day:kDate.day,
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
      setEditingId(null);
    }else{
      await addDoc(collection(db,'sales'),{...payload,createdAt:serverTimestamp()});
      setMsg('저장되었습니다.');
    }
    setForm(emptyForm);
  }

  function startEdit(s:Sale){
    setEditingId(s.id || null);
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

  function cancelEdit(){ setEditingId(null); setForm(emptyForm); setMsg(''); }
  function logout(){ clearSession(); location.href='/login'; }

  return <main className="container">
    <div className="nav no-print">
      <Link href="/dashboard">대시보드</Link>
      <Link href="/report">월별 매출표</Link>
      {profile?.role !== 'staff' && <Link href="/admin/users">직원 관리</Link>}
      <button type="button" className="nav-button" onClick={logout}>로그아웃</button>
    </div>
    <div className="card mobile-card">
      <img src="/logo.png" alt="BBQ Outpost" className="small-logo" />
      <h1>{editingId ? '매출 수정' : '매출 입력'}</h1>
      <p>날짜: <b>{now.date}</b> <span className="muted">한국 시간 자동 적용</span></p>
      <p>담당자: <b>{profile?.name}</b></p>
      <form onSubmit={save} className="grid one">
        <label className="field">크레딧카드<input inputMode="numeric" value={form.creditCard} onChange={e=>setForm({...form,creditCard:e.target.value})}/></label>
        <label className="field">스타카드<input inputMode="numeric" value={form.starCard} onChange={e=>setForm({...form,starCard:e.target.value})}/></label>
        <label className="field">달러<input inputMode="decimal" value={form.dollar} onChange={e=>setForm({...form,dollar:e.target.value})}/></label>
        <label className="field">원화<input inputMode="numeric" value={form.won} onChange={e=>setForm({...form,won:e.target.value})}/></label>
        <label className="field">원화금액 <span className="muted">일별매출 합산 제외</span><input inputMode="numeric" value={form.wonAmount} onChange={e=>setForm({...form,wonAmount:e.target.value})}/></label>
        <button className="primary">{editingId ? '수정 저장' : '저장'}</button>
        {editingId && <button type="button" className="secondary" onClick={cancelEdit}>수정 취소</button>}
      </form>
      {msg&&<p className="success">{msg}</p>}
    </div>

    <div className="card">
      <h2>내 입력 내역</h2>
      <p className="muted">직원은 본인이 입력한 매출만 수정할 수 있습니다.</p>
      <table className="sales-table compact-table">
        <thead><tr><th>날짜</th><th>크레딧카드</th><th>스타카드</th><th>달러</th><th>원화</th><th>원화금액</th><th>일별매출</th><th>수정</th></tr></thead>
        <tbody>{mySales.slice(0,20).map(s=><tr key={s.id}>
          <td>{s.date}</td><td>{s.creditCard?.toLocaleString()}</td><td>{s.starCard?.toLocaleString()}</td><td>{s.dollar?.toLocaleString()}</td><td>{s.won?.toLocaleString()}</td><td>{s.wonAmount?.toLocaleString()}</td><td>{saleTotal(s).toLocaleString()}</td><td><button type="button" className="small-button" onClick={()=>startEdit(s)}>수정</button></td>
        </tr>)}</tbody>
      </table>
    </div>
  </main>
}
