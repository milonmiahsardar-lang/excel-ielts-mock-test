import SentenceEndings from "./SentenceEndings";
import { HeadingBank, HeadingDrop } from "./HeadingDragAndDrop";
import SummaryWithClues from "./SummaryWithClues";
import type { ReactNode } from "react";

type Props = {
  pane: "passage" | "questions";
  section: number;
  answers: Record<number, string>;
  onAnswer: (number: number, answer: string) => void;
};

const headings = [
  ["i", "Continued breakthroughs in research"],
  ["ii", "Competing claims of originality"],
  ["iii", "The early years of Sir Isaac Newton"],
  ["iv", "The legacy of an exceptional mind"],
  ["v", "Routine life at a 17th century university"],
  ["vi", "Heated academic disputes"],
  ["vii", "A new venture"],
  ["viii", "His crowning achievement"],
  ["ix", "A controversial theory about planets"],
] as const;

const paragraphs = [
  {
    label: "A",
    text: "Isaac Newton was born on January 4, 1643, in Lincolnshire, England. The son of a farmer, who died three months before he was born, Newton spent most of his early years with his maternal grandmother after his mother remarried. Following an education interrupted by a failed attempt to turn him into a farmer, he attended the King’s School in Grantham before enrolling at the University of Cambridge’s Trinity College in 1661, where he soon became fascinated by the works of modern philosophers such as René Descartes. When the Great Plague shut Cambridge off from the rest of England in 1665, Newton returned home and began formulating his theories on calculus, light and color, his farm the setting for the supposed falling apple that inspired his work on gravity.",
  },
  {
    label: "B",
    text: "Newton returned to Cambridge in 1667. He constructed the first reflecting telescope in 1668, and the following year he received his Master of Arts degree and took over as Cambridge’s Professor of Mathematics. In 1671 he was asked to give a demonstration of his telescope to the Royal Society of London in 1671, the same year he was elected to the prestigious Society. The following year, fascinated with the study of light, he published his notes on optics for his peers. Through his experiments, Newton determined that white light was a composite of all the colors on the spectrum, and he asserted that light was composed of particles instead of waves. His methods were heavily criticized by established Society member Robert Hooke, who was also unwilling to compromise again with Newton’s follow-up paper in 1675. Known for his temperamental defense of his work, Newton engaged in heated correspondence with Hooke before suffering a nervous breakdown and withdrawing from the public eye in 1678. In the following years, he returned to his earlier studies on the forces governing gravity.",
  },
  {
    label: "C",
    text: "In 1684, English astronomer Edmund Halley paid a visit to the reclusive Newton. Upon learning that Newton had mathematically worked out the elliptical paths of celestial bodies, such as the movement of the planets around the sun, Halley urged him to organize his notes. The result was the 1687 publication of “Philosophiae Naturalis Principia Mathematica” (Mathematical Principles of Natural Philosophy), which established the three laws of motion and the law of universal gravity. Principia made Newton a star in intellectual circles, eventually earning him widespread acclaim as one of the most important figures in modern science.",
  },
  {
    label: "D",
    text: "As a now influential figure, Newton opposed King James II’s attempts to reinstate Catholic teachings at English Universities, and was elected to represent Cambridge in Parliament in 1689. He moved to London permanently after being named warden of the Royal Mint in 1696, earning a promotion to master of the Mint three years later. Determined to prove his position wasn’t merely symbolic, Newton moved the pound sterling from the silver to the gold standard and sought to punish forgers.",
  },
  {
    label: "E",
    text: "The death of Hooke in 1703 allowed Newton to take over as president of the Royal Society, and the following year he published his second major work, “Opticks.” Composed largely from his earlier notes on the subject, the book detailed Newton’s experiments with refraction and the color spectrum, and also contained his conclusions on such matters as energy and electricity. In 1705, he was knighted by Queen Anne of England.",
  },
  {
    label: "F",
    text: "Around this time, the debate over Newton’s claims to originating the field of calculus, the mathematical study of change, exploded into a nasty dispute. Newton had developed his mathematical concept of ‘fluxions’ (differentials) in the mid-1660s to account for celestial orbits, though there was no public record of his work. In the meantime, German mathematician Gottfried Leibniz formulated his own theories and published them in 1684. As president of the Royal Society, Newton oversaw an investigation that ruled his work to be the founding basis of the field, but the debate continued even after Leibniz’s death in 1716. Researchers later concluded that both men likely arrived at their conclusions independent of one another.",
  },
  {
    label: "G",
    text: "Newton was also obsessed with history and religious doctrines, and his writings on those subjects were collected into multiple books that were published after his death. Having never married, Newton spent his later years living with his niece at Cranbury Park, near Winchester, England. He died on March 31, 1727, and was buried in Westminster Abbey. A giant even among the brilliant minds that drove the Scientific Revolution, Newton is remembered as an extraordinary scholar, inventor and writer. His theories about the movement of bodies in the solar system transformed our understanding of the universe and his precise methodology helped to give birth to what is known as the scientific method. Although his theories of space-time and gravity were eventually superseded by those of Einstein his work remains the foundation stone of modern physics was built.",
  },
];

const antarcticaParagraphs = [
  "The continent of Antarctica makes up most of the Antarctic region. The Antarctic is a cold, remote area in the Southern Hemisphere encompassed by the Antarctic Convergence, an uneven line of latitude where cold, northward-flowing Antarctic waters meet the warmer waters of the world’s oceans. The whole Antarctic region covers approximately 20 percent of the Southern Hemisphere. Antarctica is the fifth-largest continent in terms of total area, larger than both Oceania and Europe. It is unique in that it does not have a native population. There are no countries in Antarctica, although seven nations claim different parts of it: New Zealand, Australia, France, Norway, the United Kingdom, Chile, and Argentina.",
  "The Antarctic Ice Sheet dominates the region. It is the single piece of ice on Earth covering the greatest area. This ice sheet even extends beyond the continent when snow and ice are at their most extreme. The ice surface dramatically expands from about 3 million square kilometers (1.2 million square miles) at the end of summer to about 19 million square kilometers (7.3 million square miles) by winter. Ice sheet growth mainly occurs at the coastal ice shelves, primarily the Ross Ice Shelf and the Ronne Ice Shelf. Ice shelves are floating sheets of ice that are connected to the continent. Glacial ice moves from the continent’s interior to these lower-elevation ice shelves at rates of 10 to 1,000 meters (33-32,808 feet) per year.",
  "Antarctica has numerous mountain summits, including the Transantarctic Mountains, which divide the continent into eastern and western regions. A few of these summits reach altitudes of more than 4,500 meters (14,764 feet). The elevation of the Antarctic Ice Sheet itself is about 2,000 meters (6,562 feet) and reaches 4,000 meters (13,123 feet) above sea level near the center of the continent.",
  "Without any ice, the continent would emerge as two distinct areas: a giant peninsula and archipelago of mountainous islands, known as Lesser Antarctica, and a single large landmass about the size of Australia, known as Greater Antarctica. These regions have different geologies; Greater Antarctica, or East Antarctica, is composed of older, igneous rocks whereas Lesser Antarctica, or West Antarctica, is made up of younger, volcanic rock. Lesser Antarctica, in fact, is part of the “Ring of Fire,” a tectonically active area around the Pacific Ocean. Tectonic activity is the interaction of plates on Earth’s crust, often resulting in earthquakes and volcanoes. Mount Erebus, located on Antarctica’s Ross Island, is the southernmost active volcano on Earth.",
  "Antarctica has an extremely cold, dry climate. Winter temperatures along Antarctica’s coast generally range from -10° Celsius to -30° Celsius (14° Fahrenheit to -22° Fahrenheit). During the summer, coastal areas hover around 0°C (32°F) but can reach temperatures as high as 9°C (48°F). In the mountainous, interior regions, temperatures are much colder, dropping below -60°C (-76°F) in winter and -20°C (-4°F) in summer. In 1983, Russia’s Vostok Research Station measured the coldest temperature ever recorded on Earth: -89.2°C (-128.6°F). An even lower temperature was measured using satellite data taken in 2010: -93.2°C (-135.8°F)",
  "Precipitation in the Antarctic is hard to measure. It always falls as snow. Antarctica’s interior is believed to receive only 50 to 100 millimeters (2-4 inches) of water (in the form of snow) every year. The Antarctic desert is one of the driest deserts in the world. The oceans surrounding Antarctica provide an important physical component of the Antarctic region. The waters surrounding Antarctica are relatively deep, reaching 4,000 to 5,000 meters (13,123 to 16,404 feet) in depth.",
  "The Antarctic region has an important role in global climate processes. It is an integral part of the Earth’s heat balance. This balance, also called the energy balance, is the relationship between the amount of solar heat absorbed by Earth’s atmosphere and the amount deflected back into space. Antarctica has a larger role than most continents in maintaining Earth’s heat balance and ice is more reflective than land or water surfaces. As a result, the massive Antarctic Ice Sheet reflects a large amount of solar radiation away from Earth’s surface. As global ice cover (ice sheets and glaciers) decreases, the reflectivity of Earth’s surface also diminishes. This allows more incoming solar radiation to be absorbed by the Earth’s surface, causing an unequal heat balance linked to global warming, the current period of climate change.",
  "Interestingly, NASA scientists have found that climate change has caused more ice to form in some parts of Antarctica. They say this is happening because of new climate patterns caused by this change, which in turn create a strong wind pattern called the ‘polar vortex.’ These kinds of polar winds lower temperatures in the Antarctic and have been building in strength in recent decades—as much as 15 percent since 1980. This effect is not seen throughout the Antarctic, however, and some parts are experiencing ice melt.",
];

const mindPassageParagraphs = [
  "The idea that we are ignorant of our true selves surged in the 20th century and became common. It's still a commonplace, but it’s changing shape. These days, the bulk of the explanation is done by something else: the ‘dual-process’ model of the brain. We now know that we apprehend the world in two radically opposed ways, employing two fundamentally different modes of thought: ‘System 1’ and ‘System 2’. System 1 is fast; it's intuitive, associative and automatic and it can't be switched off. Its operations involve no sense of intentional control, but it's the ‘secret author of many of the choices and judgments you make’ and it's the hero of Daniel Kahneman's alarming, intellectually stimulating book Thinking, Fast and Slow.",
  "System 2 is slow, deliberate and effortful. Its operations require attention. (To set it going now, ask yourself the question ‘What is 13 x 27?’). System 2 takes over, rather unwillingly, when things get tricky. It's ‘the conscious being you call “I”’, and one of Kahneman's main points is that this is a mistake. You're wrong to identify with System 2, for you are also and equally and profoundly System 1. Kahneman compares System 2 to a supporting character who believes herself to be the lead actor and often has little idea of what's going on.",
  "System 2 is slothful, and tires easily (a process called ‘ego depletion’) – so it usually accepts what System 1 tells it. It's often right to do so, because System 1 is for the most part pretty good at what it does; it's highly sensitive to subtle environmental cues, signs of danger, and so on. It does, however, pay a high price for speed. It loves to simplify, to assume WYSIATI (‘what you see is all there is’). It's hopelessly bad at the kind of statistical thinking often required for good decisions, it jumps wildly to conclusions and it's subject to a fantastic range of irrational cognitive biases and interference effects, such as confirmation bias and hindsight bias, to name but two.",
  "The general point about our self-ignorance extends beyond the details of Systems 1 and 2. We're astonishingly susceptible to being influenced by features of our surroundings. One famous (pre-mobile phone) experiment centred on a New York City phone booth. Each time a person came out of the booth after having made a call, an accident was staged – someone dropped all her papers on the pavement. Sometimes a dime had been placed in the phone booth, sometimes not (a dime was then enough to make a call). If there was no dime in the phone booth, only 4% of the exiting callers helped to pick up the papers. If there was a dime, no fewer than 88% helped.",
  "Since then, thousands of other experiments have been conducted, all to the same general effect. We don't know who we are or what we're like, we don't know what we're really doing and we don't know why we're doing it. For example, judges think they make considered decisions about parole based strictly on the facts of the case. It turns out (to simplify only slightly) that it is their blood-sugar levels really sitting in judgment. If you hold a pencil between your teeth, forcing your mouth into the shape of a smile, you'll find a cartoon funnier than if you hold the pencil pointing forward, by pursing your lips round it in a frown-inducing way.",
  "In an experiment designed to test the ‘anchoring effect’, highly experienced judges were given a description of a shoplifting offence. They were then ‘anchored’ to different numbers by being asked to roll a pair of dice that had been secretly loaded to produce only two totals – three or nine. Finally, they were asked whether the prison sentence for the shoplifting offence should be greater or fewer, in months, than the total showing on the dice. Normally the judges would have made extremely similar judgments, but those who had just rolled nine proposed an average of eight months while those who had rolled three proposed an average of only five months. All were unaware of the anchoring effect.",
  "The same goes for all of us, almost all the time. We think we're smart; we're confident we won't be unconsciously swayed by the high list price of a house. We're wrong. (Kahneman admits his own inability to counter some of these effects.) For example, another systematic error involves ‘duration neglect’ and the ‘peak-end rule’. Looking back on our experience of pain, we prefer a larger, longer amount to a shorter, smaller amount, just so long as the closing stages of the greater pain were easier to bear than the closing stages of the lesser one.",
];

const summaryOptions = [
  ["A", "reflectivity"], ["B", "ice melt"], ["C", "solar radiation"],
  ["D", "polar vortex winds"], ["E", "heat balance"], ["F", "water surfaces"], ["G", "global warming"],
] as const;

const sentenceEndings = [
  ["A", "feeling a certain way at the conclusion of an experience decides how we remember it."],
  ["B", "decision-making and judgments are made too quickly."],
  ["C", "having less energy means we are more likely to succumb to an irrational bias."],
  ["D", "being sensitive to one’s surroundings is a useful survival skill."],
  ["E", "wanting more food or drink may distract us from the decision we are making."],
] as const;

const passageThreeQuestions = [
  { number: 27, prompt: "The dual process model of the brain is", options: ["The common practice of thinking about two things at the same time.", "The conflicting impulses pushing the brain to make both more and less effort.", "The feeling of liking and not liking something simultaneously.", "The natural tendency to make sense of the world in two different ways."] },
  { number: 28, prompt: "System 2 takes charge of decision-making when", options: ["the brain needs a rest.", "more mental effort is required.", "a person feels excessively confident.", "a dangerous situation is developing."] },
  { number: 29, prompt: "‘Confirmation bias’ is an example of", options: ["System 1 rushing to judgment.", "System 1 making a careful judgment.", "System 1 making a brave judgment.", "System 1 judging a situation based on facts."] },
  { number: 30, prompt: "The main conclusion of the phone booth experiment was that", options: ["people are more likely to help someone they are attracted to.", "people are more responsive to their environment than they realize.", "people are more likely to be helpful if they think they will be rewarded.", "people are generally selfish and will always do what is best for themselves."] },
  { number: 31, prompt: "The ‘anchoring effect’ is the process by which", options: ["decisions are made using a numerical system.", "a subconscious factor may strongly influence our decision-making.", "decisions about prison sentences are made by rolling a dice.", "we may emphasize certain factors too much in our decision-making."] },
];

const trueNoQuestions = [
  { number: 32, prompt: "In general, humans have become less rational over the last 100 years." },
  { number: 33, prompt: "Most people lack a clear sense of their own personal identity." },
  { number: 34, prompt: "A person can train themselves to use System 2 most of the time." },
  { number: 35, prompt: "People who make important decisions should be made aware of the dual-process model." },
  { number: 36, prompt: "In most everyday situations, people are capable of making calm and rational decisions." },
];

const paragraphHeadingGroup = {
  options: headings.map(([label, text]) => ({ label, text })),
  questions: "BCDEFG".split("").map((letter, index) => ({ number: index + 1, prompt: "Paragraph " + letter })),
};

export default function TestOneReading({ pane, section, answers, onAnswer }: Props) {
  const input = (number: number) => (
    <input
      id={`question-${number}`}
      aria-label={`Answer for question ${number}`}
      type="text"
      value={answers[number] || ""}
      onChange={(event) => onAnswer(number, event.target.value)}
      className="w-48 max-w-full border border-gray-400 bg-white px-2 py-1 outline-none focus:border-[#2185d0]"
      autoComplete="off"
    />
  );

  const selectAnswer = (number: number, choices: readonly (readonly [string, string])[]) => (
    <select id={`question-${number}`} aria-label={`Answer for question ${number}`} value={answers[number] || ""} onChange={(event) => onAnswer(number, event.target.value)} className="w-48 max-w-full border border-gray-400 bg-white px-2 py-1 outline-none focus:border-[#2185d0]">
      <option value="">Select</option>
      {choices.map(([value, label]) => <option key={value} value={value}>{value} — {label}</option>)}
    </select>
  );

  const numberBadge = (number: number) => (
    <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-sm border border-[#2185d0] bg-white px-1 font-medium leading-none">
      {number}
    </span>
  );

  const shortQuestion = (number: number, content: ReactNode) => (
    <div id={`question-row-${number}`} className="flex scroll-m-6 items-start gap-3 py-3 leading-7">
      {numberBadge(number)}
      <div className="min-w-0">{content}</div>
    </div>
  );

  const radioQuestion = ({ number, prompt, options }: { number: number; prompt: string; options: string[] }) => (
    <div key={number} id={`question-${number}`} className="scroll-m-6 space-y-3 py-4">
      <div className="flex items-start gap-3 leading-7">{numberBadge(number)}<p className="min-w-0 pt-0.5">{prompt}</p></div>
      <div className="space-y-3 pl-11">
        {options.map((option) => <label key={option} className="flex cursor-pointer items-start gap-3 py-1 leading-6"><input className="mt-1.5" type="radio" name={`question-${number}-choice`} value={option} checked={answers[number] === option} onChange={() => onAnswer(number, option)} /><span>{option}</span></label>)}
      </div>
    </div>
  );

  if (pane === "passage") {
    if (section === 1) return (
      <article className="space-y-4 px-5 py-4 text-[16px] leading-6">
        <p>You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.</p>
        <h2 className="text-center text-xl font-bold">The Life of Sir Isaac Newton</h2>
        {paragraphs.map(({ label, text }) => (
          <section key={label} aria-label={`Paragraph ${label}`} className="scroll-m-6 space-y-2">
            <div className="flex items-center gap-2"><h3 className="shrink-0 font-bold">{label}</h3><HeadingDrop scope="reading-1-headings" group={paragraphHeadingGroup} paragraph={label} answers={answers} onAnswer={onAnswer} /></div>
            <p>{text}</p>
          </section>
        ))}
      </article>
    );
    if (section === 2) return (
      <article className="space-y-4 px-5 py-4 text-[16px] leading-6">
        <p>You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.</p>
        <h2 className="text-center text-xl font-bold">The Geography of Antarctica</h2>
        {antarcticaParagraphs.map((text, index) => <p key={index}>{text}</p>)}
      </article>
    );
    return (
      <article className="space-y-4 px-5 py-4 text-[16px] leading-6">
        <p>You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.</p>
        {mindPassageParagraphs.map((text, index) => <p key={index}>{text}</p>)}
      </article>
    );
  }

  if (section === 2) return (
    <div className="space-y-8 px-5 py-5 text-[16px] leading-7">
      <section className="space-y-5" aria-label="Questions 14 to 17">
        <h2 className="font-bold">Questions 14–17</h2>
        <p>Answer the questions below. Choose NO MORE THAN TWO WORDS from the passage for each answer.</p>
        {shortQuestion(14, <>Antarctica’s location far from other continents means that it is very {input(14)}.</>)}
        {shortQuestion(15, <>Antarctica is alone among the continents in having no {input(15)}.</>)}
        {shortQuestion(16, <>The Antarctic ice sheet holds the record as the largest {input(16)} ice sheet on Earth.</>)}
        {shortQuestion(17, <>{input(17)} are blocks of ice connected to the Antarctic ice sheet.</>)}
      </section>
      <section className="space-y-5" aria-label="Questions 18 to 21">
        <h2 className="font-bold">Questions 18–21</h2>
        <p>Do the following statements agree with the information in the passage? Choose TRUE, FALSE, or NOT GIVEN.</p>
        {[
          { number: 18, prompt: "Some of Antarctica’s mountains are popular with climbers." },
          { number: 19, prompt: "The temperature in Antarctica never rises above 0°C." },
          { number: 20, prompt: "Antarctica constitutes around one-fifth of the southern half of the world." },
          { number: 21, prompt: "Rain in Antarctica is rare but falls occasionally." },
        ].map(({ number, prompt }) => radioQuestion({ number, prompt, options: ["TRUE", "FALSE", "NOT GIVEN"] }))}
      </section>
      <section className="space-y-5" aria-label="Questions 22 to 26">
        <h2 className="font-bold">Questions 22–26</h2>
        <p>Complete the summary using the list of words A–G below. Write the correct letter, A–G, for each answer.</p>
        <h3 className="text-center font-bold">Antarctica and the Changing Climate</h3>
        <SummaryWithClues
          paragraphs={["Antarctica plays an important role in regulating the Earth’s climate through the process of {{22}}. {{23}} is diverted away from the Earth by the huge Antarctic ice sheet.","As the size and {{24}} of the ice sheet have decreased, {{25}} has caused melting in some parts of the continent.","However, other areas of Antarctica have experienced falling temperatures in recent years, due to {{26}}, climate patterns leading to reduced temperatures."]}
          options={summaryOptions.map(([label, text]) => ({ label, text }))}
          answers={answers} onAnswer={onAnswer} optionTitle="Options"
        />
      </section>
    </div>
  );

  if (section === 3) return (
    <div className="space-y-8 px-5 py-5 text-[16px] leading-7">
      <section className="space-y-5" aria-label="Questions 27 to 31">
        <h2 className="font-bold">Questions 27–31</h2>
        <p>Choose the correct answer, A, B, C or D.</p>
        {passageThreeQuestions.map(radioQuestion)}
      </section>
      <section className="space-y-5" aria-label="Questions 32 to 36">
        <h2 className="font-bold">Questions 32–36</h2>
        <p>Do the following statements agree with the claims of the writer? Choose TRUE, NO, or NOT GIVEN.</p>
        {trueNoQuestions.map(({ number, prompt }) => radioQuestion({ number, prompt, options: ["TRUE", "NO", "NOT GIVEN"] }))}
      </section>
      <section className="space-y-5" aria-label="Questions 37 to 39">
        <h2 className="font-bold">Questions 37–39</h2>
        <p>Complete each sentence with the correct ending, A–E. Write the correct letter for each answer.</p>
        <SentenceEndings questions={[{"number":37,"prompt":"In the course of evolutionary history System 1 has served humans well because"},{"number":38,"prompt":"Low blood sugar or tiredness may be factors in decision making because"},{"number":39,"prompt":"The ‘peak-end rule’ shows us that"}]} options={sentenceEndings.map(([label, text]) => ({ label, text }))} answers={answers} onAnswer={onAnswer} />
      </section>
      <section className="space-y-5" aria-label="Question 40">
        <h2 className="font-bold">Question 40</h2>
        <p>Choose the correct answer, A, B, C or D.</p>
        {radioQuestion({ number: 40, prompt: "What is the writer’s primary purpose in writing this article?", options: ["to introduce their own research to the general reader", "to summarize and review a recently published book", "to argue against a commonly held theory", "to encourage readers to question their own decision-making processes"] })}
      </section>
    </div>
  );

  return (
    <div className="space-y-8 px-5 py-5 text-[16px] leading-7">
      <section className="space-y-5" aria-label="Questions 1 to 6">
        <div className="space-y-1">
          <h2 className="font-bold">Questions 1–6</h2>
          <p>The text has seven paragraphs labelled A–G.</p>
          <p>Choose the correct headings for paragraphs B–G from the list below.</p>
          <p>Write the correct number, i–ix, in boxes 1–6.</p>
        </div>
        <h3 className="font-bold">List of Headings</h3><HeadingBank scope="reading-1-headings" group={paragraphHeadingGroup} answers={answers} onAnswer={onAnswer} />
      </section>

      <section className="space-y-5" aria-label="Questions 7 and 8">
        <h2 className="font-bold">Questions 7–8</h2>
        <p>Answer the questions below. Choose NO MORE THAN TWO WORDS from the passage for each answer.</p>
        {shortQuestion(7, <>With which scientific organization was Newton associated for much of his career? {input(7)}</>)}
        {shortQuestion(8, <>With whom did Newton live as he got older? {input(8)}</>)}
      </section>

      <section className="space-y-5" aria-label="Questions 9 to 13">
        <h2 className="font-bold">Questions 9–13</h2>
        <p>Complete the notes below. Choose ONE WORD from the passage for each answer.</p>
        <h3 className="font-bold">Sir Isaac Newton’s achievements</h3>
        <ul className="list-disc space-y-3 pl-6">
          <li className="flex items-start gap-3 py-3">{numberBadge(9)}<span>Created first reflecting {input(9)}, subsequently made a professor at Cambridge at the age of 25.</span></li>
          <li className="flex items-start gap-3 py-3">{numberBadge(10)}<span>Helped develop the scientific method with his experiments in {input(10)}, the study of light; showed that it is {numberBadge(11)} {input(11)}, not waves, that constitute light.</span></li>
          <li className="flex items-start gap-3 py-3">{numberBadge(12)}<span>Worked out the laws of the movement of bodies in space (planets etc.), published Principia Mathematica with laws of gravity and {input(12)}.</span></li>
          <li className="flex items-start gap-3 py-3">{numberBadge(13)}<span>Joint founder (with Leibniz) of {input(13)}, a new branch of mathematics.</span></li>
        </ul>
      </section>
    </div>
  );
}
