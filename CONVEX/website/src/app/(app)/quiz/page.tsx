import { Brain } from 'lucide-react';
import { AiQuiz } from '@/components/app/ai-quiz';

export default function QuizPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Brain className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Quiz</h1>
          <p className="text-sm text-muted-foreground">
            Generate a fresh 5-question quiz on any topic  or a random one.
          </p>
        </div>
      </header>
      <AiQuiz />
    </div>
  );
}
