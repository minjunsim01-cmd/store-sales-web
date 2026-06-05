'use client';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { initializeApp, getApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '@/lib/firebase';
import { makeLocalEmail, normalizeLoginName } from '@/lib/date';
import type { UserProfile, UserRole } from '@/lib/types';
import Link from 'next/link';

type UserDoc = UserProfile & { email?: string };

export default function UsersAdmin(){
  const [me,setMe]=useState<UserProfile|null>(null);
  const [users,setUsers]=useState<UserDoc[]>([]);
  const [name,setName]=useState('');
  const [password,setPassword]=useState('');
  const [role,setRole]=useState<UserRole>('staff');
  const [msg,setMsg]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>onAuthStateChanged(auth,async user=>{
    if(!user){ location.href='/login'; return; }
    const snap=await getDoc(doc(db,'users',user.uid));
    const data=snap.data() as Omit<UserProfile,'uid'>|undefined;
    const profile={uid:user.uid,name:data?.name||user.email||'관리자',role:data?.role||'staff',storeName:data?.storeName||'본점'};
    setMe(profile);
    if(profile.role === 'staff') location.href='/input';
  }),[]);

  useEffect(()=>onSnapshot(collection(db,'users'),snap=>setUsers(snap.docs.map(d=>({uid:d.id,...d.data()} as UserDoc)))),[]);

  const canAdmin = useMemo(()=>me?.role === 'admin' || me?.role === 'manager',[me]);

  async function createStaff(e:FormEvent){
    e.preventDefault();
    if(!canAdmin) return;
    setMsg(''); setError('');
    try{
      const cleanName = name.trim();
      const email = makeLocalEmail(cleanName);
      const appName = `create-user-${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);
      const cred = await createUserWithEmailAndPassword(secondaryAuth,email,password);
      await setDoc(doc(db,'users',cred.user.uid),{name:cleanName,role,storeName:'본점',email});
      await setDoc(doc(db,'loginNames',normalizeLoginName(cleanName)),{uid:cred.user.uid,name:cleanName,email,role});
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      setName(''); setPassword(''); setRole('staff');
      setMsg(`${cleanName} 계정을 만들었습니다.`);
    }catch(err){
      console.error(err);
      setError('계정 생성에 실패했습니다. 이미 같은 이름이 있거나 비밀번호가 너무 짧을 수 있습니다.');
    }
  }

  async function logout(){ await signOut(auth); location.href='/login'; }

  return <main className="container">
    <div className="nav no-print"><Link href="/input">매출 입력</Link><Link href="/dashboard">대시보드</Link><Link href="/report">월별 매출표</Link><button className="nav-button" onClick={logout}>로그아웃</button></div>
    <h1>직원 관리</h1>
    <div className="card">
      <h2>직원 추가</h2>
      <form className="grid" onSubmit={createStaff}>
        <label className="field">이름<input value={name} onChange={e=>setName(e.target.value)} placeholder="예: 김철수" required /></label>
        <label className="field">임시 비밀번호<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required /></label>
        <label className="field">권한<select value={role} onChange={e=>setRole(e.target.value as UserRole)}><option value="staff">직원</option><option value="manager">매니저</option><option value="admin">관리자</option></select></label>
        <button disabled={!canAdmin}>계정 만들기</button>
      </form>
      {msg&&<p className="success">{msg}</p>}{error&&<p className="error">{error}</p>}
    </div>
    <div className="card"><h2>직원 목록</h2><table className="sales-table"><thead><tr><th>이름</th><th>권한</th><th>내부 이메일</th></tr></thead><tbody>{users.map(u=><tr key={u.uid}><td>{u.name}</td><td>{u.role}</td><td>{u.email||''}</td></tr>)}</tbody></table></div>
  </main>
}
