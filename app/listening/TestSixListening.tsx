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

const cell = "border border-[#777] px-3 py-3 align-top";
const answerStyle = "h-9 w-44 max-w-full border border-[#2185d0] bg-white px-2 text-[16px] outline-none focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]";
const libraryOptions = [
  "biography",
  "fiction",
  "magazines",
  "newspapers",
  "non-fiction",
  "photocopiers",
  "reference books",
  "study area",
];
const presentationRatings = ["excellent", "acceptable", "poor"];

const libraryQuestions: ChoiceQuestion[] = [
  {
    number: 16,
    prompt: "After two years, library members have to",
    options: [
      "show proof of their current address.",
      "pay for a new membership card.",
      "bring a passport or identity card into the library.",
    ],
  },
  {
    number: 17,
    prompt: "What happens if you reserve a book?",
    options: [
      "It will be available after five days.",
      "You can collect it a week later.",
      "You will be contacted when it is available.",
    ],
  },
  {
    number: 18,
    prompt: "Which materials can be borrowed for one week only?",
    options: ["some reference books", "CD-ROMs", "children’s DVDs"],
  },
  {
    number: 19,
    prompt: "On which day does the library stay open later than it used to?",
    options: ["Wednesday", "Saturday", "Sunday"],
  },
  {
    number: 20,
    prompt: "Large bags should be left on the",
    options: ["first floor.", "second floor.", "third floor."],
  },
];

const presentationQuestions: ChoiceQuestion[] = [
  {
    number: 21,
    prompt: "Why did Anita and Lee choose to talk about John Chapman?",
    options: [
      "He was Lee’s childhood hero.",
      "They wanted to talk about the USA.",
      "He was relevant to the topic of their studies.",
    ],
  },
  {
    number: 22,
    prompt: "Where did the students record their sources of information?",
    options: ["on their laptops", "on a handout", "on a database"],
  },
  {
    number: 23,
    prompt: "The tutor claims she does not understand whether",
    options: [
      "apples grew in America before Europeans arrived.",
      "the Native Americans had always eaten apples.",
      "American apples were first bred in Europe.",
    ],
  },
  {
    number: 24,
    prompt: "The tutor says the audience was particularly interested to hear about",
    options: [
      "grafting techniques in ancient China.",
      "the cultivation of apples in Kazakhstan.",
      "the spread of apples along the Silk Route.",
    ],
  },
  {
    number: 25,
    prompt: "How will Anita and Lee present their follow-up work?",
    options: ["on the department website", "as a paper", "as a poster"],
  },
];

const presentationSkills = [
  { number: 26, label: "use of equipment" },
  { number: 27, label: "handling software" },
  { number: 28, label: "timing of sections" },
  { number: 29, label: "design of handout" },
  { number: 30, label: "clarity of speech" },
];

export default function TestSixListening({ part, answers, updateAnswer }: Props) {
  const blank = (number: number) => (
    <span className="inline-flex max-w-full items-center gap-2 align-middle">
      <label htmlFor={`question-${number}`} className="shrink-0 font-bold">{number}</label>
      <input
        id={`question-${number}`}
        aria-label={`Answer for question ${number}`}
        type="text"
        value={answers[number] || ""}
        onChange={(event) => updateAnswer(number, event.target.value)}
        className={`${answerStyle} min-w-0 scroll-m-6`}
        autoComplete="off"
      />
    </span>
  );

  const matchingAnswer = (number: number, options: string[], prompt?: string) => (
    <div key={number} className="flex flex-wrap items-center gap-2">
      <label htmlFor={`question-${number}`} className="inline-flex items-center gap-2">
        <b>{number}</b>{prompt && <span>{prompt}</span>}
      </label>
      <select
        id={`question-${number}`}
        aria-label={`Answer for question ${number}${prompt ? `: ${prompt}` : ""}`}
        value={answers[number] || ""}
        onChange={(event) => updateAnswer(number, event.target.value)}
        className={`${answerStyle} scroll-m-6`}
      >
        <option value="">Select</option>
        {options.map((option, index) => (
          <option key={option} value={String.fromCharCode(65 + index)}>{option}</option>
        ))}
      </select>
    </div>
  );

  const multipleChoice = ({ number, prompt, options }: ChoiceQuestion) => (
    <div id={`question-${number}`} key={number} className="scroll-m-6">
      <p id={`test6-prompt-${number}`} className="mb-3 flex items-start gap-2">
        <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-sm border border-[#2185d0]">{number}</span>
        <span>{prompt}</span>
      </p>
      <div role="radiogroup" aria-labelledby={`test6-prompt-${number}`} className="ml-3 flex flex-col gap-3">
        {options.map((option, index) => {
          const value = String.fromCharCode(65 + index);
          return (
            <label key={value} className="flex items-start gap-2">
              <input
                type="radio"
                name={`test6-listening-question-${number}`}
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
        <section className="space-y-4" aria-label="Questions 1 to 10">
          <div className="space-y-1">
            <h3 className="font-bold">Questions 1–10</h3>
            <p>Complete the table below.</p>
            <p>Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] table-fixed border-collapse border border-[#777] text-left">
              <caption className="border border-b-0 border-[#777] px-3 py-3 text-center text-xl font-bold">HOSTELS</caption>
              <colgroup><col className="w-1/4" /><col className="w-1/4" /><col className="w-1/4" /><col className="w-1/4" /></colgroup>
              <thead>
                <tr className="bg-[#f2f2f2]">
                  <th scope="col" className={cell}>Name</th>
                  <th scope="col" className={cell}>Location</th>
                  <th scope="col" className={cell}>Cost of double room</th>
                  <th scope="col" className={cell}>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className={`${cell} font-normal`}>Hostelling International West End</th>
                  <td className={cell}>10 minutes from downtown by bus</td>
                  <td className={cell}>$50 per night but only ${blank(1)} for members</td>
                  <td className={cell}>
                    <p className="mb-3">Membership card offers discount on entry to {blank(2)}</p>
                    <p>Internet access costs $3 per {blank(3)}</p>
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={`${cell} font-normal`}>{blank(4)} Hostel</th>
                  <td className={cell}>Near beach. Two-minute walk to {blank(5)}</td>
                  <td className={cell}>$62. Meals extra but only available in {blank(6)}</td>
                  <td className={cell}>
                    <p className="mb-3">Was built as a hotel in {blank(7)}</p>
                    <p>Can hire {blank(8)} from hostel</p>
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={`${cell} font-normal`}>Backpackers Hostel</th>
                  <td className={cell}>In {blank(9)} district</td>
                  <td className={cell}>$45 plus $5 for breakfast</td>
                  <td className={cell}>A {blank(10)} on every floor for guests to use</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {part === 2 && (
        <>
          <section className="space-y-5" aria-label="Questions 11 to 15">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 11–15</h3>
              <p>Label the map below.</p>
              <p>Choose <b>FIVE</b> answers from the list for Questions <b>11–15</b>.</p>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)]">
              <svg
                viewBox="48 414 630 465"
                role="img"
                aria-labelledby="test6-library-map-title test6-library-map-description"
                className="block h-auto w-full overflow-hidden bg-white"
              >
                <title id="test6-library-map-title">Library map for Questions 11–15</title>
                <desc id="test6-library-map-description">Library plan showing the café, gallery, issue desk and information desk. Areas 11, 12 and 13 are on the left, area 14 is at the top centre, and area 15 is at the top right.</desc>
                <image href="/images/test6-library-map-source.png" x="0" y="0" width="725" height="901" />
              </svg>
              <div className="space-y-5">
                <ul aria-label="Library map options" className="grid grid-cols-2 gap-x-4 gap-y-1 border border-[#777] p-4">
                  {libraryOptions.map((option) => <li key={option}>{option}</li>)}
                </ul>
                <div className="space-y-3">
                  {[11, 12, 13, 14, 15].map((number) => matchingAnswer(number, libraryOptions))}
                </div>
              </div>
            </div>
          </section>
          <section className="space-y-5" aria-label="Questions 16 to 20">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 16–20</h3>
              <p>Choose the correct answer.</p>
            </div>
            {libraryQuestions.map(multipleChoice)}
          </section>
        </>
      )}

      {part === 3 && (
        <>
          <section className="space-y-5" aria-label="Questions 21 to 25">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 21–25</h3>
              <p>Choose the correct answer.</p>
            </div>
            {presentationQuestions.map(multipleChoice)}
          </section>
          <section className="space-y-4" aria-label="Questions 26 to 30">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 26–30</h3>
              <p>What do Lee and Anita agree about their presentation skills with their tutor?</p>
              <p>Choose the correct rating from the box for Questions <b>26–30</b>.</p>
            </div>
            <ul aria-label="Rating options" className="mx-auto w-full max-w-sm list-none space-y-1 border border-[#777] bg-white p-4">
              {presentationRatings.map((rating) => <li key={rating}>{rating}</li>)}
            </ul>
            <h4 className="font-bold">Presentation skills</h4>
            <div className="space-y-4">
              {presentationSkills.map(({ number, label }) => matchingAnswer(number, presentationRatings, label))}
            </div>
          </section>
        </>
      )}

      {part === 4 && (
        <section className="space-y-4" aria-label="Questions 31 to 40">
          <div className="space-y-1">
            <h3 className="font-bold">Questions 31–40</h3>
            <p>Complete the table below.</p>
            <p>Write <b>NO MORE THAN ONE WORD</b> for each answer.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] table-fixed border-collapse border border-[#777] text-left">
              <caption className="border border-b-0 border-[#777] px-3 py-3 text-center text-xl font-bold">INVESTIGATING TASTE</caption>
              <thead>
                <tr className="bg-[#f2f2f2]">
                  <th scope="col" className={cell}>Procedure</th>
                  <th scope="col" className={cell}>Result</th>
                  <th scope="col" className={cell}>Cause</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={cell}>more yellow added to green colour of {blank(31)}</td>
                  <td className={cell}>subjects believed extra {blank(32)} added to drink</td>
                  <td className={cell}>brain influenced by product presentation</td>
                </tr>
                <tr>
                  <td className={cell}>gum chewed until it is {blank(33)} then again with sugar</td>
                  <td className={cell}>mint flavor {blank(34)}</td>
                  <td className={cell}>sweetness necessary for mintiness</td>
                </tr>
                <tr>
                  <td className={cell}>same drink tasted cold and at room temperature</td>
                  <td className={cell}>{blank(35)} drink seems sweeter</td>
                  <td className={cell}>temperature affects sweetness</td>
                </tr>
                <tr>
                  <td className={cell}>crisps eaten in rooms which were {blank(36)}</td>
                  <td className={cell}>with louder crunch, subjects believed crisps taste {blank(37)}</td>
                  <td className={cell}>sound affects taste perceptions</td>
                </tr>
                <tr>
                  <td className={cell}>variety of cheese sauces prepared</td>
                  <td className={cell}>subjects believed some sauces tasted less strong</td>
                  <td className={cell}>{blank(38)} affects taste perceptions</td>
                </tr>
                <tr>
                  <td className={cell}>two different flavoured {blank(39)} tasted together</td>
                  <td className={cell}>subjects still tasted {blank(40)} when no longer there</td>
                  <td className={cell}>brain is filling the taste ‘gap’</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
