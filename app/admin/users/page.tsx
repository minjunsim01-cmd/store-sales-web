'use client';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { clearSession, getSession, userDocId } from '@/lib/localAuth';
import type { UserProfile, UserRole } from '@/lib/types';
import Link from 'next/link';

type UserDoc = UserProfile & { password?: string };

export default function UsersAdmin(){
  const [me,setMe]=useState<UserProfile|null>(null);
  const [users,setUsers]=useState<UserDoc[]>([]);
  const [name,setName]=useState('');
  const [password,setPassword]=useState('');
  const [role,setRole]=useState<UserRole>('staff');
  const [resetPw,setResetPw]=useState<Record<string,string>>({});
  const [msg,setMsg]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{
    const user=getSession();
    if(!user){ location.href='/login'; return; }
    setMe(user);
    if(user.role === 'staff') location.href='/input';
  },[]);

  useEffect(()=>onSnapshot(collection(db,'users'),snap=>setUsers(snap.docs.map(d=>({uid:d.id,...d.data()} as UserDoc)).sort((a,b)=>a.name.localeCompare(b.name)))),[]);

  const canAdmin = useMemo(()=>me?.role === 'admin' || me?.role === 'manager',[me]);

  async function createStaff(e:FormEvent){
    e.preventDefault();
    if(!canAdmin) return;
    setMsg(''); setError('');
    try{
      const cleanName = name.trim();
      const uid = userDocId(cleanName);
      if(!cleanName || password.length < 4) throw new Error('bad input');
      await setDoc(doc(db,'users',uid),{uid,name:cleanName,role,storeName:'본점',password,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
      setName(''); setPassword(''); setRole('staff');
      setMsg(`${cleanName} 계정을 만들었습니다.`);
    }catch(err){
      console.error(err);
      setError('계정 생성에 실패했습니다. 이름과 비밀번호를 확인해주세요.');
    }
  }

  async function resetPassword(u:UserDoc){
    const next=resetPw[u.uid]?.trim();
    if(!next || next.length < 4){ setError('새 비밀번호는 4자리 이상으로 입력해주세요.'); return; }
    await updateDoc(doc(db,'users',u.uid),{password:next,updatedAt:serverTimestamp()});
    setResetPw({...resetPw,[u.uid]:''});
    setError(''); setMsg(`${u.name} 비밀번호를 재설정했습니다.`);
  }

  async function removeUser(u:UserDoc){
    if(u.uid === me?.uid){ setError('현재 로그인한 본인 계정은 삭제할 수 없습니다.'); return; }
    const ok=window.confirm(`${u.name} 계정을 삭제할까요? 기존 매출 기록은 삭제되지 않습니다.`);
    if(!ok) return;
    await deleteDoc(doc(db,'users',u.uid));
    setMsg(`${u.name} 계정을 삭제했습니다.`);
  }

  function logout(){ clearSession(); location.href='/login'; }

  return <main className="container">
    <section className="brand-shell no-print"><div className="brand-row"><div><img src="/logo.png" alt="BBQ Outpost" className="brand-logo"/><h1 className="brand-title">직원 관리</h1><p className="brand-sub">계정 생성 · 비밀번호 재설정 · 삭제</p></div><button className="logout-link" onClick={logout}>로그아웃</button></div></section>
    <div className="nav no-print"><Link href="/input">매출 입력</Link><Link href="/dashboard">대시보드</Link><Link href="/report">월별 매출표</Link><button className="nav-button" onClick={logout}>로그아웃</button></div>
    <div className="card">
      <h2>직원 추가</h2>
      <form className="grid" onSubmit={createStaff}>
        <label className="field">이름<input value={name} onChange={e=>setName(e.target.value)} placeholder="예: 김철수" required /></label>
        <label className="field">임시 비밀번호<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={4} required /></label>
        <label className="field">권한<select value={role} onChange={e=>setRole(e.target.value as UserRole)}><option value="staff">직원</option><option value="manager">매니저</option><option value="admin">관리자</option></select></label>
        <button disabled={!canAdmin}>계정 만들기</button>
      </form>
      {msg&&<p className="success">{msg}</p>}{error&&<p className="error">{error}</p>}
      <p className="muted">직원은 이름과 비밀번호만 입력해서 로그인합니다. 직원 본인도 입력 화면에서 비밀번호를 변경할 수 있습니다.</p>
    </div>
    <div className="card"><h2>직원 목록</h2><div className="admin-card-grid">{users.map(u=><article className="staff-card" key={u.uid}><div className="staff-card-head"><b>{u.name}</b><span className="role-pill">{u.role}</span></div><div className="inline-control"><input type="password" placeholder="새 비밀번호" value={resetPw[u.uid]||''} onChange={e=>setResetPw({...resetPw,[u.uid]:e.target.value})}/><button type="button" className="small-button" onClick={()=>resetPassword(u)}>재설정</button></div><button type="button" className="small-button danger" style={{marginTop:8,width:'100%'}} onClick={()=>removeUser(u)} disabled={u.uid===me?.uid}>삭제</button></article>)}</div></div>
  <nav className="bottom-nav no-print"><Link href="/input">🏠<span>입력</span></Link><Link href="/dashboard">📊<span>대시보드</span></Link><Link href="/admin/users" className="active">👥<span>직원</span></Link><Link href="/report">🧾<span>매출표</span></Link></nav>
  </main>
}
