
import Link from "next/link";

type FeaturePageProps = {
  title: string;
  description: string;
  icon: string;
  children?: React.ReactNode;
};

export default function FeaturePage({
  title,
  description,
  icon,
  children,
}: FeaturePageProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 px-4 py-10 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white bg-white/80 px-4 py-2 font-bold shadow-sm transition hover:bg-white"
        >
          <span>←</span>
          返回首頁
        </Link>

        <section className="mt-8 rounded-[2rem] bg-white/90 p-6 shadow-lg shadow-violet-100 sm:p-10">
          <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-4xl shadow-lg">
            {icon}
          </div>

          <h1 className="mt-6 text-3xl font-black sm:text-4xl">
            {title}
          </h1>

          <p className="mt-3 leading-7 text-slate-500">
            {description}
          </p>

          <div className="mt-8 rounded-2xl border border-violet-100 bg-violet-50/70 p-5 sm:p-6">
            {children ?? (
              <>
                <h2 className="text-lg font-extrabold">功能準備中</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  這個頁面已經建立成功。接下來可以繼續加入遊戲邏輯、
                  資料儲存和實際操作功能。
                </p>
              </>
            )}
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 font-bold text-white transition hover:bg-violet-700"
          >
            返回遊戲大廳
          </Link>
        </section>

        <footer className="mt-8 text-center text-xs text-slate-400">
          Jgamers Sudoku Party
        </footer>
      </div>
    </main>
  );
}
