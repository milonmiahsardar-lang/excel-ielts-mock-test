import { Fragment } from "react";

type Props = {
  part: number;
  answers: Record<number, string>;
  updateAnswer: (number: number, value: string) => void;
};

const border = "border border-[#777] px-3 py-2";

export default function TestTwoListening({ part, answers, updateAnswer }: Props) {
  const input = (number: number, width = "w-44") => (
    <input
      id={`question-${number}`}
      aria-label={`Answer for question ${number}`}
      type="text"
      value={answers[number] || ""}
      onChange={(event) => updateAnswer(number, event.target.value)}
      className={`h-9 ${width} max-w-full border border-[#2185d0] bg-white px-2 outline-none focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]`}
      autoComplete="off"
    />
  );

  const numberedBlank = (number: number, label: string, width?: string) => (
    <p id={`question-${number}`} className="flex scroll-m-6 flex-wrap items-center gap-2">
      <b>{number}</b><span>{label}</span>{input(number, width)}
    </p>
  );

  const multipleChoice = (number: number, prompt: string, options: string[]) => (
    <div id={`question-${number}`} key={number} className="scroll-m-6">
      <p className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-sm border border-[#2185d0] text-[16px]">{number}</span>
        {prompt}
      </p>
      <div className="ml-3 flex flex-col gap-3">
        {options.map((option, index) => {
          const value = String.fromCharCode(65 + index);
          return <label key={value} className="flex items-center gap-2"><input type="radio" name={`test2-listening-question-${number}`} value={value} checked={answers[number] === value} onChange={() => updateAnswer(number, value)} /><span>{option}</span></label>;
        })}
      </div>
    </div>
  );

  const letterAnswer = (number: number, letters: string[]) => (
    <div id={`question-${number}`} key={number} className="flex scroll-m-6 items-center gap-3">
      <b>{number}</b>
      <select aria-label={`Answer for question ${number}`} value={answers[number] || ""} onChange={(event) => updateAnswer(number, event.target.value)} className="h-9 w-28 border border-[#2185d0] bg-white px-2 focus:outline-none focus:ring-1 focus:ring-[#2185d0]">
        <option value="">Select</option>{letters.map((letter) => <option key={letter} value={letter}>{letter}</option>)}
      </select>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-3 text-[16px] leading-6">
      {part === 1 && <>
        <section className="space-y-4" aria-label="Questions 1 to 10">
          <div className="space-y-1"><h3 className="font-bold">Questions 1–10</h3><p>Complete the notes below.</p><p>Write <b>NO MORE THAN THREE WORDS AND/OR A NUMBER</b> for each answer.</p></div>
          <div className="space-y-5 border border-[#999] bg-white p-5 sm:p-7">
            <h4 className="text-center text-xl font-bold">GOODBYE PARTY FOR JOHN</h4>
            <p className="bg-[#eee] px-3 py-2">Date: 22nd December</p>
            <p className="flex flex-wrap items-center gap-2">Venue: <b>1</b>{input(1)}</p>
            <div className="space-y-3">
              <p className="font-bold">Invitations (Tony)</p>
              <p>Who to invite:</p>
              <ul className="ml-8 list-disc space-y-2">
                <li>John and his wife</li><li>Director</li>
                <li className="flex flex-wrap items-center gap-2">the <b>2</b>{input(2,"w-40")}</li>
                <li>all the teachers</li>
                <li className="flex flex-wrap items-center gap-2">all the <b>3</b>{input(3,"w-40")}</li>
              </ul>
              <p className="flex flex-wrap items-center gap-2">Date for sending invitations: <b>4</b>{input(4)}</p>
            </div>
            <div className="space-y-3">
              <p className="font-bold">Present (Lisa)</p>
              {numberedBlank(5,"Collect money during the")}
              <p className="flex flex-wrap items-center gap-2">Suggested amount per person: $ <b>6</b>{input(6,"w-36")}</p>
              <p>Check prices for:</p>
              <ul className="ml-8 list-disc space-y-2"><li>CD players</li><li className="flex flex-wrap items-center gap-2"><b>7</b>{input(7,"w-40")}</li><li>coffee maker</li></ul>
            </div>
            <div className="space-y-3">
              <p>Ask guests to bring:</p>
              <ul className="ml-8 list-disc space-y-2"><li>snacks</li><li className="flex flex-wrap items-center gap-2"><b>8</b>{input(8,"w-40")}</li><li className="flex flex-wrap items-center gap-2"><b>9</b>{input(9,"w-40")}</li></ul>
              <p className="flex flex-wrap items-center gap-2">Ask student representative to prepare a <b>10</b>{input(10)}</p>
            </div>
          </div>
        </section>
      </>}

      {part === 2 && <>
        <section className="space-y-5" aria-label="Questions 11 to 20">
          <div className="space-y-1"><h3 className="font-bold">Questions 11–20</h3></div>
          <div className="space-y-5">
            <section className="space-y-4">
              <div className="space-y-1"><h4 className="font-bold">Questions 11–15</h4><p>Choose the correct answer.</p></div>
              {multipleChoice(11,"To find out how much holidays cost, you should press button",["one.","two.","three."])}
              {multipleChoice(12,"Travelite currently offer walking holidays",["only in Western Europe.","all over Europe.","outside Europe."])}
              {multipleChoice(13,"The walks offered by Travelite",["cater for a range of walking abilities.","are planned by guides from the local area.","are for people with good fitness levels."])}
              {multipleChoice(14,"On Travelite holidays, people holidaying alone pay",["the same as other clients.","only a little more than other clients.","extra only if they stay in a large room."])}
              {multipleChoice(15,"Entertainment is provided",["when guests request it.","most nights.","every night."])}
            </section>
            <section className="space-y-4">
              <div className="space-y-1"><h4 className="font-bold">Questions 16–20</h4><p>Complete the table below.</p><p>Write <b>NO MORE THAN THREE WORDS AND/OR A NUMBER</b> for each answer.</p></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[640px] border-collapse border border-[#777] text-left">
                <thead><tr className="bg-[#f2f2f2]"><th className={border}>Length of holiday</th><th className={border}>Cost per person (including all accommodation costs)</th><th className={border}>Special offers included in price</th></tr></thead>
                <tbody>
                  <tr><td className={border}>3 days</td><td className={border}>16 $ {input(16,"w-36")}</td><td className={border}>Pick up from the 17 {input(17,"w-36")}</td></tr>
                  <tr><td className={border}>7 days</td><td className={border}>$350</td><td className={border}>As above plus<br />• book of 18 {input(18,"w-36")}<br />• maps</td></tr>
                  <tr><td className={border}>14 days</td><td className={border}>19 $ {input(19,"w-36")}</td><td className={border}>As above plus membership of a 20 {input(20,"w-36")}</td></tr>
                </tbody>
              </table></div>
            </section>
          </div>
        </section>
      </>}

      {part === 3 && <>
        <section className="space-y-4" aria-label="Questions 21 to 30">
          <div className="space-y-1"><h3 className="font-bold">Questions 21–30</h3><p>Complete the table below.</p><p>Write <b>NO MORE THAN THREE WORDS AND/OR A NUMBER</b> for each answer.</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[700px] border-collapse border border-[#777] text-left">
            <thead><tr className="bg-[#f2f2f2]"><th className={border}>Experiment number</th><th className={border}>Equipment</th><th className={border}>Purpose</th></tr></thead>
            <tbody>
              <tr><th className={border}>Experiment 1</th><td className={border}><span id="question-21"><b>21</b> {input(21,"w-40")}</span><br />and a table</td><td className={border}>To show how things move on a cushion of air</td></tr>
              <tr><th className={border}>Experiment 2</th><td className={border}>Lots of paperclips</td><td className={border}>To show why we need standard <span id="question-22"><b>22</b> {input(22,"w-40")}</span></td></tr>
              <tr><th className={border}>Experiment 3</th><td className={border}><span id="question-23"><b>23</b> {input(23,"w-40")}</span><br />and a jar of water</td><td className={border}>To show how <span id="question-24"><b>24</b> {input(24,"w-40")}</span> grow</td></tr>
              <tr><th className={border}>Experiment 4</th><td className={border}>Cardboard, coloured pens and a <span id="question-25"><b>25</b> {input(25,"w-40")}</span></td><td className={border}>To teach children about how <span id="question-26"><b>26</b> {input(26,"w-40")}</span> is made up</td></tr>
              <tr><th className={border}>Experiment 5</th><td className={border}>A drill, an old record, a pin/needle, paper, a bolt</td><td className={border}>To make a record player in order to learn about recording sound</td></tr>
            </tbody>
          </table></div>
        </section>
        <section className="space-y-4" aria-label="Questions 27 to 30">
          <div className="space-y-1"><h4 className="font-bold">Questions 27–30</h4><p>What problems do the speakers identify for each experiment?</p><p>Choose your answers from the box and select the matching letter for Questions 27–30.</p></div>
          <div className="mx-auto grid max-w-md grid-cols-[auto_1fr] gap-x-4 border border-[#777] p-4"><b className="col-span-2 text-center">Problems</b>{[["A","too messy"],["B","too boring"],["C","too difficult"],["D","too much equipment"],["E","too long"],["F","too easy"],["G","too noisy"],["H","too dangerous"]].map(([letter,label])=><Fragment key={letter}><b>{letter}</b><span>{label}</span></Fragment>)}</div>
          <div className="grid gap-3 sm:grid-cols-2">{[27,28,29,30].map((number,index)=><div key={number} className="flex items-center gap-3"><span>Experiment {index < 3 ? index + 1 : 5}:</span>{letterAnswer(number,["A","B","C","D","E","F","G","H"])}</div>)}</div>
        </section>
      </>}

      {part === 4 && <>
        <section className="space-y-4" aria-label="Questions 31 to 34">
          <div className="space-y-1"><h3 className="font-bold">Questions 31–34</h3><p>Complete the notes below.</p><p>Write <b>NO MORE THAN THREE WORDS AND/OR A NUMBER</b> for each answer.</p></div>
          <div className="mx-auto max-w-3xl border border-[#777] bg-white">
            <h4 className="border-b border-[#777] px-4 py-2 text-center text-xl font-bold">Sharks in Australia</h4>
            <div className="grid grid-cols-[minmax(120px,0.7fr)_minmax(0,1fr)_minmax(0,1.5fr)]">
              <b className={border}>Length</b><span className={border}>largest caught:</span><span className={border}>16 metres</span>
              <b className={border}>Weight</b><span className={border}>heaviest:</span><span id="question-31" className={border}><b>31</b> {input(31,"w-36")} kg</span>
              <b className={border}>Skeleton</b><span className={`${border} col-span-2`}>cartilage</span>
              <b className={border}>Skin texture</b><span className={`${border} col-span-2`}>rough barbs</span>
              <b className={border}>Swimming aide</b><span className={border}>fins and <b>32</b></span><span id="question-32" className={border}>{input(32,"w-40")}</span>
              <b className={border}>Food</b><span className={border}>gathered from the ocean <b>33</b></span><span id="question-33" className={border}>{input(33,"w-40")}</span>
              <span className={`${border} col-span-2`}>sharks locate food by using their <b>34</b></span><span id="question-34" className={border}>{input(34,"w-40")}</span>
            </div>
          </div>
        </section>
        <section className="space-y-4" aria-label="Questions 35 to 40">
          <div className="space-y-1"><h4 className="font-bold">Questions 35–38</h4><p>Choose the correct answer.</p></div>
          {multipleChoice(35,"Shark meshing uses nets laid",["along the coastline.","at an angle to the beach.","from the beach to the sea."])}
          {multipleChoice(36,"Other places that have taken up shark meshing include",["South Africa.","New Zealand.","Tahiti."])}
          {multipleChoice(37,"The average number of sharks caught in nets each year is",["15.","150.","1,500."])}
          {multipleChoice(38,"Most sharks are caught in",["spring.","summer.","winter."])}
          <div className="space-y-4">
            <div className="space-y-1"><h4 className="font-bold">Questions 39 and 40</h4><p>Select TWO options.</p><p>Which TWO factors reduce the benefits of shark nets?</p></div>
            <div className="space-y-3">
              {[["A","nets wrongly positioned"],["B","strong waves and currents"],["C","too many fish"],["D","sharks eat holes in nets"],["E","moving sands"],["F","nets are too short"],["G","holes in nets scare sharks"]].map(([letter,label])=>{
                const selected=[answers[39],answers[40]].filter(Boolean);
                const checked=selected.includes(letter);
                return <label key={letter} className="flex items-center gap-2"><input type="checkbox" checked={checked} disabled={!checked&&selected.length>=2} onChange={()=>{
                  const next=checked?selected.filter((value)=>value!==letter):[...selected,letter];
                  updateAnswer(39,next[0]||"");
                  updateAnswer(40,next[1]||"");
                }}/><span>{label}</span></label>;
              })}
            </div>
          </div>
        </section>
      </>}
    </div>
  );
}
