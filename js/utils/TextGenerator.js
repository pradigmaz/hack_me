/**
 * TextGenerator - класс для генерации случайных символов
 * Используется для создания матричного эффекта и других элементов
 */
class TextGenerator {
    constructor() {
        // Наборы символов
        this.sets = {
            // Классические символы из "Матрицы" (латиница, цифры, японские символы)
            matrix: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
                    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワ∑∆φ',
            // Только цифры
            digits: '0123456789',
            // Латинские буквы
            latin: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            // Японские символы (катакана)
            katakana: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワ',
            // Символы хакера
            hacker: '!@#$%^&*()_+-=[]{}|;:,.<>/?~`\\'
        };
    }
    
    /**
     * Получить случайный символ из указанного набора
     * @param {string} set - Имя набора символов (по умолчанию 'matrix')
     * @returns {string} - Случайный символ из выбранного набора
     */
    getRandomChar(set = 'matrix') {
        const charSet = this.sets[set] || this.sets.matrix;
        return charSet.charAt(Math.floor(Math.random() * charSet.length));
    }
    
    /**
     * Сгенерировать случайную строку символов
     * @param {number} length - Длина строки
     * @param {string} set - Имя набора символов
     * @returns {string} - Случайная строка
     */
    getRandomString(length, set = 'matrix') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += this.getRandomChar(set);
        }
        return result;
    }
    
    /**
     * Генерировать строку с эффектом "ввода терминала"
     * @param {string} text - Исходный текст
     * @param {function} callback - Функция обратного вызова, вызывается для каждого символа
     * @param {number} speed - Скорость появления символов (мс)
     */
    typeText(text, callback, speed = 50) {
        let index = 0;
        
        const typeChar = () => {
            if (index < text.length) {
                callback(text.substr(0, index + 1));
                index++;
                setTimeout(typeChar, speed);
            }
        };
        
        typeChar();
    }
    
    /**
     * Генерировать "технический" текст для хакерских интерфейсов
     * @param {number} lines - Количество строк
     * @param {number} minLength - Минимальная длина строки
     * @param {number} maxLength - Максимальная длина строки
     * @returns {string[]} - Массив строк с "техническим" текстом
     */
    generateTechText(lines, minLength = 30, maxLength = 80) {
        const result = [];
        const prefixes = ['>', '[SYS]', '[DEBUG]', '[INFO]', '[TRACE]', '[0x', '[ERROR]', 'EXEC:', 'DATA:'];
        
        for (let i = 0; i < lines; i++) {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const length = Math.floor(Math.random() * (maxLength - minLength)) + minLength;
            
            // С некоторой вероятностью генерируем реалистичные сообщения вместо случайных символов
            if (Math.random() < 0.3) {
                const techPhrases = [
                    "Инициализация протокола передачи данных...",
                    "Подключение к удаленному серверу...",
                    "Сканирование портов завершено.",
                    "Обнаружена уязвимость в системе защиты.",
                    "Загрузка модуля обхода брандмауэра...",
                    "Выполняется анализ пакетов данных.",
                    "Поиск точек доступа...",
                    "Расшифровка кода...",
                    "Внедрение эксплойта...",
                    "Перехват сетевого трафика..."
                ];
                result.push(`${prefix} ${techPhrases[Math.floor(Math.random() * techPhrases.length)]}`);
            } else {
                result.push(`${prefix} ${this.getRandomString(length, Math.random() < 0.7 ? 'matrix' : 'hacker')}`);
            }
        }
        
        return result;
    }
}
