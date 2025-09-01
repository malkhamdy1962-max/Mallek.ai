import React from 'react';
import { CaseFile, UserProfile } from '../types';

interface ConfigurationPanelProps {
  masterInstruction: string;
  setMasterInstruction: (instruction: string) => void;
  onInitializeTeam: () => void;
  isLoading: boolean;
  isTeamInitialized: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  onPlanTask: () => void;
  caseFile: CaseFile;
  userProfile: UserProfile;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  masterInstruction,
  setMasterInstruction,
  onInitializeTeam,
  isLoading,
  isTeamInitialized,
  error,
  setError,
  onPlanTask,
  caseFile,
  userProfile,
}) => {
  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMasterInstruction(e.target.value);
    if(error){
        setError(null);
    }
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2 text-cyan-300">١. مركز القيادة</h2>
        <p className="text-gray-400 text-sm">
          أدخل الهدف الرئيسي لمشروعك، ثم راقب ذاكرة الوكيل وتفضيلاتك المكتسبة هنا.
        </p>
      </div>
      
      <div className="flex-grow flex flex-col">
        <label htmlFor="master-instruction" className="block text-sm font-medium text-gray-300 mb-2">
          الهدف الرئيسي للمشروع
        </label>
        <textarea
          id="master-instruction"
          value={masterInstruction}
          onChange={handleInstructionChange}
          placeholder="مثال: إعداد رسالة دكتوراه حول المسؤولية العقدية في القانون المدني المصري مقارنةً بالشريعة الإسلامية."
          className="w-full flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out resize-none text-white placeholder-gray-500"
          rows={5}
        />
      </div>

      {isTeamInitialized && (
        <>
         <div className="flex-grow flex flex-col">
            <label htmlFor="case-file" className="block text-sm font-medium text-gray-300 mb-2">
            ملف القضية (الذاكرة طويلة الأمد)
            </label>
            <textarea
            id="case-file"
            value={caseFile}
            readOnly
            className="w-full flex-grow p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-sm resize-none text-gray-400 text-xs"
            rows={4}
            />
        </div>
         <div className="flex-grow flex flex-col">
            <label htmlFor="user-profile" className="block text-sm font-medium text-gray-300 mb-2">
            ملف تعريف المستخدم (التفضيلات المكتسبة)
            </label>
            <textarea
            id="user-profile"
            value={userProfile}
            readOnly
            className="w-full flex-grow p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-sm resize-none text-gray-400 text-xs"
            rows={3}
            />
        </div>
        </>
      )}


      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="space-y-3">
        <button
          onClick={onInitializeTeam}
          disabled={isLoading || !masterInstruction.trim()}
          className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-150 ease-in-out shadow-lg"
        >
          {isLoading ? '...جاري التهيئة' : (isTeamInitialized ? 'إعادة ضبط وبدء مشروع جديد' : 'تهيئة الشريك الاستراتيجي')}
        </button>

        <button
          onClick={onPlanTask}
          disabled={isLoading || !isTeamInitialized}
          className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-150 ease-in-out shadow-lg"
        >
          {isLoading ? '...' : 'اقترح خطة عمل'}
        </button>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
