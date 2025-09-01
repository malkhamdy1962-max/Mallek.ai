import React, { useState, useRef, useEffect } from 'react';
import { type Message, type UserInput, type TaskPlanStep } from '../types';
import SendIcon from './icons/SendIcon';
import BotIcon from './icons/BotIcon';
import UserIcon from './icons/UserIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import SpeakerIcon from './icons/SpeakerIcon';
import SummarizeIcon from './icons/SummarizeIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import ThumbsDownIcon from './icons/ThumbsDownIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import InfoIcon from './icons/InfoIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import FileTextIcon from './icons/FileTextIcon';
import LinkIcon from './icons/LinkIcon';
import HelpCircleIcon from './icons/HelpCircleIcon';


interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (userInput: UserInput) => void;
  isLoading: boolean;
  isAgentCreated: boolean;
  error: string | null;
  isListening: boolean;
  onToggleListening: () => void;
  onSummarize: (messageId: number) => void;
  onFeedback: (messageId: number, feedback: 'like' | 'dislike') => void;
}

const TaskPlanDisplay: React.FC<{ plan: TaskPlanStep[] }> = ({ plan }) => (
    <div className="space-y-3">
        <h3 className="font-bold text-lg text-cyan-300 border-b border-cyan-800 pb-1 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            خطة العمل المقترحة
        </h3>
        <ol className="list-decimal list-inside space-y-3 pr-4">
            {plan.map(step => (
                <li key={step.step} className="space-y-1">
                    <span className="font-semibold text-white">{step.title}</span>
                    <p className="text-sm text-gray-300 pr-4">{step.description}</p>
                </li>
            ))}
        </ol>
    </div>
);


const ModelResponseMessage: React.FC<{ msg: Message; onSummarize: (id: number) => void; onFeedback: (id: number, feedback: 'like' | 'dislike') => void; }> = ({ msg, onSummarize, onFeedback }) => {
  
  const getFullText = () => {
    if (!msg.responseObject) return msg.text;
    const { executiveSummary, keyPoints, detailedAnalysis, sources } = msg.responseObject;
    return `ملخص تنفيذي:\n${executiveSummary}\n\nالنقاط الرئيسية:\n- ${keyPoints.join('\n- ')}\n\nالتحليل المفصل:\n${detailedAnalysis}\n\nالمصادر:\n${sources.map(s => `- ${s.title}: ${s.link}`).join('\n')}`;
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(getFullText());
  };
  
  const handleSpeak = () => {
    if (msg.responseObject && 'speechSynthesis' in window) {
      const textToSpeak = `${msg.responseObject.executiveSummary}\n\nالنقاط الرئيسية:\n${msg.responseObject.keyPoints.join('. ')}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ar-EG';
      window.speechSynthesis.speak(utterance);
    }
  };
  
  if (msg.taskPlan) {
    return <TaskPlanDisplay plan={msg.taskPlan} />;
  }

  // Display for loading/status updates
  if (msg.statusHistory && msg.statusHistory.length > 0 && !msg.responseObject) {
      return (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
                <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                </div>
                <p className="text-sm text-cyan-300">يفكر الشريك الاستراتيجي...</p>
            </div>
            <p className="text-xs text-gray-400 pr-6 border-r-2 border-cyan-700/50">{msg.statusHistory[msg.statusHistory.length - 1]}</p>
          </div>
      );
  }

  if (msg.responseObject) {
    const { executiveSummary, keyPoints, detailedAnalysis, sources, suggestedQuestions } = msg.responseObject;
    return (
      <div className="space-y-6">
        {/* Executive Summary Section */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-cyan-300 flex items-center gap-2">
                    <InfoIcon />
                    ملخص تنفيذي
                </h3>
                 <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <button onClick={() => onSummarize(msg.id)} className="text-gray-400 hover:text-cyan-400 transition-colors" title="تلخيص التحليل المفصل">
                        <SummarizeIcon />
                    </button>
                    <button onClick={handleSpeak} className="text-gray-400 hover:text-cyan-400 transition-colors" title="استمع إلى الملخص">
                        <SpeakerIcon />
                    </button>
                    <button onClick={handleCopy} className="text-gray-400 hover:text-cyan-400 transition-colors" title="نسخ المحتوى">
                        <ClipboardIcon />
                    </button>
                 </div>
            </div>
            <p className="whitespace-pre-wrap text-gray-300">{executiveSummary}</p>
        </div>
        
        {/* Key Points Section */}
        {keyPoints?.length > 0 && (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="font-bold text-lg mb-3 text-cyan-300 flex items-center gap-2">
                <LightbulbIcon />
                النقاط الرئيسية
            </h3>
            <ul className="space-y-2 pr-4">
              {keyPoints.map((point, i) => <li key={i} className="flex items-start gap-2"><span className="text-cyan-400 mt-1">●</span><span>{point}</span></li>)}
            </ul>
          </div>
        )}

        {/* Detailed Analysis Section */}
        {detailedAnalysis && (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="font-bold text-lg mb-3 text-cyan-300 flex items-center gap-2">
                <FileTextIcon />
                التحليل المفصل
            </h3>
            <p className="whitespace-pre-wrap text-gray-300 leading-relaxed">{detailedAnalysis}</p>
          </div>
        )}

        {/* Sources Section */}
        {sources?.length > 0 && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <h3 className="font-bold text-lg mb-3 text-cyan-300 flex items-center gap-2">
                    <LinkIcon />
                    المصادر
                </h3>
                <ul className="space-y-2 pr-4">
                    {sources.map((source, i) => (
                        <li key={i} className="flex items-start gap-2">
                             <span className="text-cyan-400 mt-1">🔗</span>
                             <a href={source.link} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{source.title}</a>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {/* Suggested Questions Section */}
        {suggestedQuestions?.length > 0 && (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="font-bold text-lg mb-3 text-cyan-300 flex items-center gap-2">
                <HelpCircleIcon />
                الأسئلة المقترحة للمتابعة
            </h3>
            <div className="flex flex-col items-start gap-2">
              {suggestedQuestions.map((q, i) => <button key={i} className="text-left text-sm p-2 bg-gray-700/50 hover:bg-gray-700 rounded-md transition-colors w-full">{q}</button>)}
            </div>
          </div>
        )}

        {/* Feedback Section */}
         <div className="border-t border-gray-700 pt-3 flex items-center justify-end space-x-2 rtl:space-x-reverse">
            <span className="text-xs text-gray-500">هل كانت هذه الإجابة مفيدة؟</span>
            <button onClick={() => onFeedback(msg.id, 'like')} title="إجابة مفيدة">
                <ThumbsUpIcon filled={msg.feedback === 'like'} />
            </button>
            <button onClick={() => onFeedback(msg.id, 'dislike')} title="إجابة غير مفيدة">
                <ThumbsDownIcon filled={msg.feedback === 'dislike'} />
            </button>
        </div>
      </div>
    );
  }

  return <p className="whitespace-pre-wrap">{msg.text}</p>;
};

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading, isAgentCreated, error, isListening, onToggleListening, onSummarize, onFeedback }) => {
  const [userInput, setUserInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [stagedImage, setStagedImage] = useState<UserInput['image']>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            setImagePreview(reader.result as string);
            setStagedImage({ data: base64String, mimeType: file.type });
        };
        reader.readAsDataURL(file);
    } else { // For PDF/DOCX, send immediately
        let textContent = `\n\n[محتوى من ملف ${file.name}]:\n`;
        if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
                const pdf = await (window as any).pdfjsLib.getDocument(typedArray).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const text = await page.getTextContent();
                    fullText += text.items.map((s: any) => s.str).join(' ') + '\n';
                }
                onSendMessage({ text: `${userInput}\n${textContent}${fullText}` });
            };
            reader.readAsArrayBuffer(file);
        } else if (file.name.endsWith('.docx')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const result = await (window as any).mammoth.extractRawText({ arrayBuffer: e.target?.result });
                onSendMessage({ text: `${userInput}\n${textContent}${result.value}` });
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('نوع الملف غير مدعوم. الرجاء رفع ملف PDF, DOCX, أو صورة.');
        }
    }
    if(fileInputRef.current) fileInputRef.current.value = "";
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() || stagedImage) {
      onSendMessage({ text: userInput, image: stagedImage });
      setUserInput('');
      setStagedImage(null);
      setImagePreview(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex-grow p-6 overflow-y-auto">
        {!isAgentCreated ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <h2 className="text-2xl font-semibold">مرحباً بك!</h2>
              <p>ابدأ بتحديد المهمة في مركز القيادة لتهيئة شريكك الاستراتيجي.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'}`}>
                {msg.role === 'model' && <BotIcon />}
                <div className={`max-w-2xl px-5 py-4 rounded-2xl shadow ${msg.role === 'user' ? 'bg-cyan-600 rounded-bl-none text-white' : 'bg-gray-700 text-gray-200 rounded-br-none'}`}>
                  {msg.imageData && <img src={`data:${msg.imageType};base64,${msg.imageData}`} alt="User upload" className="max-w-xs rounded-lg mb-2" />}
                  {msg.role === 'model' ? <ModelResponseMessage msg={msg} onSummarize={onSummarize} onFeedback={onFeedback} /> : <p className="whitespace-pre-wrap">{msg.text}</p>}
                </div>
                 {msg.role === 'user' && <UserIcon />}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        {error && isAgentCreated && <div className="text-red-400 text-sm mb-2 text-right">{error}</div>}
        {imagePreview && (
            <div className="mb-2 flex items-center justify-between bg-gray-700 p-2 rounded-lg">
                <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded"/>
                <button onClick={() => { setImagePreview(null); setStagedImage(null); }} className="text-red-400 hover:text-red-600">&times;</button>
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-row-reverse">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={isAgentCreated ? (isListening ? "جاري الاستماع..." : "اسأل شريكك الاستراتيجي...") : "الرجاء تهيئة الشريك الاستراتيجي أولاً..."}
            disabled={!isAgentCreated || isLoading || isListening}
            className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out disabled:cursor-not-allowed placeholder-gray-500"
          />
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp, .pdf, .docx" />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!isAgentCreated || isLoading} className="p-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
            <PaperclipIcon />
          </button>
           <button type="button" onClick={onToggleListening} disabled={!isAgentCreated || isLoading} className={`p-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors ${isListening ? 'bg-red-700 hover:bg-red-800' : ''}`}>
            <MicrophoneIcon />
          </button>
          <button
            type="submit"
            disabled={!isAgentCreated || isLoading || (!userInput.trim() && !stagedImage)}
            className="bg-cyan-600 text-white p-3 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;