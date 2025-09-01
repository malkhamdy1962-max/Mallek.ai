
import React from 'react';

const UserIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-600 flex items-center justify-center shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    </div>
);

export default UserIcon;
