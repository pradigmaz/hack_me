/**
 * MatrixEnhancer - Класс для усиления эффекта "цифрового дождя" дополнительными HTML/CSS эффектами
 * Добавляет глитчи, сканлайны и другие эффекты для создания более аутентичного вида
 */
class MatrixEnhancer {
    /**
     * Конструктор
     * @param {object} config - Конфигурация эффектов
     */
    constructor(config = {}) {
        this.config = {
            container: config.container || document.querySelector('#game-container'),
            scanlineSpeed: config.scanlineSpeed || 4000,
            glitchInterval: config.glitchInterval || 6000,
            glitchDuration: config.glitchDuration || 500,
            additionalGlitches: config.additionalGlitches !== false,
            screenFlickers: config.screenFlickers !== false
        };
        
        // Находим элементы эффектов
        this.scanlineElement = document.querySelector('.matrix-scanline');
        this.rainOverlayElement = document.querySelector('.matrix-rain-overlay');
        this.flareElement = document.querySelector('.matrix-flare');
        
        // Проверяем, нашлись ли все элементы
        if (!this.scanlineElement || !this.rainOverlayElement || !this.flareElement) {
            console.warn('MatrixEnhancer: Не найдены некоторые элементы эффектов');
            this.createMissingElements();
        }
        
        // Инициализация интервалов
        this.glitchInterval = null;
        this.flickerInterval = null;
        
        // Запускаем эффекты
        this.initialize();
    }
    
    /**
     * Создает недостающие элементы эффектов
     */
    createMissingElements() {
        if (!this.scanlineElement) {
            this.scanlineElement = document.createElement('div');
            this.scanlineElement.className = 'matrix-scanline';
            this.config.container.appendChild(this.scanlineElement);
        }
        
        if (!this.rainOverlayElement) {
            this.rainOverlayElement = document.createElement('div');
            this.rainOverlayElement.className = 'matrix-rain-overlay';
            this.config.container.appendChild(this.rainOverlayElement);
        }
        
        if (!this.flareElement) {
            this.flareElement = document.createElement('div');
            this.flareElement.className = 'matrix-flare';
            this.config.container.appendChild(this.flareElement);
        }
    }
    
    /**
     * Инициализация всех эффектов
     */
    initialize() {
        // Запускаем случайные глитчи
        if (this.config.additionalGlitches) {
            this.startRandomGlitches();
        }
        
        // Запускаем эффект мерцания экрана
        if (this.config.screenFlickers) {
            this.startScreenFlickers();
        }
        
        // Устанавливаем начальную позицию блика
        this.moveFlare();
        
        // Добавляем обработчик для "вспышек" при нажатии клавиш
        this.addKeyPressEffects();
    }
    
    /**
     * Запускает случайные глитчи на экране
     */
    startRandomGlitches() {
        // Очищаем предыдущий интервал если есть
        if (this.glitchInterval) clearInterval(this.glitchInterval);
        
        // Создаем новый интервал
        this.glitchInterval = setInterval(() => {
            // Создаем глитч только с определенной вероятностью
            if (Math.random() < 0.7) {
                this.createGlobalGlitch();
            }
        }, this.config.glitchInterval + Math.random() * 5000); // Добавляем случайность в интервал
    }
    
    /**
     * Создает эффект глобального глитча
     */
    createGlobalGlitch() {
        // Создаем элемент глитча
        const glitchElement = document.createElement('div');
        glitchElement.className = 'global-glitch';
        this.config.container.appendChild(glitchElement);
        
        // Случайная продолжительность эффекта
        const duration = this.config.glitchDuration + Math.random() * 500;
        
        // Удаляем элемент через указанное время
        setTimeout(() => {
            if (glitchElement && glitchElement.parentNode) {
                glitchElement.parentNode.removeChild(glitchElement);
            }
        }, duration);
        
        // С некоторой вероятностью добавляем смещение экрана
        if (Math.random() < 0.3) {
            const container = this.config.container;
            const originalTransform = container.style.transform || '';
            
            // Смещаем весь контейнер
            const offsetX = (Math.random() * 10 - 5) + 'px';
            const offsetY = (Math.random() * 6 - 3) + 'px';
            container.style.transform = `translate(${offsetX}, ${offsetY})`;
            
            // Возвращаем в исходное положение
            setTimeout(() => {
                container.style.transform = originalTransform;
            }, 200);
        }
    }
    
    /**
     * Запускает эффект мерцания экрана
     */
    startScreenFlickers() {
        // Очищаем предыдущий интервал если есть
        if (this.flickerInterval) clearInterval(this.flickerInterval);
        
        // Создаем новый интервал для случайных мерцаний
        this.flickerInterval = setInterval(() => {
            // Мерцаем только с определенной вероятностью
            if (Math.random() < 0.1) {
                this.createScreenFlicker();
            }
        }, 10000); // Редкий интервал для мерцаний
    }
    
    /**
     * Создает эффект мерцания экрана
     */
    createScreenFlicker() {
        const container = this.config.container;
        const originalFilter = container.style.filter || '';
        const originalOpacity = container.style.opacity || '1';
        
        // Применяем эффект
        container.style.filter = 'brightness(1.5) contrast(1.2)';
        container.style.opacity = '0.9';
        
        // Возвращаем в исходное состояние
        setTimeout(() => {
            container.style.filter = originalFilter;
            container.style.opacity = originalOpacity;
        }, 100);
        
        // Иногда делаем второе мерцание
        if (Math.random() < 0.5) {
            setTimeout(() => {
                container.style.filter = 'brightness(1.3) contrast(1.1)';
                container.style.opacity = '0.95';
                
                setTimeout(() => {
                    container.style.filter = originalFilter;
                    container.style.opacity = originalOpacity;
                }, 80);
            }, 200);
        }
    }
    
    /**
     * Перемещает эффект блика на экране
     */
    moveFlare() {
        // Задаем случайную позицию
        const x = Math.random() * 80 + 10; // 10-90% ширины
        const y = Math.random() * 80 + 10; // 10-90% высоты
        
        // Применяем позицию
        this.flareElement.style.left = `${x}%`;
        this.flareElement.style.top = `${y}%`;
        
        // Случайный размер
        const size = 70 + Math.random() * 60;
        this.flareElement.style.width = `${size}px`;
        this.flareElement.style.height = `${size}px`;
        
        // Планируем следующее перемещение
        setTimeout(() => this.moveFlare(), 10000 + Math.random() * 5000);
    }
    
    /**
     * Добавляет эффекты при нажатии клавиш
     */
    addKeyPressEffects() {
        document.addEventListener('keydown', (e) => {
            // Создаем эффект вспышки только при вводе текста (не для служебных клавиш)
            if (e.key.length === 1 || e.key === 'Enter') {
                // С небольшой вероятностью создаем мини-глитч
                if (Math.random() < 0.05) {
                    this.createMiniGlitch();
                }
                
                // Небольшой эффект свечения при нажатии клавиш
                const originalFilter = this.config.container.style.filter || '';
                this.config.container.style.filter = 'brightness(1.05)';
                
                setTimeout(() => {
                    this.config.container.style.filter = originalFilter;
                }, 50);
            }
        });
    }
    
    /**
     * Создает мини-глитч в случайном месте экрана
     */
    createMiniGlitch() {
        // Создаем элемент мини-глитча
        const glitchElement = document.createElement('div');
        glitchElement.className = 'matrix-symbol glitch';
        
        // Задаем случайный текст
        glitchElement.textContent = String.fromCharCode(Math.floor(Math.random() * 26) + 97);
        
        // Случайная позиция
        glitchElement.style.left = `${Math.random() * 90 + 5}%`;
        glitchElement.style.top = `${Math.random() * 90 + 5}%`;
        
        // Добавляем в DOM
        this.config.container.appendChild(glitchElement);
        
        // Удаляем через некоторое время
        setTimeout(() => {
            if (glitchElement && glitchElement.parentNode) {
                glitchElement.parentNode.removeChild(glitchElement);
            }
        }, 300 + Math.random() * 200);
    }
    
    /**
     * Уничтожает объект и очищает все интервалы
     */
    destroy() {
        if (this.glitchInterval) {
            clearInterval(this.glitchInterval);
            this.glitchInterval = null;
        }
        
        if (this.flickerInterval) {
            clearInterval(this.flickerInterval);
            this.flickerInterval = null;
        }
    }
} 