'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import Link from 'next/link';

function num(v:string){return Number(String(v).replaceAll(',',''))||0}
export default function InputPage(){
  const [profile,setProfile]=useState<UserProfile|null>(null); const [msg,setMsg]=useState('');
  const today=new Date().toISOString().slice(0,10);
  const [form,setForm]=useState({date:today,creditCard:'',starCard:'',dollar:'',won:'',memo:''});
  useEffect(()=>onAuthStateChanged(auth,async user=>{ if(!user){location.href='/login';return} const snap=await getDoc(doc(db,'users',user.uid)); const data=snap.data() as Omit<UserProfile,'uid'>|undefined; setProfile({uid:user.uid,name:data?.name||user.email||'직원',role:data?.role||'staff',storeName:data?.storeName||'본점'}); }),[]);
  async function save(e:React.FormEvent){
    e.preventDefault(); if(!profile)return;
    const d=new Date(form.date); const sale={date:form.date,year:d.getFullYear(),month:d.getMonth()+1,day:d.getDate(),creditCard:num(form.creditCard),starCard:num(form.starCard),dollar:num(form.dollar),won:num(form.won),memo:form.memo,managerName:profile.name,userId:profile.uid,storeName:profile.storeName,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
    await addDoc(collection(db,'sales'),sale); setMsg('저장되었습니다.'); setForm({...form,creditCard:'',starCard:'',dollar:'',won:'',memo:''});
  }
  return <main className="container"><div className="nav no-print"><Link href="/dashboard">대시보드</Link><Link href="/report">월별 매출표</Link></div><div className="card"><h1>매출 입력</h1><p>담당자: <b>{profile?.name}</b> / 매장: <b>{profile?.storeName}</b></p><form onSubmit={save} className="grid"><label className="field">날짜<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required /></label><label className="field">크레딧카드<input inputMode="numeric" value={form.creditCard} onChange={e=>setForm({...form,creditCard:e.target.value})}/></label><label className="field">스타카드<input inputMode="numeric" value={form.starCard} onChange={e=>setForm({...form,starCard:e.target.value})}/></label><label className="field">달러<input inputMode="decimal" value={form.dollar} onChange={e=>setForm({...form,dollar:e.target.value})}/></label><label className="field">원화<input inputMode="numeric" value={form.won} onChange={e=>setForm({...form,won:e.target.value})}/></label><label className="field">메모<textarea value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})}/></label><button>저장</button></form>{msg&&<p>{msg}</p>}</div></main>
}
