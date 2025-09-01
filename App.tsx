import React, { useState, useCallback, useEffect, useRef } from 'react';
import { type Message, type UserInput, type CaseFile, type UserProfile } from './types';
import { runLegalAgentWorkflow, planTaskWorkflow, summarizeTextWorkflow } from './services/geminiService';
import ConfigurationPanel from './components/ConfigurationPanel';
import ChatWindow from './components/ChatWindow';

// Extend the window interface for the SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const App: React.FC = () => {
  const [masterInstruction, setMasterInstruction] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTeamInitialized, setIsTeamInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [caseFile, setCaseFile] = useState<CaseFile>('');
  const [userProfile, setUserProfile] = useState<UserProfile>('ملف تعريف جديد: لم يتم تحديد تفضيلات للمستخدم بعد.');

  // Load persistent data from local storage on initial mount
  useEffect(() => {
    try {
      const savedCaseFile = localStorage.getItem('legalAgentCaseFile');
      if (savedCaseFile) setCaseFile(savedCaseFile);
      const savedUserProfile = localStorage.getItem('legalAgentUserProfile');
      if (savedUserProfile) setUserProfile(savedUserProfile);
    } catch (e) {
      console.error("Failed to read from local storage:", e);
    }
  }, []);
  
  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'ar-EG';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSendMessage({ text: transcript });
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setError(`خطأ في التعرف على الصوت: ${event.error}`);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };


  const handleInitializeTeam = useCallback(() => {
    if (!masterInstruction.trim()) {
      setError('الرجاء تحديد المهمة القانونية الرئيسية للفريق.');
      return;
    }
    setError(null);
    setMessages([]);
    setIsTeamInitialized(true);
    // Reset state for a new project
    const initialCaseFile = 'ملف قضية جديد: لم يتم تسجيل أي حقائق أساسية بعد.';
    const initialProfile = 'ملف تعريف جديد: لم يتم تحديد تفضيلات للمستخدم بعد.';
    setCaseFile(initialCaseFile);
    setUserProfile(initialProfile);
    try {
        localStorage.setItem('legalAgentCaseFile', initialCaseFile);
        localStorage.setItem('legalAgentUserProfile', initialProfile);
    } catch(e) {
        console.error("Failed to write to local storage:", e);
    }
  }, [masterInstruction]);

  const handlePlanTask = useCallback(async () => {
    if (!isTeamInitialized) return;
    setIsLoading(true);
    setError(null);

    const userMessage: Message = { id: Date.now(), role: 'user', text: "اقتراح خطة عمل لهذه المهمة." };
    setMessages(prev => [...prev, userMessage]);

    try {
        const plan = await planTaskWorkflow(masterInstruction, caseFile, userProfile);
        const modelMessage: Message = {
            id: Date.now() + 1,
            role: 'model',
            text: "بناءً على هدفك، أقترح خطة العمل التالية:",
            taskPlan: plan,
        };
        setMessages(prev => [...prev, modelMessage]);
    } catch (e) {
        const err = e as Error;
        setError(`حدث خطأ أثناء التخطيط: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
  }, [isTeamInitialized, masterInstruction, caseFile, userProfile]);

  const handleSummarizeMessage = useCallback(async (messageId: number) => {
    const messageToSummarize = messages.find(m => m.id === messageId);
    if (!messageToSummarize) return;
    
    setIsLoading(true);
    setError(null);
    const textToSummarize = messageToSummarize.responseObject?.detailedAnalysis || messageToSummarize.text;

    try {
        const summary = await summarizeTextWorkflow(textToSummarize);
        const summaryMessage: Message = {
            id: Date.now(),
            role: 'model',
            text: `ملخص للنص السابق:\n\n${summary}`,
        };
        setMessages(prev => [...prev, summaryMessage]);
    } catch (e) {
        const err = e as Error;
        setError(`حدث خطأ أثناء التلخيص: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
}, [messages]);

  const handleFeedback = (messageId: number, feedback: 'like' | 'dislike') => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback } : m));
  };

  const handleSendMessage = useCallback(async (userInput: UserInput) => {
    if (!isTeamInitialized || (!userInput.text?.trim() && !userInput.image)) return;

    setIsLoading(true);
    setError(null);
    
    const userMessage: Message = { 
        id: Date.now(),
        role: 'user', 
        text: userInput.text || 'Image analysis request', 
        imageData: userInput.image?.data, 
        imageType: userInput.image?.mimeType 
    };
    setMessages(prev => [...prev, userMessage]);
    
    const modelMessageId = Date.now() + 1;
    let currentModelMessage: Message = {
        id: modelMessageId,
        role: 'model',
        text: '',
        statusHistory: [],
    };
    setMessages(prev => [...prev, currentModelMessage]);

    try {
        const stream = runLegalAgentWorkflow(userInput, masterInstruction, messages, caseFile, userProfile);
        
        for await (const chunk of stream) {
            if (chunk.type === 'status') {
                currentModelMessage = {
                    ...currentModelMessage,
                    statusHistory: [...(currentModelMessage.statusHistory || []), chunk.message],
                };
            } else if (chunk.type === 'response') {
                currentModelMessage = {
                    ...currentModelMessage,
                    responseObject: chunk.data
                };
            } else if (chunk.type === 'final') {
                 if(chunk.updatedCaseFile) {
                    setCaseFile(chunk.updatedCaseFile);
                    localStorage.setItem('legalAgentCaseFile', chunk.updatedCaseFile);
                }
                if (chunk.updatedUserProfile) {
                    setUserProfile(chunk.updatedUserProfile);
                    localStorage.setItem('legalAgentUserProfile', chunk.updatedUserProfile);
                }
            }
            // Update the message in the state with the new chunk data
            setMessages(prev => prev.map(m => m.id === modelMessageId ? currentModelMessage : m));
        }

    } catch (e) {
      const err = e as Error;
      const errorMessage = `حدث خطأ: ${err.message}`;
      setError(errorMessage);
      console.error(e);
      currentModelMessage.text = "عذراً، لقد واجهت خطأ. قد يكون بسبب تعقيد الطلب أو مشكلة في الشبكة. الرجاء تبسيط سؤالك والمحاولة مرة أخرى.";
      setMessages(prev => prev.map(m => m.id === modelMessageId ? currentModelMessage : m));
    } finally {
      setIsLoading(false);
    }
  }, [isTeamInitialized, masterInstruction, messages, caseFile, userProfile]);

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-900 text-white" dir="rtl">
      <header className="p-4 border-b border-gray-700 shadow-lg bg-gray-800">
        <h1 className="text-2xl font-bold text-center text-cyan-400">الشريك القانوني الاستراتيجي</h1>
        <p className="text-center text-gray-400 mt-1">وكيل ذكاء اصطناعي بذاكرة طويلة الأمد وقدرات تخطيط استراتيجية لإنجاز مشاريعك القانونية.</p>
      </header>
      <div className="flex-grow grid md:grid-cols-3 overflow-hidden">
        <div className="md:col-span-1 bg-gray-800 p-6 border-l border-gray-700 overflow-y-auto">
          <ConfigurationPanel
            masterInstruction={masterInstruction}
            setMasterInstruction={setMasterInstruction}
            onInitializeTeam={handleInitializeTeam}
            isLoading={isLoading && !isTeamInitialized}
            isTeamInitialized={isTeamInitialized}
            error={error}
            setError={setError}
            onPlanTask={handlePlanTask}
            caseFile={caseFile}
            userProfile={userProfile}
          />
        </div>
        <div className="md:col-span-2 flex flex-col h-full bg-gray-900">
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isAgentCreated={isTeamInitialized}
            error={error}
            isListening={isListening}
            onToggleListening={handleToggleListening}
            onSummarize={handleSummarizeMessage}
            onFeedback={handleFeedback}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
