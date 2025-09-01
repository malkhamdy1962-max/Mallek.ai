
import React from 'react';

const BotIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" />
            <rect x="4" y="12" width="16" height="8" rx="2" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M12 12v-2" />
            <path d="M12 20v-4" />
        </svg>
    </div>
);

export default BotIcon;
