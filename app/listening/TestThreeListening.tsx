type Props = {
  part: number;
  answers: Record<number, string>;
  updateAnswer: (number: number, value: string) => void;
};

const cell = "border border-[#777] px-3 py-2 align-top";

export default function TestThreeListening({ part, answers, updateAnswer }: Props) {
  const input = (number: number, width = "w-44") => (
    <input id={`question-${number}`} aria-label={`Answer for question ${number}`} value={answers[number] || ""} onChange={(event) => updateAnswer(number, event.target.value)} className={`h-9 ${width} max-w-full border border-[#2185d0] bg-white px-2 outline-none focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]`} autoComplete="off" />
  );

  const multipleChoice = (number: number, prompt: string, options: string[]) => (
    <div id={`question-${number}`} key={number} className="scroll-m-6">
      <p className="mb-3 flex items-center gap-2"><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-sm border border-[#2185d0]">{number}</span>{prompt}</p>
      <div className="ml-3 flex flex-col gap-3">{options.map((option, index) => {
        const value = String.fromCharCode(65 + index);
        return <label key={value} className="flex items-center gap-2"><input type="radio" name={`test3-listening-question-${number}`} value={value} checked={answers[number] === value} onChange={() => updateAnswer(number, value)} /><span>{option}</span></label>;
      })}</div>
    </div>
  );

  const multipleSelect = (numbers: [number, number], options: string[]) => {
    const selected = numbers.map((number) => answers[number]).filter(Boolean);
    return <div className="space-y-3">
      <div id={`question-${numbers[0]}`} className="scroll-m-6"><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-sm border border-[#2185d0]">{numbers[0]}–{numbers[1]}</span></div>
      <span id={`question-${numbers[1]}`} className="block scroll-m-6" />
      {options.map((option, index) => {
        const value = String.fromCharCode(65 + index);
        const checked = selected.includes(value);
        return <label key={value} className="flex items-center gap-2"><input type="checkbox" checked={checked} disabled={!checked && selected.length >= 2} onChange={() => {
          const next = checked ? selected.filter((answer) => answer !== value) : [...selected, value];
          updateAnswer(numbers[0], next[0] || "");
          updateAnswer(numbers[1], next[1] || "");
        }} /><span>{option}</span></label>;
      })}
    </div>;
  };

  return <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-3 text-[16px] leading-6">
    {part === 1 && <>
      <section className="space-y-4" aria-label="Questions 1 to 10">
        <div className="space-y-1"><h3 className="font-bold">Questions 1–10</h3><p>Complete the notes below.</p><p>Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</p></div>
        <div className="space-y-5 border border-[#999] bg-white p-5 sm:p-7">
          <h4 className="text-center text-xl font-bold">Dreamtime travel agency</h4><p className="text-center font-semibold">Tour information</p>
          <div className="space-y-4">
            <p className="flex flex-wrap items-center gap-2">Holiday length: 2 days</p>
            <p id="question-1" className="flex flex-wrap items-center gap-2">Type of transportation <b>1</b>{input(1)}</p>
            <p id="question-2" className="flex flex-wrap items-center gap-2">Maximum group size <b>2</b>{input(2)}</p>
            <p id="question-3" className="flex flex-wrap items-center gap-2">Next tour date <b>3</b>{input(3)}</p>
            <p id="question-4" className="flex flex-wrap items-center gap-2">Hotel name <b>4</b><span>The</span>{input(4)}</p>
          </div>
        </div>
      </section>
      <section className="space-y-4" aria-label="Questions 5 to 6">
        <div className="space-y-1"><h4 className="font-bold">Questions 5 and 6</h4><p>Select TWO options.</p><p>Which TWO things are included in the price of the tour?</p></div>
        {multipleSelect([5, 6],["fishing trip","guided bushwalk","reptile park entry","table tennis","tennis"])}
      </section>
      <section className="space-y-4" aria-label="Questions 7 to 10">
        <div className="space-y-1"><h4 className="font-bold">Questions 7–10</h4><p>Complete the sentences below.</p><p>Write <b>NO MORE THAN THREE WORDS AND/OR A NUMBER</b> for each answer.</p></div>
        <div className="space-y-4">
          <p id="question-7" className="flex flex-wrap items-center gap-2"><b>7</b><span>The tour costs $</span>{input(7)}</p>
          <p id="question-8" className="flex flex-wrap items-center gap-2"><b>8</b><span>Bookings must be made no later than</span>{input(8)}<span>days in advance.</span></p>
          <p id="question-9" className="flex flex-wrap items-center gap-2"><b>9</b><span>A</span>{input(9)}<span>deposit is required.</span></p>
          <p id="question-10" className="flex flex-wrap items-center gap-2"><b>10</b><span>The customer’s reference number is</span>{input(10)}.</p>
        </div>
      </section>
    </>}

    {part === 2 && <>
      <section className="space-y-4" aria-label="Questions 11 to 20">
        <div className="space-y-1"><h3 className="font-bold">Questions 11–19</h3><p>Complete the table below.</p><p>Write <b>NO MORE THAN THREE WORDS</b> for each answer.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[740px] border-collapse border border-[#777] text-left text-[16px]">
          <thead><tr className="bg-[#f2f2f2]"><th className={cell}>Brand of cot</th><th className={cell}>Good points</th><th className={cell}>Problems</th><th className={cell}>Verdict</th></tr></thead>
          <tbody>
            <tr><th className={cell}>Baby Safe</th><td className={cell}>Easy to <span id="question-11"><b>11</b> {input(11,"w-40")}</span></td><td className={cell}><ul className="list-disc space-y-2 pl-5"><li>Did not have any <span id="question-12"><b>12</b> {input(12,"w-40")}</span></li><li>Babies could trap their <span id="question-13"><b>13</b> {input(13,"w-40")}</span> in the side bar</li></ul></td><td className={cell}><span id="question-14"><b>14</b> {input(14,"w-40")}</span></td></tr>
            <tr><th className={cell}>Choice Cots</th><td className={cell}>Easy to <span id="question-15"><b>15</b> {input(15,"w-40")}</span></td><td className={cell}><ul className="list-disc space-y-2 pl-5"><li>Side did not drop down</li><li>Spaces between the bars were <span id="question-16"><b>16</b> {input(16,"w-40")}</span></li></ul></td><td className={cell}><span id="question-17"><b>17</b> {input(17,"w-40")}</span></td></tr>
            <tr><th className={cell}>Mother’s Choice</th><td className={cell}>Base of cot could be moved</td><td className={cell}><ul className="list-disc space-y-2 pl-5"><li>Did not have any <span id="question-18"><b>18</b> {input(18,"w-40")}</span></li><li>Pictures could be removed easily</li></ul></td><td className={cell}><span id="question-19"><b>19</b> {input(19,"w-40")}</span></td></tr>
          </tbody>
        </table></div>
      </section>
      <section className="space-y-3" aria-label="Question 20">
        <div className="space-y-1"><h4 className="font-bold">Question 20</h4><p>Complete the notes below.</p><p>Write <b>ONE WORD ONLY</b> for the answer.</p></div>
        <ul className="list-disc space-y-3 pl-6"><li>Metal should not be rusted or bent</li><li id="question-20" className="flex flex-wrap items-center gap-2">Edges of cot should not be <b>20</b>{input(20,"w-40")}</li></ul>
      </section>
    </>}

    {part === 3 && <>
      <section className="space-y-4" aria-label="Questions 21 to 25">
        <div className="space-y-1"><h3 className="font-bold">Questions 21–23</h3><p>Choose the correct answer.</p></div>
        {multipleChoice(21,"Andrew has worked at the hospital for",["two years.","three years.","five years."])}
        {multipleChoice(22,"During the course Andrew’s employers will pay",["his fees.","his living costs.","his salary."])}
        {multipleChoice(23,"The part-time course lasts for",["one whole year.","18 months.","two years."])}
      </section>
      <section className="space-y-4" aria-label="Questions 24 and 25">
        <div className="space-y-1"><h4 className="font-bold">Questions 24 and 25</h4><p>Select TWO options.</p><p>What TWO types of coursework are required each month on the part-time course?</p></div>
        {multipleSelect([24,25],["a case study","an essay","a survey","a short report","a study diary"])}
      </section>
      <section className="space-y-4" aria-label="Questions 26 to 30">
        <div className="space-y-1"><h4 className="font-bold">Questions 26–30</h4><p>Complete the summary below.</p><p>Write <b>NO MORE THAN THREE WORDS AND/OR A NUMBER</b> for each answer.</p></div>
        <div className="space-y-4 border border-[#999] bg-white p-5 sm:p-7">
          <h4 className="text-center text-xl font-bold">Modular Courses</h4>
          <p className="flex flex-wrap items-center gap-2">Students study <b>26</b>{input(26)} during each module. A module takes <b>27</b>{input(27)}, and the work is very <b>28</b>{input(28)}. To get a Diploma each student has to study <b>29</b>{input(29)} and then work on <b>30</b>{input(30)} in depth.</p>
        </div>
      </section>
    </>}

    {part === 4 && <>
      <section className="space-y-4" aria-label="Questions 31 to 35">
        <div className="space-y-1"><h3 className="font-bold">Questions 31–35</h3><p>Complete the sentences below.</p><p>Write <b>NO MORE THAN THREE WORDS</b> for each answer.</p></div>
        <div className="space-y-4">
          <p id="question-31" className="flex flex-wrap items-center gap-2"><b>31</b><span>According to George Bernard Shaw, men are supposed to understand</span>{input(31)}<span>, economics and finance.</span></p>
          <p id="question-32" className="flex flex-wrap items-center gap-2"><b>32</b><span>However, women are more prepared to</span>{input(32)}<span>about them.</span></p>
          <p id="question-33" className="flex flex-wrap items-center gap-2"><b>33</b><span>Women tend to save for</span>{input(33)}<span>and a house.</span></p>
          <p id="question-34" className="flex flex-wrap items-center gap-2"><b>34</b><span>Men tend to save for</span>{input(34)}<span>and for retirement.</span></p>
          <p id="question-35" className="flex flex-wrap items-center gap-2"><b>35</b><span>Women who are left alone may have to pay for</span>{input(35)}<span>when they are old.</span></p>
        </div>
      </section>
      <section className="space-y-4" aria-label="Questions 36 to 40">
        <div className="space-y-1"><h4 className="font-bold">Questions 36–40</h4><p>Complete the summary below.</p><p>Write <b>NO MORE THAN THREE WORDS AND/OR A NUMBER</b> for each answer.</p></div>
        <div className="space-y-4 border border-[#999] bg-white p-5 sm:p-7">
          <h4 className="text-center text-xl font-bold">Saving for the future</h4>
          <p className="flex flex-wrap items-center gap-2">Research indicates that many women only think about their financial future when a <b>36</b>{input(36)} occurs. This is the worst time to make decisions. It is best for women to start thinking about pensions when they are in their <b>37</b>{input(37)}. A good way for women to develop their <b>38</b>{input(38)} in dealing with financial affairs would be to attend classes in <b>39</b>{input(39)}. When investing in stocks and shares, it is suggested that women should put a high proportion of their savings in <b>40</b>{input(40)}. In such ways, women can have a comfortable, independent retirement.</p>
        </div>
      </section>
    </>}
  </div>;
}
