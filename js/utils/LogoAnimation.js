/**
 * AdvancedLogoAnimation - класс для создания продвинутой 3D-подобной анимации логотипа 
 * с эффектами цифрового проявления, матричного дождя и глитча
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
            text: config.text || 'h4ck/me',
            fontSize: config.fontSize || 36,
            fontFamily: config.fontFamily || 'monospace',
            color: config.color || '#00FF41',
            glowColor: config.glowColor || 0x00FF41,
            duration: config.duration || 3000,
            charAnimSpeed: config.charAnimSpeed || 80,
            symbolSpeed: config.symbolSpeed || 50,
            onComplete: config.onComplete || null,
            depth: config.depth || 10,
            layers: config.layers || 8, // Количество слоев для 3D-эффекта
            layerOffset: config.layerOffset || 1.5, // Базовое смещение между слоями
            rotationAmplitude: config.rotationAmplitude || 0.05, // Амплитуда вращения логотипа
            particlesCount: config.particlesCount || 50 // Количество матричных частиц
        };
        
        // Создаем основной контейнер для логотипа
        this.container = scene.add.container(this.config.x, this.config.y);
        this.container.setDepth(this.config.depth);
        
        // Контейнер для фоновых эффектов
        this.backgroundContainer = scene.add.container(0, 0);
        this.container.add(this.backgroundContainer);
        
        // Контейнер для слоев логотипа
        this.layersContainer = scene.add.container(0, 0);
        this.container.add(this.layersContainer);
        
        // Контейнер для частиц и эффектов
        this.effectsContainer = scene.add.container(0, 0);
        this.container.add(this.effectsContainer);
        
        // Состояние анимации
        this.animationCompleted = false;
        this.currentChar = 0;
        
        // Массивы для отслеживания объектов
        this.textLayers = []; // Слои для 3D-эффекта
        this.textChars = []; // Отдельные символы логотипа
        this.particles = []; // Матричные частицы
        
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
        // Создаем фоновый эффект
        this.createBackground();
        
        // Создаем 3D-слои логотипа
        this.create3DLayers();
        
        // Создаем матричные частицы
        this.createMatrixParticles();
        
        // Начально скрываем слои (для последующей анимации появления)
        this.textLayers.forEach(layer => {
            layer.setAlpha(0);
        });
        
        // Добавляем обновление для анимации вращения
        this.scene.events.on('update', this.update, this);
    }
    
    /**
     * Создание фонового эффекта
     */
    createBackground() {
        // Создаем затемненный прямоугольник для фона
        const bg = this.scene.add.rectangle(
            0, 0, 
            this.scene.cameras.main.width, 
            this.scene.cameras.main.height / 2,
            0x000000, 0.5
        );
        bg.setOrigin(0.5);
        bg.setAlpha(0);
        
        this.backgroundContainer.add(bg);
        this.background = bg;
        
        // Добавляем пульсирующее свечение
        const glow = this.scene.add.rectangle(
            0, 0,
            this.config.text.length * this.config.fontSize * 0.6 + 50,
            this.config.fontSize * 2 + 20,
            this.config.glowColor, 0.2
        );
        glow.setOrigin(0.5);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        glow.setAlpha(0);
        
        this.backgroundContainer.add(glow);
        this.glow = glow;
        
        // Анимация пульсации свечения
        this.scene.tweens.add({
            targets: glow,
            scaleX: 1.05,
            scaleY: 1.1,
            alpha: 0.15,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    /**
     * Создание 3D-слоев логотипа
     */
    create3DLayers() {
        // Очищаем массив слоев
        this.textLayers = [];
        
        // Создаем слои текста для эффекта глубины
        for (let i = this.config.layers - 1; i >= 0; i--) {
            // Смещение и прозрачность зависят от индекса слоя
            const offsetMultiplier = (this.config.layers - i) / this.config.layers;
            const alpha = i === 0 ? 1 : 0.1 + (i / this.config.layers) * 0.9;
            const scale = 1 - (0.01 * i);
            
            // Расчет цвета слоя - от темного к яркому
            const colorValue = Math.floor(20 + (235 * (i / this.config.layers)));
            const layerColor = i === 0 
                ? this.config.color 
                : `rgb(0, ${colorValue}, ${Math.floor(colorValue * 0.6)})`;
            
            // Создаем текстовый объект для слоя
            const layer = this.scene.add.text(
                -i * this.config.layerOffset,
                -i * this.config.layerOffset,
                this.config.text,
                {
                    fontFamily: this.config.fontFamily,
                    fontSize: this.config.fontSize,
                    color: layerColor,
                    stroke: i === 0 ? '#003300' : undefined,
                    strokeThickness: i === 0 ? 1 : 0
                }
            );
            
            layer.setOrigin(0.5);
            layer.setScale(scale);
            layer.setAlpha(alpha);
            
            if (i === 0) {
                // Верхний слой с дополнительными эффектами
                layer.setShadow(0, 0, '#00FF41', 5);
                layer.depth = this.config.depth + 10;
            }
            
            this.layersContainer.add(layer);
            this.textLayers.push(layer);
        }
        
        // Сохраняем ссылку на верхний (главный) слой
        this.mainTextLayer = this.textLayers[0];
    }
    
    /**
     * Создание матричных частиц
     */
    createMatrixParticles() {
        const textWidth = this.mainTextLayer.width;
        const textHeight = this.mainTextLayer.height;
        
        for (let i = 0; i < this.config.particlesCount; i++) {
            // Создаем случайный символ
            const particle = this.scene.add.text(
                Phaser.Math.Between(-textWidth/2, textWidth/2),
                Phaser.Math.Between(-textHeight*2, textHeight/2),
                this.textGenerator.getRandomChar(),
                {
                    fontFamily: this.config.fontFamily,
                    fontSize: Phaser.Math.Between(10, 18),
                    color: '#00FF41'
                }
            );
            
            // Устанавливаем параметры частицы
            particle.setOrigin(0.5);
            particle.setAlpha(0);
            particle.speed = Phaser.Math.Between(1, 4);
            particle.setBlendMode(Phaser.BlendModes.ADD);
            
            // Добавляем частицу в контейнер и массив
            this.effectsContainer.add(particle);
            this.particles.push(particle);
        }
    }
    
    /**
     * Запуск анимации
     */
    start() {
        // Показываем фон с анимацией
        this.scene.tweens.add({
            targets: [this.background, this.glow],
            alpha: { from: 0, to: 1 },
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                // Начинаем анимацию появления символов
                this.startSymbolsAnimation();
            }
        });
        
        // Запускаем движение частиц
        this.particles.forEach(particle => {
            // Устанавливаем случайную задержку для появления
            this.scene.time.delayedCall(Phaser.Math.Between(0, 2000), () => {
                particle.setAlpha(Phaser.Math.FloatBetween(0.3, 0.7));
            });
        });
    }
    
    /**
     * Запуск анимации появления символов
     */
    startSymbolsAnimation() {
        // Разбиваем текст на отдельные символы для анимации
        const charWidth = this.config.fontSize * 0.6;
        const totalTextWidth = this.config.text.length * charWidth;
        const startX = -totalTextWidth / 2 + charWidth / 2;
        
        this.textChars = [];
        
        // Скрываем слои с целым текстом
        this.textLayers.forEach(layer => {
            layer.setAlpha(0);
        });
        
        // Создаем каждый символ отдельно
        for (let i = 0; i < this.config.text.length; i++) {
            const charContainers = [];
            
            // Создаем символы для каждого слоя
            for (let l = this.config.layers - 1; l >= 0; l--) {
                const offsetMultiplier = (this.config.layers - l) / this.config.layers;
                const alpha = l === 0 ? 1 : 0.1 + (l / this.config.layers) * 0.9;
                const scale = 1 - (0.01 * l);
                
                const colorValue = Math.floor(20 + (235 * (l / this.config.layers)));
                const layerColor = l === 0 
                    ? this.config.color 
                    : `rgb(0, ${colorValue}, ${Math.floor(colorValue * 0.6)})`;
                
                // Создаем контейнер для слоя символа
                const charContainer = this.scene.add.container(
                    startX + i * charWidth - l * this.config.layerOffset,
                    -l * this.config.layerOffset
                );
                
                // Создаем текст символа
                const charText = this.scene.add.text(
                    0, 0,
                    this.textGenerator.getRandomChar(), // Начинаем с случайного символа
                    {
                        fontFamily: this.config.fontFamily,
                        fontSize: this.config.fontSize,
                        color: layerColor,
                        stroke: l === 0 ? '#003300' : undefined,
                        strokeThickness: l === 0 ? 1 : 0
                    }
                );
                
                charText.setOrigin(0.5);
                charText.setScale(scale);
                charText.finalChar = this.config.text[i];
                charText.currentChar = this.textGenerator.getRandomChar();
                charText.charChangeCounter = 0;
                charText.charChanges = 5 + Math.floor(Math.random() * 5);
                charText.complete = false;
                
                if (l === 0) {
                    // Верхний слой с дополнительными эффектами
                    charText.setShadow(0, 0, '#00FF41', 5);
                }
                
                // Скрываем символ изначально
                charContainer.setAlpha(0);
                charContainer.add(charText);
                
                charContainers.push({ container: charContainer, text: charText, layer: l });
                this.layersContainer.add(charContainer);
            }
            
            this.textChars.push({
                index: i,
                layers: charContainers,
                complete: false
            });
        }
        
        // Запускаем последовательную анимацию появления
        this.animateNextChar(0);
    }
    
    /**
     * Анимация появления следующего символа
     * @param {number} index - Индекс символа для анимации
     */
    animateNextChar(index) {
        if (index >= this.textChars.length) {
            // Все символы анимированы
            this.finishSymbolsAnimation();
            return;
        }
        
        const char = this.textChars[index];
        
        // Анимируем все слои символа
        char.layers.forEach(layer => {
            // Анимация появления с задержкой в зависимости от слоя
            this.scene.tweens.add({
                targets: layer.container,
                alpha: 1,
                y: layer.container.y + Phaser.Math.Between(-5, 5),
                duration: 200,
                ease: 'Power2',
                delay: layer.layer * 30,
                onComplete: () => {
                    if (layer.layer === 0) {
                        // Для верхнего слоя запускаем анимацию смены символов
                        this.animateCharChange(layer.text, this.config.text[index]);
                    }
                }
            });
        });
        
        // Добавляем эффект глитча для случайных символов
        if (Math.random() < 0.3) {
            this.scene.time.delayedCall(200, () => {
                if (this.scene.game.globals && this.scene.game.globals.glitch) {
                    const mainLayer = char.layers.find(l => l.layer === 0);
                    if (mainLayer) {
                        this.scene.game.globals.glitch.applyToPhaserObject(
                            this.scene,
                            mainLayer.container,
                            { intensity: 0.3, duration: 200 }
                        );
                    }
                }
            });
        }
        
        // Переходим к следующему символу с задержкой
        this.scene.time.delayedCall(this.config.charAnimSpeed, () => {
            this.animateNextChar(index + 1);
        });
    }
    
    /**
     * Анимация смены символов до финального
     * @param {Phaser.GameObjects.Text} textObj - Текстовый объект
     * @param {string} finalChar - Финальный символ
     */
    animateCharChange(textObj, finalChar) {
        // Проверка на валидность объекта
        if (!textObj || !textObj.scene) {
            return;
        }
        
        // Таймер для смены символов
        const symbolTimer = this.scene.time.addEvent({
            delay: this.config.symbolSpeed,
            callback: () => {
                // Проверка на валидность объекта при каждом вызове
                if (!textObj || !textObj.scene) {
                    symbolTimer.remove();
                    return;
                }
                
                // Увеличиваем счетчик смен
                textObj.charChangeCounter++;
                
                // Проверяем, достигли ли нужного количества смен
                if (textObj.charChangeCounter < textObj.charChanges) {
                    // Меняем на случайный символ
                    textObj.currentChar = this.textGenerator.getRandomChar();
                    textObj.setText(textObj.currentChar);
                } else {
                    // Устанавливаем финальный символ
                    textObj.setText(finalChar);
                    textObj.complete = true;
                    
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
                    
                    // Проверяем, завершены ли все символы
                    this.checkAnimationComplete();
                }
            },
            callbackScope: this,
            repeat: textObj.charChanges
        });
    }
    
    /**
     * Проверка завершения анимации всех символов
     */
    checkAnimationComplete() {
        // Проверяем, все ли символы верхнего слоя завершили анимацию
        const allComplete = this.textChars.every(char => {
            const mainLayer = char.layers.find(l => l.layer === 0);
            return mainLayer && mainLayer.text.complete;
        });
        
        if (allComplete && !this.animationCompleted) {
            this.animationCompleted = true;
            
            // Финальная анимация сборки логотипа
            this.scene.time.delayedCall(300, () => {
                this.finishSymbolsAnimation();
            });
        }
    }
    
    /**
     * Завершение анимации символов и переход к финальному виду
     */
    finishSymbolsAnimation() {
        // Скрываем отдельные анимированные символы
        this.textChars.forEach(char => {
            char.layers.forEach(layer => {
                this.scene.tweens.add({
                    targets: layer.container,
                    alpha: 0,
                    duration: 300,
                    ease: 'Power2'
                });
            });
        });
        
        // Показываем целые текстовые слои
        this.textLayers.forEach((layer, index) => {
            this.scene.tweens.add({
                targets: layer,
                alpha: index === 0 ? 1 : 0.1 + (index / this.config.layers) * 0.9,
                y: 0,
                duration: 500,
                ease: 'Power2',
                delay: index * 50
            });
        });
        
        // Финальная анимация логотипа
        this.scene.tweens.add({
            targets: this.layersContainer,
            scale: 1.05,
            duration: 300,
            ease: 'Power2',
            yoyo: true,
            repeat: 0,
            onComplete: () => {
                // Добавляем пульсацию для логотипа
                this.scene.tweens.add({
                    targets: this.layersContainer,
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
    
    /**
     * Обновление анимации (вызывается каждый кадр)
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        // Обновляем матричные частицы
        this.updateParticles(delta);
        
        // Анимация дыхания для 3D-слоев (когда анимация завершена)
        if (this.animationCompleted) {
            // Плавное вращение и покачивание логотипа
            const rotationX = Math.sin(time / 2000) * this.config.rotationAmplitude;
            const rotationY = Math.cos(time / 2500) * this.config.rotationAmplitude;
            
            // Применяем разное смещение для каждого слоя для усиления 3D-эффекта
            this.textLayers.forEach((layer, index) => {
                if (index > 0) {
                    const offsetMultiplier = (this.config.layers - index) / this.config.layers;
                    layer.x = -index * this.config.layerOffset + rotationY * (index * 2);
                    layer.y = -index * this.config.layerOffset + rotationX * (index * 2);
                }
            });
        }
    }
    
    /**
     * Обновление матричных частиц
     * @param {number} delta - Время с последнего обновления
     */
    updateParticles(delta) {
        const textHeight = this.mainTextLayer ? this.mainTextLayer.height * 2 : 100;
        
        this.particles.forEach(particle => {
            // Движение частицы вниз
            particle.y += particle.speed * (delta / 16);
            
            // Если частица вышла за пределы, перемещаем её наверх
            if (particle.y > textHeight / 2) {
                particle.y = -textHeight / 2;
                particle.x = Phaser.Math.Between(-this.mainTextLayer.width/2, this.mainTextLayer.width/2);
                
                // Меняем символ
                if (Math.random() < 0.5) {
                    particle.setText(this.textGenerator.getRandomChar());
                }
            }
            
            // С небольшой вероятностью меняем символ
            if (Math.random() < 0.01) {
                particle.setText(this.textGenerator.getRandomChar());
            }
        });
    }
    
    /**
     * Уничтожение объекта
     */
    destroy() {
        // Удаляем обработчик обновления
        this.scene.events.off('update', this.update, this);
        
        // Останавливаем все твины
        this.scene.tweens.killTweensOf(this.layersContainer);
        this.scene.tweens.killTweensOf(this.backgroundContainer);
        this.scene.tweens.killTweensOf(this.textLayers);
        
        // Очищаем контейнеры
        this.container.destroy();
    }
}