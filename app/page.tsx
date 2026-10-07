import Link from "next/link";
const mockTests = Array.from({ length: 20 }, (_, index) => index + 1);
const availableTests = new Set(mockTests);

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7f6] text-[#202124]">
      <header className="sticky top-0 z-20 border-b border-[#e7e2df] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" aria-label="Excel Institute IELTS home" className="flex items-center">
            <img
              src="/images/excel-institute-logo.jpg"
              alt="Excel Institute"
              className="h-11 w-[118px] object-contain sm:h-12 sm:w-[128px]"
            />
            <span className="ml-3 hidden border-l border-[#e5e5e5] pl-3 text-sm font-semibold leading-5 text-[#343434] sm:block">
              IELTS<br />Mock Tests
            </span>
          </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-5 text-sm font-medium sm:gap-8">
            <Link href="#mock-tests" className="text-[#4b4b4b] transition hover:text-[#7a1f2b]">Mock Tests</Link>
            <Link href="#about" className="text-[#4b4b4b] transition hover:text-[#7a1f2b]">About</Link>
            <Link href="#mock-tests" className="rounded-md bg-[#7a1f2b] px-4 py-2.5 text-white transition hover:bg-[#641923]">Start a test</Link>
          </nav>
        </div>
      </header>

      <section className="overflow-hidden bg-[#741e2b] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-[#f7e9ea]">
              Excel Institute · IELTS Practice
            </p>
            <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[56px]">
              Prepare IELTS with confidence.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#f2dfe1] sm:text-lg">
              Practice with IELTS mock tests designed to help you experience the test format and build confidence before exam day.
            </p>
            <Link href="#mock-tests" className="mt-8 inline-flex items-center gap-3 rounded-lg bg-white px-6 py-3.5 text-[15px] font-bold text-[#741e2b] shadow-sm transition hover:bg-[#f8eeee]">
              Browse mock tests <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/[0.08] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#edcdd1]">Your practice starts here</p>
            <h2 className="mt-3 text-2xl font-semibold">Choose a test and begin</h2>
            <p className="mt-3 text-sm leading-6 text-[#f2dfe1]">Enter your candidate login details to access an available mock test.</p>
            <div className="mt-7 flex items-center gap-4 border-t border-white/20 pt-5">
              <div className="flex -space-x-2" aria-hidden="true">
                {["L", "R", "W"].map((skill) => (
                  <span key={skill} className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#741e2b] bg-white text-sm font-bold text-[#741e2b]">{skill}</span>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold">Listening · Reading · Writing</p>
                <p className="mt-1 text-xs text-[#edcdd1]">Available in Tests 1–20</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="mock-tests" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#8b2635]">Practice library</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#252525]">Choose your mock test</h2>
          </div>
          <p className="text-sm text-[#666]">Select an available test to continue to candidate login.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockTests.map((number) => {
            const isAvailable = availableTests.has(number);
            return (
              <article key={number} className={`group flex min-h-[190px] flex-col rounded-xl border bg-white p-5 transition ${isAvailable ? "border-[#e5d6d8] shadow-sm hover:-translate-y-1 hover:border-[#c8949c] hover:shadow-md" : "border-[#e8e8e8] opacity-80"}`}>
                <div className="flex items-center justify-between">
                  <span className={`grid h-10 w-10 place-items-center rounded-lg text-sm font-bold ${isAvailable ? "bg-[#f7ecee] text-[#7a1f2b]" : "bg-[#f1f1f1] text-[#767676]"}`}>
                    {String(number).padStart(2, "0")}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isAvailable ? "bg-[#edf6ef] text-[#28613a]" : "bg-[#f2f2f2] text-[#777]"}`}>
                    {isAvailable ? "Available" : "Coming soon"}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#292929]">IELTS Mock Test {number}</h3>
                <p className="mt-1 text-sm text-[#777]">Listening, Reading and Writing</p>
                <div className="mt-auto pt-5">
                  {isAvailable ? (
                    <Link href={`/verify?test=${number}`} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#8b2635] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6a1824]">
                      Start Test <span aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <button disabled className="w-full cursor-not-allowed rounded-md bg-[#f1f1f1] px-4 py-2.5 text-sm font-semibold text-[#969696]">Coming Soon</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="about" className="scroll-mt-24 border-y border-[#ece7e5] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#8b2635]">Built for practice</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">A clear way to prepare</h2>
            <p className="mt-3 text-base leading-7 text-[#666]">Work through each section in a focused test environment and review your progress.</p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { number: "01", title: "Timed practice", text: "Work through questions with a countdown timer." },
              { number: "02", title: "Listening section", text: "Follow the audio and answer as you listen." },
              { number: "03", title: "Reading section", text: "Read passages and answer IELTS-style questions." },
              { number: "04", title: "Writing section", text: "Respond to both writing tasks in one workspace." },
  
            ].map((feature) => (
              <div key={feature.number} className="rounded-xl border border-[#ece7e5] bg-[#fdfcfb] p-5">
                <span className="text-xs font-bold tracking-widest text-[#9a4551]">{feature.number}</span>
                <h3 className="mt-3 font-bold text-[#2c2c2c]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6c6c6c]">{feature.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-xl bg-[#f7f1f2] p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h3 className="text-xl font-bold text-[#39262a]">Ready to begin?</h3>
              <p className="mt-1 text-sm text-[#6d5b5e]">Choose one of the available mock tests above.</p>
            </div>
            <Link href="#mock-tests" className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#7a1f2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#641923]">View tests <span aria-hidden="true">↑</span></Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#2b2022] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-3">
            <img src="/images/excel-institute-logo.jpg" alt="" className="h-9 w-[96px] object-contain" />
            <span className="text-sm text-white/75">IELTS Mock Tests</span>
          </div>
          <p className="text-xs text-white/60">© 2026 Excel Institute. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
