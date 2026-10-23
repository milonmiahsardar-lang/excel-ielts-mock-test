export const testModes = ["full", "listening", "reading", "writing"] as const;
export type TestMode = typeof testModes[number];
export type TestSection = Exclude<TestMode, "full">;
export function isTestMode(value: unknown): value is TestMode {return testModes.includes(value as TestMode);}
export function modeOf(value: {mode?: unknown}): TestMode {return isTestMode(value.mode)?value.mode:"full";}
export function includesModule(mode: TestMode|undefined, skill: TestSection) {return !mode||mode==="full"||mode===skill;}
export function firstModule(mode: TestMode): TestSection {return mode==="full"?"listening":mode;}
export function modeLabel(mode: TestMode) {return mode==="full"?"Full mock":`${mode[0].toUpperCase()}${mode.slice(1)} only`;}
export function testName(test: number,mode: TestMode) {return `${mode==="full"?"Full Mock":modeLabel(mode)} Test ${String(test).padStart(2,"0")}`;}
export function modePath(path: string,mode: TestMode) {return mode==="full"?path:`${path}${path.includes("?")?"&":"?"}mode=${mode}`;}
