function App() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white sm:px-8 lg:px-12">
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-10 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-black/30 backdrop-blur md:flex-row md:items-start md:justify-between md:p-12">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-300">
            StrengthOut Client
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Build your next fitness experience with React, Vite, and Tailwind.
          </h1>
          <p className="mt-6 text-lg text-slate-300">
            This project was created with Vite React TypeScript and Tailwind
            CSS, ready for you to extend into your StrengthOut app.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="https://vite.dev/guide/"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              Vite Docs
            </a>
            <a
              href="https://tailwindcss.com/docs/installation"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/20 px-5 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Tailwind Docs
            </a>
          </div>
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Project ready</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>• React + TypeScript scaffolded with Vite</li>
            <li>• Tailwind CSS installed and configured</li>
            <li>• Starter UI ready for your next feature</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

export default App;
