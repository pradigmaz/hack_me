/**
 * AdvancedLogoAnimation - класс для создания продвинутой 3D-подобной анимации логотипа 
 * с эффектами цифрового проявления и глитча
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
            fontSize: config.fontSize || 48, // Увеличили размер с 36 до 48
            fontFamily: config.fontFamily || 'monospace',
            color: config.color || '#00FF41',
            glowColor: config.glowColor || 0x00FF41,
            duration: config.duration || 3000,
            charAnimSpeed: config.charAnimSpeed || 80,
            symbolSpeed: config.symbolSpeed || 50,
            onComplete: config.onComplete || null,
            depth: config.depth || 10,
            layers: config.layers || 10, // Увеличили количество слоев с 8 до 10
            layerOffset: config.layerOffset || 2, // Увеличили смещение с 1.5 до 2
            rotationAmplitude: config.rotationAmplitude || 0.05,
            // Настройки для глитч-эффекта
            glitchInterval: config.glitchInterval || { min: 2000, max: 5000 },
            glitchDuration: config.glitchDuration || { min: 100, max: 400 },
            glitchIntensity: config.glitchIntensity || { min: 0.3, max: 0.8 },
            // Отключаем матричные частицы
            particlesCount: 0
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
        
        // Контейнер для эффектов
        this.effectsContainer = scene.add.container(0, 0);
        this.container.add(this.effectsContainer);
        
        // Состояние анимации
        this.animationCompleted = false;
        this.currentChar = 0;
        this.isGlitching = false;
        
        // Массивы для отслеживания объектов
        this.textLayers = []; // Слои для 3D-эффекта
        this.textChars = []; // Отдельные символы логотипа
        
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
        
        // Добавляем пульсирующее свечение с усиленной яркостью
        const glow = this.scene.add.rectangle(
            0, 0,
            this.config.text.length * this.config.fontSize * 0.7 + 70, // Увеличиваем размер свечения
            this.config.fontSize * 2.5 + 30, // Увеличиваем высоту свечения
            this.config.glowColor, 0.25 // Усиливаем яркость с 0.2 до 0.25
        );
        glow.setOrigin(0.5);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        glow.setAlpha(0);
        
        this.backgroundContainer.add(glow);
        this.glow = glow;
        
        // Анимация пульсации свечения с увеличенной амплитудой
        this.scene.tweens.add({
            targets: glow,
            scaleX: 1.08, // Усилено с 1.05
            scaleY: 1.15, // Усилено с 1.1
            alpha: 0.2,  // Усилено с 0.15
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
            
            // Расчет цвета слоя - от темного к яркому с большей контрастностью
            const colorValue = Math.floor(20 + (235 * Math.pow(i / this.config.layers, 1.2)));
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
                    strokeThickness: i === 0 ? 2 : 0 // Усилили обводку с 1 до 2
                }
            );
            
            layer.setOrigin(0.5);
            layer.setScale(scale);
            layer.setAlpha(alpha);
            
            if (i === 0) {
                // Верхний слой с усиленными эффектами
                layer.setShadow(0, 0, '#00FF41', 8); // Усилили свечение с 5 до 8
                layer.depth = this.config.depth + 10;
            }
            
            this.layersContainer.add(layer);
            this.textLayers.push(layer);
        }
        
        // Сохраняем ссылку на верхний (главный) слой
        this.mainTextLayer = this.textLayers[0];
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
                
                const colorValue = Math.floor(20 + (235 * Math.pow(l / this.config.layers, 1.2)));
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
                        strokeThickness: l === 0 ? 2 : 0 // Усилили обводку
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
                    charText.setShadow(0, 0, '#00FF41', 8); // Усилили свечение
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
        
        // Добавляем эффект глитча для случайных символов с большей вероятностью
        if (Math.random() < 0.5) { // Увеличили вероятность с 0.3 до 0.5
            this.scene.time.delayedCall(200, () => {
                if (this.scene.game.globals && this.scene.game.globals.glitch) {
                    const mainLayer = char.layers.find(l => l.layer === 0);
                    if (mainLayer) {
                        this.scene.game.globals.glitch.applyToPhaserObject(
                            this.scene,
                            mainLayer.container,
                            { intensity: 0.5, duration: 200 } // Усилили глитч с 0.3 до 0.5
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
                        scale: 1.2, // Увеличили эффект с 1.1 до 1.2
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
                
                // Запускаем периодические глитч-эффекты
                this.setupGlitchEffects();
                
                // Вызываем callback завершения
                if (this.config.onComplete) {
                    this.config.onComplete();
                }
            }
        });
    }
    
    /**
     * Настройка периодических глитч-эффектов
     */
    setupGlitchEffects() {
        const scheduleNextGlitch = () => {
            // Случайный интервал между глитчами
            const nextGlitchDelay = Phaser.Math.Between(
                this.config.glitchInterval.min, 
                this.config.glitchInterval.max
            );
            
            this.scene.time.delayedCall(nextGlitchDelay, () => {
                // Применяем глитч
                this.applyRandomGlitch();
                
                // Планируем следующий глитч
                scheduleNextGlitch();
            });
        };
        
        // Запускаем цикл глитч-эффектов
        scheduleNextGlitch();
    }
    
    /**
     * Применение случайного глитч-эффекта
     */
    applyRandomGlitch() {
        if (this.isGlitching) return;
        this.isGlitching = true;
        
        // Выбираем случайный тип глитча
        const glitchType = Phaser.Math.Between(1, 4);
        const intensity = Phaser.Math.FloatBetween(
            this.config.glitchIntensity.min, 
            this.config.glitchIntensity.max
        );
        const duration = Phaser.Math.Between(
            this.config.glitchDuration.min, 
            this.config.glitchDuration.max
        );
        
        switch (glitchType) {
            case 1:
                // Тип 1: Смещение слоев
                this.applyLayerShiftGlitch(intensity, duration);
                break;
            case 2:
                // Тип 2: Изменение цвета
                this.applyColorGlitch(intensity, duration);
                break;
            case 3:
                // Тип 3: Дрожание
                this.applyShakeGlitch(intensity, duration);
                break;
            case 4:
                // Тип 4: Искажение формы
                this.applyDistortionGlitch(intensity, duration);
                break;
        }
        
        // Если доступен встроенный глитч-эффект из globals - используем и его
        if (this.scene.game.globals && this.scene.game.globals.glitch) {
            this.scene.game.globals.glitch.applyToPhaserObject(
                this.scene,
                this.layersContainer,
                { intensity: intensity * 0.8, duration: duration * 0.7 }
            );
        }
        
        // Восстановление после глитча
        this.scene.time.delayedCall(duration, () => {
            this.resetGlitch();
            this.isGlitching = false;
        });
    }
    
    /**
     * Глитч типа 1: Смещение слоев
     */
    applyLayerShiftGlitch(intensity, duration) {
        // Смещаем слои в разные стороны
        this.textLayers.forEach((layer, index) => {
            if (index > 0) { // Оставляем верхний слой неподвижным
                const xShift = Phaser.Math.Between(-15, 15) * intensity * (index / this.config.layers);
                const yShift = Phaser.Math.Between(-10, 10) * intensity * (index / this.config.layers);
                
                layer.oldX = layer.x;
                layer.oldY = layer.y;
                
                this.scene.tweens.add({
                    targets: layer,
                    x: layer.x + xShift,
                    y: layer.y + yShift,
                    duration: duration * 0.2,
                    ease: 'Stepped',
                    onComplete: () => {
                        // Добавляем случайные промежуточные смещения
                        if (Math.random() < 0.7) {
                            this.scene.tweens.add({
                                targets: layer,
                                x: layer.x + Phaser.Math.Between(-5, 5) * intensity,
                                y: layer.y + Phaser.Math.Between(-5, 5) * intensity,
                                duration: duration * 0.1,
                                ease: 'Stepped'
                            });
                        }
                    }
                });
            }
        });
        
        // Вероятность сдвига всего логотипа
        if (Math.random() < 0.4) {
            this.scene.tweens.add({
                targets: this.layersContainer,
                x: Phaser.Math.Between(-10, 10) * intensity,
                y: Phaser.Math.Between(-5, 5) * intensity,
                duration: duration * 0.3,
                ease: 'Stepped',
                yoyo: true,
                repeat: 1
            });
        }
    }
    
    /**
     * Глитч типа 2: Изменение цвета
     */
    applyColorGlitch(intensity, duration) {
        // Измененный цвет (смещаем к синему или красному)
        const colorShift = Math.random() < 0.5 ? 
            { r: 0, g: 255, b: 255 } : // Голубой
            { r: 255, g: 50, b: 50 };  // Красный
        
        this.textLayers.forEach((layer, index) => {
            layer.oldTint = layer.tint;
            layer.oldAlpha = layer.alpha;
            
            // Увеличиваем прозрачность для некоторых слоев
            if (Math.random() < 0.5) {
                this.scene.tweens.add({
                    targets: layer,
                    alpha: layer.alpha * 1.5, // Увеличиваем яркость
                    duration: duration * 0.2,
                    ease: 'Stepped'
                });
            }
            
            // Меняем оттенок для верхних слоев
            if (index < 3) {
                layer.setTint(Phaser.Display.Color.GetColor(
                    colorShift.r, 
                    colorShift.g, 
                    colorShift.b
                ));
            }
        });
        
        // Временное изменение цвета свечения
        const oldGlowFillColor = this.glow.fillColor;
        this.glow.setFillStyle(
            Phaser.Display.Color.GetColor(
                colorShift.r, 
                colorShift.g, 
                colorShift.b
            ), 
            0.3
        );
        
        // Восстановим цвет свечения после глитча
        this.scene.time.delayedCall(duration, () => {
            this.glow.setFillStyle(oldGlowFillColor, 0.25);
        });
    }
    
    /**
     * Глитч типа 3: Дрожание
     */
    applyShakeGlitch(intensity, duration) {
        // Количество тряски и сила
        const shakeCount = Math.floor(duration / 50);
        const shakeForce = 5 * intensity;
        
        // Начальные позиции
        const originalX = this.layersContainer.x;
        const originalY = this.layersContainer.y;
        
        // Функция одиночной тряски
        const shake = (count) => {
            if (count <= 0) return;
            
            const xShift = Phaser.Math.Between(-shakeForce, shakeForce);
            const yShift = Phaser.Math.Between(-shakeForce, shakeForce);
            
            this.scene.tweens.add({
                targets: this.layersContainer,
                x: originalX + xShift,
                y: originalY + yShift,
                duration: 30,
                ease: 'Power1',
                onComplete: () => {
                    // Следующая тряска
                    shake(count - 1);
                }
            });
        };
        
        // Запускаем тряску
        shake(shakeCount);
        
        // Добавляем случайные глитчи слоев во время тряски
        if (Math.random() < 0.7) {
            this.textLayers.forEach((layer, index) => {
                if (index > 0 && Math.random() < 0.5) {
                    this.scene.tweens.add({
                        targets: layer,
                        alpha: layer.alpha * (Math.random() < 0.5 ? 0.5 : 1.5),
                        x: layer.x + Phaser.Math.Between(-10, 10) * intensity,
                        y: layer.y + Phaser.Math.Between(-10, 10) * intensity,
                        duration: 50,
                        ease: 'Stepped',
                        yoyo: true,
                        repeat: 1
                    });
                }
            });
        }
    }
    
    /**
     * Глитч типа 4: Искажение формы
     */
    applyDistortionGlitch(intensity, duration) {
        // Искажаем масштаб слоев и логотипа
        this.scene.tweens.add({
            targets: this.layersContainer,
            scaleX: 1 + 0.2 * intensity,
            scaleY: 1 - 0.1 * intensity,
            duration: duration * 0.2,
            ease: 'Stepped',
            yoyo: true,
            repeat: 1
        });
        
        // Искажаем отдельные слои
        this.textLayers.forEach((layer, index) => {
            if (Math.random() < 0.5) {
                layer.oldScaleX = layer.scaleX;
                layer.oldScaleY = layer.scaleY;
                
                this.scene.tweens.add({
                    targets: layer,
                    scaleX: layer.scaleX * (1 + 0.15 * intensity * Math.random()),
                    scaleY: layer.scaleY * (1 - 0.05 * intensity * Math.random()),
                    duration: duration * 0.3,
                    ease: 'Stepped'
                });
                
                // Добавляем поворот для некоторых слоев
                if (Math.random() < 0.3) {
                    layer.oldRotation = layer.rotation;
                    
                    this.scene.tweens.add({
                        targets: layer,
                        angle: Phaser.Math.Between(-5, 5) * intensity,
                        duration: duration * 0.3,
                        ease: 'Stepped'
                    });
                }
            }
        });
    }
    
    /**
     * Сброс эффектов глитча
     */
    resetGlitch() {
        // Восстанавливаем позиции слоев
        this.textLayers.forEach(layer => {
            // Восстанавливаем позицию
            if (layer.hasOwnProperty('oldX') && layer.hasOwnProperty('oldY')) {
                this.scene.tweens.add({
                    targets: layer,
                    x: layer.oldX,
                    y: layer.oldY,
                    duration: 200,
                    ease: 'Power1'
                });
                
                delete layer.oldX;
                delete layer.oldY;
            }
            
            // Восстанавливаем цвет
            if (layer.hasOwnProperty('oldTint')) {
                layer.setTint(layer.oldTint);
                delete layer.oldTint;
            }
            
            // Восстанавливаем прозрачность
            if (layer.hasOwnProperty('oldAlpha')) {
                this.scene.tweens.add({
                    targets: layer,
                    alpha: layer.oldAlpha,
                    duration: 200,
                    ease: 'Power1'
                });
                delete layer.oldAlpha;
            }
            
            // Восстанавливаем масштаб
            if (layer.hasOwnProperty('oldScaleX') && layer.hasOwnProperty('oldScaleY')) {
                this.scene.tweens.add({
                    targets: layer,
                    scaleX: layer.oldScaleX,
                    scaleY: layer.oldScaleY,
                    duration: 200,
                    ease: 'Power1'
                });
                
                delete layer.oldScaleX;
                delete layer.oldScaleY;
            }
            
            // Восстанавливаем вращение
            if (layer.hasOwnProperty('oldRotation')) {
                this.scene.tweens.add({
                    targets: layer,
                    rotation: layer.oldRotation,
                    duration: 200,
                    ease: 'Power1'
                });
                
                delete layer.oldRotation;
            }
        });
        
        // Восстанавливаем позицию контейнера
        this.scene.tweens.add({
            targets: this.layersContainer,
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Power1'
        });
    }
    
    /**
     * Обновление анимации (вызывается каждый кадр)
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        // Анимация дыхания для 3D-слоев (когда анимация завершена)
        if (this.animationCompleted && !this.isGlitching) {
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