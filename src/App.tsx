import { useState, useCallback, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './auth/AuthContext';
import HomePage from './pages/HomePage';
import TestPage from './pages/TestPage';
import ReportPage from './pages/ReportPage';
import ToolsPage from './pages/ToolsPage';
import ScriptsDetailPage from './pages/ScriptsDetailPage';
import PracticePage from './pages/PracticePage';
import TreeHolePage from './pages/TreeHolePage';
import CommunityPage from './pages/CommunityPage';
import NewPostPage from './pages/NewPostPage';
import PostDetailPage from './pages/PostDetailPage';
import ProfilePage from './pages/ProfilePage';
import TestHistoryPage from './pages/TestHistoryPage';
import LeaveDecisionPage from './pages/LeaveDecisionPage';
import OnboardingPage from './pages/OnboardingPage';
import WechatCallbackPage from './pages/WechatCallbackPage';
import type { TestResult, ScriptItem, PracticeScenario, Post } from './types';

type PageName = 'home' | 'test' | 'report' | 'tools'
  | 'scripts-detail' | 'practice'
  | 'treehole' | 'community' | 'new-post' | 'post-detail'
  | 'profile' | 'test-history' | 'leave-decision'
  | 'onboarding' | 'wechat-callback';

const PAGE_TITLES: Record<PageName, string> = {
  home: '职场清醒笔记', test: '识别测试', report: '测试报告',
  tools: '工具箱', 'scripts-detail': '话术详情', practice: '情景练习',
  treehole: '情绪树洞', community: '互助社区', 'new-post': '发布帖子',
  'post-detail': '帖子详情', profile: '我的',
  'test-history': '测试历史', 'leave-decision': '去留决策',
  onboarding: '欢迎', 'wechat-callback': '微信登录',
};

const TAB_PAGES: PageName[] = ['home', 'tools', 'treehole', 'community', 'profile'];

const TABS: { id: PageName; label: string; icon: string }[] = [
  { id: 'home', label: '首页', icon: '🏠' },
  { id: 'tools', label: '工具箱', icon: '🔧' },
  { id: 'treehole', label: '树洞', icon: '🌳' },
  { id: 'community', label: '社区', icon: '💬' },
  { id: 'profile', label: '我的', icon: '👤' },
];

function ActionButton({ page, onNavigate }: { page: PageName; onNavigate: (p: string) => void }) {
  if (page === 'community') {
    return (
      <button
        onClick={() => onNavigate('new-post')}
        className="bg-brand-500 text-white text-xs px-3 py-1.5 rounded-full font-medium active:scale-95 transition-transform"
      >
        + 发帖
      </button>
    );
  }
  return null;
}

// 检测是否在小程序 WebView 中运行
function detectWebview(): boolean {
  try {
    return (
      window.location.search.includes('from=miniprogram') ||
      /miniProgram/i.test(navigator.userAgent)
    );
  } catch {
    return false;
  }
}

// 小程序 WebView 内嵌导航栏（紧凑型，含状态栏安全区）
function WebviewNavBar({ title, onBack, showBack }: { title: string; onBack: () => void; showBack: boolean }) {
  return (
    <div className="bg-white border-b border-gray-100 flex items-center justify-between px-2 shrink-0"
      style={{ paddingTop: 'env(safe-area-inset-top, 12px)', height: 'calc(44px + env(safe-area-inset-top, 12px))' }}>
      <div className="w-14 flex items-center">
        {showBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-0.5 text-brand-500 text-sm font-medium pl-1 active:opacity-60"
          >
            <span>‹</span><span>返回</span>
          </button>
        )}
      </div>
      <div className="flex-1 text-center">
        <span className="text-sm font-semibold text-gray-700 truncate px-2">{title}</span>
      </div>
      <div className="w-14" />
    </div>
  );
}

function AppContent() {
  const { onboardingDone } = useApp();

  const isCallbackRoute = typeof window !== 'undefined' && window.location.pathname.includes('wechat-callback');
  const [isInWebview] = useState(() => detectWebview());
  const [historyStack, setHistoryStack] = useState<PageName[]>([]);

  const [currentPage, setCurrentPage] = useState<PageName>(
    isCallbackRoute ? 'wechat-callback'
      : (onboardingDone ? 'home' : 'onboarding') as PageName
  );
  const [pageParams, setPageParams] = useState<Record<string, unknown>>({});

  // WebView 模式下维护页面历史栈
  const navigateWithHistory = useCallback((page: string, params?: Record<string, unknown>) => {
    if (page !== currentPage) {
      setHistoryStack(s => [...s, currentPage]);
    }
    setPageParams(params || {});
    setCurrentPage(page as PageName);
  }, [currentPage]);

  // WebView 模式下返回上一页
  const webviewGoBack = useCallback(() => {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack(s => s.slice(0, -1));
      setCurrentPage(prev);
    } else {
      // 历史栈为空，通过微信 API 返回小程序
      try {
        if (typeof (window as any).wx !== 'undefined' && (window as any).wx.miniProgram) {
          (window as any).wx.miniProgram.navigateBack();
        }
      } catch {}
    }
  }, [historyStack]);

  useEffect(() => {
    if (!onboardingDone && currentPage !== 'onboarding' && currentPage !== 'wechat-callback') {
      setCurrentPage('onboarding');
    }
  }, [onboardingDone, currentPage]);

  const navigate = useCallback((page: string, params?: Record<string, unknown>) => {
    if (isInWebview) {
      navigateWithHistory(page, params);
    } else {
      setPageParams(params || {});
      setCurrentPage(page as PageName);
    }
  }, [isInWebview, navigateWithHistory]);

  const isTabPage = TAB_PAGES.includes(currentPage);
  const isWebviewNavPage = !isTabPage && currentPage !== 'wechat-callback';

  function renderPage() {
    if (currentPage === 'wechat-callback') return <WechatCallbackPage onNavigate={navigate} />;
    if (!onboardingDone) return <OnboardingPage onNavigate={navigate} />;
    switch (currentPage) {
      case 'home': return <HomePage onNavigate={navigate} />;
      case 'test': return <TestPage onNavigate={navigate} />;
      case 'report': return <ReportPage onNavigate={navigate} result={pageParams.result as TestResult} />;
      case 'tools': return <ToolsPage onNavigate={navigate} initialTab={pageParams.tab as string} />;
      case 'scripts-detail': return <ScriptsDetailPage onNavigate={navigate} script={pageParams.script as ScriptItem} />;
      case 'practice': return <PracticePage onNavigate={navigate} scenario={pageParams.scenario as PracticeScenario} />;
      case 'treehole': return <TreeHolePage onNavigate={navigate} />;
      case 'community': return <CommunityPage onNavigate={navigate} />;
      case 'new-post': return <NewPostPage onNavigate={navigate} />;
      case 'post-detail': return <PostDetailPage onNavigate={navigate} post={pageParams.post as Post} />;
      case 'profile': return <ProfilePage onNavigate={navigate} />;
      case 'test-history': return <TestHistoryPage onNavigate={navigate} />;
      case 'leave-decision': return <LeaveDecisionPage onNavigate={navigate} />;
      default: return <HomePage onNavigate={navigate} />;
    }
  }

  // 回调页 / 引导页：全屏展示
  if (currentPage === 'wechat-callback' || !onboardingDone) {
    return <div className="min-h-screen bg-white">{renderPage()}</div>;
  }

  // Tab 页面：常规布局，顶部导航栏
  if (isTabPage) {
    return (
      <div className="min-h-screen bg-gray-50 relative flex flex-col" style={{ height: '100vh', maxWidth: '100vw' }}>
        {/* WebView 内嵌时显示紧凑导航 */}
        {isInWebview && (
          <WebviewNavBar
            title="职场清醒笔记"
            onBack={webviewGoBack}
            showBack={false}
          />
        )}
        {/* 页面内容 */}
        <div className="flex-1 overflow-y-auto">
          {renderPage()}
        </div>
        {/* TabBar */}
        <div className="bg-white border-t border-gray-100 shrink-0">
          <div className="flex">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => navigate(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${
                  currentPage === tab.id ? 'text-brand-500' : 'text-gray-400'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 非 Tab 子页面：白色顶栏 + 内容
  return (
    <div className="min-h-screen bg-gray-50 relative flex flex-col" style={{ height: '100vh', maxWidth: '100vw' }}>
      {/* 标准导航栏（PC / H5 独立访问） */}
      {!isInWebview && (
        <div className="bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0" style={{ height: '48px' }}>
          <div className="w-14">
            <button onClick={() => navigate('home')} className="text-brand-500 text-sm font-medium">‹ 返回</button>
          </div>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-gray-700">{PAGE_TITLES[currentPage]}</span>
          </div>
          <div className="w-14 flex justify-end">
            <ActionButton page={currentPage} onNavigate={navigate} />
          </div>
        </div>
      )}
      {/* 小程序 WebView 内嵌导航栏 */}
      {isInWebview && (
        <WebviewNavBar
          title={PAGE_TITLES[currentPage]}
          onBack={webviewGoBack}
          showBack={true}
        />
      )}
      <div className="flex-1 overflow-y-auto">
        {renderPage()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppProvider>
  );
}
