'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib';

type Question = { question: string; options: string[] };
type Result = { correctIndex: number; chosenIndex: number; correct: boolean };

export function Quiz({
  blogSlug,
  quiz,
}: {
  blogSlug: string;
  quiz: Question[];
}) {
  const submit = useMutation(api.quiz.submit);
  const [answers, setAnswers] = useState<(number | undefined)[]>(() =>
    Array(quiz.length).fill(undefined)
  );
  const [results, setResults] = useState<Result[] | null>(null);
  const [score, setScore] = useState<{
    score: number;
    total: number;
    passed: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = answers.every((a) => a !== undefined);
  const locked = results !== null;

  async function onSubmit() {
    setSubmitting(true);
    try {
      const res = await submit({
        blogSlug,
        answers: answers.map((a) => a ?? -1),
      });
      setResults(res.results);
      setScore({ score: res.score, total: res.total, passed: res.passed });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setAnswers(Array(quiz.length).fill(undefined));
    setResults(null);
    setScore(null);
  }

  return (
    <div className="space-y-6">
      {score && (
        <div
          className={cn(
            'rounded-xl border p-4',
            score.passed
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : 'border-amber-500/40 bg-amber-500/10'
          )}
        >
          <p className="font-medium">
            {score.passed ? 'Passed 🎉' : 'Keep going'} — {score.score}/
            {score.total} correct
          </p>
          <p className="text-sm text-muted-foreground">
            {score.passed
              ? 'You cleared the 70% bar for this topic.'
              : 'You need 70% to pass. Review the answers below and retake.'}
          </p>
        </div>
      )}

      <ol className="space-y-6">
        {quiz.map((q, qi) => {
          const res = results?.[qi];
          return (
            <li key={qi} className="space-y-3">
              <p className="font-medium">
                <span className="text-muted-foreground">{qi + 1}.</span>{' '}
                {q.question}
              </p>
              <RadioGroup
                value={answers[qi] === undefined ? '' : String(answers[qi])}
                onValueChange={(v) => {
                  if (locked) return;
                  setAnswers((prev) => {
                    const next = [...prev];
                    next[qi] = Number(v);
                    return next;
                  });
                }}
                className="gap-2"
              >
                {q.options.map((opt, oi) => {
                  const isCorrect = res && oi === res.correctIndex;
                  const isWrongChosen =
                    res && oi === res.chosenIndex && !res.correct;
                  return (
                    <label
                      key={oi}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors',
                        !locked && 'hover:bg-muted/50',
                        isCorrect && 'border-emerald-500/50 bg-emerald-500/10',
                        isWrongChosen && 'border-destructive/50 bg-destructive/10'
                      )}
                    >
                      <RadioGroupItem value={String(oi)} disabled={locked} />
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
          );
        })}
      </ol>

      <div className="flex items-center gap-3">
        {!locked ? (
          <Button
            size="lg"
            disabled={!allAnswered || submitting}
            onClick={onSubmit}
          >
            {submitting ? 'Grading…' : 'Submit quiz'}
          </Button>
        ) : (
          <Button size="lg" variant="outline" onClick={reset}>
            Retake quiz
          </Button>
        )}
        {!locked && !allAnswered && (
          <span className="text-sm text-muted-foreground">
            Answer all {quiz.length} questions to submit.
          </span>
        )}
      </div>
    </div>
  );
}
