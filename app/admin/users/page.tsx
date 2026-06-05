'use client';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
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
  const [msg,setMsg]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{
    const user=getSession();
    if(!user){ location.href='/login'; return; }
    setMe(user);
    if(user.role === 'staff') location.href='/input';
  },[]);

  useEffect(()=>onSnapshot(collection(db,'users'),snap=>setUsers(snap.docs.map(d=>({uid:d.id,...d.data()} as UserDoc)))),[]);

  const canAdmin = useMemo(()=>me?.role === 'admin' || me?.role === 'manager',[me]);

  async function createStaff(e:FormEvent){
    e.preventDefault();
    if(!canAdmin) return;
    setMsg(''); setError('');
    try{
      const cleanName = name.trim();
      const uid = userDocId(cleanName);
      if(!cleanName || password.length < 4) throw new Error('bad input');
      await setDoc(doc(db,'users',uid),{uid,name:cleanName,role,storeName:'본점',password});
      setName(''); setPassword(''); setRole('staff');
      setMsg(`${cleanName} 계정을 만들었습니다.`);
    }catch(err){
      console.error(err);
      setError('계정 생성에 실패했습니다. 이름과 비밀번호를 확인해주세요.');
    }
  }

  function logout(){ clearSession(); location.href='/login'; }

  return <main className="container">
    <div className="nav no-print"><Link href="/input">매출 입력</Link><Link href="/dashboard">대시보드</Link><Link href="/report">월별 매출표</Link><button className="nav-button" onClick={logout}>로그아웃</button></div>
    <h1>직원 관리</h1>
    <div className="card">
      <h2>직원 추가</h2>
      <form className="grid" onSubmit={createStaff}>
        <label className="field">이름<input value={name} onChange={e=>setName(e.target.value)} placeholder="예: 김철수" required /></label>
        <label className="field">비밀번호<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={4} required /></label>
        <label className="field">권한<select value={role} onChange={e=>setRole(e.target.value as UserRole)}><option value="staff">직원</option><option value="manager">매니저</option><option value="admin">관리자</option></select></label>
        <button disabled={!canAdmin}>계정 만들기</button>
      </form>
      {msg&&<p className="success">{msg}</p>}{error&&<p className="error">{error}</p>}
      <p className="muted">직원은 이름과 비밀번호만 입력해서 로그인합니다.</p>
    </div>
    <div className="card"><h2>직원 목록</h2><table className="sales-table"><thead><tr><th>이름</th><th>권한</th><th>비밀번호</th></tr></thead><tbody>{users.map(u=><tr key={u.uid}><td>{u.name}</td><td>{u.role}</td><td>{u.password ? '설정됨' : ''}</td></tr>)}</tbody></table></div>
  </main>
}
