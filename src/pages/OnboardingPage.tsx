import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Industry, WorkYears } from '../types';

interface OnboardingPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

const INDUSTRIES: Industry[] = ['互联网', '教育', '金融', '医疗', '其他'];
const WORK_YEARS: WorkYears[] = ['1年以内', '1-3年', '3-5年', '5年以上'];

const PAIN_POINTS = [
  { id: '加班', label: '经常加班', emoji: '⏰' },
  { id: '否定价值', label: '被否定价值', emoji: '💔' },
  { id: '领导情绪', label: '领导情绪不稳定', emoji: '😡' },
  { id: '同事排挤', label: '同事排挤', emoji: '🚶' },
  { id: 'PUA困惑', label: '不清楚自己是否被PUA', emoji: '❓' },
  { id: '其他', label: '其他', emoji: '💬' },
];

const STEPS = ['选择行业', '工作年限', '主要痛点', '功能介绍'];

export default function OnboardingPage({ onNavigate }: OnboardingPageProps) {
  const { completeOnboarding, setUserInfo, appName } = useApp();
  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState<Industry>('互联网');
  const [workYears, setWorkYears] = useState<WorkYears>('1-3年');
  const [painPoints, setPainPoints] = useState<string[]>([]);

  const togglePainPoint = (id: string) => {
    setPainPoints(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleFinish = () => {
    setUserInfo(industry, workYears);
    completeOnboarding();
    onNavigate('home');
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-brand-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                i < step ? 'bg-brand-500 text-white' :
                i === step ? 'bg-brand-500 text-white' :
                'bg-gray-200 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] ${i === step ? 'text-brand-500 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 pt-4">
        {step === 0 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-1">欢迎来到 {appName}</h2>
            <p className="text-sm text-gray-500 mb-8">告诉我们你的背景，以便更好地帮助你</p>
            <div className="grid grid-cols-2 gap-3">
              {INDUSTRIES.map(ind => (
                <button
                  key={ind}
                  onClick={() => setIndustry(ind)}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    industry === ind
                      ? 'border-brand-500 bg-brand-50 text-brand-600'
                      : 'border-gray-200 text-gray-600 bg-gray-50'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-1">你的工作年限？</h2>
            <p className="text-sm text-gray-500 mb-8">帮助我们了解你的职场经验</p>
            <div className="space-y-3">
              {WORK_YEARS.map(years => (
                <button
                  key={years}
                  onClick={() => setWorkYears(years)}
                  className={`w-full py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                    workYears === years
                      ? 'border-brand-500 bg-brand-50 text-brand-600'
                      : 'border-gray-200 text-gray-600 bg-gray-50'
                  }`}
                >
                  {years}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-1">你在职场中遇到了什么？</h2>
            <p className="text-sm text-gray-500 mb-6">可多选，我们会为你提供针对性支持</p>
            <div className="grid grid-cols-2 gap-3">
              {PAIN_POINTS.map(pt => (
                <button
                  key={pt.id}
                  onClick={() => togglePainPoint(pt.id)}
                  className={`py-3 px-3 rounded-xl border-2 text-sm transition-all flex items-center gap-2 ${
                    painPoints.includes(pt.id)
                      ? 'border-brand-500 bg-brand-50 text-brand-600'
                      : 'border-gray-200 text-gray-600 bg-gray-50'
                  }`}
                >
                  <span>{pt.emoji}</span>
                  <span className="text-xs">{pt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-1">{appName} 能帮你做什么？</h2>
            <p className="text-sm text-gray-500 mb-6">了解产品核心功能</p>
            <div className="space-y-3">
              {[
                { icon: '🔍', title: '识别测试', desc: '通过专业问卷，识别你正在经历的职场PUA套路和风险等级', color: 'from-blue-50 to-blue-100' },
                { icon: '🎭', title: '情景练习', desc: '与AI模拟高压对话场景，练习设立边界、优雅应对的话术', color: 'from-orange-50 to-orange-100' },
                { icon: '📝', title: '情绪日记', desc: '记录每日情绪变化，AI伙伴陪你梳理思路，看见自己的感受', color: 'from-green-50 to-green-100' },
                { icon: '💬', title: '互助社区', desc: '与有类似经历的人交流，找到共鸣，不再孤单', color: 'from-purple-50 to-purple-100' },
              ].map(f => (
                <div key={f.title} className={`card bg-gradient-to-br ${f.color} border-0`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{f.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">{f.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="px-6 pb-8 pt-4 shrink-0">
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium"
            >
              上一步
            </button>
          )}
          <button
            onClick={step < STEPS.length - 1 ? () => setStep(s => s + 1) : handleFinish}
            className="flex-1 py-3 rounded-xl bg-brand-500 text-white text-sm font-medium active:scale-95 transition-transform"
          >
            {step < STEPS.length - 1 ? '下一步' : '开始使用 🌿'}
          </button>
        </div>
      </div>
    </div>
  );
}
