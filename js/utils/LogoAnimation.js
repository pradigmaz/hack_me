/**
 * LogoAnimation - класс для анимации логотипа в стиле матрицы
 * Создает эффект цифрового проявления текста
 */
class LogoAnimation {
    /**
     * Конструктор класса LogoAnimation
     * @param {Phaser.Scene} scene - Сцена Phaser
     * @param {object} config - Конфигурация анимации
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        
        // Настройки по умолчанию
        this.config = {
            x: config.x || scene.cameras.main.width / 2,
            y: config.y || scene.cameras.main.height / 2,
            text: config.text || 'ЦИФРОВОЕ ПРОНИКНОВЕНИЕ',
            fontSize: config.fontSize || 36,
            fontFamily: config.fontFamily || 'monospace',
            color: config.color || '#00FF41',
            glowColor: config.glowColor || 0x00FF41,
            duration: config.duration || 3000,
            charAnimSpeed: config.charAnimSpeed || 80,
            symbolSpeed: config.symbolSpeed || 50,
            onComplete: config.onComplete || null
        };
        
        // Создаем контейнер для элементов логотипа
        this.container = scene.add.container(this.config.x, this.config.y);
        
        // Кэшируем символы для анимации
        this.textSymbols = [];
        this.finalText = this.config.text;
        this.textObjects = [];
        
        // Состояние анимации
        this.animationCompleted = false;
        this.currentChar = 0;
        
        // Получаем генератор символов
        this.textGenerator = this.scene.game.globals?.textGenerator || {
            getRandomChar: () => {
                const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワ∑∆φ';
                return chars.charAt(Math.floor(Math.random() * chars.length));
            }
        };
        
        // Инициализируем анимацию
        this.init();
    }
    
    /**
     * Инициализация анимации
     */
    init() {
        // Создаем текстовые объекты для каждого символа
        for (let i = 0; i < this.finalText.length; i++) {
            // Начинаем с случайного символа для каждой позиции
            const textObj = this.scene.add.text(
                (i - this.finalText.length / 2) * this.config.fontSize * 0.6,
                0,
                this.textGenerator.getRandomChar(),
                {
                    fontFamily: this.config.fontFamily,
                    fontSize: this.config.fontSize,
                    color: this.config.color
                }
            );
            textObj.setOrigin(0.5);
            textObj.setAlpha(0); // Начинаем с прозрачности
            
            // Добавляем свечение для текста
            textObj.setShadow(0, 0, this.config.color, 5);
            
            // Добавляем в контейнер
            this.container.add(textObj);
            this.textObjects.push(textObj);
            
            // Сохраняем оригинальный символ
            this.textSymbols.push({
                finalChar: this.finalText[i],
                currentChar: this.textGenerator.getRandomChar(),
                obj: textObj,
                complete: false,
                charChangeCounter: 0,
                charChanges: 5 + Math.floor(Math.random() * 5) // Случайное количество смен символа
            });
        }
    }
    
    /**
     * Запуск анимации
     */
    start() {
        // Таймер для запуска анимации каждого символа с задержкой
        this.charTimer = this.scene.time.addEvent({
            delay: this.config.charAnimSpeed,
            callback: this.startNextChar,
            callbackScope: this,
            repeat: this.finalText.length - 1
        });
    }
    
    /**
     * Запуск анимации следующего символа
     */
    startNextChar() {
        if (this.currentChar < this.textObjects.length) {
            // Получаем объект текущего символа
            const symbol = this.textSymbols[this.currentChar];
            const textObj = symbol.obj;
            
            // Сохраняем текущий индекс символа для использования в колбэке
            const currentIndex = this.currentChar;
            
            // Анимация появления символа
            this.scene.tweens.add({
                targets: textObj,
                alpha: 1,
                scale: 1.2,
                duration: 200,
                ease: 'Power2',
                yoyo: true,
                repeat: 0,
                onComplete: () => {
                    textObj.setScale(1);
                    
                    // Запускаем анимацию смены символов с сохраненным индексом
                    this.startSymbolAnimation(currentIndex);
                }
            });
            
            // Добавляем эффект глитча с определенной вероятностью
            if (Math.random() < 0.3) {
                this.scene.time.delayedCall(100, () => {
                    if (this.scene.game.globals && this.scene.game.globals.glitch) {
                        this.scene.game.globals.glitch.applyToPhaserObject(
                            this.scene,
                            textObj,
                            { intensity: 0.3, duration: 200 }
                        );
                    }
                });
            }
            
            this.currentChar++;
        }
    }
    
    /**
     * Анимация смены символов до финального
     * @param {number} index - Индекс символа
     */
    startSymbolAnimation(index) {
        // Проверяем валидность индекса и наличие символа
        if (index < 0 || index >= this.textSymbols.length || !this.textSymbols[index]) {
            console.warn(`LogoAnimation: Invalid symbol index: ${index}`);
            return;
        }
        
        const symbol = this.textSymbols[index];
        
        // Дополнительная проверка на существование свойства obj
        if (!symbol.obj) {
            console.warn(`LogoAnimation: Missing obj property for symbol at index ${index}`);
            return;
        }
        
        const textObj = symbol.obj;
        
        // Создаем таймер для смены символов
        const symbolTimer = this.scene.time.addEvent({
            delay: this.config.symbolSpeed,
            callback: () => {
                // Дополнительная проверка на существование символа при каждом вызове таймера
                if (!this.textSymbols[index] || !this.textSymbols[index].obj) {
                    console.warn(`LogoAnimation: Symbol no longer exists at index ${index}`);
                    symbolTimer.remove();
                    return;
                }
                
                // Увеличиваем счетчик смен
                symbol.charChangeCounter++;
                
                // Если не достигли нужного количества смен, меняем на случайный символ
                if (symbol.charChangeCounter < symbol.charChanges) {
                    symbol.currentChar = this.textGenerator.getRandomChar();
                    textObj.setText(symbol.currentChar);
                } else {
                    // Устанавливаем финальный символ
                    textObj.setText(symbol.finalChar);
                    symbol.complete = true;
                    
                    // Анимация для финального символа
                    this.scene.tweens.add({
                        targets: textObj,
                        scale: 1.1,
                        duration: 100,
                        ease: 'Power2',
                        yoyo: true
                    });
                    
                    // Останавливаем таймер
                    symbolTimer.remove();
                    
                    // Проверяем, завершена ли вся анимация
                    this.checkAnimationComplete();
                }
            },
            callbackScope: this,
            repeat: symbol.charChanges
        });
    }
    
    /**
     * Проверка завершения анимации
     */
    checkAnimationComplete() {
        // Проверяем, все ли символы завершили анимацию
        const allComplete = this.textSymbols.every(symbol => symbol.complete);
        
        if (allComplete && !this.animationCompleted) {
            this.animationCompleted = true;
            
            // Финальная анимация для всего логотипа
            this.scene.tweens.add({
                targets: this.container,
                scale: 1.05,
                duration: 300,
                ease: 'Power2',
                yoyo: true,
                repeat: 0,
                onComplete: () => {
                    // Добавляем пульсацию для логотипа
                    this.scene.tweens.add({
                        targets: this.container,
                        alpha: 0.9,
                        scale: 0.98,
                        duration: 1500,
                        ease: 'Sine.easeInOut',
                        yoyo: true,
                        repeat: -1
                    });
                    
                    // Вызываем callback завершения
                    if (this.config.onComplete) {
                        this.config.onComplete();
                    }
                }
            });
        }
    }
    
    /**
     * Уничтожение объекта
     */
    destroy() {
        if (this.charTimer) {
            this.charTimer.remove();
        }
        
        this.container.destroy();
    }
}