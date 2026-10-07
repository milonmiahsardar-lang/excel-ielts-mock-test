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

const answerStyle = "h-9 w-44 max-w-full border border-[#2185d0] bg-white px-2 text-[16px] outline-none focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]";
const gardenTopics = [
  "varieties of desert",
  "edible plants",
  "lawns and lawn alternatives",
  "native plants",
  "storing water",
  "plants attract wildlife",
  "unified design",
  "soil nutrients",
];
const gardenSpeakers = [
  { number: 15, name: "Mary" },
  { number: 16, name: "Berson" },
  { number: 17, name: "Smith" },
  { number: 18, name: "Nunee" },
  { number: 19, name: "Scanlan" },
  { number: 20, name: "Mandelson" },
];
const discussionQuestions: ChoiceQuestion[] = [
  {
    number: 21,
    prompt: "How could ancient Africans recognize different stars?",
    options: [
      "by the location of the stars",
      "by the way stars affect each other",
      "by the distance between two stars",
    ],
  },
  {
    number: 22,
    prompt: "In which way do the Weyaka people like to deal with their money?",
    options: ["open bank accounts", "assist others", "lend money to others"],
  },
  {
    number: 23,
    prompt: "What do the Africans obtain from their suffering?",
    options: [
      "ways of protecting themselves in their new environment",
      "approaches to improving their international status",
      "reasons of conquering drought",
    ],
  },
  {
    number: 24,
    prompt: "What are the local people concerned with?",
    options: [
      "having enough food",
      "getting rid of disease",
      "going back to their former environment",
    ],
  },
  {
    number: 25,
    prompt: "What is the reason for the declining financial condition of the African people?",
    options: [
      "They find it hard to trade because of the undeveloped transportation system.",
      "They have difficulty in mining minerals.",
      "They refuse to develop a range of commercial activities.",
    ],
  },
  {
    number: 26,
    prompt: "When can the African people expect to stop suffering from starvation?",
    options: ["next year", "in the long-term future", "in the near future"],
  },
];

export default function TestSevenListening({ part, answers, updateAnswer }: Props) {
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
      <p id={`test7-prompt-${number}`} className="mb-3 flex items-start gap-2">
        <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-sm border border-[#2185d0]">{number}</span>
        <span>{prompt}</span>
      </p>
      <div role="radiogroup" aria-labelledby={`test7-prompt-${number}`} className="ml-3 flex flex-col gap-3">
        {options.map((option, index) => {
          const value = String.fromCharCode(65 + index);
          return (
            <label key={value} className="flex items-start gap-2">
              <input
                type="radio"
                name={`test7-listening-question-${number}`}
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
                  name={`test7-listening-questions-${numbers[0]}-${numbers[1]}`}
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
        <section className="space-y-4" aria-label="Questions 1 to 10">
          <div className="space-y-1">
            <h3 className="font-bold">Questions 1–10</h3>
            <p>Complete the notes below.</p>
            <p>Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</p>
          </div>
          <div className="space-y-4 border border-[#999] bg-white p-5 sm:p-7">
            <h4 className="text-center text-xl font-bold">Job Enquiry</h4>
            <p>Name: Fredie Lea</p>
            <p>Location: {blank(1)} Island</p>
            <p>Starting date: {blank(2)}</p>
            <p>Age: 17</p>
            <p>Four vacancies for {blank(3)}</p>
            <p>Pay: 5.52 per hour</p>
            <p>Qualities required: ability to {blank(4)}</p>
            <div className="space-y-2">
              <p>Duties:</p>
              <ul className="list-disc space-y-3 pl-6">
                <li>Offer table service</li>
                <li>Look after {blank(5)}</li>
              </ul>
            </div>
            <p>Extra advantage: ability of the candidate to {blank(6)}</p>
            <div className="space-y-2">
              <p>Benefits:</p>
              <ul className="list-disc space-y-3 pl-6">
                <li>free {blank(7)}</li>
                <li>a {blank(8)} will be provided</li>
              </ul>
            </div>
            <p>Interview arranged for: {blank(9)} at 10:00 am</p>
            <div className="space-y-2">
              <p>Need to take:</p>
              <ul className="list-disc space-y-3 pl-6">
                <li>a reference letter from employer</li>
                <li>a bank statement</li>
                <li>the application form with a {blank(10)}</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {part === 2 && (
        <>
          <section className="space-y-4" aria-label="Questions 11 and 12">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 11–12</h3>
              <p>Select <b>TWO</b> options.</p>
            </div>
            {chooseTwo([11, 12], "Which TWO things are included in the price of the tour?", [
              "garden gloves", "ladybugs", "bush timbering lessons", "food", "humming birds",
            ])}
          </section>
          <section className="space-y-4" aria-label="Questions 13 and 14">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 13 and 14</h3>
              <p>Select <b>TWO</b> options.</p>
            </div>
            {chooseTwo([13, 14], "Which TWO facilities of Pine Garden are open today?", [
              "plant care centre", "cafe", "gift shop", "model town", "tourist office",
            ])}
          </section>
          <section className="space-y-4" aria-label="Questions 15 to 20">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 15–20</h3>
              <p>Choose <b>SIX</b> answers from the box and select the correct letter, <b>A–H</b>, for Questions <b>15–20</b>.</p>
            </div>
            <ul aria-label="Topic options" className="mx-auto w-full max-w-sm list-none space-y-1 border border-[#777] bg-white p-4">
              {gardenTopics.map((topic, index) => <li key={topic} className="flex gap-3"><b>{String.fromCharCode(65 + index)}</b><span>{topic}</span></li>)}
            </ul>
            <div className="space-y-4">
              {gardenSpeakers.map(({ number, name }) => (
                <div key={number} className="flex flex-wrap items-center gap-2">
                  <label htmlFor={`question-${number}`} className="inline-flex items-center gap-2"><b>{number}</b><span>{name}</span></label>
                  <select
                    id={`question-${number}`}
                    aria-label={`Answer for question ${number}: ${name}`}
                    value={answers[number] || ""}
                    onChange={(event) => updateAnswer(number, event.target.value)}
                    className={`${answerStyle} scroll-m-6`}
                  >
                    <option value="">Select</option>
                    {gardenTopics.map((topic, index) => <option key={topic} value={String.fromCharCode(65 + index)}>{String.fromCharCode(65 + index)}</option>)}
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
            <div className="space-y-1">
              <h3 className="font-bold">Questions 21–26</h3>
              <p>Choose the correct answer.</p>
            </div>
            {discussionQuestions.map(multipleChoice)}
          </section>
          <section className="space-y-4" aria-label="Questions 27 to 30">
            <div className="space-y-1">
              <h3 className="font-bold">Questions 27–30</h3>
              <p>Complete the sentences below.</p>
              <p>Write <b>NO MORE THAN TWO WORDS</b> for each answer.</p>
            </div>
            <div className="space-y-4">
              <p>A valuable quality of the Africans is {blank(27)} to make up for the difficulties of food transportation.</p>
              <p>The government intends to pay greater attention to their {blank(28)} plan.</p>
              <p>Nowadays, the Africans are encouraged to {blank(29)} in an area consistently.</p>
              <p>For the Weyaka people, it is impolite to visit someone’s home without {blank(30)}.</p>
            </div>
          </section>
        </>
      )}

      {part === 4 && (
        <section className="space-y-4" aria-label="Questions 31 to 40">
          <div className="space-y-1">
            <h3 className="font-bold">Questions 31–40</h3>
            <p>Complete the notes below.</p>
            <p>Write <b>NO MORE THAN TWO WORDS</b> for each answer.</p>
          </div>
          <div className="space-y-5 border border-[#999] bg-white p-5 sm:p-7">
            <h4 className="text-center text-xl font-bold">Animal Sense</h4>
            <div className="space-y-3">
              <h5 className="font-bold">Smell</h5>
              <ul className="list-disc space-y-4 pl-6">
                <li>Dogs have a greater sense of smell than human beings and are able to tell.</li>
                <li>Some animals can smell odours such as {blank(31)} not recognised by the human nose.</li>
                <li>Some beetles can only distinguish the odours of certain plants.</li>
                <li>Bees, feeling threatened, will use their {blank(32)} before they sting.</li>
                <li>Queen bees, which can sting multiple times, use their feet to keep {blank(33)} over the colony.</li>
                <li>A female {blank(34)} decides whether or not to mate with a male according to the quality of his scent.</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h5 className="font-bold">Hearing</h5>
              <ul className="list-disc space-y-4 pl-6">
                <li>Sound through vibrations can be recognized by beetles without ears by using their {blank(35)}.</li>
                <li>They can locate prey living in {blank(36)} by tracking the vibrations.</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h5 className="font-bold">Sight</h5>
              <ul className="list-disc space-y-4 pl-6">
                <li>Snakes are able to search for food by detecting {blank(37)} from the mouths of their prey.</li>
                <li>They can tell the {blank(38)} of a mouse by detecting its heat.</li>
                <li>After its prey is killed, a snake stores food in its {blank(39)} and hibernates.</li>
                <li>A snake that goes into a state of hibernation will not eat for a long period of time.</li>
                <li>The {blank(40)} is calculated by snakes before hunting their prey.</li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
