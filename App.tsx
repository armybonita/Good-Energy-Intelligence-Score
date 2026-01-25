
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import { ChatMessage, MessageAuthor } from './types';
import Header from './components/Header';
import ChatMessageComponent from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import GesScore from './components/GesScore';
import ExerciseSummary from './components/ExerciseSummary';
import MindSummary from './components/MindSummary';
import SleepSummary from './components/SleepSummary';
import CoachingInsights from './components/CoachingInsights';
import PersonalGoals, { Goal } from './components/PersonalGoals';
import RegistrationModal, { UserProfile } from './components/RegistrationModal';
import EnergyTrendChart from './components/EnergyTrendChart';

export interface GesScoreData {
  timestamp: number;
  overall: number;
  breakdown: { [key: string]: number };
}

// Define the overall shape of the user data state
interface UserDataState {
  profile: UserProfile | null;
  ges: GesScoreData;
  gesHistory: GesScoreData[];
  data: {
    exercise: { type: string; durationMinutes: number }[];
    mind: { type: string; durationMinutes: number }[];
    sleep: { date: string; durationHours: number }[];
    goals: Goal[];
  };
  aiCoach: {
    insights: string[];
  };
}

// Ensure initialUserData conforms to UserDataState
const initialUserData: UserDataState = {
  profile: null,
  ges: {
    timestamp: Date.now(), // Add initial timestamp to conform to GesScoreData
    overall: 82,
    breakdown: { biomarker: 85, exercise: 78, mind: 88, sleep: 75, food: 84 } as { [key: string]: number } // Explicitly type breakdown
  },
  gesHistory: [], // Initialize as empty array, type is already GesScoreData[]
  data: {
    exercise: [{ type: "Morning Run", durationMinutes: 30 }],
    mind: [{ type: "Zen Meditation", durationMinutes: 15 }],
    sleep: [{ date: "Last Night", durationHours: 7.2 }],
    goals: [
      { id: "g1", title: "Metabolic Peak", category: "biomarker", currentValue: 75, targetValue: 100, unit: "pts" },
      { id: "g2", title: "Sleep Recovery", category: "sleep", currentValue: 6, targetValue: 8, unit: "hrs" }
    ], // No need for 'as Goal[]' here if initialUserData is typed
  },
  aiCoach: {
    insights: ["시스템 등록이 완료되었습니다. 분석 준비 중..."]
  }
};

const analyzeHealthKpisFunction: FunctionDeclaration = {
  name: 'analyzeHealthKpis',
  description: '사용자의 건강 데이터를 분석하여 각 카테고리별 z-score(0.0~1.0)를 바탕으로 최종 점수를 산출합니다.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      hrv: { type: Type.NUMBER }, rhr: { type: Type.NUMBER }, glucoseVar: { type: Type.NUMBER }, biomarkerStress: { type: Type.NUMBER },
      tir: { type: Type.NUMBER }, ppSpike: { type: Type.NUMBER }, mealReg: { type: Type.NUMBER }, macroBal: { type: Type.NUMBER },
      mvpa: { type: Type.NUMBER }, steps: { type: Type.NUMBER }, fitness: { type: Type.NUMBER }, recovery: { type: Type.NUMBER },
      sleepDur: { type: Type.NUMBER }, sleepEff: { type: Type.NUMBER }, sleepReg: { type: Type.NUMBER }, deepRem: { type: Type.NUMBER },
      mindRecovery: { type: Type.NUMBER }, mindStress: { type: Type.NUMBER }, hrvMind: { type: Type.NUMBER }, mood: { type: Type.NUMBER },
      insights: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  }
};

const App: React.FC = () => {
  // Use UserDataState for the useState hook
  const [userData, setUserData] = useState<UserDataState>(initialUserData);
  const [messages, setMessages] = useState<ChatMessage[]>([{ 
    author: MessageAuthor.MODEL, 
    content: "GOOD ENERGY INTELLIGENCE 시스템 가동. 신체 프로필을 등록해 주세요." 
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const initChat = useCallback((profile: UserProfile) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    chatRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `당신은 'GOOD ENERGY INTELLIGENCE' 엔진입니다. 
        사용자 정보: 이름 ${profile.name}, 나이 ${profile.age}세, 성별 ${profile.gender}, 신장 ${profile.height}cm, 체중 ${profile.weight}kg.
        이 신체적 특성과 현재까지의 GEIS 스코어 트렌드를 고려하여 HRV, 혈당, 수면 데이터를 분석하고, 
        과거 데이터와의 비교를 통해 장기적인 건강 인사이트와 목표 달성 전략을 제시하십시오.
        사용자에게 조언할 때는 항상 전문적이고 데이터 기반의 톤을 유지하십시오.
        분석 시 'analyzeHealthKpis' 도구를 적극 활용하십시오.`,
        tools: [{ functionDeclarations: [analyzeHealthKpisFunction] }],
      },
    });
  }, []);

  const handleRegister = (profile: UserProfile) => {
    setUserData(prev => ({ ...prev, profile }));
    initChat(profile);
    setMessages(prev => [...prev, { author: MessageAuthor.MODEL, content: `${profile.name}님, 시스템 등록이 완료되었습니다. 오늘 어떤 건강 데이터를 분석해 드릴까요?` }]);
  };

  const handleAddGoal = (newGoal: Omit<Goal, 'id'>) => {
    const goalWithId: Goal = { ...newGoal, id: `g${Date.now()}` };
    setUserData(prev => ({
      ...prev,
      data: { ...prev.data, goals: [...prev.data.goals, goalWithId] }
    }));
  };

  const calculateScientificScores = useCallback((args: any) => {
    const safeNum = (val: any, def: number) => {
      const n = Number(val);
      return isNaN(n) ? def : n;
    };

    const b = 100 * (0.30 * safeNum(args.hrv, 0.8) + 0.20 * safeNum(args.rhr, 0.9) + 0.30 * safeNum(args.glucoseVar, 0.85) + 0.20 * safeNum(args.biomarkerStress, 0.75));
    const n = 100 * (0.35 * safeNum(args.tir, 0.8) + 0.35 * safeNum(args.ppSpike, 0.7) + 0.15 * safeNum(args.mealReg, 0.9) + 0.15 * safeNum(args.macroBal, 0.85));
    const e = 100 * (0.30 * safeNum(args.mvpa, 0.7) + 0.20 * safeNum(args.steps, 0.8) + 0.25 * safeNum(args.fitness, 0.75) + 0.25 * safeNum(args.recovery, 0.85));
    const s = 100 * (0.25 * safeNum(args.sleepDur, 0.8) + 0.25 * safeNum(args.sleepEff, 0.85) + 0.30 * safeNum(args.sleepReg, 0.7) + 0.20 * safeNum(args.deepRem, 0.65));
    const m = 100 * (0.35 * safeNum(args.mindRecovery, 0.9) + 0.30 * safeNum(args.mindStress, 0.8) + 0.20 * safeNum(args.hrvMind, 0.85) + 0.15 * safeNum(args.mood, 0.9));
    
    const overall = (b + n + e + s + m) / 5;

    const newGes: GesScoreData = {
      timestamp: Date.now(),
      overall: Math.round(overall),
      breakdown: {
        biomarker: Math.round(b),
        food: Math.round(n),
        exercise: Math.round(e),
        sleep: Math.round(s),
        mind: Math.round(m),
      } as { [key: string]: number } // Explicitly cast to match GesScoreData's breakdown
    };

    setUserData(prev => ({
      ...prev,
      ges: newGes, // `newGes` is now correctly typed as GesScoreData
      gesHistory: [...prev.gesHistory, newGes], // 히스토리에 추가
      aiCoach: { insights: args.insights || prev.aiCoach.insights }
    }));
    return { success: true, message: "Dashboard updated." };
  }, []);

  const onSendMessage = async (text: string, image?: { data: string; mimeType: string }) => {
    if (!chatRef.current || isLoading) return;
    setIsLoading(true);
    setMessages(prev => [...prev, { author: MessageAuthor.USER, content: text, image: image ? `data:${image.mimeType};base64,${image.data}` : undefined }]);

    try {
      const parts: any[] = [];
      if (image) parts.push({ inlineData: image });
      parts.push({ text: text || "데이터 분석해줘." });

      const response = await chatRef.current.sendMessage({ message: parts });
      
      if (response.functionCalls?.length) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'analyzeHealthKpis') {
            const result = calculateScientificScores(fc.args);
            const stream = await chatRef.current.sendMessageStream({ 
              message: [{ functionResponse: { id: fc.id, name: fc.name, response: { result: result.message } } }] 
            });

            let modelText = '';
            setMessages(prev => [...prev, { author: MessageAuthor.MODEL, content: '' }]);
            for await (const chunk of stream) {
              modelText += (chunk as any).text || '';
              setMessages(prev => { 
                const next = [...prev]; 
                next[next.length-1].content = modelText; 
                return next; 
              });
            }
          }
        }
      } else {
        setMessages(prev => [...prev, { author: MessageAuthor.MODEL, content: response.text || "분석 완료." }]);
      }
    } catch (e) {
      console.error("Analysis error:", e);
      setMessages(prev => [...prev, { author: MessageAuthor.MODEL, content: "오류가 발생했습니다." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 overflow-hidden">
      <Header profile={userData.profile} />
      
      {!userData.profile && <RegistrationModal onRegister={handleRegister} />}

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden perspective-2000">
        <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth bg-black/20">
          <div className="max-w-5xl mx-auto space-y-12 pb-24">
            <GesScore ges={userData.ges} />
            <CoachingInsights insights={userData.aiCoach.insights} />
            <PersonalGoals goals={userData.data.goals} onAddGoal={handleAddGoal} />
            <EnergyTrendChart gesHistory={userData.gesHistory} profile={userData.profile} /> {/* New Chart Component */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ExerciseSummary exercises={userData.data.exercise} />
              <MindSummary activities={userData.data.mind} />
              <SleepSummary logs={userData.data.sleep} />
            </div>
          </div>
        </div>
        <aside className="w-full md:w-[400px] bg-slate-900/40 border-l border-white/5 backdrop-blur-3xl flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-20">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m, i) => <ChatMessageComponent key={i} message={m} />)}
            <div ref={chatEndRef} />
          </div>
          <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
        </aside>
      </main>
    </div>
  );
};

export default App;