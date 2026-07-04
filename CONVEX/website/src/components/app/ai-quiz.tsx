'use client';

import { useState } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Loader2, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib';

type AiQuestion = { question: string; options: string[]; answerIndex: number };

export function AiQuiz() {
  const topics = useQuery(api.blogs.list);
  const generate = useAction(api.ai.generateQuiz);

  const [selected, setSelected] = useState<string>('random');
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<{ title: string; questions: AiQuestion[] } | null>(
    null
  );
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setQuiz(null);
    setSubmitted(false);
    try {
      const res = await generate({
        blogSlug: selected === 'random' ? undefined : selected,
      });
      setQuiz({ title: res.title, questions: res.questions });
      setAnswers(Array(res.questions.length).fill(undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate quiz');
    } finally {
      setLoading(false);
    }
  }

  const allAnswered = quiz && answers.every((a) => a !== undefined);
  const score =
    submitted && quiz
      ? quiz.questions.filter((q, i) => answers[i] === q.answerIndex).length
      : 0;

  return (
    <div className="space-y-6">
      {/* Topic picker */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Pick a topic</p>
        {topics === undefined ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <div className="flex flex-wrap gap-2">
            <Chip
              label="🎲 Random"
              active={selected === 'random'}
              onClick={() => setSelected('random')}
            />
            {topics.map((t) => (
              <Chip
                key={t.slug}
                label={t.title}
                active={selected === t.slug}
                onClick={() => setSelected(t.slug)}
              />
            ))}
          </div>
        )}
      </div>

      <Button size="lg" onClick={onGenerate} disabled={loading}>
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Brain className="size-4" />
        )}
        {loading ? 'Generating…' : 'Generate 5-question quiz'}
      </Button>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {quiz && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{quiz.title}</h2>
            <p className="text-sm text-muted-foreground">AI-generated practice quiz</p>
          </div>

          {submitted && (
            <div
              className={cn(
                'rounded-xl border p-4',
                score >= Math.ceil(quiz.questions.length * 0.7)
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-amber-500/40 bg-amber-500/10'
              )}
            >
              <p className="font-medium">
                {score}/{quiz.questions.length} correct
              </p>
            </div>
          )}

          <ol className="space-y-6">
            {quiz.questions.map((q, qi) => (
              <li key={qi} className="space-y-3">
                <p className="font-medium">
                  <span className="text-muted-foreground">{qi + 1}.</span> {q.question}
                </p>
                <RadioGroup
                  value={answers[qi] === undefined ? '' : String(answers[qi])}
                  onValueChange={(v) => {
                    if (submitted) return;
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[qi] = Number(v);
                      return next;
                    });
                  }}
                  className="gap-2"
                >
                  {q.options.map((opt, oi) => {
                    const isCorrect = submitted && oi === q.answerIndex;
                    const isWrongChosen =
                      submitted && oi === answers[qi] && oi !== q.answerIndex;
                    return (
                      <label
                        key={oi}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors',
                          !submitted && 'hover:bg-muted/50',
                          isCorrect && 'border-emerald-500/50 bg-emerald-500/10',
                          isWrongChosen && 'border-destructive/50 bg-destructive/10'
                        )}
                      >
                        <RadioGroupItem value={String(oi)} disabled={submitted} />
                        <span className="text-sm">{opt}</span>
                        {isCorrect && (
                          <CheckCircle2 className="ml-auto size-4 shrink-0 text-emerald-500" />
                        )}
                        {isWrongChosen && (
                          <X className="ml-auto size-4 shrink-0 text-destructive" />
                        )}
                      </label>
                    );
                  })}
                </RadioGroup>
              </li>
            ))}
          </ol>

          {!submitted ? (
            <Button
              size="lg"
              disabled={!allAnswered}
              onClick={() => setSubmitted(true)}
            >
              Check answers
            </Button>
          ) : (
            <Button size="lg" variant="outline" onClick={onGenerate}>
              New quiz
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-sm transition-colors',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border hover:bg-muted/50'
      )}
    >
      {label}
    </button>
  );
}
