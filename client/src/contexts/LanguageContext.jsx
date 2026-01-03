import React, { createContext, useState, useEffect, useCallback } from 'react';
import { en } from '../locales/en';
import { zh } from '../locales/zh';

export const LanguageContext = createContext(null);

const translations = { en, zh };

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('app_language') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('app_language', language);
        document.documentElement.lang = language;
    }, [language]);

    const t = useCallback((key, params = {}) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) return key;
        }

        if (typeof value === 'string' && Object.keys(params).length > 0) {
            return value.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] || `{{${k}}}`);
        }

        return value;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}
