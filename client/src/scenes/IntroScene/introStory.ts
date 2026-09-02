export const INTRO_STEPS = [
  {
    id: 'title', label: 'The ENIAC 6', eyebrow: 'Behind the Machine',
    title: 'THE ENIAC 6',
    body: 'The story of six women who programmed the first electronic general-purpose computer.',
    duration: 9000,
  },
  {
    id: 'context', label: 'A world at war', eyebrow: 'United States during World War II',
    title: 'Before computers were machines, they were people.',
    body: 'With many men serving in the armed forces, wartime demand opened more technical jobs to women. The U.S. Army recruited women with mathematical training as “human computers” to calculate artillery trajectories.',
    note: 'Their calculations helped produce firing tables: guides for aiming artillery.',
    duration: 20000,
  },
  {
    id: 'women', label: 'Meet the six', eyebrow: 'Philadelphia, 1945',
    title: 'A new machine.\nSix pioneering minds.',
    body: 'Six women were selected from the Army’s human computers to program ENIAC. Drawing on their mathematical skills, they developed the sequences of operations that would make this new machine work.',
    duration: 20000,
  },
  {
    id: 'machine', label: 'The machine', eyebrow: 'Publicly unveiled in 1946',
    title: 'Programming a computer that filled an entire room',
    body: 'ENIAC was the first electronic general-purpose digital computer. Its programmers translated calculations into sequences of operations, connecting cables and setting switches by hand.',
    note: 'ENIAC = Electronic Numerical Integrator and Computer',
    duration: 19000,
  },
  {
    id: 'recognition', label: 'Their place in history', eyebrow: 'Belated recognition',
    title: 'The machine made history,\nbut their names were left out.',
    body: 'Their contribution remained largely overlooked for decades. In 1997, all six were inducted into the Women in Technology International Hall of Fame.',
    note: 'This installation invites you to explore their work, experiences and perspectives through their own words.',
    duration: 18000,
  },
  {
    id: 'insert', label: 'Choose a woman', eyebrow: 'Your turn',
    title: 'One punched card.\nOne woman’s story.',
    body: 'Each punched card represents the woman named on it. Choose a card and insert it into a slot in the machine.',
    note: 'Start with any woman. There is no fixed order.',
    duration: 13000,
  },
  {
    id: 'connect', label: 'Connect a chapter', eyebrow: 'Your turn',
    title: 'Make a connection \n and discover a topic.',
    body: 'Take the cable belonging to the slot you have just used. Plug it into one of the four chapter sections to explore that woman’s story.',
    note: 'Move the cable to another chapter whenever you want to explore further.',
    duration: 17000,
  },
  {
    id: 'controls', label: 'Shape the experience', eyebrow: 'Your turn',
    title: 'Turn the controls\n and explore!',
    body: 'Step into the programmers’ shoes and bring the machine to life. Use the controls in your chosen chapter to change the animation in real time. Experiment with the parameters and see how each adjustment changes what the code creates.',
    note: 'Inspired by the women’s hands-on approach to programming. Now choose a card to begin!',
    duration: 17000,
  },
] as const;

export type IntroStepId = (typeof INTRO_STEPS)[number]['id'];
