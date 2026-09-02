import { memo, type CSSProperties } from 'react';
import { THEME_IDS } from '@shared/constants';
import { PROGRAMMER_LIST } from '../../data/programmers';
import type { IntroStepId } from './introStory';

const indexedStyle = (index: number, color?: string) => ({
  '--i': index, '--person-color': color,
}) as CSSProperties;

function SixSignals() {
  return (
    <svg viewBox="0 0 800 420" fill="none" aria-hidden="true" className="intro-signals">
      <path className="intro-grid-line" d="M0 90H800M0 210H800M0 330H800M100 0V420M300 0V420M500 0V420M700 0V420" />
      {PROGRAMMER_LIST.map((person, i) => (
        <g key={person.key} style={indexedStyle(i, person.color)}>
          <path className="intro-signal-path" d={`M${105 + i * 118} 28 V${100 + i * 22} C${105 + i * 118} ${230 + i * 13}, ${185 + i * 85} ${205 + i * 18}, ${185 + i * 85} 340 V390`} />
          <circle cx={105 + i * 118} cy="28" r="9" fill={person.color} />
          <circle className="intro-signal-end" cx={185 + i * 85} cy="390" r="6" fill={person.color} />
          <text x={105 + i * 118} y="65" textAnchor="middle" className="intro-svg-micro">0{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

function Trajectory() {
  return (
    <figure className="intro-figure">
      <svg viewBox="0 0 800 420" fill="none" aria-hidden="true">
        <path className="intro-grid-line" d="M55 40V360H750M55 100H750M55 165H750M55 230H750M55 295H750M195 40V360M335 40V360M475 40V360M615 40V360M750 40V360" />
        {[0, 1, 2].map((i) => <path key={i} className="intro-trajectory" style={indexedStyle(i)} d={`M55 360 Q${310 + i * 45} ${-185 + i * 100} ${610 + i * 65} 360`} />)}
        <circle cx="55" cy="360" r="7" fill="var(--intro-gold)" />
        <text x="70" y="63" className="intro-svg-label">TRAJECTORY CALCULATIONS</text>
        <text x="540" y="403" className="intro-svg-micro">DISTANCE →</text>
        <g className="intro-calculation-sheet">
          <rect x="478" y="85" width="244" height="181" fill="#121310" stroke="#6c6b60" />
          <text x="498" y="119" className="intro-svg-label">FIRING TABLE</text>
          <path d="M498 135H702M498 167H702M498 199H702M565 135V248M635 135V248" stroke="#3f4139" />
          <text x="502" y="157" className="intro-svg-micro">01</text><text x="576" y="157" className="intro-svg-micro">028</text><text x="649" y="157" className="intro-svg-micro">146</text>
          <text x="502" y="190" className="intro-svg-micro">02</text><text x="576" y="190" className="intro-svg-micro">032</text><text x="649" y="190" className="intro-svg-micro">182</text>
          <text x="502" y="232" className="intro-svg-micro">03</text><text x="576" y="232" className="intro-svg-micro">036</text><text x="649" y="232" className="intro-svg-micro">219</text>
        </g>
      </svg>
      <figcaption>Mathematics, calculated by hand. <span>Illustrative diagram</span></figcaption>
    </figure>
  );
}

function Women() {
  return (
    <div className="intro-women">
      {PROGRAMMER_LIST.map((person, i) => (
        <figure className="intro-woman" key={person.key} style={indexedStyle(i, person.color)}>
          <div className="intro-portrait"><img src={person.portrait} alt="" /><span>0{i + 1}</span></div>
          <figcaption><strong>{person.name.replace('\n', ' ')}</strong><span>{person.fullName}</span></figcaption>
        </figure>
      ))}
    </div>
  );
}

function Machine() {
  return (
    <figure className="intro-figure intro-machine-figure">
      <svg viewBox="0 0 800 410" fill="none" aria-hidden="true">
        <path d="M20 348H785M60 375H740" className="intro-grid-line" />
        {Array.from({ length: 10 }, (_, i) => (
          <g key={i} className="intro-cabinet" style={indexedStyle(i)}>
            <rect x={32 + i * 73} y="55" width="67" height="288" fill="#141511" stroke="#777467" />
            <rect x={39 + i * 73} y="65" width="53" height="18" stroke="#56564d" />
            {[0, 1, 2, 3, 4].map((row) => (
              <g key={row}>
                <path d={`M${40 + i * 73} ${96 + row * 42}h51`} stroke="#383b33" />
                {[0, 1, 2, 3].map((col) => <circle key={col} className="intro-tube" style={indexedStyle(i + row + col)} cx={45 + i * 73 + col * 14} cy={111 + row * 42} r="3" />)}
              </g>
            ))}
            <path d={`M${41 + i * 73} 311h49M${41 + i * 73} 320h49M${41 + i * 73} 329h49`} stroke="#505247" />
          </g>
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} className="intro-patch-wire" style={indexedStyle(i)} d={`M${60 + i * 90} 282 C${65 + i * 90} ${340 + i * 5},${160 + i * 82} ${350 + i * 5},${175 + i * 82} 241`} />)}
        <text x="32" y="30" className="intro-svg-micro">ENIAC / SCHEMATIC IMPRESSION</text>
      </svg>
      <div className="intro-machine-stats">
        <div><strong>40</strong><span>panels</span></div>
        <div><strong>≈18,000</strong><span>vacuum tubes</span></div>
        <div><strong>1</strong><span>room-sized computer</span></div>
      </div>
    </figure>
  );
}

function Recognition() {
  return (
    <div className="intro-recognition">
      <div className="intro-years"><span>1946<small>ENIAC unveiled</small></span><div className="intro-year-line" /><span>1997<small>Six pioneers honoured</small></span></div>
      <div className="intro-recognition-names">
        {PROGRAMMER_LIST.map((person, i) => <span key={person.key} style={indexedStyle(i, person.color)}><i />{person.name.replace('\n', ' ')}</span>)}
      </div>
      <p>Their words. Their work. Their place in history.</p>
    </div>
  );
}

function InsertCard() {
  return (
    <svg viewBox="0 0 800 500" fill="none" aria-hidden="true">
      <defs><clipPath id="intro-card-slot-clip"><rect x="0" y="0" width="800" height="331" /></clipPath></defs>
      <path d="M138 331L205 274H608L670 331V429H138Z" fill="#141511" stroke="#7e7a69" strokeWidth="2" />
      <path d="M138 331H670M205 274V312M608 274V312" stroke="#55574b" />
      <rect x="249" y="316" width="287" height="16" rx="8" fill="#060706" stroke="#797561" />
      <g clipPath="url(#intro-card-slot-clip)">
        <g className="intro-inserting-card">
          <path d="M279 40H489L511 62V258H279Z" fill="#d7c995" stroke="#eee3bd" strokeWidth="2" />
          <text x="300" y="80" className="intro-card-ink">THE ENIAC 6</text>
          <text x="300" y="116" className="intro-card-name">KAY McNULTY</text>
          {Array.from({ length: 36 }, (_, i) => <rect key={i} x={301 + (i % 12) * 16} y={143 + Math.floor(i / 12) * 29} width="5" height="13" fill={(i * 7) % 5 < 2 ? '#22231c' : '#a99e76'} />)}
          <path d="M301 231H488" stroke="#807b5e" />
        </g>
      </g>
      <path className="intro-insert-arrow" d="M582 150V235m-12-12 12 12 12-12" stroke="var(--intro-gold)" strokeWidth="3" />
      <circle cx="187" cy="383" r="7" className="intro-slot-light" />
      <text x="212" y="389" className="intro-svg-label">CARD SLOT</text>
      <text x="253" y="476" className="intro-svg-micro">CHOOSE → INSERT → CONNECT</text>
    </svg>
  );
}

function ConnectCable() {
  return (
    <svg viewBox="0 0 800 480" fill="none" aria-hidden="true">
      <rect x="36" y="130" width="182" height="190" fill="#151610" stroke="#73715e" />
      <path d="M65 130V75H187V130" fill="#d7c995" stroke="#d7c995" />
      <text x="80" y="105" className="intro-card-ink">KAY</text>
      <text x="67" y="185" className="intro-svg-label">HER CARD</text>
      <circle cx="126" cy="248" r="17" stroke="var(--intro-gold)" strokeWidth="3" />
      <path className="intro-cable-shadow" d="M126 248C126 454 411 455 411 255S425 168 498 168" />
      <path className="intro-cable-connect" d="M126 248C126 454 411 455 411 255S425 168 498 168" />
      {THEME_IDS.map((theme, i) => (
        <g key={theme}>
          <rect x="488" y={31 + i * 98} width="283" height="78" fill={i === 1 ? '#242217' : '#11130f'} stroke={i === 1 ? '#d7c995' : '#484c40'} />
          <circle cx="518" cy={70 + i * 98} r="12" stroke={i === 1 ? '#d7c995' : '#777b68'} strokeWidth="2" />
          <text x="545" y={76 + i * 98} className="intro-svg-label">{theme.toUpperCase()}</text>
        </g>
      ))}
      <g className="intro-cable-plug"><rect x="471" y="158" width="45" height="20" rx="4" fill="var(--intro-gold)" /><path d="M516 163h10v10h-10" fill="#eeeee4" /></g>
      <text x="45" y="450" className="intro-svg-micro">HER CABLE</text>
      <text x="490" y="450" className="intro-svg-micro">FOUR WAYS INTO HER STORY</text>
    </svg>
  );
}

function Controls() {
  return (
    <svg viewBox="0 0 800 470" fill="none" aria-hidden="true">
      <rect x="48" y="35" width="704" height="228" stroke="#555a49" fill="#10120e" />
      <path className="intro-grid-line" d="M48 92H752M48 149H752M48 206H752M224 35V263M400 35V263M576 35V263" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} className="intro-output-shape" style={indexedStyle(i)} x={330 - i * 24} y={79 - i * 8} width={140 + i * 48} height={140} stroke="var(--intro-gold)" opacity={1 - i * 0.15} />)}
      <text x="70" y="66" className="intro-svg-micro">LIVE VISUAL OUTPUT</text>
      {['SPEED', 'SIZE', 'GAMMA', 'CONTRAST'].map((label, i) => (
        <g key={label}>
          <path d={`M${128 + i * 180} 284v24`} stroke="#68694f" strokeDasharray="3 5" />
          <circle cx={128 + i * 180} cy="359" r="42" stroke="#6a6c57" strokeWidth="2" />
          <circle cx={128 + i * 180} cy="359" r="32" fill="#23251c" stroke="#b3ac84" />
          <g className="intro-knob-pointer" style={{ ...indexedStyle(i), transformOrigin: `${128 + i * 180}px 359px` }}><path d={`M${128 + i * 180} 336v15`} stroke="var(--intro-gold)" strokeWidth="4" strokeLinecap="round" /></g>
          <text x={128 + i * 180} y="431" textAnchor="middle" className="intro-svg-label">{label}</text>
        </g>
      ))}
      <text x="400" y="467" textAnchor="middle" className="intro-svg-micro">EXAMPLE: THE PROGRAMMING CHAPTER</text>
    </svg>
  );
}

// The timer updates progress ten times a second; keep the artwork independent.
export const IntroIllustration = memo(function IntroIllustration({ step }: { step: IntroStepId }) {
  switch (step) {
    case 'title': return <SixSignals />;
    case 'context': return <Trajectory />;
    case 'women': return <Women />;
    case 'machine': return <Machine />;
    case 'recognition': return <Recognition />;
    case 'insert': return <InsertCard />;
    case 'connect': return <ConnectCable />;
    case 'controls': return <Controls />;
  }
});
