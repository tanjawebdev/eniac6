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
      quote: 'They had no books or anything to teach us.',
      speaker: 'Jean Jennings Bartik',
      quote_type: 'direct_quote',
      context: 'In 1945, the programmers were given engineering and logical diagrams, but no usable programming manual. They were not yet cleared to enter the ENIAC room, so they had to reconstruct the machine\u2019s operation from drawings and teach themselves how its units could be connected into a program. Their work helped define programming at a time when programming languages, compilers, and formal courses did not yet exist.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'pp. 125\u2013127, chapter \u201cA New Project\u201d' },
    },
    pioneering: {
      quote: 'We knew we were pushing back frontiers.',
      speaker: 'Jean Jennings Bartik',
      quote_type: 'direct_quote',
      context: 'Bartik described the sense that the team was entering territory no one had mapped before. They were turning a unique electronic machine into a general-purpose computer by discovering how to express mathematical problems as timed pulses, switch settings, and cable connections. Their methods became part of the foundation of modern programming.',
      source: { title: 'The Computers', author: 'ENIAC Programmers Project documentary', year: 2014, locator: 'Jean Jennings Bartik interview excerpt' },
    },
    teamwork: {
      quote: 'Betty Snyder was my first perfect partner.',
      speaker: 'Jean Jennings Bartik',
      quote_type: 'direct_quote_about_betty',
      context: 'Jean and Betty developed the trajectory program as an unusually rigorous pair. Each actively searched for faults in the other\u2019s work, and finding an error was treated as a success because it prevented the mistake from remaining in the program.',
      source: { title: 'Pioneer Programmer', author: 'Jean Jennings Bartik', year: 2013, locator: 'pp. 84\u201385, chapter 3' },
    },
    recognition: {
      quote: 'It felt as if history had been made that day\u2014and then it had run over us and left us flat in its tracks.',
      speaker: 'Jean Jennings Bartik',
      quote_type: 'direct_quote',
      context: 'On February 15, 1946, the ENIAC successfully demonstrated the trajectory program Jean and Betty had prepared. The programmers were not introduced, congratulated, or invited to the official celebratory dinner, even though their work made the central demonstration possible.',
      source: { title: 'Pioneer Programmer', author: 'Jean Jennings Bartik', year: 2013, locator: 'pp. 99\u2013100, chapter 4' },
    },
  },
  betty_snyder_holberton: {
    computing: {
      quote: 'How we learned to program, I have no idea... We must have thought it up ourselves.',
      speaker: 'Betty Snyder Holberton',
      quote_type: 'direct_quote',
      context: 'The six programmers had no established programming method to follow. They worked from ENIAC\u2019s diagrams and gradually discovered how to move numbers and control pulses through the machine. Betty later summarized this process with striking understatement: the team effectively invented the method as they went.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'pp. 136\u2013138, chapter \u201cA Sequencing of the Problem\u201d' },
    },
    pioneering: {
      quote: 'Everything I did was the beginning of something new.',
      speaker: 'Betty Snyder Holberton',
      quote_type: 'direct_quote',
      context: 'Betty\u2019s career continued far beyond the ENIAC. She worked on early stored-program computers, contributed to programming tools and standards, and became known for testing new code and languages with exceptional precision.',
      source: { title: 'The Computers', author: 'ENIAC Programmers Project documentary', year: 2014, locator: 'Betty Snyder Holberton interview excerpt' },
    },
    teamwork: {
      quote: 'Betty was bright, logical, and hard-working.',
      speaker: 'Jean Jennings Bartik',
      quote_type: 'quote_about_betty',
      context: 'Jean\u2019s description appears directly after she calls Betty her first perfect partner. Their partnership joined Jean\u2019s mathematical work with Betty\u2019s strength in logic, while both repeatedly checked and challenged the program.',
      source: { title: 'Pioneer Programmer', author: 'Jean Jennings Bartik', year: 2013, locator: 'p. 85, chapter 3' },
    },
    recognition: {
      quote: 'In those days the women were not recognized at all. So it was just a normal thing.',
      speaker: 'Betty Snyder Holberton',
      quote_type: 'direct_quote',
      context: 'Betty was reflecting on ENIAC\u2019s public demonstration, where the programmers were present but not introduced to the audience. Her calm wording shows how routine this exclusion appeared within the gender expectations of the period.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'pp. 178\u2013179, chapter \u201cDemonstration Day, February 15, 1946\u201d' },
    },
  },
  kay_mcnulty_mauchly_antonelli: {
    computing: {
      quote: 'I know how! We use the master programmer to reuse code!',
      speaker: 'Kathleen \u201cKay\u201d McNulty',
      quote_type: 'direct_quote_recalled_by_jean',
      context: 'The programmers were struggling to fit the many repeated calculations of a ballistic trajectory onto ENIAC. Kay realized that the master programmer could repeat an existing sequence instead of requiring the same cables and switches to be recreated for every step.',
      source: { title: 'Pioneer Programmer', author: 'Jean Jennings Bartik', year: 2013, locator: 'pp. 80\u201381, chapter 3' },
    },
    pioneering: {
      quote: 'In retrospect, I think that we were like fighter pilots.',
      speaker: 'Kathleen \u201cKay\u201d McNulty',
      quote_type: 'direct_quote',
      context: 'Kay used the fighter-pilot comparison after recalling the 1946 demonstration. ENIAC was an extraordinary machine, but it could not simply be handed to an untrained operator; its programmers needed detailed knowledge of its timing, units, switches, and connections.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'pp. 179\u2013180, chapter \u201cDemonstration Day, February 15, 1946\u201d' },
    },
    teamwork: {
      quote: 'I really loved working with those girls that were Programmers on the ENIAC with me.',
      speaker: 'Kathleen \u201cKay\u201d McNulty',
      quote_type: 'direct_quote',
      context: 'The six women divided ENIAC\u2019s units among pairs, taught one another what they discovered, and later reunited to build the complete trajectory program. Kay\u2019s recollection frames the team not only as colleagues but as a close technical community.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'pp. 156\u2013157, chapter \u201cParallel Programming\u201d' },
    },
    recognition: {
      quote: 'None of us girls were ever introduced as any part of it.',
      speaker: 'Kathleen \u201cKay\u201d McNulty',
      quote_type: 'direct_quote',
      context: 'During ENIAC\u2019s major public demonstration, the programmers distributed printed trajectories and helped run the event, but the speakers did not identify them or explain their work. The audience therefore saw the machine\u2019s result without knowing who had translated the trajectory equations into a functioning program.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'pp. 177\u2013178, chapter \u201cDemonstration Day, February 15, 1946\u201d' },
    },
  },
  marlyn_wescoff_meltzer: {
    computing: {
      quote: 'We were computing. And we were Computers.',
      speaker: 'Marlyn Wescoff Meltzer',
      quote_type: 'direct_quote',
      context: 'Before programming ENIAC, Marlyn worked as a human \u201cComputer,\u201d calculating ballistic tables with desk calculators. Her words connect the human labor of wartime computation with the electronic machine that would soon perform those calculations at unprecedented speed.',
      source: { title: 'The Computers', author: 'ENIAC Programmers Project documentary', year: 2014, locator: 'Marlyn Wescoff Meltzer interview excerpt' },
    },
    pioneering: {
      quote: 'We would grope it out and figure it out together.',
      speaker: 'Marlyn Wescoff Meltzer',
      quote_type: 'reconstructed_direct_wording_in_narrative',
      context: 'The women had been left with large diagrams, little documentation, and no direct access to the computer itself. They divided ENIAC into units, studied them in pairs, and returned to teach one another\u2014turning uncertainty into a workable programming method.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'pp. 127\u2013133, chapter \u201cDivide and Conquer\u201d' },
    },
    teamwork: {
      quote: 'We went to movies, we went to the concerts together, and plays when we could.',
      speaker: 'Marlyn Wescoff Meltzer',
      quote_type: 'direct_quote_about_ruth_and_marlyn',
      context: 'Marlyn and Ruth were paired for demanding bench-test work that manually reproduced ENIAC\u2019s trajectory calculations. The precision required by this task brought them closer, and their friendship extended beyond the Moore School.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'around pp. 151\u2013153, chapter \u201cBench Tests and Best Friends\u201d' },
    },
    recognition: {
      quote: 'The attendees would think they were the operators of that machine and that was it.',
      speaker: 'Marlyn Wescoff Meltzer',
      quote_type: 'direct_quote',
      context: 'Marlyn understood what the audience would infer when the women were visible near ENIAC but their work was never explained. Without their names or roles, they could easily be mistaken for attendants who merely operated controls prepared by others.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'p. 178, chapter \u201cDemonstration Day, February 15, 1946\u201d' },
    },
  },
  fran_bilas_spence: {
    computing: {
      quote: 'The two put their heads together to study the high-speed multiplier and figure out how it worked.',
      speaker: 'Kathy Kleiman',
      quote_type: 'narrative_statement_about_fran_and_kay',
      context: 'Fran joined the ENIAC team after supervising work on the differential analyzer. Kay brought her up to date, and the two friends studied the high-speed multiplier from its diagrams because they were not yet permitted to enter the ENIAC room.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'pp. 129\u2013133, chapter \u201cDivide and Conquer\u201d' },
    },
    pioneering: {
      quote: 'What brought us together initially was an advertisement for recently graduated female math majors.',
      speaker: 'Jean Jennings Bartik',
      quote_type: 'group_quote_including_fran',
      context: 'Fran and Kay were among the rare women of their generation to graduate with mathematics degrees, both from Chestnut Hill College. They answered an Army recruitment notice seeking women with mathematical training.',
      source: { title: 'Pioneer Programmer', author: 'Jean Jennings Bartik', year: 2013, locator: 'prologue and pp. 79\u201380' },
    },
    teamwork: {
      quote: 'The two best friends were back together.',
      speaker: 'Kathy Kleiman',
      quote_type: 'narrative_statement_about_fran_and_kay',
      context: 'Fran and Kay had studied mathematics together and had already supervised teams working with the differential analyzer. When Fran was transferred to the ENIAC project, they became partners again and took responsibility for understanding the high-speed multiplier.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'pp. 129\u2013130, chapter \u201cDivide and Conquer\u201d' },
    },
    recognition: {
      quote: 'For decades, this famous photograph of two ENIAC Programmers was shared without the women being named.',
      speaker: 'Kathy Kleiman',
      quote_type: 'historical_caption_about_fran_and_jean',
      context: 'The photograph shows Jean Jennings Bartik and Fran Bilas Spence working beside ENIAC, yet it circulated for decades without identifying them. The missing names allowed the women to be interpreted as anonymous models or operators rather than programmers.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'photographic section; caption identifying Jean on the left and Fran on the right' },
    },
  },
  ruth_lichterman_teitelbaum: {
    computing: {
      quote: 'We did a lot of testing on it... and got it working again.',
      speaker: 'Ruth Lichterman Teitelbaum',
      quote_type: 'direct_quote',
      context: 'After ENIAC was moved from Philadelphia to Aberdeen in 1947, it arrived with damage from the journey. Ruth and Kay worked with engineers for seven months, testing the machine unit by unit with diagnostic programs they had learned to create themselves.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'pp. 206\u2013207, chapter \u201cENIAC 5 in and around Aberdeen\u201d' },
    },
    pioneering: {
      quote: 'About sixty of us signed up because we were all curious and I was one of the lucky six that was chosen.',
      speaker: 'Ruth Lichterman Teitelbaum',
      quote_type: 'direct_quote',
      context: 'A notice circulated among the Army\u2019s computing teams asking who was interested in learning to work on a classified special machine. The candidates were told almost nothing about the project, but roughly sixty volunteered.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'p. 108, chapter describing selection of the programmers' },
    },
    teamwork: {
      quote: 'Marlyn and Ruth grew much closer.',
      speaker: 'Kathy Kleiman',
      quote_type: 'narrative_statement_about_ruth_and_marlyn',
      context: 'Ruth and Marlyn manually calculated a trajectory exactly as ENIAC would process it, operation by operation. This bench test gave the programmers an independent result against which they could check the electronic machine and diagnose errors.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'around pp. 151\u2013153, chapter \u201cBench Tests and Best Friends\u201d' },
    },
    recognition: {
      quote: 'In many photographs, Ruth is present and unnamed as she stands quietly in the background.',
      speaker: 'Kathy Kleiman',
      quote_type: 'historical_statement_about_ruth',
      context: 'After ENIAC moved to Aberdeen, Ruth became a senior programmer and supervised newer programming teams. Photographs often recorded her presence but omitted her name, even when she was visibly overseeing the work.',
      source: { title: 'Proving Ground', author: 'Kathy Kleiman', year: 2022, locator: 'p. 216, chapter \u201cA New Life\u201d' },
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
