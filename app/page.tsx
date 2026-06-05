import Link from 'next/link';
export default function Home(){return <main className="login-page"><div className="login-card"><img src="/logo.png" alt="BBQ Outpost" className="login-logo"/><h1>매장세일즈</h1><p>직원 로그인 후 매출을 입력하고 월말 매출표를 인쇄합니다.</p><div className="nav center"><Link href="/login">로그인</Link></div></div></main>}
