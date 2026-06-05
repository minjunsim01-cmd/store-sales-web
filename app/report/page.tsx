'use client';
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { clearSession, getSession } from '@/lib/localAuth';
import type { Sale } from '@/lib/types';
import Link from 'next/link';

const weekdays=['일','월','화','수','목','금','토'];
const blank=(day:number,year:number,month:number)=>({day,weekday:weekdays[new Date(year,month-1,day).getDay()],creditCard:0,starCard:0,dollar:0,won:0,wonAmount:0,dailySales:0,managerName:''});

export default function Report(){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth()+1);
  const [sales,setSales]=useState<Sale[]>([]);

  useEffect(()=>{ if(!getSession()) location.href='/login'; },[]);
  useEffect(()=>onSnapshot(query(collection(db,'sales'),where('year','==',year),where('month','==',month)),snap=>setSales(snap.docs.map(d=>({id:d.id,...d.data()} as Sale)))),[year,month]);

  const rows=useMemo(()=>Array.from({length:31},(_,i)=>{
    const day=i+1;
    const list=sales.filter(s=>s.day===day);
    const row=blank(day,year,month);
    row.creditCard=list.reduce((a,s)=>a+(s.creditCard||0),0);
    row.starCard=list.reduce((a,s)=>a+(s.starCard||0),0);
    row.dollar=list.reduce((a,s)=>a+(s.dollar||0),0);
    row.won=list.reduce((a,s)=>a+(s.won||0),0);
    row.wonAmount=list.reduce((a,s)=>a+(s.wonAmount||0),0);
    row.dailySales=row.creditCard+row.starCard+row.dollar+row.won;
    row.managerName=Array.from(new Set(list.map(s=>s.managerName).filter(Boolean))).join(', ');
    return row;
  }),[sales,year,month]);

  const money=(n:number)=>n?Math.round(n).toLocaleString():'';
  const totals=rows.reduce((a,r)=>({creditCard:a.creditCard+r.creditCard,starCard:a.starCard+r.starCard,dollar:a.dollar+r.dollar,won:a.won+r.won,wonAmount:a.wonAmount+r.wonAmount,dailySales:a.dailySales+r.dailySales}),{creditCard:0,starCard:0,dollar:0,won:0,wonAmount:0,dailySales:0});
  function logout(){ clearSession(); location.href='/login'; }

  return <main className="container report-container">
    <section className="brand-shell no-print"><div className="brand-row"><div><img src="/logo.png" alt="BBQ Outpost" className="brand-logo"/><h1 className="brand-title">월별 매출표</h1><p className="brand-sub">모바일은 요약, 인쇄는 회사 양식</p></div><button className="logout-link" onClick={logout}>로그아웃</button></div></section>
    <div className="nav no-print">
      <Link href="/input">매출 입력</Link>
      <Link href="/dashboard">대시보드</Link>
      <Link href="/admin/users">직원 관리</Link>
      <button className="nav-button" onClick={logout}>로그아웃</button>
    </div>
    <div className="card">
      <div className="print-actions no-print">
        <label>연도 <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))}/></label>{' '}
        <label>월 <input type="number" min="1" max="12" value={month} onChange={e=>setMonth(Number(e.target.value))}/></label>{' '}
        <button onClick={()=>window.print()}>인쇄 / PDF 저장</button>
        <p className="muted">월을 바꾸면 지난달 매출표도 다시 볼 수 있습니다.</p>
      </div>
      <div className="mobile-only no-print card hero-card"><h2 className="section-title">{year}년 {month}월 요약</h2><div className="summary-grid"><div className="summary-card"><strong>일별매출 합계</strong><b>{money(totals.dailySales)}</b></div><div className="summary-card"><strong>누적 달러</strong><b>${money(totals.dollar)}</b></div><div className="summary-card"><strong>누적 원화금액</strong><b>₩{money(totals.wonAmount)}</b></div><div className="summary-card"><strong>크레딧카드</strong><b>{money(totals.creditCard)}</b></div></div><p className="muted">아래 인쇄/PDF 버튼을 누르면 회사 양식 그대로 출력됩니다.</p></div><div className="table-scroll report-scroll desktop-only"><table className="sales-table report-table">
        <thead>
          <tr><th className="report-title" colSpan={9}>매 장 매 출</th></tr>
          <tr><th>연도</th><th>월</th><th colSpan={2}>카 드</th><th colSpan={3}>현 금</th><th>일별매출</th><th>담당자</th></tr>
          <tr><th>{year}</th><th>{month}</th><th>크레딧카드</th><th>스타카드</th><th>달러</th><th>원화</th><th>원화금액</th><th></th><th></th></tr>
        </thead>
        <tbody>
          {rows.map(r=><tr key={r.day}>
            <td colSpan={2}>{r.day}일&nbsp;&nbsp;{r.weekday}요일</td>
            <td>{money(r.creditCard)}</td>
            <td>{money(r.starCard)}</td>
            <td>{money(r.dollar)}</td>
            <td>{money(r.won)}</td>
            <td>{money(r.wonAmount)}</td>
            <td className="daily-cell">{money(r.dailySales)}</td>
            <td className="manager-cell">{r.managerName}</td>
          </tr>)}
        </tbody>
      </table></div>
    </div>
  <nav className="bottom-nav no-print"><Link href="/input">🏠<span>입력</span></Link><Link href="/dashboard">📊<span>대시보드</span></Link><Link href="/admin/users">👥<span>직원</span></Link><Link href="/report" className="active">🧾<span>매출표</span></Link></nav>
  </main>;
}
