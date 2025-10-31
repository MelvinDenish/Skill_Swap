import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import { examAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
}

interface SubmitItem { questionId: string; answer: string; timeSpent?: number; }

export default function PracticeArena() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'Quiz' | 'Attempts' | 'Leaderboard' | 'Daily'>('Quiz');

  // Quiz state
  const [skill, setSkill] = useState<string>('Java');
  const [difficulty, setDifficulty] = useState<string>('Easy');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const totalTime = useMemo(() => Math.max(questions.length * 30, 60), [questions.length]); // 30s per question, min 60s

  useEffect(() => {
    if (tab === 'Daily') {
      (async () => {
        try {
          const { data } = await examAPI.daily();
          setQuestions(data || []);
          setAnswers({});
          setIndex(0);
          setResult(null);
        } catch {}
      })();
    }
  }, [tab]);

  useEffect(() => {
    if (!startTs) return;
    setRemaining(totalTime);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          submit();
          if (timerRef.current) window.clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [startTs, totalTime]);

  const start = async () => {
    setLoading(true);
    try {
      const { data } = await examAPI.questions(skill, difficulty, 10);
      const qs: QuizQuestion[] = Array.isArray(data) ? data : [];
      setQuestions(qs);
      setAnswers({});
      setIndex(0);
      setResult(null);
      if (qs.length > 0) {
        setStartTs(Date.now());
      } else {
        setStartTs(null);
        alert('No questions available for the chosen filters. Try a different skill/difficulty.');
      }
    } finally { setLoading(false); }
  };

  const submit = async () => {
    if (!questions.length) return;
    const items: SubmitItem[] = questions.map((q) => ({ questionId: q.id, answer: answers[q.id] || '' }));
    try {
      const { data } = await examAPI.submit({ skill, difficulty, items });
      setResult(data);
    } catch (e) {
      // ignore
    } finally {
      setQuestions([]);
      setStartTs(null);
    }
  };

  const scorePct = result ? Math.round((result.correct / Math.max(1, result.total)) * 100) : 0;

  // Attempts
  const [attempts, setAttempts] = useState<any[]>([]);
  const [attemptPage, setAttemptPage] = useState(0);
  const [attemptHasMore, setAttemptHasMore] = useState(true);

  const loadAttempts = async (page = 0, replace = false) => {
    const { data } = await examAPI.attempts(page, 20);
    const content = data?.content || [];
    setAttemptHasMore(!data?.last);
    setAttemptPage(page + 1);
    setAttempts((prev) => replace ? content : [...prev, ...content]);
  };

  useEffect(() => { if (tab === 'Attempts') { loadAttempts(0, true); } }, [tab]);

  // Leaderboard
  const [lbSkill, setLbSkill] = useState('Java');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const loadLeaderboard = async () => {
    const { data } = await examAPI.leaderboard(lbSkill);
    setLeaderboard(data || []);
  };
  useEffect(() => { if (tab === 'Leaderboard') loadLeaderboard(); }, [tab]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Practice Arena</h1>
          <div className="flex gap-2">
            {(['Quiz','Attempts','Leaderboard','Daily'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded ${tab===t?'bg-indigo-600 text-white':'bg-white dark:bg-neutral-900 border dark:border-neutral-800'}`}>{t}</button>
            ))}
          </div>
        </div>

        {tab === 'Quiz' && (
          <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 p-4 rounded-xl shadow">
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              <select value={skill} onChange={(e) => setSkill(e.target.value)} className="border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2">
                {['Java','React','Python','AWS','General'].map(s => (<option key={s} value={s}>{s}</option>))}
              </select>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2">
                {['Easy','Medium','Hard','Any'].map(d => (<option key={d} value={d==='Any'?'':d}>{d}</option>))}
              </select>
              <button onClick={start} disabled={loading} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded px-3 py-2 disabled:opacity-60 dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">{loading?'Loading...':'Start Quiz'}</button>
              {startTs && <div className="text-right text-sm text-gray-600 dark:text-gray-400">Time left: {Math.floor(remaining/60)}:{(remaining%60).toString().padStart(2,'0')}</div>}
            </div>

            {questions.length > 0 && (
              <div>
                <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">Question {index+1} of {questions.length}</div>
                <div className="w-full h-2 bg-gray-200 dark:bg-neutral-800 rounded mb-4">
                  <div className="h-2 bg-indigo-600 dark:bg-neutral-600 rounded" style={{ width: `${((index)/Math.max(1,questions.length))*100}%` }} />
                </div>
                <div className="text-lg font-medium mb-3">{questions[index]?.questionText}</div>
                <div className="space-y-2">
                  {questions[index]?.options?.map((opt: string) => (
                    <label key={opt} className={`block border dark:border-neutral-800 rounded px-3 py-2 cursor-pointer ${answers[questions[index].id]===opt?'border-indigo-600 bg-indigo-50 dark:border-neutral-500 dark:bg-neutral-900/40':''}`}>
                      <input type="radio" name={`q_${questions[index].id}`} className="mr-2" checked={answers[questions[index].id]===opt} onChange={() => setAnswers(prev => ({ ...prev, [questions[index].id]: opt }))} />
                      {opt}
                    </label>
                  ))}
                </div>
                <div className="flex justify-between mt-4">
                  <button disabled={index===0} onClick={() => setIndex((i)=>Math.max(0,i-1))} className="px-3 py-2 border dark:border-neutral-800 rounded">Previous</button>
                  {index < questions.length-1 ? (
                    <button onClick={() => setIndex((i)=>Math.min(questions.length-1,i+1))} className="px-3 py-2 bg-gray-800 dark:bg-neutral-800 text-white rounded">Next</button>
                  ) : (
                    <button onClick={submit} className="px-3 py-2 bg-green-600 text-white rounded">Submit</button>
                  )}

            {questions.length === 0 && !loading && !result && (
              <div className="text-sm text-gray-600 dark:text-gray-400">No questions loaded. Click Start Quiz after selecting a different filter.</div>
            )}
                </div>
              </div>
            )}

            {result && (
              <div className="mt-6">
                <div className="text-xl font-semibold mb-2">Your Score: {result.score}% ({result.correct}/{result.total})</div>
                {result.score >= 80 && (
                  <div className="mb-2 text-green-700">Great job! 🎉</div>
                )}
                <div className="mt-3">
                  <div className="font-semibold">Review</div>
                  <div className="space-y-2 mt-2">
                    {(result.details || []).map((d:any, idx:number) => (
                      <div key={idx} className="border dark:border-neutral-800 rounded p-2 text-sm dark:bg-neutral-900/50">
                        <div className="mb-1"><span className="font-medium">Q</span>: {d.questionId}</div>
                        <div className="mb-1"><span className="font-medium">Correct</span>: {String(d.correct)}</div>
                        {d.correct === false && (
                          <div className="mb-1 text-red-600">Your answer was wrong. Correct: {d.correctAnswer}</div>
                        )}
                        {d.explanation && <div className="text-gray-600 dark:text-gray-400">{d.explanation}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'Attempts' && (
          <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 p-4 rounded-xl shadow">
            <div className="font-semibold mb-2">Previous Attempts</div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b dark:border-neutral-800">
                    <th className="py-2 px-2">When</th>
                    <th className="py-2 px-2">Skill</th>
                    <th className="py-2 px-2">Difficulty</th>
                    <th className="py-2 px-2">Correct</th>
                    <th className="py-2 px-2">Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a:any) => (
                    <tr key={a.id} className="border-b dark:border-neutral-800">
                      <td className="py-2 px-2">{a.createdAt ? new Date(a.createdAt).toLocaleString() : '-'}</td>
                      <td className="py-2 px-2">{a.skill}</td>
                      <td className="py-2 px-2">{a.difficulty}</td>
                      <td className="py-2 px-2">{a.isCorrect ? '✔' : '✘'}</td>
                      <td className="py-2 px-2">{a.userAnswer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-center">
              <button disabled={!attemptHasMore} onClick={() => loadAttempts(attemptPage)} className="px-3 py-1 border dark:border-neutral-800 rounded disabled:opacity-60">{attemptHasMore? 'Load more' : 'No more'}</button>
            </div>
          </div>
        )}

        {tab === 'Leaderboard' && (
          <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 p-4 rounded-xl shadow">
            <div className="flex gap-2 mb-3">
              <input value={lbSkill} onChange={(e)=>setLbSkill(e.target.value)} placeholder="Skill (e.g., Java)" className="border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-3 py-2" />
              <button onClick={loadLeaderboard} className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">Refresh</button>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b dark:border-neutral-800">
                    <th className="py-2 px-2">User</th>
                    <th className="py-2 px-2">Score</th>
                    <th className="py-2 px-2">Quizzes</th>
                    <th className="py-2 px-2">Average</th>
                    <th className="py-2 px-2">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((e:any, idx:number) => (
                    <tr key={e.userId} className="border-b dark:border-neutral-800">
                      <td className="py-2 px-2 flex items-center gap-2"><img src={e.avatar || '/default-avatar.svg'} className="w-6 h-6 rounded-full"/> <span>{idx+1}. {e.name}</span></td>
                      <td className="py-2 px-2">{e.totalScore}</td>
                      <td className="py-2 px-2">{e.quizCount}</td>
                      <td className="py-2 px-2">{Number(e.averageScore || 0).toFixed(1)}%</td>
                      <td className="py-2 px-2">{e.streak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'Daily' && (
          <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 p-4 rounded-xl shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">5 random questions from popular skills</div>
            {questions.length === 0 ? (
              <div>No challenge loaded. Click the tab again to refresh.</div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <div key={q.id} className="border dark:border-neutral-800 rounded p-3">
                    <div className="font-medium mb-2">{i+1}. {q.questionText}</div>
                    <div className="grid md:grid-cols-2 gap-2">
                      {q.options.map((o) => (
                        <label key={o} className={`border dark:border-neutral-800 rounded px-3 py-2 cursor-pointer ${answers[q.id]===o?'border-indigo-600 bg-indigo-50 dark:border-neutral-500 dark:bg-neutral-900/40':''}`}>
                          <input type="radio" name={`dq_${q.id}`} className="mr-2" checked={answers[q.id]===o} onChange={() => setAnswers(prev => ({ ...prev, [q.id]: o }))} />
                          {o}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3">
              <button onClick={async () => { if (!questions.length) return; const items = questions.map(q => ({ questionId: q.id, answer: answers[q.id] || '' })); const { data } = await examAPI.submit({ skill: 'Daily', difficulty: 'Mixed', items }); setResult(data); }} className="px-3 py-2 bg-green-600 text-white rounded">Submit</button>
            </div>
            {result && (
              <div className="mt-4">Score: {result.score}% ({result.correct}/{result.total})</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
