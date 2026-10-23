type Props = {
  part: number;
  answers: Record<number, string>;
  updateAnswer: (number: number, value: string) => void;
};

type ChoiceQuestion = {
  number: number;
  prompt: string;
  options: string[];
};

type SentenceQuestion = {
  number: number;
  before: string;
  after?: string;
};

const answerStyle = "h-9 w-44 max-w-full border border-[#2185d0] bg-white px-2 text-[16px] outline-none focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]";
const cellStyle = "border border-[#777] px-3 py-3 align-top";

const busTourSentences: SentenceQuestion[] = [
  { number: 15, before: "You need to have a", after: "to buy a ticket for £10." },
  { number: 16, before: "The bus tour lasts", after: "in total." },
  { number: 17, before: "The cost of the bus ticket includes entrance to the", after: "." },
  { number: 18, before: "You can listen to an audio commentary which has been made by the", after: "." },
  { number: 19, before: "If the weather is wet, it is a good idea to bring", after: "." },
  { number: 20, before: "Don’t forget to bring your", after: "when you book online." },
];

const discussionQuestions: ChoiceQuestion[] = [
  {
    number: 21,
    prompt: "Dave Hadley says that the computer system has",
    options: ["too many users.", "never worked well.", "become outdated."],
  },
  {
    number: 22,
    prompt: "The main problem with the computer system is that it",
    options: ["is too slow.", "stops working.", "displays incorrect data."],
  },
  {
    number: 23,
    prompt: "Timetabling has become an issue because",
    options: [
      "there is not enough time for anyone to do it.",
      "the system does not handle course options.",
      "the courses are constantly changing.",
    ],
  },
  {
    number: 24,
    prompt: "To solve the timetabling issues, Randhir suggests that",
    options: [
      "students should create their own timetables.",
      "Dave should have someone to assist him.",
      "the number of courses should be reduced.",
    ],
  },
  {
    number: 25,
    prompt: "Randhir says that a new system may",
    options: ["need to be trialled.", "still have problems.", "be more economical."],
  },
  {
    number: 26,
    prompt: "Improving the existing system will take",
    options: ["a few weeks.", "four or five months.", "nine months."],
  },
];

const nextSteps: SentenceQuestion[] = [
  { number: 27, before: "Get approval from" },
  { number: 28, before: "Complete a", after: "form" },
  { number: 29, before: "Book a", after: "with the systems analyst" },
  { number: 30, before: "Set up a", after: "with technologies team" },
];

const materialsSections: { title: string; questions: SentenceQuestion[] }[] = [
  {
    title: "Ceramics",
    questions: [
      { number: 31, before: "Ceramics date back approximately", after: "." },
      { number: 32, before: "The first figurines were made in the area of", after: "." },
      { number: 33, before: "Early humans could not use their pots to store", after: "." },
      { number: 34, before: "The Chinese improved the quality of ceramics by mixing", after: "with the clay." },
      { number: 35, before: "Chinese porcelain was also called", after: "." },
      { number: 36, before: "Bottger added quartz and", after: "to clay to make porcelain." },
    ],
  },
  {
    title: "Glass",
    questions: [
      { number: 37, before: "Glass production is similar to clay ceramics apart from the rate of", after: "." },
      { number: 38, before: "The Romans introduced the use of glass to make", after: "." },
    ],
  },
  {
    title: "Concrete",
    questions: [
      { number: 39, before: "The discovery of concrete is probably due to observing reactions of water and", after: "." },
      { number: 40, before: "The ability to build large", after: "contributed to the success of the Roman Empire." },
    ],
  },
];

export default function TestEightListening({ part, answers, updateAnswer }: Props) {
  const answerInput = (number: number) => (
    <input
      id={`question-${number}`}
      aria-label={`Answer for question ${number}`}
      type="text"
      value={answers[number] || ""}
      onChange={(event) => updateAnswer(number, event.target.value)}
      className={`${answerStyle} min-w-0 scroll-m-6 align-middle`}
      autoComplete="off"
    />
  );

  const blank = (number: number, prefix = "") => (
    <span className="inline-flex max-w-full items-center gap-2 align-middle">
      <label htmlFor={`question-${number}`} className="shrink-0 font-bold">{number}</label>
      {prefix && <span>{prefix}</span>}
      {answerInput(number)}
    </span>
  );

  const sentence = ({ number, before, after }: SentenceQuestion) => (
    <p key={number}>
      <label htmlFor={`question-${number}`} className="flex items-start gap-3">
        <b className="shrink-0 pt-1.5">{number}</b>
        <span className="min-w-0 leading-9">
          {before} {answerInput(number)}{after === "." ? "." : after ? ` ${after}` : ""}
        </span>
      </label>
    </p>
  );

  const multipleChoice = ({ number, prompt, options }: ChoiceQuestion) => (
    <div id={`question-${number}`} key={number} className="scroll-m-6">
      <p id={`test8-prompt-${number}`} className="mb-3 flex items-start gap-2">
        <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-sm border border-[#2185d0]">{number}</span>
        <span>{prompt}</span>
      </p>
      <div role="radiogroup" aria-labelledby={`test8-prompt-${number}`} className="ml-3 flex flex-col gap-3">
        {options.map((option, index) => {
          const value = String.fromCharCode(65 + index);
          return (
            <label key={value} className="flex items-start gap-2">
              <input
                type="radio"
                name={`test8-listening-question-${number}`}
                value={value}
                checked={answers[number] === value}
                onChange={() => updateAnswer(number, value)}
                className="mt-1.5 shrink-0"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-3 text-[16px] leading-6">
      {part === 1 && (
        <>
          <section className="space-y-4" aria-label="Questions 1 to 6">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 1–6</h3>
              <p>Complete the notes below.</p>
              <p>Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</p>
            </div>
            <div className="border border-[#777] bg-white">
              <h4 className="border-b border-[#777] px-4 py-3 text-center text-xl font-bold">PRESTON PARK RUN</h4>
              <div className="space-y-3 border-b border-[#777] p-4 sm:p-5">
                <h5 className="font-bold">Details of run</h5>
                <p>Day of Park Run: Saturday</p>
              </div>
              <div className="space-y-4 p-4 sm:p-5">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="w-full sm:w-44">Start of run:</span><span>in front of the {blank(1)}</span></p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="w-full sm:w-44">Time of start:</span>{blank(2)}</p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="w-full sm:w-44">Length of run:</span>{blank(3)}</p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="w-full sm:w-44">At end of run:</span><span>volunteer scans {blank(4)}</span></p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="w-full sm:w-44">Best way to register:</span><span>on the {blank(5)}</span></p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="w-full sm:w-44">Cost of run:</span>{blank(6, "£")}</p>
              </div>
            </div>
          </section>
          <section className="space-y-4" aria-label="Questions 7 to 10">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 7–10</h3>
              <p>Complete the notes below.</p>
              <p>Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</p>
            </div>
            <div className="space-y-4 border border-[#777] bg-white p-4 sm:p-5">
              <h4 className="text-xl font-bold">Volunteering</h4>
              <p>Contact name: Pete {blank(7)}</p>
              <p>Phone number: {blank(8)}</p>
              <p>Activities: setting up course</p>
              <p>{blank(9)} the runners</p>
              <p>{blank(10)} for the weekly report</p>
            </div>
          </section>
        </>
      )}

      {part === 2 && (
        <>
          <section className="space-y-4" aria-label="Questions 11 to 14">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 11–14</h3>
              <p>Complete the table below.</p>
              <p>Write <b>NO MORE THAN THREE WORDS AND/OR A NUMBER</b> for each answer.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse border border-[#777] bg-white text-left">
                <caption className="border border-b-0 border-[#777] px-3 py-3 text-center text-lg font-bold">PACTON-ON-SEA BUS TOUR</caption>
                <thead>
                  <tr><th scope="col" className={cellStyle}>Bus stops</th><th scope="col" className={cellStyle}>Location</th><th scope="col" className={cellStyle}>Things to see</th></tr>
                </thead>
                <tbody>
                  <tr><th scope="row" className={`${cellStyle} font-normal`}>Bus stop 1</th><td className={cellStyle}>train station</td><td className={cellStyle}>start of tour</td></tr>
                  <tr><th scope="row" className={`${cellStyle} font-normal`}>Bus stop 2</th><td className={cellStyle}>the aquarium</td><td className={cellStyle}>dolphins and {blank(11)}</td></tr>
                  <tr><th scope="row" className={`${cellStyle} font-normal`}>Bus stop 3</th><td className={cellStyle}>{blank(12)}</td><td className={cellStyle}>yachts and power boats</td></tr>
                  <tr><th scope="row" className={`${cellStyle} font-normal`}>Bus stop 4</th><td className={cellStyle}>{blank(13)} centre</td><td className={cellStyle}>very old {blank(14)}</td></tr>
                </tbody>
              </table>
            </div>
          </section>
          <section className="space-y-4" aria-label="Questions 15 to 20">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 15–20</h3>
              <p>Complete the sentences below.</p>
              <p>Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</p>
            </div>
            <div className="space-y-4">{busTourSentences.map(sentence)}</div>
          </section>
        </>
      )}

      {part === 3 && (
        <>
          <section className="space-y-5" aria-label="Questions 21 to 26">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 21–26</h3>
              <p>Choose the correct answer.</p>
            </div>
            {discussionQuestions.map(multipleChoice)}
          </section>
          <section className="space-y-4" aria-label="Questions 27 to 30">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 27–30</h3>
              <p>Complete the flow-chart below.</p>
              <p>Write <b>NO MORE THAN TWO WORDS</b> for each answer.</p>
            </div>
            <ol className="mx-auto max-w-3xl list-none" aria-label="Next steps">
              {nextSteps.map(({ number, before, after }, index) => (
                <li key={number}>
                  {index > 0 && <div aria-hidden="true" className="py-1 text-center text-3xl font-bold leading-8">↓</div>}
                  <div className="border border-[#777] bg-white px-4 py-3 text-center leading-9">
                    {index === 0 && <h4 className="mb-1 font-bold">Next steps</h4>}
                    <p>{before} {blank(number)}{after ? ` ${after}` : ""}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      {part === 4 && (
        <section className="space-y-5 border border-[#777] bg-white p-4 sm:p-5" aria-label="Questions 31 to 40">
          <div className="space-y-1">
            <h3 className="font-bold">Questions 31–40</h3>
            <p>Complete the sentences below.</p>
            <p>Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</p>
          </div>
          {materialsSections.map(({ title, questions }) => (
            <div key={title} className="space-y-4">
              <h4 className="text-lg font-bold">{title}</h4>
              {questions.map(sentence)}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
