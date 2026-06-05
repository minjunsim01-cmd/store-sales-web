'use client';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { getKoreaDateParts } from '@/lib/date';
import Link from 'next/link';

function num(v:string){return Number(String(v).replaceAll(',',''))||0}

export default function InputPage(){
  const [profile,setProfile]=useState<UserProfile|null>(null);
  const [msg,setMsg]=useState('');
  const [now,setNow]=useState(getKoreaDateParts());
  const [form,setForm]=useState({creditCard:'',starCard:'',dollar:'',won:'',wonAmount:''});

  useEffect(()=>{
    const timer = setInterval(()=>setNow(getKoreaDateParts()), 30000);
    return () => clearInterval(timer);
  },[]);

  useEffect(()=>onAuthStateChanged(auth,async user=>{
    if(!user){location.href='/login';return}
    const snap=await getDoc(doc(db,'users',user.uid));
    const data=snap.data() as Omit<UserProfile,'uid'>|undefined;
    setProfile({uid:user.uid,name:data?.name||user.displayName||user.email||'직원',role:data?.role||'staff',storeName:data?.storeName||'본점', email:user.email||undefined});
  }),[]);

  async function save(e:FormEvent){
    e.preventDefault();
    if(!profile)return;
    const kDate = getKoreaDateParts();
    const sale={
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
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    };
    await addDoc(collection(db,'sales'),sale);
    setMsg('저장되었습니다.');
    setForm({creditCard:'',starCard:'',dollar:'',won:'',wonAmount:''});
  }

  async function logout(){
    await signOut(auth);
    location.href='/login';
  }

  return <main className="container">
    <div className="nav no-print">
      <Link href="/dashboard">대시보드</Link>
      <Link href="/report">월별 매출표</Link>
      {profile?.role !== 'staff' && <Link href="/admin/users">직원 관리</Link>}
      <button type="button" className="nav-button" onClick={logout}>로그아웃</button>
    </div>
    <div className="card mobile-card">
      <img src="/logo.png" alt="BBQ Outpost" className="small-logo" />
      <h1>매출 입력</h1>
      <p>날짜: <b>{now.date}</b> <span className="muted">한국 시간 자동 적용</span></p>
      <p>담당자: <b>{profile?.name}</b></p>
      <form onSubmit={save} className="grid one">
        <label className="field">크레딧카드<input inputMode="numeric" value={form.creditCard} onChange={e=>setForm({...form,creditCard:e.target.value})}/></label>
        <label className="field">스타카드<input inputMode="numeric" value={form.starCard} onChange={e=>setForm({...form,starCard:e.target.value})}/></label>
        <label className="field">달러<input inputMode="decimal" value={form.dollar} onChange={e=>setForm({...form,dollar:e.target.value})}/></label>
        <label className="field">원화<input inputMode="numeric" value={form.won} onChange={e=>setForm({...form,won:e.target.value})}/></label>
        <label className="field">원화금액 <span className="muted">일별매출 합산 제외</span><input inputMode="numeric" value={form.wonAmount} onChange={e=>setForm({...form,wonAmount:e.target.value})}/></label>
        <button className="primary">저장</button>
      </form>
      {msg&&<p className="success">{msg}</p>}
    </div>
  </main>
}
