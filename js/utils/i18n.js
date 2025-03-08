/**
 * i18n - система локализации для игры
 * Поддерживает множество языков
 */
class I18n {
    /**
     * Конструктор класса I18n
     */
    constructor() {
        // Текущий язык
        this.currentLanguage = 'ru';
        
        // Словари переводов
        this.dictionaries = {};
        
        // Карта резервных языков
        this.fallbackMap = {
            'be': 'ru', 'kk': 'ru', 'uk': 'ru', 'uz': 'ru'
            // Для остальных языков используется английский
        };
        
        // Приоритетные языки
        this.priorityLanguages = ['ru', 'tr', 'en'];
        
        // Поддерживаемые языки
        this.supportedLanguages = [
            'ar', 'az', 'be', 'bg', 'ca', 'cs', 'de', 'en',
            'es', 'fa', 'fr', 'he', 'hi', 'hu', 'hy', 'id',
            'it', 'ja', 'ka', 'kk', 'nl', 'pl', 'pt', 'ro',
            'ru', 'sk', 'sr', 'th', 'tk', 'tr', 'uk', 'uz',
            'vi', 'zh'
        ];
        
        // Информация о языках
        this.languageInfo = {
            'ar': { name: 'العربية', direction: 'rtl' },
            'az': { name: 'Azərbaycan', direction: 'ltr' },
            'be': { name: 'Беларуская', direction: 'ltr' },
            'bg': { name: 'Български', direction: 'ltr' },
            'ca': { name: 'Català', direction: 'ltr' },
            'cs': { name: 'Čeština', direction: 'ltr' },
            'de': { name: 'Deutsch', direction: 'ltr' },
            'en': { name: 'English', direction: 'ltr' },
            'es': { name: 'Español', direction: 'ltr' },
            'fa': { name: 'فارسی', direction: 'rtl' },
            'fr': { name: 'Français', direction: 'ltr' },
            'he': { name: 'עברית', direction: 'rtl' },
            'hi': { name: 'हिन्दी', direction: 'ltr' },
            'hu': { name: 'Magyar', direction: 'ltr' },
            'hy': { name: 'Հայերեն', direction: 'ltr' },
            'id': { name: 'Bahasa Indonesia', direction: 'ltr' },
            'it': { name: 'Italiano', direction: 'ltr' },
            'ja': { name: '日本語', direction: 'ltr' },
            'ka': { name: 'ქართული', direction: 'ltr' },
            'kk': { name: 'Қазақша', direction: 'ltr' },
            'nl': { name: 'Nederlands', direction: 'ltr' },
            'pl': { name: 'Polski', direction: 'ltr' },
            'pt': { name: 'Português', direction: 'ltr' },
            'ro': { name: 'Română', direction: 'ltr' },
            'ru': { name: 'Русский', direction: 'ltr' },
            'sk': { name: 'Slovenčina', direction: 'ltr' },
            'sr': { name: 'Српски', direction: 'ltr' },
            'th': { name: 'ไทย', direction: 'ltr' },
            'tk': { name: 'Türkmençe', direction: 'ltr' },
            'tr': { name: 'Türkçe', direction: 'ltr' },
            'uk': { name: 'Українська', direction: 'ltr' },
            'uz': { name: 'O\'zbek', direction: 'ltr' },
            'vi': { name: 'Tiếng Việt', direction: 'ltr' },
            'zh': { name: '中文', direction: 'ltr' }
        };
    }
    
    /**
     * Инициализация системы локализации
     * @param {string} defaultLanguage - Язык по умолчанию
     * @param {object} dictionaries - Словари переводов
     */
    init(defaultLanguage, dictionaries = {}) {
        // Устанавливаем словари
        this.dictionaries = dictionaries;
        
        // Пытаемся загрузить сохраненный язык из локального хранилища
        const savedLanguage = localStorage.getItem('hacker_sim_language');
        
        // Устанавливаем язык по умолчанию или загруженный из хранилища
        if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
            this.setLanguage(savedLanguage);
        } else {
            this.setLanguage(defaultLanguage || 'ru');
        }
        
        return this;
    }
    
    /**
     * Определение языка на основе кода языка
     * @param {string} langCode - Код языка
     * @returns {string} - Определенный язык
     */
    detectLanguage(langCode) {
        // Если язык не поддерживается, используем карту резервных языков
        if (!this.isLanguageSupported(langCode)) {
            // Если есть в карте резервных
            if (this.fallbackMap[langCode]) {
                return this.fallbackMap[langCode];
            }
            
            // По умолчанию английский
            return 'en';
        }
        
        return langCode;
    }
    
    /**
     * Проверка поддержки языка
     * @param {string} lang - Код языка
     * @returns {boolean} - Поддерживается ли язык
     */
    isLanguageSupported(lang) {
        return this.supportedLanguages.includes(lang);
    }
    
    /**
     * Установка языка
     * @param {string} lang - Код языка
     */
    setLanguage(lang) {
        // Если язык не поддерживается, используем определение языка
        if (!this.isLanguageSupported(lang)) {
            lang = this.detectLanguage(lang);
        }
        
        this.currentLanguage = lang;
        
        // Сохраняем выбранный язык в локальном хранилище
        localStorage.setItem('hacker_sim_language', lang);
        
        // Устанавливаем направление текста для документа
        document.documentElement.dir = this.getLanguageDirection();
        
        // Возвращаем текущий язык
        return this.currentLanguage;
    }
    
    /**
     * Получение направления текста для текущего языка
     * @returns {string} - Направление текста (ltr/rtl)
     */
    getLanguageDirection() {
        return this.languageInfo[this.currentLanguage]?.direction || 'ltr';
    }
    
    /**
     * Получение имени языка на родном языке
     * @param {string} lang - Код языка
     * @returns {string} - Имя языка
     */
    getLanguageName(lang = null) {
        lang = lang || this.currentLanguage;
        return this.languageInfo[lang]?.name || lang;
    }
    
    /**
     * Получение локализованной строки по ключу
     * @param {string} key - Ключ строки
     * @param {object} params - Параметры для подстановки
     * @returns {string} - Локализованная строка
     */
    get(key, params = {}) {
        // Пытаемся получить строку для текущего языка
        let string = this.getStringForLanguage(this.currentLanguage, key);
        
        // Если строка не найдена и текущий язык не английский,
        // пытаемся получить строку на английском
        if (string === undefined && this.currentLanguage !== 'en') {
            string = this.getStringForLanguage('en', key);
        }
        
        // Если строка все еще не найдена и английский не русский,
        // пытаемся получить строку на русском
        if (string === undefined && this.currentLanguage !== 'ru') {
            string = this.getStringForLanguage('ru', key);
        }
        
        // Если строка не найдена вообще, возвращаем ключ
        if (string === undefined) {
            return key;
        }
        
        // Подстановка параметров
        if (params && Object.keys(params).length > 0) {
            Object.keys(params).forEach(paramKey => {
                string = string.replace(new RegExp(`{${paramKey}}`, 'g'), params[paramKey]);
            });
        }
        
        return string;
    }
    
    /**
     * Получение строки для конкретного языка
     * @param {string} lang - Код языка
     * @param {string} key - Ключ строки
     * @returns {string|undefined} - Строка или undefined, если не найдена
     */
    getStringForLanguage(lang, key) {
        // Если нет словаря для данного языка, возвращаем undefined
        if (!this.dictionaries[lang]) {
            return undefined;
        }
        
        // Разбиваем ключ на части (для вложенных ключей)
        const parts = key.split('.');
        let current = this.dictionaries[lang];
        
        // Перебираем части ключа
        for (let i = 0; i < parts.length; i++) {
            if (current[parts[i]] === undefined) {
                return undefined;
            }
            current = current[parts[i]];
        }
        
        return current;
    }
    
    /**
     * Загрузка словаря для языка
     * @param {string} lang - Код языка
     * @param {object} dictionary - Словарь переводов
     */
    loadDictionary(lang, dictionary) {
        this.dictionaries[lang] = dictionary;
    }
    
    /**
     * Получение списка поддерживаемых языков
     * @returns {array} - Список кодов языков
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }
    
    /**
     * Получение списка приоритетных языков
     * @returns {array} - Список кодов языков
     */
    getPriorityLanguages() {
        return this.priorityLanguages;
    }
}