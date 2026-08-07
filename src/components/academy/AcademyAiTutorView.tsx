import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, ShieldCheck, AlertCircle, BookOpen, MessageSquarePlus } from 'lucide-react';

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language: string;
  groundingContext?: string | null;
  createdAt: string;
}

export interface TutorSession {
  id: string;
  title: string;
  courseId: string;
  lessonId?: string | null;
  updatedAt: string;
}

interface AcademyAiTutorViewProps {
  courseId: string;
  courseTitle: string;
  lessonId?: string | null;
  lessonTitle?: string;
  lang: 'en' | 'ar';
}

export const AcademyAiTutorView: React.FC<AcademyAiTutorViewProps> = ({
  courseId,
  courseTitle,
  lessonId,
  lessonTitle,
  lang,
}) => {
  const isRtl = lang === 'ar';
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await fetch(`/api/academy/tutor/sessions?courseId=${courseId}`);
      if (!res.ok) throw new Error('Failed to load tutor sessions.');
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
        if (data.sessions.length > 0 && !activeSessionId) {
          setActiveSessionId(data.sessions[0].id);
        } else if (data.sessions.length === 0) {
          // create default session
          await handleCreateSession();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to AI Tutor service.');
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/academy/tutor/sessions/${sessionId}/messages`);
      if (!res.ok) throw new Error('Failed to load session messages.');
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading conversation history.');
    }
  };

  const handleCreateSession = async () => {
    try {
      const title = lessonTitle ? `Tutor: ${lessonTitle}` : `Tutor: ${courseTitle}`;
      const res = await fetch('/api/academy/tutor/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, lessonId, title }),
      });
      if (!res.ok) throw new Error('Failed to create new tutor session.');
      const data = await res.json();
      if (data.session) {
        setSessions((prev) => [data.session, ...prev]);
        setActiveSessionId(data.session.id);
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [courseId]);

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputContent.trim();
    if (!textToSend || !activeSessionId || sending) return;

    setError(null);
    setInputContent('');
    setSending(true);

    // Optimistic UI insert
    const tempUserMsg: TutorMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: textToSend,
      language: lang,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/academy/tutor/sessions/${activeSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textToSend,
          language: lang,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message to AI Tutor.');
      }

      const data = await res.json();
      if (data.success && data.assistantMessage) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          data.userMessage,
          data.assistantMessage,
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to receive AI Tutor response.');
    } finally {
      setSending(false);
    }
  };

  const samplePrompts = isRtl
    ? [
        'اشرح لي المفهوم الأساسي في هذا الدرس بأسلوب مبسط.',
        'أعطني تمريناً عملياً مع تطبيق تطبيقي للتحقق من فهمي.',
        'كيف يمكنني تطبيق هذا المفيد في مشاريع الواقع؟',
      ]
    : [
        'Explain the core concept in this lesson simply.',
        'Give me a practical exercise to test my understanding.',
        'How do I apply this concept in real-world projects?',
      ];

  return (
    <div className={`flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-slate-100 ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Top Banner / Grounding & Governance Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-white">
                {isRtl ? 'معلم أوبك روكس الذكي (AI Tutor)' : 'OPROX AI Tutor'}
              </h3>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                {isRtl ? 'موثوق بمحتوى الدورة' : 'Grounded'}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <BookOpen className="w-3 h-3 text-indigo-400" />
              {lessonTitle ? (isRtl ? `الدرس الحالي: ${lessonTitle}` : `Lesson: ${lessonTitle}`) : courseTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateSession}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 border border-slate-700 transition"
            title={isRtl ? 'محادثة جديدة' : 'New Session'}
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isRtl ? 'جلسة جديدة' : 'New Chat'}</span>
          </button>
        </div>
      </div>

      {/* Grounding & Integrity Disclosure Notice */}
      <div className="bg-indigo-950/30 border-b border-indigo-900/30 px-4 py-2 flex items-center justify-between text-xs text-indigo-200">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {isRtl
              ? 'تنبيه النزاهة الأكاديمية: يتم تقديم الإجابات موثقة بمحتوى المنهج، ولا تُكشف مفاتيح إجابات التقييمات النهائية مباشرة.'
              : 'Academic Integrity Guarded: Responses grounded in authorized course materials. Assessment answer keys remain protected.'}
          </span>
        </div>
      </div>

      {/* Main Chat Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingSessions ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>{isRtl ? 'جاري تحميل المعلم الذكي...' : 'Initializing AI Tutor...'}</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-200 mb-1">
              {isRtl ? 'أهلاً بك! كيف يمكنني مساعدتك اليوم؟' : 'Welcome! How can I assist your learning today?'}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mb-6">
              {isRtl
                ? 'أنا معلمك الذكي الخاص بدورة أوبك روكس. اسألني عن مفاهيم الدرس، أو اطلب أمثلة توضيحية أو تمارين تطبيقية.'
                : 'I am your course-grounded AI Tutor. Ask me about lesson concepts, request examples, or practice problem breakdown.'}
            </p>

            {/* Quick Socratic Prompt Chips */}
            <div className="w-full max-w-md space-y-2">
              <p className="text-xs font-medium text-slate-400 text-start">
                {isRtl ? 'أسئلة مقترحة لبدء النقاش:' : 'Suggested prompts to start:'}
              </p>
              {samplePrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(promptText)}
                  className="w-full text-start text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-300 p-2.5 rounded-lg border border-slate-700/60 hover:border-indigo-500/40 transition flex items-center gap-2 group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition" />
                  <span>{promptText}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-emerald-950 border border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {!isUser && msg.groundingContext && (
                    <div className="pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <BookOpen className="w-3 h-3 text-indigo-400" />
                      <span>
                        {isRtl ? 'موثوق بالمصدر:' : 'Grounded in:'} {msg.groundingContext}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {sending && (
          <div className="flex gap-3 items-center text-xs text-indigo-400 animate-pulse bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 w-fit">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? 'المعلم الذكي يحلل المنهج ويصيغ الإجابة...' : 'AI Tutor is analyzing lesson material and drafting response...'}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder={
              isRtl
                ? 'اطرح سؤالاً على المعلم الذكي...'
                : 'Ask AI Tutor a question about this course...'
            }
            disabled={sending}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={!inputContent.trim() || sending}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition shrink-0"
          >
            {sending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isRtl ? 'إرسال' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
