import Link from "next/link";
import HomepageBanner from "./HomepageBanner";
import styles from "./homepage.module.css";

export const dynamic = "force-dynamic";
const mockTests = Array.from({ length: 20 }, (_, index) => index + 1);
const features = [
  { title: "Listening section", text: "Follow the audio and answer as you listen.", image: "/images/homepage-listening.png" },
  { title: "Reading section", text: "Read passages and answer IELTS-style questions.", image: "/images/homepage-reading.png" },
  { title: "Writing section", text: "Respond to both writing tasks in one workspace.", image: "/images/homepage-writing.png" },
];
function Arrow() { return <span aria-hidden="true" className={styles.arrow}>&#8594;</span>; }

export default function Home() {
  return <main className={styles.home}>
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.masthead}`}>
        <Link href="/" aria-label="Excel Institute IELTS home" className={styles.logo}><img src="/images/excel-institute-logo.jpg" alt="Excel Institute" /><span className={styles.headerTestTitle}>IELTS Mock Test</span></Link>
        <div className={styles.loginLinks}>
          <Link href="/verify"><svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="6" r="3" /><path d="M4 17v-2a6 6 0 0 1 12 0v2z" /></svg>Candidate Login</Link>
          <Link href="/admin/login"><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m8 1-1 3-3 1 1 3-3 2 3 2-1 3 3 1 1 3 3-1 1-3 3-1-1-3 3-2-3-2 1-3-3-1-1-3z" /><circle cx="10" cy="10" r="3" fill="white" /></svg>Admin Login</Link>
        </div>
      </div>
      <nav className={styles.navigation} aria-label="Main navigation"><div className={styles.container}>
        <Link href="/" aria-current="page">Home</Link><Link href="#mock-tests">Mock Tests</Link><Link href="#about">About</Link><Link href="#mock-tests">Start a test</Link>
      </div></nav>
    </header>

    <HomepageBanner>
      <p className={styles.eyebrow}>Excel Institute &middot; IELTS Practice</p>
      <h1>Prepare IELTS with confidence.</h1>
      <p>Practice with IELTS mock tests designed to help you experience the test format and build confidence before exam day.</p>
      <Link href="#mock-tests" className={styles.primaryButton}><span>Browse mock tests</span><Arrow /></Link>
    </HomepageBanner>

    <section id="about" className={styles.welcome}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>Your practice starts here</p>
        <h2>Choose a test and begin</h2>
        <p className={styles.intro}>Enter your candidate login details to access an available mock test.<br />Work through each section in a focused test environment and review your progress.</p>
        <div className={styles.skillCards}>{features.map((feature) => <article key={feature.title} className={styles.skillCard}>
          <img src={feature.image} alt="" />
          <div className={styles.skillCardBody}><div><h3>{feature.title}</h3><p>{feature.text}</p></div><Link href="#mock-tests" aria-label={`View mock tests for the ${feature.title.toLowerCase()}`}><Arrow /></Link></div>
        </article>)}</div>
        <p className={styles.practiceNote}><strong>Built for practice &middot; A clear way to prepare &middot; Timed practice</strong><span>Work through questions with a countdown timer.</span></p>
      </div>
    </section>

    <section id="mock-tests" className={styles.tests}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>Practice library</p>
        <h2>Choose your mock test</h2>
        <p className={styles.intro}>Select an available test to continue to candidate login.</p>
        <p className={styles.testSummary}>Listening, Reading and Writing &middot; Tests 1&ndash;20 &middot; ready tests available below</p>
        <div className={styles.testGrid}>{mockTests.map((number) => <article key={number} className={styles.testTile}>
          <div className={styles.testCardTop}><span className={styles.testNumber}>{String(number).padStart(2, "0")}</span><span className={styles.available}>Available</span></div>
          <h3>IELTS Mock Test {number}</h3>
          <p>Listening, Reading and Writing</p>
          <Link href={`/verify?test=${number}`} className={styles.testButton} aria-label={`Start Test ${number}`}><span>Start Test</span><Arrow /></Link>
        </article>)}</div>
        <div className={styles.ready}><div><h3>Ready to begin?</h3><p>Choose one of the available mock tests above.</p></div><Link href="#mock-tests" className={styles.testButton}><span>View tests</span><Arrow /></Link></div>
      </div>
    </section>

    <footer id="contact" className={styles.footer}>
      <div className={`${styles.container} ${styles.contactDetails}`}>
        <h2>Contact us</h2>
        <address>
          <a href="mailto:excelinstitute.sylhet@gmail.com">excelinstitute.sylhet@gmail.com</a>
          <a href="tel:+8801711184799">+880 171 118 4799</a>
          <span>Point View Shopping Centre, Amberkhana, Sylhet, 3100</span>
        </address>
      </div>
      <div className={`${styles.container} ${styles.footerContent}`}>
        <div className={styles.footerBrand}><img src="/images/excel-institute-logo.jpg" alt="Excel Institute" /><span>IELTS Mock Tests</span></div>
        <nav aria-label="Footer navigation"><Link href="/">Home</Link><Link href="#mock-tests">Mock Tests</Link><Link href="#about">About</Link></nav>
        <p>&copy; 2026 Excel Institute. All rights reserved.</p>
      </div>
    </footer>
  </main>;
}
