type Props = {
  part: number;
  answers: Record<number, string>;
  updateAnswer: (number: number, value: string) => void;
};
type ChoiceQuestion = { number: number; prompt: string; options: string[] };
const answerStyle = "h-9 w-44 max-w-full border border-[#2185d0] bg-white px-2 text-[16px] outline-none focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]";
const cellStyle = "border border-[#777] px-3 py-3 align-top";

export default function TestElevenListening({ part, answers, updateAnswer }: Props) {
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
      <p id={`test11-prompt-${number}`} className="mb-3 flex items-start gap-2">
        <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-sm border border-[#2185d0]">{number}</span>
        <span>{prompt}</span>
      </p>
      <div role="radiogroup" aria-labelledby={`test11-prompt-${number}`} className="ml-3 flex flex-col gap-3">
        {options.map((option, index) => {
          const value = String.fromCharCode(65 + index);
          return (
            <label key={value} className="flex items-start gap-2">
              <input
                type="radio"
                name={`test11-listening-question-${number}`}
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
                  name={`test11-listening-questions-${numbers[0]}-${numbers[1]}`}
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


  const heading = (range: string, task: string, limit?: string) => <div className="space-y-1"><h3 className="font-bold">Questions {range}</h3><p>{task}</p>{limit && <p>Write <b>{limit}</b> for each answer.</p>}</div>;
  const shortQuestions = [
    { number: 11, prompt: "What was the Sea Life Centre previously called?" },
    { number: 12, prompt: "What is the newest attraction called?" },
    { number: 13, prompt: "When is the main feeding time?" },
    { number: 14, prompt: "What can you do with a VIP ticket?" },
    { number: 15, prompt: "What special event will the Sea Life Centre arrange for you?" },
    { number: 16, prompt: "Where will the petition for animal conservation be sent to?" },
    { number: 17, prompt: "What can you use to test what you have learnt?" },
  ];
  const attractions = ["Aquarium", "Crocodile Cave", "Penguin Park", "Seal Centre", "Turtle Town"];
  const universityQuestions: ChoiceQuestion[] = [
    { number: 27, prompt: "Martina thinks the students at her university are", options: ["sociable.", "intelligent.", "energetic."] },
    { number: 28, prompt: "George hopes that his tutor will help him", options: ["lose his shyness.", "settle into university.", "get to know his subject better."] },
    { number: 29, prompt: "What does Martina know about her first assignment?", options: ["the topic", "the length", "the deadline"] },
    { number: 30, prompt: "George would like to live", options: ["in a hall of residence.", "in a flat on his own.", "with a host family."] },
  ];

  return <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-3 text-[16px] leading-6">
    {part === 1 && <>
      <section className="space-y-4" aria-label="Questions 1 to 6">
        {heading("1–6", "Complete the notes below.", "NO MORE THAN TWO WORDS AND/OR A NUMBER")}
        <div className="space-y-4 border border-[#999] bg-white p-5 sm:p-7">
          <h4 className="text-center text-xl font-bold">Short Story Competition</h4>
          <h5 className="font-bold">Entry Details</h5>
          <div className="space-y-4 border-t border-[#999] pt-4">
            <p>Length of story: approximately {blank(1)}</p>
            <p>Story must include: a {blank(2)}</p>
            <p>Minimum age: {blank(3)}</p>
            <p>Last entry date: 1st {blank(4)}</p>
            <p>Web address: www. {blank(5)} .com</p>
            <p>Don’t: {blank(6)} the story to the organisers</p>
          </div>
        </div>
      </section>
      <section className="space-y-4" aria-label="Questions 7 to 10">
        {heading("7–10", "Complete the sentences below.", "NO MORE THAN TWO WORDS")}
        <h4 className="font-bold">Judging and Prize Details</h4>
        <p>The competition is judged by {blank(7)}.</p>
        <p>The top five stories will be available {blank(8)}.</p>
        <p>The top story will be chosen by the {blank(9)}.</p>
        <p>The first prize is a place at a writers’ workshop in {blank(10)}.</p>
      </section>
    </>}
    {part === 2 && <>
      <section className="space-y-4" aria-label="Questions 11 to 17">
        {heading("11–17", "Answer the questions below.", "NO MORE THAN THREE WORDS")}
        <h4 className="text-center text-xl font-bold">Sea Life Centre – information</h4>
        {shortQuestions.map(({number,prompt}) => <div key={number} className="space-y-2"><p>{prompt}</p>{blank(number)}</div>)}
      </section>
      <section className="space-y-4" aria-label="Questions 18 to 20">
        {heading("18–20", "What does the guide say about each attraction?")}
        <p>Choose the correct letter, <b>A–E</b>, for each answer.</p>
        <div className="mx-auto w-fit max-w-full space-y-2 border border-[#999] bg-white p-5">{attractions.map((name,index) => <p key={name} className="flex gap-3"><b>{String.fromCharCode(65+index)}</b><span>{name}</span></p>)}</div>
        {[{number:18,prompt:"must not miss"},{number:19,prompt:"temporarily closed"},{number:20,prompt:"large queues"}].map(({number,prompt}) => <div key={number} className="flex flex-wrap items-center gap-2"><label htmlFor={`question-${number}`}><b>{number}</b> {prompt}</label><select id={`question-${number}`} aria-label={`Answer for question ${number}`} value={answers[number] || ""} onChange={event => updateAnswer(number,event.target.value)} className={`${answerStyle} scroll-m-6`}><option value="">Select</option>{attractions.map((name,index) => <option key={name} value={String.fromCharCode(65+index)}>{String.fromCharCode(65+index)}</option>)}</select></div>)}
      </section>
    </>}
    {part === 3 && <>
      <section className="space-y-4" aria-label="Questions 21 and 22">
        {heading("21–22", "Choose TWO answers.")}
        {chooseTwo([21,22],"Which TWO subjects did Martina like best before going to university?",["Art","English","French","History","Science"])}
      </section>
      <section className="space-y-4" aria-label="Questions 23 to 26">
        {heading("23–26", "Complete the summary below.", "NO MORE THAN TWO WORDS")}
        <h4 className="text-center text-xl font-bold">George’s experience of university</h4>
        <p className="leading-10">George is studying Mechanical Engineering which involves several disciplines. He is finding {blank(23)} the most difficult. At the moment, his course is mainly {blank(24)}. He will soon have an assignment which involves a study of {blank(25)}. He thinks there are too many {blank(26)} and would like less of them.</p>
      </section>
      <section className="space-y-5" aria-label="Questions 27 to 30">
        {heading("27–30", "Choose the correct answer.")}
        {universityQuestions.map(multipleChoice)}
      </section>
    </>}
    {part === 4 && <section className="space-y-4" aria-label="Questions 31 to 40">
      {heading("31–40", "Complete the notes below.", "NO MORE THAN TWO WORDS")}
      <div className="space-y-5 border border-[#999] bg-white p-5 sm:p-7">
        <h4 className="text-center text-xl font-bold">Preparing and Giving a Presentation</h4>
        <div className="space-y-3"><h5 className="font-bold">Initial thoughts</h5><p>Most important consideration: your audience</p><p>Three points to bear in mind:</p><ul className="list-disc space-y-4 pl-6"><li>what they need to know</li><li>how {blank(31)} they will be</li><li>how big the audience will be</li></ul></div>
        <div className="space-y-3"><h5 className="font-bold">Structure</h5><p>Start with information that makes the audience {blank(32)}.</p><p>End with {blank(33)}.</p></div>
        <div className="space-y-3"><h5 className="font-bold">Design</h5><p>The presentation needs to be {blank(34)}.</p><p>Vary content by using a mix of words and {blank(35)}.</p></div>
        <div className="space-y-3"><h5 className="font-bold">Presenting</h5><p>Look at the audience, be enthusiastic and energetic</p><p>Voice – vary speed and {blank(36)}.</p><p>Occasionally add {blank(37)} for greater impact</p><p>Do not use {blank(38)} (e.g. <i>appears, seems</i>)</p></div>
        <div className="space-y-3"><h5 className="font-bold">Questions and Interruptions</h5><p>When asked a question, first of all you should {blank(39)}.</p><p>Minimise interruptions by {blank(40)} them</p></div>
      </div>
    </section>}
  </div>;
}
