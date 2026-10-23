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

const answerStyle = "h-9 max-w-full border border-[#2185d0] bg-white px-2 text-[16px] outline-none focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]";
const cellStyle = "border border-[#777] px-3 py-3 align-top";

const parkQuestions: ChoiceQuestion[] = [
  {
    number: 11,
    prompt: "Simon’s idea for a theme park came from",
    options: ["his childhood hobby", "his interest in landscape design", "his visit to another park"],
  },
  {
    number: 12,
    prompt: "When they started, the family decided to open the park only when",
    options: ["the weather was expected to be good", "the children weren’t at school", "there were fewer farming commitments"],
  },
  {
    number: 13,
    prompt: "Since opening, the park has had",
    options: ["50,000 visitors", "1,000,000 visitors", "1,500,000 visitors"],
  },
];

const workAreas = [
  "advertising",
  "animal care",
  "building",
  "educational links",
  "engine maintenance",
  "food and drink",
  "sales",
  "staffing",
];

const parkPeople = [
  { number: 14, name: "Simon" },
  { number: 15, name: "Liz" },
  { number: 16, name: "Sarah" },
  { number: 17, name: "Duncan" },
  { number: 18, name: "Judith" },
];

const houseQuestions: ChoiceQuestion[] = [
  {
    number: 31,
    prompt: "The owners of the underground house",
    options: [
      "had no experience of living in a rural area",
      "were interested in environmental issues",
      "wanted a professional project manager",
    ],
  },
  {
    number: 32,
    prompt: "What does the speaker say about the site of the house?",
    options: ["The land was quite cheap", "Stone was being extracted nearby", "It was in a completely unspoilt area"],
  },
];

export default function TestNineListening({ part, answers, updateAnswer }: Props) {
  const blank = (number: number, width = "w-40", prefix = "") => (
    <span className="inline-flex max-w-full items-center gap-2 align-middle">
      <label htmlFor={`question-${number}`} className="shrink-0 font-bold">{number}</label>
      {prefix && <span>{prefix}</span>}
      <input
        id={`question-${number}`}
        aria-label={`Answer for question ${number}`}
        type="text"
        value={answers[number] || ""}
        onChange={(event) => updateAnswer(number, event.target.value)}
        className={`${answerStyle} ${width} min-w-0 scroll-m-6`}
        autoComplete="off"
      />
    </span>
  );

  const multipleChoice = ({ number, prompt, options }: ChoiceQuestion) => (
    <div id={`question-${number}`} key={number} className="scroll-m-6">
      <p id={`test9-prompt-${number}`} className="mb-3 flex items-start gap-2">
        <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-sm border border-[#2185d0]">{number}</span>
        <span>{prompt}</span>
      </p>
      <div role="radiogroup" aria-labelledby={`test9-prompt-${number}`} className="ml-3 flex flex-col gap-3">
        {options.map((option, index) => {
          const value = String.fromCharCode(65 + index);
          return (
            <label key={value} className="flex items-start gap-2">
              <input
                type="radio"
                name={`test9-listening-question-${number}`}
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
          <section className="space-y-4" aria-label="Questions 1 to 5">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 1–5</h3>
              <p>Complete the table below.</p>
              <p>Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse border border-[#777] bg-white text-left">
                <thead>
                  <tr><th scope="col" className={cellStyle}>Apartments</th><th scope="col" className={cellStyle}>Facilities</th><th scope="col" className={cellStyle}>Other Information</th><th scope="col" className={cellStyle}>Cost</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row" className={`${cellStyle} font-normal`}>Rose Garden Apartments</th>
                    <td className={cellStyle}>Studio Flat</td>
                    <td className={cellStyle}>Entertainment programme: Greek dancing</td>
                    <td className={`${cellStyle} whitespace-nowrap`}>£219</td>
                  </tr>
                  <tr>
                    <th scope="row" className={`${cellStyle} font-normal`}>Blue Bay Apartments</th>
                    <td className={cellStyle}>Large salt water swimming pool</td>
                    <td className={cellStyle}><ul className="list-disc space-y-2 pl-5"><li>Just {blank(1, "w-28")} meters from beach</li><li>Near shops</li></ul></td>
                    <td className={`${cellStyle} whitespace-nowrap`}>£275</td>
                  </tr>
                  <tr>
                    <th scope="row" className={`${cellStyle} font-normal`}>{blank(2, "w-28")} Apartments</th>
                    <td className={cellStyle}>Terrace</td>
                    <td className={cellStyle}>Watersports</td>
                    <td className={`${cellStyle} whitespace-nowrap`}>£490</td>
                  </tr>
                  <tr>
                    <th scope="row" className={`${cellStyle} font-normal`}>The Grand</th>
                    <td className={cellStyle}>Greek paintings and {blank(3, "w-28")}</td>
                    <td className={cellStyle}><ul className="list-disc space-y-2 pl-5"><li>Overlooking {blank(4, "w-28")}</li><li>Near a supermarket and a disco</li></ul></td>
                    <td className={cellStyle}>{blank(5, "w-24", "£")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section className="space-y-4" aria-label="Questions 6 to 10">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 6–10</h3>
              <p>Complete the table below.</p>
              <p>Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse border border-[#777] bg-white text-left">
                <caption className="pb-3 text-left font-bold">GREEK ISLAND HOLIDAYS</caption>
                <thead><tr><th scope="col" className={cellStyle}>Insurance Benefits</th><th scope="col" className={cellStyle}>Maximum Amount</th></tr></thead>
                <tbody>
                  <tr><th scope="row" className={`${cellStyle} font-normal`}>Cancellation</th><td className={cellStyle}>{blank(6, "w-40", "£")}</td></tr>
                  <tr><th scope="row" className={`${cellStyle} font-normal`}>Hospital</th><td className={cellStyle}>£600 additional benefit allows a {blank(7)} to travel to resort</td></tr>
                  <tr><th scope="row" className={`${cellStyle} font-normal`}>{blank(8, "w-28")} departure</th><td className={cellStyle}>Up to £1000 depends on reason</td></tr>
                  <tr><th scope="row" className={`${cellStyle} font-normal`}>Personal belongings</th><td className={cellStyle}>Up to £3000 £500 for one {blank(9)}</td></tr>
                </tbody>
                <tfoot><tr><td colSpan={2} className={cellStyle}>Name of assistant manager: Ben {blank(10)}</td></tr></tfoot>
              </table>
            </div>
          </section>
        </>
      )}

      {part === 2 && (
        <>
          <section className="space-y-5" aria-label="Questions 11 to 13">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 11–13</h3>
              <p>Choose the correct answer.</p>
            </div>
            <h4 className="font-bold">WINRIDGE FOREST RAILWAY PARK</h4>
            {parkQuestions.map(multipleChoice)}
          </section>
          <section className="space-y-4" aria-label="Questions 14 to 18">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 14–18</h3>
              <p>What is currently the main area of work of each of the following people?</p>
              <p>Choose <b>FIVE</b> answers from the box and select the correct letter, <b>A–H</b>, for Questions <b>14–18</b>.</p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2 border border-[#777] bg-white p-4">
              <h4 className="font-bold">Area of work</h4>
              <ul aria-label="Area of work options" className="list-none space-y-1">
                {workAreas.map((area, index) => (
                  <li key={area} className="flex gap-3"><b>{String.fromCharCode(65 + index)}</b><span>{area}</span></li>
                ))}
              </ul>
            </div>
            <h4 className="font-bold">People</h4>
            <div className="space-y-4">
              {parkPeople.map(({ number, name }) => (
                <div key={number} className="grid grid-cols-[minmax(0,1fr)_minmax(0,11rem)] items-center gap-x-6 sm:grid-cols-[14rem_11rem] sm:gap-x-8">
                  <label htmlFor={`question-${number}`} className="inline-flex items-center gap-2"><b>{number}</b><span>{name}</span></label>
                  <select
                    id={`question-${number}`}
                    aria-label={`Answer for question ${number}: ${name}`}
                    value={answers[number] || ""}
                    onChange={(event) => updateAnswer(number, event.target.value)}
                    className={`${answerStyle} w-44 scroll-m-6`}
                  >
                    <option value="">Select</option>
                    {workAreas.map((area, index) => <option key={area} value={String.fromCharCode(65 + index)}>{String.fromCharCode(65 + index)}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-4" aria-label="Questions 19 and 20">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 19 and 20</h3>
              <p>Complete the table below.</p>
              <p>Write <b>ONE WORD AND/OR NUMBERS</b> for each answer.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse border border-[#777] bg-white text-left">
                <thead><tr><th scope="col" className={cellStyle}>Feature</th><th scope="col" className={cellStyle}>Size</th><th scope="col" className={cellStyle}>Biggest Challenge</th><th scope="col" className={cellStyle}>Target Age Group</th></tr></thead>
                <tbody>
                  <tr><th scope="row" className={`${cellStyle} font-normal`}>Railway</th><td className={cellStyle}>1.2 km</td><td className={cellStyle}>Making tunnels</td><td className={cellStyle}></td></tr>
                  <tr><th scope="row" className={`${cellStyle} font-normal`}>Go-kart arena</th><td className={cellStyle}>{blank(19, "w-28")} sq mt</td><td className={cellStyle}>Removing mounds on track</td><td className={cellStyle}>{blank(20, "w-28")} year olds</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {part === 3 && (
        <section className="space-y-5" aria-label="Questions 21 to 30">
          <div className="space-y-1">
            <h3 className="font-bold">Questions 21–30</h3>
            <p>Complete the notes below.</p>
            <p>Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</p>
          </div>
          <h4 className="text-lg font-bold">Study Skills Tutorial – Caroline Benning</h4>
          <div className="space-y-4">
            <p>Dissertation topic: the {blank(21)}</p>
            <div className="space-y-2">
              <p>Strengths:</p>
              <ul className="list-disc space-y-3 pl-6"><li>{blank(22)}</li><li>Computer modeling</li></ul>
            </div>
            <div className="space-y-2">
              <p>Weaknesses:</p>
              <ul className="list-disc space-y-3 pl-6"><li>lack of background information</li><li>Poor {blank(23)} skills</li></ul>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse border border-[#777] bg-white text-left">
              <thead><tr><th scope="col" className={cellStyle}>Possible strategy</th><th scope="col" className={cellStyle}>Benefits</th><th scope="col" className={cellStyle}>Problems</th></tr></thead>
              <tbody>
                <tr><th scope="row" className={`${cellStyle} font-normal`}>Peer group discussion</th><td className={cellStyle}>Increase {blank(24)}</td><td className={cellStyle}>Dissertations tend to contain the same {blank(25)}</td></tr>
                <tr><th scope="row" className={`${cellStyle} font-normal`}>Use the {blank(26)} service</th><td className={cellStyle}>Provides structured programme</td><td className={cellStyle}>Limited {blank(27)}</td></tr>
                <tr><th scope="row" className={`${cellStyle} font-normal`}>Consult study skill books</th><td className={cellStyle}>Are a good source of reference</td><td className={cellStyle}>Can be too {blank(28)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="space-y-4">
            <p>Recommendations: use a card index</p>
            <p>Read all notes {blank(29)}</p>
            <p>Next tutorial date: {blank(30)} January</p>
          </div>
        </section>
      )}

      {part === 4 && (
        <>
          <section className="space-y-5" aria-label="Questions 31 and 32">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 31 and 32</h3>
              <p>Choose the correct answer.</p>
            </div>
            {houseQuestions.map(multipleChoice)}
          </section>
          <section className="space-y-4" aria-label="Questions 33 to 40">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 33–40</h3>
              <p>Complete the notes below.</p>
              <p>Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.</p>
            </div>
            <div className="space-y-5 border border-[#999] bg-white p-5 sm:p-7">
              <h4 className="text-lg font-bold">THE UNDERGROUND HOUSE</h4>
              <div className="space-y-3">
                <h5 className="font-bold">Design</h5>
                <ul className="list-disc space-y-4 pl-6">
                  <li>Built in the earth, with two floors</li>
                  <li>The south-facing side was constructed of two layers of {blank(33)}</li>
                  <li>Photovoltaic tiles were attached</li>
                  <li>A layer of foam was used to improve the {blank(34)} of the building</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h5 className="font-bold">Special features</h5>
                <ul className="list-disc space-y-4 pl-6">
                  <li>To increase the light, the building has many internal mirrors and {blank(35)}</li>
                  <li>In future, the house may produce more {blank(36)} than it needs</li>
                  <li>Recycled wood was used for the {blank(37)} of the house</li>
                  <li>The system for processing domestic {blank(38)} is organic</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h5 className="font-bold">Environmental issues</h5>
                <ul className="list-disc space-y-4 pl-6">
                  <li>The use of large quantities of {blank(39)} in construction was environmentally harmful</li>
                  <li>But the house will have paid its ‘environmental debt’ within {blank(40)}</li>
                </ul>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
