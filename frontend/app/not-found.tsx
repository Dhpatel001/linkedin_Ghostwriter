import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #EBF3FB 50%, #F0F9FF 100%)' }}
    >
      <div
        className="w-16 h-16 rounded-[14px] flex items-center justify-center mb-6"
        style={{
          background: 'linear-gradient(135deg, #0A66C2 0%, #0ea5e9 100%)',
          boxShadow: '0 4px 16px rgba(10,102,194,0.25)',
        }}
      >
        <span className="text-white text-2xl font-black">V</span>
      </div>

      <h1 className="text-6xl font-black text-slate-900 mb-3">404</h1>
      <p className="text-base font-semibold text-slate-700 mb-2">Page not found</p>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-8">
        The page you&apos;re looking for does not exist or has been moved.
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 py-2.5 px-5 text-sm font-semibold text-white bg-linkedin hover:bg-linkedin-hover rounded-[8px] transition-all duration-150 active:scale-[0.97]"
          style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.10), 0 4px 12px rgba(10,102,194,0.22)' }}
        >
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="py-2.5 px-5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-[8px] transition-all duration-150 active:scale-[0.97]"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
