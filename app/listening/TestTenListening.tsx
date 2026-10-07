type Props = {
  part: number;
  answers: Record<number, string>;
  updateAnswer: (number: number, value: string) => void;
};
type ChoiceQuestion = { number: number; prompt: string; options: string[] };
const answerStyle = "h-9 w-44 max-w-full border border-[#2185d0] bg-white px-2 text-[16px] outline-none focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]";
const cellStyle = "border border-[#777] px-3 py-3 align-top";

const museumQuestions: ChoiceQuestion[] = [
  { number: 11, prompt: "The reason why David is replacing Jane is that", options: ["she is unwell.", "she is very busy.", "she is inexperienced."] },
  { number: 12, prompt: "According to the speaker, what is the problem for the museum currently?", options: ["lack of staff", "lack of publicity", "lack of money"] },
  { number: 13, prompt: "Why were the thieves able to successfully steal the statue?", options: ["The security device is outdated.", "The security guard is not well-trained.", "They knew what they were searching for."] },
  { number: 14, prompt: "In order to improve security, they are going to", options: ["get more closed-circuit television cameras.", "hire more security guards.", "buy more computers."] },
  { number: 15, prompt: "What kind of librarian are they looking for?", options: ["responsible", "experienced", "highly-trained"] },
];
const museumRooms = [
  { number: 16, name: "Box Office" },
  { number: 17, name: "Children’s Room" },
  { number: 18, name: "Cafe" },
  { number: 19, name: "Multimedia Room" },
  { number: 20, name: "Showroom" },
];
const willowsQuestions: ChoiceQuestion[] = [
  { number: 21, prompt: "What field is Willows currently focused on?", options: ["Specialising in one product", "making a variety of products", "adding a lot of retail outlet"] },
  { number: 22, prompt: "How did the department start its contact with Willows?", options: ["The professor contacted the company.", "An article was read in a newspaper", "A student work their part-time during the vacations."] },
  { number: 23, prompt: "How did the student feel about the software?", options: ["It’s not easy to predict.", "It’s slow for drawing designs", "It had a good interface."] },
  { number: 24, prompt: "How did the students find out about the effects of the software on the company?", options: ["They went to the IT department.", "They talked with the manager.", "They inspected the accounts."] },
  { number: 25, prompt: "The reason why the students have a face-to-face interview alone is that", options: ["they could prepare for exams.", "there will be less disturbance.", "it’s less realistic."] },
  { number: 26, prompt: "How did the two students perform in the exam?", options: ["very disappointing", "significantly good", "above the average"] },
];

export default function TestTenListening({ part, answers, updateAnswer }: Props) {
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

  const multipleChoice = ({ number, prompt, options }: ChoiceQuestion) => (
    <div id={`question-${number}`} key={number} className="scroll-m-6">
      <p id={`test10-prompt-${number}`} className="mb-3 flex items-start gap-2">
        <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-sm border border-[#2185d0]">{number}</span>
        <span>{prompt}</span>
      </p>
      <div role="radiogroup" aria-labelledby={`test10-prompt-${number}`} className="ml-3 flex flex-col gap-3">
        {options.map((option, index) => {
          const value = String.fromCharCode(65 + index);
          return (
            <label key={value} className="flex items-start gap-2">
              <input
                type="radio"
                name={`test10-listening-question-${number}`}
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

  const chooseTwo = (numbers: [number, number], prompt: string, options: string[]) => {
    const selected = numbers.map((number) => answers[number]).filter(Boolean);
    return (
      <fieldset id={`question-${numbers[0]}`} className="min-w-0 scroll-m-6 space-y-3">
        <legend className="mb-3 flex items-start gap-2">
          <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-sm border border-[#2185d0] px-1">{numbers[0]}–{numbers[1]}</span>
          <span>{prompt}</span>
        </legend>
        <div id={`question-${numbers[1]}`} className="ml-3 flex scroll-m-6 flex-col gap-3">
          {options.map((option, index) => {
            const value = String.fromCharCode(65 + index);
            const checked = selected.includes(value);
            return (
              <label key={value} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name={`test10-listening-questions-${numbers[0]}-${numbers[1]}`}
                  value={value}
                  checked={checked}
                  disabled={!checked && selected.length >= 2}
                  onChange={() => {
                    const next = checked ? selected.filter((answer) => answer !== value) : [...selected, value];
                    if (next.length > 2) return;
                    updateAnswer(numbers[0], next[0] || "");
                    updateAnswer(numbers[1], next[1] || "");
                  }}
                  className="mt-1.5 shrink-0"
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  };


  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-3 text-[16px] leading-6">
      {part === 1 && (
        <>
          <section className="space-y-4" aria-label="Questions 1 to 5">
            <div className="space-y-1"><h3 className="font-bold">Questions 1–5</h3><p>Complete the table below.</p><p>Write <b>ONE WORD AND/OR NUMBERS</b> for each answer.</p></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse border border-[#777] bg-white text-left">
                <caption className="border border-b-0 border-[#777] px-3 py-3 text-center text-xl font-bold">JOB HUNTING</caption>
                <thead><tr><th scope="col" className={cellStyle}>Company’s name</th><th scope="col" className={cellStyle}>Job details</th><th scope="col" className={cellStyle}>Reference Number</th><th scope="col" className={cellStyle}>Contact</th></tr></thead>
                <tbody>
                  <tr>
                    <th scope="row" className={`${cellStyle} font-normal`}>POWER<br />(manufacturing company)</th>
                    <td className={cellStyle}>work in a {blank(1)} section</td>
                    <td className={cellStyle}>SW35FT</td>
                    <td className={cellStyle}>Jane {blank(2)}</td>
                  </tr>
                  <tr>
                    <th scope="row" className={`${cellStyle} font-normal`}>COTTON<br />(grocery company)</th>
                    <td className={cellStyle}>
                      <ul className="list-disc space-y-3 pl-5"><li>good pay</li><li>work<ul className="list-disc space-y-3 pl-5"><li>in {blank(3)} office</li><li>in a {blank(4)}</li></ul></li><li>chance of promotion</li></ul>
                    </td>
                    <td className={cellStyle}>{blank(5)}</td>
                    <td className={cellStyle}>go to office</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section className="space-y-4" aria-label="Questions 6 to 10">
            <div className="space-y-1"><h3 className="font-bold">Questions 6–10</h3><p>Complete the notes below.</p><p>Write <b>ONE WORD ONLY</b> for each answer.</p></div>
            <div className="space-y-4 border border-[#999] bg-white p-5 sm:p-7">
              <h4 className="font-bold">Notes on Jobs</h4>
              <ul className="list-disc space-y-4 pl-6">
                <li>Local jobs can be found in the {blank(6)}</li>
                <li>Buy the {blank(7)} to get one free magazine (Job Plus)</li>
                <li>Feel stress and spend a lot of time looking for jobs</li>
                <li>Advisable to go to an {blank(8)} instead of the recruitment seminar</li>
                <li>Bring a student card (10% discount)</li>
                <li>Referee:<ul className="list-disc space-y-3 pl-6"><li>former boss (once had a job)</li><li>one of the {blank(9)} (if not)</li></ul></li>
                <li>Intend to take the art course</li>
                <li>Fill out a {blank(10)} form at the end of the course</li>
              </ul>
            </div>
          </section>
        </>
      )}

      {part === 2 && (
        <>
          <section className="space-y-5" aria-label="Questions 11 to 15">
            <div className="space-y-1"><h3 className="font-bold">Questions 11–15</h3><p>Choose the correct answer.</p></div>
            {museumQuestions.map(multipleChoice)}
          </section>
          <section className="space-y-4" aria-label="Questions 16 to 20">
            <div className="space-y-1"><h3 className="font-bold">Questions 16–20</h3><p>Label the map below.</p><p>Select the correct letter, <b>A–H</b>, for Questions <b>16–20</b>.</p></div>
            <h4 className="text-center text-xl font-bold">City Museum</h4>
            <svg viewBox="30 158 635 375" className="mx-auto block h-auto w-full max-w-3xl" role="img" aria-labelledby="test10-map-title test10-map-description">
              <title id="test10-map-title">City Museum map</title>
              <desc id="test10-map-description">Entrance at the bottom. Study Centre and C are on the left of the entrance; A and E on the right. B is at middle left. Sculpture is in the middle, with F to its right. G is at top left, D at top middle, and H at top right.</desc>
              <image href="/images/test10-city-museum-source.png" x="0" y="0" width="692" height="741" />
            </svg>
            <div className="space-y-4">
              {museumRooms.map(({ number, name }) => (
                <div key={number} className="flex flex-wrap items-center gap-2">
                  <label htmlFor={`question-${number}`} className="inline-flex items-center gap-2"><b>{number}</b><span>{name}</span></label>
                  <select id={`question-${number}`} aria-label={`Answer for question ${number}: ${name}`} value={answers[number] || ""} onChange={(event) => updateAnswer(number, event.target.value)} className={`${answerStyle} scroll-m-6`}>
                    <option value="">Select</option>
                    {["A", "B", "C", "D", "E", "F", "G", "H"].map((letter) => <option key={letter} value={letter}>{letter}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {part === 3 && (
        <>
          <section className="space-y-5" aria-label="Questions 21 to 26">
            <div className="space-y-1"><h3 className="font-bold">Questions 21–26</h3><p>Choose the correct answer.</p></div>
            <h4 className="text-center text-lg font-bold">Willows Studies</h4>
            {willowsQuestions.map(multipleChoice)}
          </section>
          <section className="space-y-4" aria-label="Questions 27 and 28">
            <div className="space-y-1"><h3 className="font-bold">Questions 27–28</h3><p>Select <b>TWO</b> options.</p></div>
            {chooseTwo([27, 28], "Which TWO business decisions might benefit the company?", ["gain more profit", "employ more new staff", "increase sales", "reduce production time", "cut labour costs"])}
          </section>
          <section className="space-y-4" aria-label="Questions 29 and 30">
            <div className="space-y-1"><h3 className="font-bold">Questions 29 and 30</h3><p>Select <b>TWO</b> options.</p></div>
            {chooseTwo([29, 30], "Which TWO effects will the new system have on new clients?", ["getting more involved in the design", "obtaining more contacts", "linking at home to do online work", "wasting less time", "decreasing labour costs"])}
          </section>
        </>
      )}

      {part === 4 && (
        <section className="space-y-4" aria-label="Questions 31 to 40">
          <div className="space-y-1"><h3 className="font-bold">Questions 31–40</h3><p>Complete the notes below.</p><p>Write <b>ONE WORD ONLY</b> for each answer.</p></div>
          <div className="space-y-5 border border-[#999] bg-white p-5 sm:p-7">
            <h4 className="text-center text-xl font-bold">A Survey Research</h4>
            <div className="space-y-3">
              <h5 className="font-bold">Results of Questionnaire</h5>
              <ul className="list-disc space-y-4 pl-6">
                <li>The patients preferred to choose the hospital because of the free {blank(31)} service provided.</li>
                <li>Most patients wished the hospital to be {blank(32)}</li>
                <li>Patients were concerned about prior {blank(33)} about the hospital treatment.</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h5 className="font-bold">Actions in the next year</h5>
              <ul className="list-disc space-y-4 pl-6">
                <li>improvements on website for local {blank(34)} as well as hospital medical staff</li>
                <li>incentive to motivate the members of staff</li>
                <li>extra {blank(35)} for staff’s success in work</li>
                <li>considering the opinions of the {blank(36)}</li>
                <li>improving the effectiveness of {blank(37)} between patients, doctors and staff</li>
                <li>first-come-first-served system</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h5 className="font-bold">Recommendation</h5>
              <ul className="list-disc space-y-4 pl-6">
                <li>A new unit would be built for those who are suffering from {blank(38)} disturbance.</li>
                <li>A new ward would be proposed to those in need of {blank(39)} surgery.</li>
                <li>The equipment is advanced enough to do with the treatments.</li>
                <li>More effective {blank(40)} is needed to improve the efficiency of communication.</li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
