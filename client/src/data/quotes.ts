import type { ProgrammerKey, ThemeId } from '@shared/constants';

export interface QuoteSource {
  title: string;
  author: string;
  year: number;
  locator: string;
}

export interface QuoteEntry {
  quote: string;
  speaker: string;
  quote_type: string;
  context: string;
  source: QuoteSource;
}

/** Maps ProgrammerKey to the JSON data id */
const PROGRAMMER_KEY_TO_ID: Record<ProgrammerKey, string> = {
  jennings: 'jean_jennings_bartik',
  snyder: 'betty_snyder_holberton',
  mcnulty: 'kay_mcnulty_mauchly_antonelli',
  wescoff: 'marlyn_wescoff_meltzer',
  bilas: 'fran_bilas_spence',
  lichterman: 'ruth_lichterman_teitelbaum',
};

/** Maps ThemeId to the JSON category key */
const THEME_TO_CATEGORY: Record<ThemeId, string> = {
  programming: 'computing',
  pioneering: 'pioneering',
  teamwork: 'teamwork',
  recognition: 'recognition',
};

// Inline the quote data keyed by JSON id → category → QuoteEntry
const QUOTE_DATA: Record<string, Record<string, QuoteEntry>> = {
  jean_jennings_bartik: {
    computing: {
      quote: 'The ENIAC was a son of a bitch to program.',
      speaker: 'Jean Jennings',
      quote_type: 'direct_quote',
      context: 'Programming ENIAC required the team to coordinate operations with different running times while preventing conflicts on the machine\u2019s shared buses. Bartik used this blunt phrase to capture how painstaking it was to translate a problem into switches, cables, pulses, and precisely timed sequences.',
      source: { title: 'Pioneer Programmer', author: 'Jean Jennings Bartik', year: 2013, locator: 'ch. 3 / user notes' },
    },
    pioneering: {
      quote: 'Through a series of fortuitous circumstances, we were allowed to play an important technical role during a time when American society... was even more sexist than it is today.',
      speaker: 'Jean Jennings',
      quote_type: 'direct_quote',
      context: 'Wartime labor shortages opened technical positions that were usually closed to women, allowing Bartik and the other programmers to enter a new field. Their opportunity depended on unusual historical circumstances, but the technical methods they developed were their own achievement.',
      source: { title: 'Pioneer Programmer', author: 'Jean Jennings Bartik', year: 2013, locator: 'user notes' },
    },
    teamwork: {
      quote: 'Betty and I had a grand time. We were not only partners, but we were friends...',
      speaker: 'Jean Jennings',
      quote_type: 'direct_quote_about_betty',
      context: 'Jean and Betty built the trajectory program through a demanding form of peer review: each tried to find faults in the other\u2019s work, and every discovered error improved the program. Their technical partnership became a close friendship that continued outside the ENIAC room.',
      source: { title: 'Pioneer Programmer', author: 'Jean Jennings Bartik', year: 2013, locator: 'p. 85 / user notes' },
    },
    recognition: {
      quote: 'History had been made that day\u2014and then it had run over us and left us flat in its tracks.',
      speaker: 'Jean Jennings',
      quote_type: 'direct_quote',
      context: 'On February 15, 1946, the ENIAC successfully demonstrated the trajectory program Jean and Betty had prepared. The programmers were not introduced, congratulated, or invited to the official celebratory dinner, even though their work made the central demonstration possible.',
      source: { title: 'Pioneer Programmer', author: 'Jean Jennings Bartik', year: 2013, locator: 'p. 99 / user notes' },
    },
  },
  betty_snyder_holberton: {
    computing: {
      quote: 'How we learned to program, I have no idea... We must have thought it up ourselves.',
      speaker: 'Betty Snyder',
      quote_type: 'direct_quote',
      context: 'The six programmers had no established programming method to follow. They worked from ENIAC\u2019s diagrams and gradually discovered how to move numbers and control pulses through the machine. Betty later summarized this process with striking understatement: the team effectively invented the method as they went.',
      source: { title: 'Holberton Oral History', author: 'Betty Snyder Holberton', year: 1997, locator: 'cited in user notes' },
    },
    pioneering: {
      quote: 'If you\u2019re in the computer field from the very beginning, you are going to be a first in a lot of things.',
      speaker: 'Betty Snyder',
      quote_type: 'direct_quote',
      context: 'Betty\u2019s work began before programming had established tools, job descriptions, or conventions. After ENIAC, she continued with early stored-program computers and contributed to programming languages and standards, repeatedly entering areas that had no precedent.',
      source: { title: 'The Computers documentary', author: 'ENIAC Programmers Project', year: 2014, locator: 'user transcript' },
    },
    teamwork: {
      quote: 'Betty Snyder was my first perfect partner.',
      speaker: 'Jean Jennings',
      quote_type: 'quote_about_betty',
      context: 'Jean and Betty divided the trajectory problem according to their strengths: Jean broke down the mathematics, while Betty translated it into the logical steps ENIAC could execute. They checked one another\u2019s work closely and treated every detected fault as progress toward an error-free program.',
      source: { title: 'Pioneer Programmer', author: 'Jean Jennings Bartik', year: 2013, locator: 'p. 84 / user notes' },
    },
    recognition: {
      quote: 'In those days the women were not recognized at all. So it was just a normal thing.',
      speaker: 'Betty Snyder',
      quote_type: 'direct_quote',
      context: 'Betty was reflecting on ENIAC\u2019s public demonstration, where the programmers were present but not introduced to the audience. Her calm wording shows how routine this exclusion appeared within the gender expectations of the period.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'p. 178 / user notes' },
    },
  },
  kay_mcnulty_mauchly_antonelli: {
    computing: {
      quote: 'I know how! We use the master programmer to reuse code!',
      speaker: 'Kay McNulty',
      quote_type: 'direct_quote_recalled_by_jean',
      context: 'The programmers were struggling to fit the repeated calculations of a ballistic trajectory onto ENIAC. Kay realized that the master programmer could run a sequence repeatedly for a fixed number of times and then continue with another sequence. This introduced the practical equivalents of loops and conditional branching without rewiring the same operations for every step.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'user notes' },
    },
    pioneering: {
      quote: 'We were like fighter pilots. I mean, here was this great machine...',
      speaker: 'Kay McNulty',
      quote_type: 'direct_quote',
      context: 'Kay compared the programmers to trained pilots. The ENIAC could not simply be handed to an ordinary operator. Running it required intimate knowledge of its units, timing, switches, and cable connections, as well as the judgment to diagnose problems while a program was operating.',
      source: { title: 'The Computers documentary', author: 'ENIAC Programmers Project', year: 2014, locator: 'user transcript' },
    },
    teamwork: {
      quote: 'I really loved working with those girls.',
      speaker: 'Kay McNulty',
      quote_type: 'direct_quote',
      context: 'The six women divided ENIAC\u2019s units among pairs, taught one another what they discovered, and then combined their knowledge to build complete programs. Their collaboration also became a close social community that extended beyond work.',
      source: { title: 'The Computers documentary', author: 'ENIAC Programmers Project', year: 2014, locator: 'user transcript' },
    },
    recognition: {
      quote: 'None of us girls were ever introduced... we were just programmers.',
      speaker: 'Kay McNulty',
      quote_type: 'direct_quote',
      context: 'At ENIAC\u2019s public demonstration, the engineers and institutional leaders were introduced, but the women who programmed the central trajectory demonstration were not. At the time, \u201cprogrammer\u201d still described a low-status service role associated with women; only later did programming become a prestigious profession.',
      source: { title: 'The Computers documentary', author: 'ENIAC Programmers Project', year: 2014, locator: 'user transcript; Proving Ground, p. 178 / user notes' },
    },
  },
  marlyn_wescoff_meltzer: {
    computing: {
      quote: 'We were sure that this machine could do anything we wanted it to do. We were very cocky about that.',
      speaker: 'Marlyn Wescoff',
      quote_type: 'direct_quote',
      context: 'After learning ENIAC from its diagrams and turning its units into a programmable system, the women understood that the machine was not limited to one calculation. Their confidence came from having made it solve trajectories and then helping adapt it to other complex problems.',
      source: { title: 'The Computers documentary', author: 'ENIAC Programmers Project', year: 2014, locator: 'user transcript' },
    },
    pioneering: {
      quote: 'We were computing ballistic tables on a hand calculator. We were computing. And we were Computers.',
      speaker: 'Marlyn Wescoff',
      quote_type: 'direct_quote',
      context: 'Before ENIAC, Marlyn and other women calculated firing tables by hand with desk calculators and were employed under the job title \u201cComputer.\u201d Their mathematical labor formed the bridge from human computation to programming the electronic machine that accelerated the same work.',
      source: { title: 'The Computers documentary', author: 'ENIAC Programmers Project', year: 2014, locator: 'user transcript' },
    },
    teamwork: {
      quote: 'Marlyn enjoyed being with Ruth, who was \u201cvery bubbly, very, very outspoken and a lot of fun to be with.\u201d',
      speaker: 'Marlyn Wescoff / Kathy Kleiman',
      quote_type: 'quote_about_ruth',
      context: 'Marlyn and Ruth became close while carrying out a demanding bench test that reproduced ENIAC\u2019s trajectory calculation by hand. Their complementary personalities and shared work developed into a friendship that included dinners, concerts, films, and plays.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'p. 153 / user notes' },
    },
    recognition: {
      quote: 'The attendees would think [we] were \u201cthe operators of that machine and that was it.\u201d',
      speaker: 'Marlyn Wescoff',
      quote_type: 'direct_quote',
      context: 'Marlyn understood what the audience would infer when the women were visible near ENIAC but their work was never explained. Without their names or roles, they could easily be mistaken for attendants who merely operated controls prepared by others.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'p. 178 / user notes' },
    },
  },
  fran_bilas_spence: {
    computing: {
      quote: 'Fran and Kay \u201cput their heads together to study the high-speed multiplier and figure out how it worked.\u201d',
      speaker: 'Kathy Kleiman',
      quote_type: 'narrative_statement_about_fran_and_kay',
      context: 'Fran joined the ENIAC team after supervising work on the differential analyzer. Kay brought her up to date, and the two friends studied the high-speed multiplier from its diagrams because they were not yet permitted to enter the ENIAC room.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'p. 153 / user notes' },
    },
    pioneering: {
      quote: 'Fran was one of the six selected to program ENIAC after wartime recruitment of women mathematicians.',
      speaker: 'Kathy Kleiman',
      quote_type: 'biographical_fact',
      context: 'Fran graduated in mathematics from Chestnut Hill College and joined the Army\u2019s computing work during the wartime demand for mathematically trained women. Her experience supervising a differential-analyzer team helped lead to her selection for the classified ENIAC project in 1945.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'Cast of Characters / file search' },
    },
    teamwork: {
      quote: 'Fran was Kay\u2019s best friend and fellow math graduate of Chestnut Hill College.',
      speaker: 'Kathy Kleiman',
      quote_type: 'biographical_fact',
      context: 'Fran and Kay studied mathematics together at Chestnut Hill College and remained close after joining the Army\u2019s computing teams. On ENIAC they became technical partners, studying the high-speed multiplier and helping prepare demanding programs for the machine.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'Cast of Characters / file search' },
    },
    recognition: {
      quote: 'For decades, a famous photo of Jean and Frances Bilas was shared without naming the women.',
      speaker: 'Kathy Kleiman',
      quote_type: 'historical_caption_about_fran_and_jean',
      context: 'The photograph shows Jean Jennings Bartik and Fran Bilas Spence working beside ENIAC, yet it circulated for decades without identifying them. The missing names allowed the women to be interpreted as anonymous models or operators rather than programmers.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'photo caption / file search' },
    },
  },
  ruth_lichterman_teitelbaum: {
    computing: {
      quote: 'We did a lot of testing on it... and got it working again.',
      speaker: 'Ruth Lichterman',
      quote_type: 'direct_quote',
      context: 'After ENIAC was moved from Philadelphia to Aberdeen in 1947, it arrived with damage from the journey. Ruth and Kay worked with engineers for seven months, testing the machine unit by unit with diagnostic programs they had learned to create themselves.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'user notes' },
    },
    pioneering: {
      quote: 'Ruth continued as a Programmer and supervisor at Aberdeen after ENIAC began operations there in 1947.',
      speaker: 'Kathy Kleiman',
      quote_type: 'historical_fact_about_ruth',
      context: 'Ruth helped restore ENIAC after its move from Philadelphia to the Ballistics Research Laboratory at Aberdeen. Once the machine was operational, she stayed on as an experienced programmer and supervisor, passing her knowledge to the next generation of ENIAC programmers.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'image caption / file search' },
    },
    teamwork: {
      quote: 'Ruth and Marlyn \u201cspent almost as much time together outside of work as they did at the Moore School.\u201d',
      speaker: 'Kathy Kleiman',
      quote_type: 'narrative_statement_about_ruth_and_marlyn',
      context: 'Ruth and Marlyn manually calculated a trajectory exactly as ENIAC would process it, creating a benchmark for checking the electronic result. The precision and time required by this work strengthened a friendship that continued through dinners, films, concerts, and plays.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'p. 153 / user notes' },
    },
    recognition: {
      quote: 'In 2019 Ruth appeared on the cover of the New York Times Magazine, \u201cbut still without her name.\u201d',
      speaker: 'Kathy Kleiman',
      quote_type: 'narrative_statement_about_ruth',
      context: 'The magazine cover reused an archival image in which Ruth stands behind later programmers working at ENIAC. Even decades after efforts to recover the ENIAC women\u2019s history, the image again presented her visibly while withholding the name that would identify her contribution.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'p. 216 / user notes' },
    },
  },
};

/**
 * Look up the quote entry for a given programmer and theme.
 */
export function getQuoteForProgrammer(
  programmerKey: ProgrammerKey,
  themeId: ThemeId
): QuoteEntry | null {
  const jsonId = PROGRAMMER_KEY_TO_ID[programmerKey];
  const category = THEME_TO_CATEGORY[themeId];
  if (!jsonId || !category) return null;

  const programmerEntries = QUOTE_DATA[jsonId];
  if (!programmerEntries) return null;

  return programmerEntries[category] || null;
}
