type Props = {
  part: number;
  answers: Record<number, string>;
  updateAnswer: (number: number, value: string) => void;
};

const cell = "border border-[#777] px-3 py-2 align-top";

export default function TestFiveListening({ part, answers, updateAnswer }: Props) {
  const input = (number: number, width = "w-44") => (
    <input id={`question-${number}`} aria-label={`Answer for question ${number}`} value={answers[number] || ""} onChange={(event) => updateAnswer(number, event.target.value)} className={`h-9 ${width} max-w-full border border-[#2185d0] bg-white px-2 outline-none focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]`} autoComplete="off" />
  );

  const multipleChoice = (number: number, prompt: string, options: string[]) => (
    <div id={`question-${number}`} key={number} className="scroll-m-6">
      <p className="mb-3 flex items-center gap-2"><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-sm border border-[#2185d0]">{number}</span>{prompt}</p>
      <div className="ml-3 flex flex-col gap-3">{options.map((option, index) => {
        const value = String.fromCharCode(65 + index);
        return <label key={value} className="flex items-center gap-2"><input type="radio" name={`test5-listening-question-${number}`} value={value} checked={answers[number] === value} onChange={() => updateAnswer(number, value)} /><span>{option}</span></label>;
      })}</div>
    </div>
  );

  const chooseTwo = (numbers: [number, number], options: string[]) => {
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

  const listAnswer = (number: number, options: string[]) => (
    <div id={`question-${number}`} key={number} className="flex scroll-m-6 items-center gap-3"><b>{number}</b><select aria-label={`Answer for question ${number}`} value={answers[number] || ""} onChange={(event) => updateAnswer(number, event.target.value)} className="h-9 w-full max-w-xs border border-[#2185d0] bg-white px-2 focus:outline-none focus:ring-1 focus:ring-[#2185d0]"><option value="">Select</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
  );

  const dimensions = (answers[24] || "||").split("|");
  const updateDimension = (index: number, value: string) => {
    const next = [...dimensions];
    next[index] = value;
    updateAnswer(24, next.join("|"));
  };

  return <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-3 text-[16px] leading-6">
    {part === 1 && <>
      <section className="space-y-4" aria-label="Questions 1 to 10">
        <div className="space-y-1"><h3 className="font-bold">Questions 1–10</h3><p>Complete the notes below.</p><p>Write <b>NO MORE THAN THREE WORDS AND/OR A NUMBER</b> for each answer.</p></div>
        <div className="space-y-5 border border-[#999] bg-white p-5 sm:p-7">
          <h4 className="text-center text-xl font-bold">NOTES — Christmas Dinner</h4>
          <p><b>Date of dinner:</b> 21 December</p>
          <p className="font-semibold">Choices for venue:</p>
          <div className="space-y-3">
            <p id="question-1" className="flex flex-wrap items-center gap-2">• First choice <b>1</b>{input(1)} <span>Tel. number: not known</span></p>
            <p id="question-2" className="flex flex-wrap items-center gap-2">• Second choice <b>2</b>{input(2)} <span>Tel. number: 777192</span></p>
            <p id="question-3" className="flex flex-wrap items-center gap-2">• Third choice <b>3</b>{input(3)} <span>Tel. number:</span> <b>4</b>{input(4,"w-36")}</p>
          </div>
          <p><b>Price per person:</b> £12</p>
          <p id="question-5" className="flex flex-wrap items-center gap-2">Restaurant must have vegetarian food and a <b>5</b>{input(5)}.</p>
          <p className="font-semibold">Menu:</p>
          <div className="space-y-2 pl-6"><p>First course — French Onion Soup OR Fruit Juice</p><p className="flex flex-wrap items-center gap-2">Main course — Roast Dinner OR <b>6</b>{input(6,"w-40")}</p><p>Dessert — Plum Pudding OR Apple Pie</p><p>Coffee</p></div>
          <p className="flex flex-wrap items-center gap-2">Restaurant requires from us: <b>7</b>{input(7)} and letter of confirmation, and we must <b>8</b>{input(8)} in advance.</p>
          <p id="question-9" className="flex flex-wrap items-center gap-2">Must confirm in writing by <b>9</b>{input(9)}.</p>
          <p id="question-10" className="flex flex-wrap items-center gap-2">Put notice in <b>10</b>{input(10)}.</p>
        </div>
      </section>
    </>}

    {part === 2 && <>
      <section className="space-y-4" aria-label="Questions 11 to 16">
        <div className="space-y-1"><h3 className="font-bold">Questions 11–13</h3><p>Complete the table below.</p><p>Write <b>NO MORE THAN THREE WORDS OR A NUMBER</b> for each answer.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse border border-black text-left">
          <thead><tr><th colSpan={2} className={cell+" text-center"}>MEMBERSHIP OF SPORTS CENTRE</th></tr></thead>
          <tbody>
            <tr><th className={cell+" w-24 font-normal"}>Cost</th><td className={cell}><span id="question-11"><b>11</b> £{input(11,"w-28")}</span> per <span id="question-12"><b>12</b> {input(12,"w-40")}</span></td></tr>
            <tr><th className={cell+" font-normal"}>Where?</th><td className={cell}><span id="question-13"><b>13</b> {input(13,"w-48")}</span></td></tr>
            <tr><th className={cell+" font-normal"}>When?</th><td className={cell}>2 to 6 pm, Monday to Thursday</td></tr>
            <tr><th className={cell+" font-normal"}>Bring:</th><td className={cell}><p>Union card</p><p>Photo</p><p>Fee</p></td></tr>
          </tbody>
        </table></div>
      </section>
      <section className="space-y-4" aria-label="Questions 14 to 16">
        <div className="space-y-1"><h4 className="font-bold">Questions 14–16</h4><p>Complete the table below.</p><p>Write <b>NO MORE THAN THREE WORDS</b> for each answer.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse border border-black text-left"><tbody>
          <tr><td colSpan={2} className={cell}>Always bring sports <span id="question-14"><b>14</b> {input(14,"w-36")}</span> when you come to <span id="question-15"><b>15</b> {input(15,"w-36")}</span> or use the Centre’s facilities.</td></tr>
          <tr><th className={cell+" w-1/2 font-normal"}>Opening hours</th><td className={cell}>9 am to 10 pm on <span id="question-16"><b>16</b> {input(16,"w-36")}</span><br />10 am to 6 pm on Saturdays</td></tr>
          <tr><th className={cell+" font-normal"}>50% ‘morning discount’</th><td className={cell}>9 am to 12 noon on weekdays</td></tr>
        </tbody></table></div>
      </section>
      <section className="space-y-5" aria-label="Questions 17 to 20">
        <div className="space-y-1"><h4 className="font-bold">Questions 17–20</h4><p>Look at the map of the Sports Complex below.</p><p>Label the buildings on the map of the Sports Complex.</p><p>Choose your answers from the list and match them with Questions 17–20.</p></div>
        <div className="grid items-start gap-6 md:grid-cols-2">
          <img src="/images/test2-sports-centre.png" alt="Map of the Sports Complex" className="mx-auto block h-auto w-full border border-[#d5d5d5] bg-white object-contain" />
          <div className="space-y-5"><div className="space-y-3">{[17,18,19,20].map((number)=>listAnswer(number,["Arts Studio","Football Pitch","Tennis Courts","Dance Studio","Fitness Room","Reception","Squash Courts"]))}</div><div className="space-y-1 border border-[#777] p-4">{["Arts Studio","Football Pitch","Tennis Courts","Dance Studio","Fitness Room","Reception","Squash Courts"].map((option)=><p key={option}>{option}</p>)}</div></div>
        </div>
      </section>
    </>}

    {part === 3 && <>
      <section className="space-y-4" aria-label="Questions 21 to 30">
        <div className="space-y-1"><h3 className="font-bold">Questions 21–30</h3><p>Complete the form below.</p><p>Write <b>NO MORE THAN THREE WORDS AND/OR A NUMBER</b> for each answer.</p></div>
        <div className="mx-auto w-full max-w-3xl space-y-4 border-4 border-double border-black bg-white p-5 sm:p-7">
          <h4 className="text-center text-2xl font-semibold uppercase leading-tight underline">Young Electronic<br />Engineer Competition</h4>
          <p>Name(s) of designer(s): John Brown</p>
          <p id="question-21" className="flex scroll-m-6 justify-center gap-2"><b>21</b>{input(21,"w-52")}</p>
          <p id="question-22">Age: <b>22</b> {input(22,"w-44")}</p>
          <p id="question-23">Name of design: <b>23</b> {input(23,"w-full max-w-xl")}</p>
          <div id="question-24"><p className="mb-2">Dimensions of equipment: <b>24</b></p><table className="mx-auto w-full max-w-xl table-fixed border-collapse border border-black text-center text-[14px]"><thead><tr>{["Width","Length","Depth"].map((label)=><th key={label} className={cell+" font-normal"}>{label}</th>)}</tr></thead><tbody><tr>{[0,1,2].map((index)=><td key={index} className={cell}><input aria-label={`Question 24 ${["width","length","depth"][index]}`} value={dimensions[index]||""} onChange={(event)=>updateDimension(index,event.target.value)} className="h-9 w-28 max-w-full border border-[#2185d0] bg-white px-1 text-center outline-none focus:ring-1 focus:ring-[#2185d0]" /><span> cm</span></td>)}</tr></tbody></table></div>
          <p><b>Power:</b> Battery</p>
          <p className="font-semibold">Special features:</p>
          <p id="question-25"><b>25</b> {input(25,"w-full")}</p><p id="question-26" className="pl-8"><b>26</b> {input(26,"w-full")}</p><p id="question-27" className="pl-8"><b>27</b> {input(27,"w-full")}</p>
          <p><b>Cost:</b> parts $5</p><p id="question-28"><b>28</b> {input(28,"w-56")} $9.50</p>
          <p id="question-29">Other comments: need help to make <b>29</b> {input(29,"w-56")}</p><p className="text-center italic">would like to develop range of sizes</p><p id="question-30">Send by: <b>30</b> {input(30,"w-56")}</p>
        </div>
      </section>
    </>}

    {part === 4 && <>
      <section className="space-y-4" aria-label="Questions 31 to 33">
        <div className="space-y-1"><h3 className="font-bold">Questions 31–33</h3><p>Complete the table below.</p><p>Write <b>NO MORE THAN TWO WORDS</b> for each answer.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] border-collapse border border-black text-left"><thead><tr className="bg-[#f2f2f2]"><th className={cell}>“NEW” MEAT</th><th className={cell}>CAN BE COMPARED TO</th><th className={cell}>PROBLEM</th></tr></thead><tbody>
          <tr><td className={cell}>Kangaroo</td><td className={cell}><b>31</b> {input(31,"w-40")}</td><td className={cell}><b>32</b> {input(32,"w-40")}</td></tr>
          <tr><td className={cell}>Crocodile</td><td className={cell}>Chicken</td><td className={cell}>Fatty</td></tr>
          <tr><td className={cell}>Ostrich</td><td className={cell}><b>33</b> {input(33,"w-40")}</td><td className={`${cell} bg-[#d9d9d9]`} /></tr>
        </tbody></table></div>
      </section>
      <section className="space-y-4" aria-label="Questions 34 to 36">
        <div className="space-y-1"><h4 className="font-bold">Questions 34–36</h4><p>Complete the table below.</p><p>Write <b>NO MORE THAN THREE WORDS</b> for each answer.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse border border-black text-left"><thead><tr><th className={cell}>OSTRICH PRODUCT</th><th className={cell}>USE</th></tr></thead><tbody>
          <tr><td rowSpan={3} className={cell}>Ostrich feathers</td><td className={cell}>• tribal ceremonial dress</td></tr><tr><td className={cell}>• <b>34</b> {input(34,"w-40")}</td></tr><tr><td className={cell}>• decorated hats</td></tr>
          <tr><td className={cell}>Ostrich hide</td><td className={cell}>• <b>35</b> {input(35,"w-40")}</td></tr>
          <tr><td className={cell}>Ostrich <b>36</b> {input(36,"w-40")}</td><td className={cell}>• ‘biltong’</td></tr>
        </tbody></table></div>
      </section>
      <section className="space-y-4" aria-label="Questions 37 to 40">
        <div className="space-y-1"><h4 className="font-bold">Questions 37–40</h4><p>Choose the correct answer.</p></div>
        {multipleChoice(37,"Ostrich meat",["has more protein than beef.","tastes nearly as good as beef.","is very filling."])}
        {multipleChoice(38,"One problem with ostrich farming in Britain is",["the climate.","the cost of transporting birds.","the price of ostrich eggs."])}
        {multipleChoice(39,"Ostrich chicks reared on farms",["must be kept in incubators until mature.","are very independent.","need looking after carefully."])}
        {multipleChoice(40,"The speaker suggests ostrich farms are profitable because",["little initial outlay is required.","farmed birds are very productive.","there is a good market for the meat."])}
      </section>
    </>}
  </div>;
}
