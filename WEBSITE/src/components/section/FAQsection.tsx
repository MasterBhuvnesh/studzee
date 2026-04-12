'use client';

import { useState } from 'react';

const faqs = [
  {
    question: 'What is Studzee?',
    answer:
      'Studzee is a cross-platform SaaS ed-tech application that helps students access, consume, and retain structured educational content — across mobile, web, and desktop.',
  },
  {
    question: 'Is Studzee free to use?',
    answer:
      'Yes — Studzee is free during the beta period. You get full access to the core platform with no credit card required.',
  },
  {
    question: 'Which platforms is Studzee available on?',
    answer:
      'Studzee works on Android (Play Store launch coming soon), the web at studzee.in, and desktop. All platforms stay in sync in real time.',
  },
  {
    question: 'What kind of content can I study on Studzee?',
    answer:
      'Studzee supports document-based learning — structured modules, summaries, and quizzes. Admins curate content, and soon AI will automate content ingestion from PDFs and the web.',
  },
  {
    question:
      "I'm a developer — can I contribute or learn more about the architecture?",
    answer:
      'Absolutely. The project is open on GitHub at github.com/MasterBhuvnesh/studzee. The architecture uses TypeScript microservices, Docker, AWS EKS, and more.',
  },
  {
    question: 'When will AI features be available?',
    answer:
      'The agentic AI pipeline is in active development. It will support automated quiz generation, PDF ingestion, and content structuring. Join the beta to get early access when it ships.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="faq" className="border border-white/5 bg-[#1f1f1f] rounded-lg overflow-hidden transition-colors hover:border-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <h3 className="text-[15px] font-medium text-foreground tracking-wide">
          {question}
        </h3>
        <div
          className={`relative w-4 h-4 shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-45' : ''}`}
        >
          <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-foreground/60 -translate-y-1/2 rounded-full" />
          <div className="absolute left-1/2 top-0 w-[1.5px] h-full bg-foreground/60 -translate-x-1/2 rounded-full" />
        </div>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <p className="p-6 pt-0 text-muted-foreground text-[14px] leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

const FAQsection = () => {
  return (
    <section className="relative w-full flex flex-col items-center justify-center px-4 md:px-6 py-32 overflow-hidden">
      <div className="z-10 max-w-3xl w-full flex flex-col items-center gap-12 md:gap-16">
        <div className="text-center space-y-6 flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl lg:text-5xl font-medium tracking-tight text-foreground leading-tight">
            Frequently asked questions
          </h2>
        </div>

        <div className="w-full flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQsection;
