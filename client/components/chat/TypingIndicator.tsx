import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const QUOTES = [
  "KFC was rejected 1,009 times before its first franchise.",
  "Every 'no' is one step closer to the right 'yes'.",
  "The average job seeker applies to 27 roles before landing one.",
  "LinkedIn started with just 13 people. Keep going.",
  "Steve Jobs was fired from Apple before building the iPod.",
  "Your resume is being matched. Stay sharp.",
  "Great careers are built one application at a time.",
  "The best job you'll ever have hasn't been posted yet.",
  "Walt Disney was told he lacked imagination. He built Disneyland.",
  "Oprah was fired from her first TV job. She kept going.",
  "J.K. Rowling was rejected by 12 publishers before Harry Potter.",
  "Every expert was once a beginner who didn't quit.",
  "The job market rewards persistence above all else.",
  "Your next interview is just a great conversation waiting to happen.",
  "Albert Einstein failed his university entrance exam. Twice.",
  "The right opportunity is closer than it feels right now.",
  "Michael Jordan was cut from his high school basketball team.",
  "Every application you send is an investment in yourself.",
  "Jack Ma was rejected by Harvard 10 times. Now he leads Alibaba.",
  "Your skills are more valuable than your current title suggests.",
  "The interview you're nervous about is the one that changes things.",
  "Rejection is just redirection toward the right fit.",
  "Elon Musk was rejected by Netscape as a fresh graduate.",
  "You don't need to be perfect to get hired. You need to be right.",
  "Your dream company is hiring. You just haven't applied yet.",
  "Soichiro Honda was rejected by Toyota before founding Honda.",
  "One good referral can open more doors than 100 cold applications.",
  "Warren Buffett was rejected by Harvard Business School.",
  "The interview is a two-way conversation — you're evaluating them too.",
  "Bill Gates dropped out, but he never stopped building.",
  "Your resume tells a story. Make sure it's a compelling one.",
  "The best time to network was yesterday. The second best is right now.",
  "Vera Wang failed to make the Olympic team, then became a fashion icon.",
  "Every great hire was once an underdog candidate.",
  "Arianna Huffington's second book was rejected by 36 publishers.",
  "A great cover letter can get you interviews your resume alone won't.",
  "The job search is a marathon, not a sprint. Pace yourself.",
  "Reid Hoffman built LinkedIn after multiple startup failures.",
  "Your career is yours. Own every decision in it.",
  "The next company that hires you is lucky to have you.",
];

export function TypingIndicator() {
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [displayed, setDisplayed] = useState('');
  const [charIdx, setCharIdx] = useState(0);

  const currentQuote = QUOTES[quoteIdx];

  useEffect(() => {
    if (charIdx < currentQuote.length) {
      const t = setTimeout(() => {
        setDisplayed(currentQuote.slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
      }, 28);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        const next = (quoteIdx + 1) % QUOTES.length;
        setQuoteIdx(next);
        setDisplayed('');
        setCharIdx(0);
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [charIdx, currentQuote, quoteIdx]);

  return (
    <div className="flex gap-3 mb-6 animate-in fade-in duration-200">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm mt-0.5">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[11px] font-semibold text-foreground/60 mb-1">Nova</p>
        <div className="inline-block bg-white dark:bg-card rounded-2xl rounded-tl-sm shadow-sm border border-border/40 px-4 py-3 max-w-sm">
          <div className="flex items-center gap-1 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }} />
          </div>
          <p className="text-[11px] text-muted-foreground italic leading-relaxed min-h-[2.5em]">
            {displayed}
            <span className="inline-block w-px h-3 bg-muted-foreground/50 animate-pulse ml-0.5 align-middle" />
          </p>
        </div>
      </div>
    </div>
  );
}
