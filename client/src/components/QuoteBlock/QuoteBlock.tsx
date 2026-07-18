import { useAppStore } from '../../stores/appStore';
import { PROGRAMMERS } from '../../data/programmers';
import { getQuoteForProgrammer } from '../../data/quotes';
import './QuoteBlock.css';

export function QuoteBlock() {
  const selectedProgrammer = useAppStore((state) => state.selectedProgrammer);
  const selectedTheme = useAppStore((state) => state.selectedTheme);

  // Only render when both a programmer and a theme are active
  if (!selectedProgrammer || !selectedTheme) return null;

  const programmer = PROGRAMMERS[selectedProgrammer];
  const quoteEntry = getQuoteForProgrammer(selectedProgrammer, selectedTheme);

  if (!programmer || !quoteEntry) return null;

  const sourceLabel = quoteEntry.quote_type.includes('direct_quote')
    ? 'Direct Quote'
    : 'Source';

  return (
    <div className="quote-block">
      {/* Header: Portrait | Name | Years */}
      <div className="quote-block-header">
        <div className="quote-block-portrait">
          <img src={programmer.portrait} alt={programmer.fullName} />
        </div>
        <div className="quote-block-name">
          {programmer.fullName.toUpperCase()}
        </div>
        <div className="quote-block-years">
          {programmer.born} – {programmer.died}
        </div>
      </div>

      {/* Quote area */}
      <div className="quote-block-quote">
        <span className="quote-block-mark">"</span>
        <p className="quote-block-text">{quoteEntry.quote}</p>
      </div>

      {/* Context section */}
      <div className="quote-block-context">
        <span className="quote-block-context-label">Context:</span>
        <p className="quote-block-context-text">{quoteEntry.context}</p>
      </div>

      {/* Source line */}
      <div className="quote-block-source">
        {sourceLabel}, Source: {quoteEntry.source.author} {quoteEntry.source.year}, {quoteEntry.source.locator}
      </div>
    </div>
  );
}
