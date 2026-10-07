type Props = {
  part: number;
  answers: Record<number, string>;
  updateAnswer: (number: number, value: string) => void;
};

const cell = "border border-[#777] px-3 py-2 align-top";

export default function TestFourListening({ part, answers, updateAnswer }: Props) {
  const input = (number: number, width = "w-44") => (
    <input id={`question-${number}`} aria-label={`Answer for question ${number}`} value={answers[number] || ""} onChange={(event) => updateAnswer(number, event.target.value)} className={`h-9 ${width} max-w-full border border-[#2185d0] bg-white px-2 outline-none focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]`} autoComplete="off" />
  );

  const multipleChoice = (number: number, prompt: string, options: string[]) => (
    <div id={`question-${number}`} key={number} className="scroll-m-6">
      <p className="mb-3 flex items-center gap-2"><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-sm border border-[#2185d0]">{number}</span>{prompt}</p>
      <div className="ml-3 flex flex-col gap-3">{options.map((option, index) => {
        const value = String.fromCharCode(65 + index);
        return <label key={value} className="flex items-center gap-2"><input type="radio" name={`test4-listening-question-${number}`} value={value} checked={answers[number] === value} onChange={() => updateAnswer(number, value)} /><span>{option}</span></label>;
      })}</div>
    </div>
  );

  const selectSeveral = (numbers: number[], options: string[]) => {
    const selected = numbers.map((number) => answers[number]).filter(Boolean);
    return <div className="space-y-3">
      <div id={`question-${numbers[0]}`} className="scroll-m-6"><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-sm border border-[#2185d0]">{numbers[0]}–{numbers[numbers.length - 1]}</span></div>
      {numbers.slice(1).map((number) => <span key={number} id={`question-${number}`} className="block scroll-m-6" />)}
      {options.map((option, index) => {
        const value = String.fromCharCode(65 + index);
        const checked = selected.includes(value);
        return <label key={value} className="flex items-center gap-2"><input type="checkbox" checked={checked} disabled={!checked && selected.length >= numbers.length} onChange={() => {
          const next = checked ? selected.filter((answer) => answer !== value) : [...selected, value];
          numbers.forEach((number, answerIndex) => updateAnswer(number, next[answerIndex] || ""));
        }} /><span>{option}</span></label>;
      })}
    </div>;
  };

  const letterAnswer = (number: number, letters: string[]) => (
    <div id={`question-${number}`} key={number} className="flex scroll-m-6 items-center gap-3">
      <b>{number}</b><select aria-label={`Answer for question ${number}`} value={answers[number] || ""} onChange={(event) => updateAnswer(number, event.target.value)} className="h-9 w-28 border border-[#2185d0] bg-white px-2 focus:outline-none focus:ring-1 focus:ring-[#2185d0]"><option value="">Select</option>{letters.map((letter) => <option key={letter} value={letter}>{letter}</option>)}</select>
    </div>
  );

  return <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-3 text-[16px] leading-6">
    {part === 1 && <>
      <section className="space-y-4" aria-label="Questions 1 to 5">
        <div className="space-y-1"><h3 className="font-bold">Questions 1–5</h3><p>Complete the form below.</p><p>Write <b>NO MORE THAN THREE WORDS AND/OR A NUMBER</b> for each answer.</p></div>
        <div className="space-y-5 border border-[#999] bg-white p-5 sm:p-7">
          <p><b>Aim:</b> protecting environment through recycling</p><p><b>Type of group:</b> non-profit</p>
          <p id="question-1" className="flex flex-wrap items-center gap-2">Frequency of newspaper collection: <b>1</b>{input(1)}</p>
          <p id="question-2" className="flex flex-wrap items-center gap-2">Name: <b>2</b>{input(2)}</p>
          <p id="question-3" className="flex flex-wrap items-center gap-2">Address: <b>3</b>{input(3)}</p>
          <p id="question-4" className="flex flex-wrap items-center gap-2">E-mail: <b>4</b>{input(4)}</p>
          <p id="question-5" className="flex flex-wrap items-center gap-2">Postcode: <b>5</b>{input(5)}</p>
        </div>
      </section>
      <section className="space-y-4" aria-label="Questions 6 to 10">
        <div className="space-y-1"><h4 className="font-bold">Questions 6–10</h4><p>Complete the form below.</p><p>Write <b>NO MORE THAN TWO WORDS</b> for each answer.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse border border-[#d5d5d5] text-left">
          <thead><tr><th colSpan={2} className={cell}>Recycling</th></tr></thead>
          <tbody>
            <tr><th className={cell}>Ways of recycling</th><td className={cell}>Newspaper: in a <b>6</b> {input(6,"w-40")} box</td></tr>
            <tr><th className={cell}>Nearest rubbish collection centre</th><td className={cell}>On the East Side of <b>7</b> {input(7,"w-40")}</td></tr>
            <tr><th className={cell}>Rubbish that can be recycled</th><td className={cell}>Blue box: <b>8</b> {input(8,"w-40")}　Green box: glass and plastics　Yellow box: paper</td></tr>
            <tr><th className={cell}>Rubbish that cannot be recycled</th><td className={cell}><b>9</b> {input(9,"w-40")}</td></tr>
            <tr><th className={cell}>Name of a booklet</th><td className={cell}><b>10</b> {input(10,"w-40")}</td></tr>
          </tbody>
        </table></div>
      </section>
    </>}

    {part === 2 && <>
      <section className="space-y-4" aria-label="Questions 11 to 20">
        <div className="space-y-1"><h3 className="font-bold">Questions 11–17</h3><p>Complete the notes below.</p><p>Write <b>NO MORE THAN THREE WORDS</b> for each answer.</p></div>
        <div className="space-y-4 border border-[#999] bg-white p-5 sm:p-7">
          <h4 className="text-center text-lg font-bold">‘CV and Interview Skills’ Seminar</h4>
          <p id="question-11" className="flex flex-wrap items-center gap-2">The speaker suggests that the students use the <b>11</b>{input(11)} when they begin writing résumés.</p>
          <p id="question-12" className="flex flex-wrap items-center gap-2">The students should be sure not to keep the CV <b>12</b>{input(12)}.</p>
          <p id="question-13" className="flex flex-wrap items-center gap-2">A <b>13</b>{input(13)} cover letter is useful when applying for a job and should be included.</p>
          <p id="question-14" className="flex flex-wrap items-center gap-2">The speaker believes the CV should have a beautiful <b>14</b>{input(14)}.</p>
          <p id="question-15" className="flex flex-wrap items-center gap-2">The CV should not have any spelling and grammar <b>15</b>{input(15)}.</p>
          <p id="question-16" className="flex flex-wrap items-center gap-2">The words in a CV can describe your <b>16</b>{input(16)}.</p>
          <p id="question-17" className="flex flex-wrap items-center gap-2">Don’t forget to put down a <b>17</b>{input(17)} on the CV.</p>
        </div>
      </section>
      <section className="space-y-4" aria-label="Questions 18 to 20">
        <div className="space-y-1"><h4 className="font-bold">Questions 18–20</h4><p>Select THREE options.</p><p>What THREE details should job applicants know in the interview?</p></div>
        {selectSeveral([18,19,20],["Working hours","Promotion prospect","Salary range","Pension contribution bonus","Training","Holidays","Location"])}
      </section>
    </>}

    {part === 3 && <>
      <section className="space-y-4" aria-label="Questions 21 to 30">
        <div className="space-y-1"><h3 className="font-bold">Questions 21–30</h3><p>Choose the correct answer.</p></div>
        {multipleChoice(21,"What does the man want to have?",["A break","A talk","A class"])}
        {multipleChoice(22,"What does the man think of children nowadays?",["Confident","Intelligent","Mature"])}
        {multipleChoice(23,"What type of people does the man want to teach?",["Children","Students","Adults"])}
        {multipleChoice(24,"What did the man do when he encountered former students?",["Had a conversation","Ran away","Taught them"])}
        {multipleChoice(25,"What is the man’s greatest weakness?",["Being old-fashioned","Lack of confidence","Being introverted"])}
        {multipleChoice(26,"When did Doctor Lindsey go to college?",["18 years ago","After starting a family","When she was 35 years old"])}
        {multipleChoice(27,"How did the woman feel when she was a freshman?",["Hopeless","Unsuccessful","Stressed"])}
        {multipleChoice(28,"How does the man feel about his career?",["Unique","Boring","Impressive"])}
        {multipleChoice(29,"What does the man finally decide to study?",["Languages","Business","Liberal Arts"])}
        {multipleChoice(30,"Which change in students’ life is NOT important to Frank?",["Classroom technology","Student housing","University facilities"])}
      </section>
    </>}

    {part === 4 && <>
      <section className="space-y-4" aria-label="Questions 31 to 36">
        <div className="space-y-1"><h3 className="font-bold">Questions 31–34</h3><p>Complete the sentences below.</p><p>Write <b>NO MORE THAN THREE WORDS</b> for each answer.</p></div>
        <div className="space-y-4">
          <p id="question-31" className="flex flex-wrap items-center gap-2">• The university uses <b>31</b>{input(31)} as their teaching method.</p>
          <p id="question-32" className="flex flex-wrap items-center gap-2">• Research skills include writing and <b>32</b>{input(32)}.</p>
          <p id="question-33" className="flex flex-wrap items-center gap-2">• Books of Economics are kept in the <b>33</b>{input(33)}.</p>
          <p id="question-34" className="flex flex-wrap items-center gap-2">• Maths books are kept in the <b>34</b>{input(34)} Building.</p>
        </div>
      </section>
      <section className="space-y-4" aria-label="Questions 35 and 36">
        <div className="space-y-1"><h4 className="font-bold">Questions 35–36</h4><p>Choose the correct answer.</p></div>
        {multipleChoice(35,"Which is NOT provided for students in most of the large buildings?",["Printing","Photocopying","Typing"])}
        {multipleChoice(36,"What type of printer is available for the students?",["Computer printers","Prepaid cards","Laser printers"])}
      </section>
      <section className="space-y-4" aria-label="Questions 37 to 40">
        <div className="space-y-1"><h4 className="font-bold">Questions 37–40</h4><p>Match each statement to a building from the list. Choose FOUR options.</p></div>
        <div className="grid gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.8fr)]">
          <div className="space-y-4">
            <p>If you go straight out those doors, the building directly opposite is:</p>{letterAnswer(37,["A","B","C","D","E","F","G"])}
            <p>If you make a right turn outside the door and go to the second building, that is:</p>{letterAnswer(38,["A","B","C","D","E","F","G"])}
            <p>You can see this if you look out of that window:</p>{letterAnswer(39,["A","B","C","D","E","F","G"])}
            <p>The Media Centre is in front of this:</p>{letterAnswer(40,["A","B","C","D","E","F","G"])}
          </div>
          <div className="space-y-2 border border-[#777] p-4"><h5 className="text-center font-bold">Buildings</h5>{[["A","Student Union Building"],["B","Nursery"],["C","Media Centre"],["D","Medical Services Centre"],["E","Maths Department Building"],["F","new library"],["G","old library"]].map(([letter,label])=><p key={letter}><b>{letter}.</b> {label}</p>)}</div>
        </div>
      </section>
    </>}
  </div>;
}
