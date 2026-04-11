import { useEffect } from 'react';

// Character moods and their visual properties
const MOODS = {
  excited:   { eyes: '😊',  body: '#fef9c3', cheeks: '#fde68a', shadow: '#f59e0b', label: '充满期待' },
  confident:{ eyes: '😄',  body: '#dbeafe', cheeks: '#93c5fd', shadow: '#3b82f6', label: '信心满满' },
  nervous:  { eyes: '😣',  body: '#fef3c7', cheeks: '#fcd34d', shadow: '#d97706', label: '有点紧张' },
  confused: { eyes: '😕',  body: '#f3f4f6', cheeks: '#d1d5db', shadow: '#6b7280', label: '困惑不解' },
  anxious:  { eyes: '😰',  body: '#fef3c7', cheeks: '#fcd34d', shadow: '#ea580c', label: '焦虑不安' },
  sad:      { eyes: '😢',  body: '#ede9fe', cheeks: '#c4b5fd', shadow: '#8b5cf6', label: '难过失落' },
  humiliated:{ eyes: '😞', body: '#fce7f3', cheeks: '#f9a8d4', shadow: '#db2777', label: '被羞辱了' },
  isolated: { eyes: '😔',  body: '#f3f4f6', cheeks: '#d1d5db', shadow: '#6b7280', label: '被孤立' },
  gaslit:   { eyes: '😦',  body: '#fef3c7', cheeks: '#fcd34d', shadow: '#b45309', label: '自我怀疑' },
  hopeful:  { eyes: '🤞',  body: '#dcfce7', cheeks: '#86efac', shadow: '#16a34a', label: '心存希望' },
  angry:    { eyes: '😠',  body: '#fee2e2', cheeks: '#fca5a5', shadow: '#dc2626', label: '愤怒不满' },
  violated: { eyes: '😨',  body: '#fee2e2', cheeks: '#fca5a5', shadow: '#b91c1c', label: '边界被侵犯' },
  empowered:{ eyes: '💪',  body: '#d1fae5', cheeks: '#6ee7b7', shadow: '#059669', label: '充满力量' },
  broken:   { eyes: '😞',  body: '#f3f4f6', cheeks: '#d1d5db', shadow: '#374151', label: '精疲力尽' },
  determined:{ eyes: '😤',  body: '#fef9c3', cheeks: '#fde68a', shadow: '#d97706', label: '下定决心' },
};

export type MoodKey = keyof typeof MOODS;

interface CharacterProps {
  mood: MoodKey;
  size?: number;
  showLabel?: boolean;
  bouncing?: boolean;
  onTap?: () => void;
}

export function WorkplaceCharacter({ mood, size = 80, showLabel = true, bouncing = false, onTap }: CharacterProps) {
  const m = MOODS[mood] || MOODS.confused;
  return (
    <div
      className={`flex flex-col items-center select-none ${bouncing ? 'animate-bounce' : ''} ${onTap ? 'cursor-pointer' : ''}`}
      style={{ width: size, height: size + 24 }}
      onClick={onTap}
    >
      {/* Shadow */}
      <div
        className="rounded-full"
        style={{
          width: size * 0.7,
          height: size * 0.2,
          background: 'rgba(0,0,0,0.08)',
          marginTop: -size * 0.05,
        }}
      />
      {/* Body */}
      <div
        className="rounded-full flex items-center justify-center shadow-md relative overflow-visible"
        style={{
          width: size,
          height: size,
          background: m.body,
          boxShadow: `0 4px 0 ${m.shadow}40, 0 2px 8px rgba(0,0,0,0.1)`,
          transform: 'translateY(-4px)',
          transition: 'background 0.4s ease, box-shadow 0.4s ease',
        }}
      >
        {/* Cheeks */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div style={{ fontSize: size * 0.9, lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}>
            {m.eyes}
          </div>
          {/* Left cheek */}
          <div
            className="absolute rounded-full opacity-60"
            style={{
              width: size * 0.18,
              height: size * 0.12,
              background: m.cheeks,
              left: size * 0.08,
              top: '50%',
              transform: 'translateY(-30%)',
            }}
          />
          {/* Right cheek */}
          <div
            className="absolute rounded-full opacity-60"
            style={{
              width: size * 0.18,
              height: size * 0.12,
              background: m.cheeks,
              right: size * 0.08,
              top: '50%',
              transform: 'translateY(-30%)',
            }}
          />
        </div>
      </div>
      {/* Label */}
      {showLabel && (
        <p className="text-xs text-gray-400 mt-1.5 text-center leading-tight">{m.label}</p>
      )}
    </div>
  );
}

// Floating idle animation for the character on intro page
export function IdleCharacter({ onTap }: { onTap?: () => void }) {
  return (
    <div className="relative">
      {/* Floating background circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-32 h-32 rounded-full bg-brand-100/50 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute w-24 h-24 rounded-full bg-purple-100/40 animate-ping" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>
      {/* Character */}
      <div className="relative z-10" style={{ animation: 'float 3s ease-in-out infinite' }}>
        <WorkplaceCharacter mood="excited" size={96} showLabel={false} onTap={onTap} />
      </div>
    </div>
  );
}

// Reaction flash animation when user makes a choice
export function ReactionFlash({ mood, onDone }: { mood: MoodKey; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(2px)' }}
    >
      <div style={{ animation: 'pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <WorkplaceCharacter mood={mood} size={120} showLabel={false} />
      </div>
    </div>
  );
}

// Mini floating character in corner during test
export function MiniCharacter({ mood }: { mood: MoodKey }) {
  return (
    <div
      className="fixed bottom-20 right-4 z-40 transition-all duration-500"
      style={{ animation: 'float-mini 4s ease-in-out infinite' }}
    >
      <WorkplaceCharacter mood={mood} size={56} showLabel={false} />
    </div>
  );
}

// Mood tracker bar shown on result page
export function MoodTimeline({ answers }: { answers: Array<{ reactionMood: MoodKey }> }) {
  const moodColors: Record<string, string> = {
    empowered: '#059669',
    confident: '#3b82f6',
    hopeful: '#16a34a',
    excited: '#f59e0b',
    nervous: '#d97706',
    confused: '#6b7280',
    anxious: '#ea580c',
    sad: '#8b5cf6',
    humiliated: '#db2777',
    isolated: '#6b7280',
    gaslit: '#b45309',
    angry: '#dc2626',
    violated: '#b91c1c',
    broken: '#374151',
    determined: '#d97706',
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">小林的情绪轨迹</p>
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
        {answers.map((a, i) => (
          <div key={i} className="shrink-0 flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm border-2 border-white"
              style={{ background: moodColors[a.reactionMood] || '#ccc', animationDelay: `${i * 0.05}s` }}
            >
              {MOODS[a.reactionMood]?.eyes || '?'}
            </div>
            <p className="text-[9px] text-gray-400 text-center w-10">第{i + 1}题</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>😢 低落</span>
        <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-red-200 via-amber-200 to-green-200" />
        <span>💪 坚强</span>
      </div>
    </div>
  );
}
