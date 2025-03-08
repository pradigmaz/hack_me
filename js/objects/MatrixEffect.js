/**
 * MatrixEffect - класс для создания эффекта "цифрового дождя" 
 * Основной визуальный элемент игры
 */
class MatrixEffect {
    /**
     * Конструктор класса MatrixEffect
     * @param {Phaser.Scene} scene - Сцена Phaser, в которой создается эффект
     * @param {object} config - Конфигурация эффекта
     */
    constructor(scene, config) {
        this.scene = scene;
        
        // Применяем настройки по умолчанию или переданные в конфигурации
        this.config = {
            x: config.x || 0,
            y: config.y || 0,
            width: config.width || scene.cameras.main.width,
            height: config.height || scene.cameras.main.height,
            fontSize: config.fontSize || 24,  // Увеличиваем размер для лучшей видимости
            symbolWidth: config.symbolWidth || (config.fontSize ? config.fontSize * 1.2 : 28), // Настраиваем ширину
            color: config.color || '#00FF41', // Насыщенный зеленый цвет как в оригинальной Матрице
            highlightColor: config.highlightColor || '#5FFF5F', // Яркий зеленый для подсветки
            dimColor: config.dimColor || '#0A4A4C',
            glowColor: config.glowColor || '#00FF41',
            density: config.density || 0.5, // Настраиваем плотность для аутентичного вида
            speedMin: config.speedMin || 1.0, // Минимальная скорость
            speedMax: config.speedMax || 4.5, // Максимальная скорость
            changeRate: config.changeRate || 0.018, // Вероятность смены символа
            highlightRate: config.highlightRate || 0.12, // Вероятность "подсветки" символа
            glitchRate: config.glitchRate || 0.015, // Умеренная вероятность глитчей
            useKatakana: config.useKatakana !== undefined ? config.useKatakana : true, 
            interactive: config.interactive !== undefined ? config.interactive : true,
            depth: config.depth || 0,
            glitchIntensity: config.glitchIntensity || 0.6, // Интенсивность глитчей
            trailLength: config.trailLength || 12, // Увеличиваем длину "хвоста" символов для более длинных капель
            bloomEffect: config.bloomEffect || true // Эффект свечения
        };
        // Создаем канвас для рисования символов
        this.canvas = scene.textures.createCanvas('matrixEffect_' + Date.now(), this.config.width, this.config.height);
        this.context = this.canvas.getContext('2d');
        
        // Рассчитываем количество столбцов (меньше из-за увеличенного размера шрифта)
        this.columns = Math.floor(this.config.width / this.config.symbolWidth);
        
        // Массив для символов
        this.symbols = [];
        
        // Массив для хранения эффектов глитча
        this.glitchEffects = [];
        
        // Таймер для создания глитчей
        this.glitchTimer = scene.time.addEvent({
            delay: 2000,
            callback: this.createRandomGlitch,
            callbackScope: this,
            loop: true
        });
        
        // Инициализация массива символов
        this.initSymbols();
        
        // Создаем спрайт с канвасом
        this.sprite = scene.add.image(this.config.x, this.config.y, this.canvas.key);
        this.sprite.setOrigin(0);
        this.sprite.setDepth(this.config.depth);
        
        // Запускаем обновление эффекта (немного быстрее для более плавной анимации)
        this.timer = scene.time.addEvent({
            delay: 40, // Уменьшаем задержку для более плавной анимации
            callback: this.update,
            callbackScope: this,
            loop: true
        });
        
        // Если эффект интерактивный, добавляем реакцию на движение мыши
        if (this.config.interactive) {
            scene.input.on('pointermove', this.handlePointerMove, this);
            scene.input.on('pointerdown', this.createWaveAtPointer, this);
        }
    }
    
    /**
     * Инициализация массива символов
     */
    initSymbols() {
        // Определяем количество столбцов с учетом плотности
        const activeColumns = Math.floor(this.columns * this.config.density);
        const columnIndices = [];
        
        // Выбираем случайные столбцы для отображения символов
        while (columnIndices.length < activeColumns) {
            const index = Math.floor(Math.random() * this.columns);
            if (!columnIndices.includes(index)) {
                columnIndices.push(index);
            }
        }
        
        // Инициализируем символы в выбранных столбцах
        for (const i of columnIndices) {
            const headY = Math.random() * this.config.height;
            
            // Создаем "хвост" из символов
            const trail = [];
            
            for (let j = 0; j < this.config.trailLength; j++) {
                trail.push({
                    char: this.getRandomSymbol(),
                    opacity: 1 - (j / this.config.trailLength),
                    highlighted: j === 0 && Math.random() < this.config.highlightRate
                });
            }
            
            this.symbols[i] = {
                y: headY,
                speed: this.config.speedMin + Math.random() * (this.config.speedMax - this.config.speedMin),
                trail: trail,
                lastChanged: 0
            };
        }
    }
    
    /**
     * Получить случайный символ для матричного эффекта
     * @returns {string} - Случайный символ
     */
    getRandomSymbol() {
        // Расширенные наборы символов для более аутентичного визуального эффекта
        const sets = {
            // Японская катакана (как в оригинальной "Матрице")
            katakana: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ',
            
            // Хирагана для разнообразия
            hiragana: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん',
            
            // Латинские символы для контраста (используются реже)
            latin: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            
            // Программные символы (используются ещё реже)
            code: '[]{}()<>!@#$%^&*+=\\|/:;,.~`\'"-_',
            
            // Двоичные данные
            binary: '01',
            
            // Хакерский набор - шестнадцатеричные значения
            hex: '0123456789ABCDEFabcdef'
        };
        
        // Выбираем случайный набор с разными вероятностями для более аутентичного вида
        let set;
        const rand = Math.random();
        
        if (rand < 0.65) {
            // Преимущественно катакана - основной набор символов в Матрице
            set = sets.katakana;
        } else if (rand < 0.8) {
            // Хирагана для разнообразия
            set = sets.hiragana;
        } else if (rand < 0.9) {
            // Латинские символы и цифры
            set = sets.latin;
        } else if (rand < 0.95) {
            // Двоичные и шестнадцатеричные данные
            set = Math.random() < 0.5 ? sets.binary : sets.hex;
        } else {
            // Редко символы программирования
            set = sets.code;
        }
        
        return set.charAt(Math.floor(Math.random() * set.length));
    }
    
    /**
     * Создать случайный эффект глитча
     */
    createRandomGlitch() {
        // Если не нужно создавать глитч, выходим
        if (Math.random() > this.config.glitchIntensity) return;
        
        // Создаем от 1 до 5 глитчей одновременно
        const count = Math.floor(Math.random() * 5) + 1;
        
        for (let i = 0; i < count; i++) {
            // Выбираем случайную область для глитча
            const x = Math.random() * this.config.width;
            const y = Math.random() * this.config.height;
            const width = Math.random() * 100 + 50;
            const height = Math.random() * 30 + 10;
            
            // Добавляем глитч с случайной продолжительностью
            this.glitchEffects.push({
                x: x,
                y: y,
                width: width,
                height: height,
                duration: Math.random() * 500 + 100,
                created: Date.now(),
                opacity: Math.random() * 0.7 + 0.3,
                offsetX: Math.random() * 10 - 5,
                offsetY: Math.random() * 6 - 3,
                type: Math.random() < 0.5 ? 'block' : 'line'
            });
        }
    }
    
    /**
     * Создает эффект волны при клике
     */
    createWaveAtPointer(pointer) {
        const x = pointer.x - this.config.x;
        const y = pointer.y - this.config.y;
        
        // Создаем эффект волны с большим радиусом
        this.createWave(x, y, 150, 1200);
        
        // Добавляем несколько глитчей в месте клика
        for (let i = 0; i < 3; i++) {
            this.glitchEffects.push({
                x: x - 50 + Math.random() * 100,
                y: y - 30 + Math.random() * 60,
                width: Math.random() * 100 + 20,
                height: Math.random() * 20 + 10,
                duration: Math.random() * 400 + 200,
                created: Date.now(),
                opacity: Math.random() * 0.8 + 0.2,
                offsetX: Math.random() * 12 - 6,
                offsetY: Math.random() * 8 - 4,
                type: Math.random() < 0.7 ? 'block' : 'line'
            });
        }
    }
    
    /**
     * Обновление эффекта (вызывается по таймеру)
     */
    update() {
        // Очищаем канвас
        this.context.clearRect(0, 0, this.config.width, this.config.height);
        
        // Затемнение предыдущего кадра с эффектом размытия для создания "хвостов"
        this.context.fillStyle = 'rgba(0, 0, 0, 0.09)';
        this.context.fillRect(0, 0, this.config.width, this.config.height);
        
        // Настройка шрифта
        this.context.font = `bold ${this.config.fontSize}px monospace`;
        this.context.textAlign = 'center';
        
        // Обновление и отрисовка символов
        for (let i = 0; i < this.columns; i++) {
            const symbol = this.symbols[i];
            
            // Пропускаем столбцы без символов
            if (!symbol) continue;
            
            // Обновляем положение символа
            symbol.y += symbol.speed;
            
            // Если главный символ вышел за границы экрана - перезапускаем
            if (symbol.y > this.config.height) {
                symbol.y = 0;
                symbol.speed = this.config.speedMin + Math.random() * (this.config.speedMax - this.config.speedMin);
                
                // Обновляем символы в хвосте
                for (let j = 0; j < symbol.trail.length; j++) {
                    symbol.trail[j].char = this.getRandomSymbol();
                    symbol.trail[j].highlighted = j === 0 && Math.random() < this.config.highlightRate;
                }
            }
            
            // Отрисовка "хвоста" символов
            for (let j = symbol.trail.length - 1; j >= 0; j--) {
                const trailSymbol = symbol.trail[j];
                const symbolY = symbol.y - (j * this.config.fontSize * 0.8); // Уменьшаем интервал для более плотных капель
                
                // Пропускаем символы, которые вышли за пределы экрана
                if (symbolY < 0 || symbolY > this.config.height) continue;
                
                // Эффект свечения для подсвеченных символов и первых символов в цепочке
                if (j === 0) {
                    // Ярко светящийся первый символ (голова капли), как в оригинальной Матрице
                    this.context.shadowBlur = 15;
                    this.context.shadowColor = this.config.highlightColor;
                    this.context.fillStyle = this.config.highlightColor;
                    this.context.globalAlpha = 1;
                } else if (trailSymbol.highlighted) {
                    // Иногда подсвечиваем символы в "хвосте"
                    this.context.shadowBlur = 8;
                    this.context.shadowColor = this.config.color;
                    this.context.fillStyle = this.config.color;
                    this.context.globalAlpha = 0.9 - (j / (symbol.trail.length * 1.5));
                } else {
                    // Остальные символы с затуханием прозрачности, зависящим от позиции
                    this.context.shadowBlur = 0;
                    this.context.fillStyle = this.config.color;
                    
                    // Экспоненциальное затухание прозрачности для аутентичного вида
                    const fadeRate = Math.pow(0.92, j);
                    this.context.globalAlpha = fadeRate * 0.9;
                }
                
                // Отрисовка символа
                this.context.fillText(
                    trailSymbol.char,
                    (i + 0.5) * this.config.symbolWidth, 
                    symbolY
                );
            }
            
            // Периодическая смена символов для динамичности
            if (Math.random() < this.config.changeRate) {
                // Меняем первый символ в хвосте
                symbol.trail[0].char = this.getRandomSymbol();
                
                // Иногда меняем и другие символы в хвосте
                if (Math.random() < 0.2) {
                    const randomIndex = Math.floor(Math.random() * symbol.trail.length);
                    symbol.trail[randomIndex].char = this.getRandomSymbol();
                }
            }
        }
        
        // Отрисовка эффектов глитча
        this.drawGlitchEffects();
        
        // Удаление устаревших глитчей
        this.glitchEffects = this.glitchEffects.filter(glitch => 
            Date.now() - glitch.created < glitch.duration
        );
        
        // Обновление канваса
        this.canvas.refresh();
    }
    
    /**
     * Отрисовка эффектов глитча
     */
    drawGlitchEffects() {
        const now = Date.now();
        
        for (const glitch of this.glitchEffects) {
            // Рассчитываем прогресс анимации (0-1)
            const progress = (now - glitch.created) / glitch.duration;
            
            // Если глитч закончился, пропускаем
            if (progress >= 1) continue;
            
            // Настраиваем контекст
            this.context.globalAlpha = glitch.opacity * (1 - progress);
            
            // Различные типы глитчей
            if (glitch.type === 'block') {
                // Разрезанный блок с эффектом сдвига
                this.context.fillStyle = '#00FF41';
                
                // Верхняя часть блока
                this.context.fillRect(
                    glitch.x + glitch.offsetX,
                    glitch.y,
                    glitch.width,
                    glitch.height / 2
                );
                
                // Нижняя часть блока со сдвигом
                this.context.fillRect(
                    glitch.x - glitch.offsetX,
                    glitch.y + glitch.height / 2,
                    glitch.width,
                    glitch.height / 2
                );
                
                // Иногда добавляем дополнительные линии для усиления эффекта
                if (Math.random() < 0.7) {
                    this.context.fillRect(
                        glitch.x - glitch.width/2,
                        glitch.y + glitch.offsetY * 3,
                        glitch.width * 2,
                        2
                    );
                }
            } else {
                // Линия с эффектом разрыва
                this.context.fillStyle = '#7FFF00';
                
                // Основная линия
                this.context.fillRect(
                    glitch.x,
                    glitch.y,
                    glitch.width,
                    3
                );
                
                // Разрывы в линии
                for (let i = 0; i < 3; i++) {
                    const gapStart = glitch.x + (glitch.width / 3) * i + Math.random() * 10;
                    const gapWidth = Math.random() * 15 + 5;
                    
                    this.context.clearRect(
                        gapStart,
                        glitch.y,
                        gapWidth,
                        3
                    );
                }
            }
        }
        
        // Сбрасываем прозрачность
        this.context.globalAlpha = 1;
    }
    
    /**
     * Обработка движения указателя (мыши/тача)
     * @param {Phaser.Input.Pointer} pointer - Указатель
     */
    handlePointerMove(pointer) {
        // Определяем столбец, над которым находится указатель
        const columnWidth = this.config.symbolWidth;
        const column = Math.floor((pointer.x - this.config.x) / columnWidth);
        
        // Если столбец в пределах канваса и в нем есть символ
        if (column >= 0 && column < this.columns && this.symbols[column]) {
            // Добавляем несколько подсвеченных символов в этой области
            for (let i = Math.max(0, column - 3); i <= Math.min(this.columns - 1, column + 3); i++) {
                if (this.symbols[i]) {
                    // С некоторой вероятностью подсвечиваем символы
                    if (Math.random() < 0.3) {
                        // Выбираем случайную позицию в хвосте для подсветки
                        const trailIndex = Math.min(1, Math.floor(Math.random() * this.symbols[i].trail.length));
                        this.symbols[i].trail[trailIndex].highlighted = true;
                        
                        // Сбрасываем подсветку через случайное время
                        this.scene.time.delayedCall(
                            200 + Math.random() * 500, 
                            () => {
                                if (this.symbols[i] && this.symbols[i].trail[trailIndex]) {
                                    this.symbols[i].trail[trailIndex].highlighted = trailIndex === 0 && Math.random() < this.config.highlightRate;
                                }
                            }
                        );
                    }
                }
            }
        }
    }
    
    /**
     * Создать эффект волны от указанной точки
     * @param {number} x - Координата X центра волны
     * @param {number} y - Координата Y центра волны
     * @param {number} radius - Радиус волны
     * @param {number} duration - Длительность анимации в мс
     */
    createWave(x, y, radius = 100, duration = 1000) {
        // Задаем лимит волн для избежания проблем с производительностью
        const maxWaves = 5;
        let activeWaves = 0;
        
        // Получаем все активные волны
        this.scene.children.each(child => {
            if (child.type === 'Image' && child.texture.key.startsWith('wave_')) {
                activeWaves++;
            }
        });
        
        // Если слишком много активных волн, выходим
        if (activeWaves >= maxWaves) return;
        
        // Создаем текстуру для волны
        const waveKey = 'wave_' + Date.now();
        const waveTexture = this.scene.textures.createCanvas(waveKey, radius * 2, radius * 2);
        const waveContext = waveTexture.getContext('2d');
        
        // Рисуем волну
        waveContext.strokeStyle = this.config.highlightColor;
        waveContext.lineWidth = 2;
        waveContext.beginPath();
        waveContext.arc(radius, radius, radius - 5, 0, Math.PI * 2);
        waveContext.stroke();
        
        // Добавляем свечение
        waveContext.shadowBlur = 15;
        waveContext.shadowColor = this.config.highlightColor;
        waveContext.beginPath();
        waveContext.arc(radius, radius, radius - 5, 0, Math.PI * 2);
        waveContext.stroke();
        
        waveTexture.refresh();
        
        // Создаем спрайт волны
        const wave = this.scene.add.image(x + this.config.x, y + this.config.y, waveKey);
        wave.setDepth(this.config.depth + 1);
        wave.setAlpha(0.8);
        wave.setScale(0);
        
        // Анимируем волну
        this.scene.tweens.add({
            targets: wave,
            scale: 1,
            alpha: 0,
            duration: duration,
            ease: 'Sine.easeOut',
            onComplete: () => {
                wave.destroy();
                this.scene.textures.remove(waveKey);
            }
        });
        
        // Увеличиваем скорость символов в зоне волны
        for (let i = 0; i < this.columns; i++) {
            const symbol = this.symbols[i];
            if (!symbol) continue;
            
            const symbolX = i * this.config.symbolWidth + this.config.symbolWidth / 2;
            const distance = Phaser.Math.Distance.Between(x, y, symbolX, symbol.y);
            
            if (distance < radius) {
                // Увеличиваем скорость пропорционально близости к центру волны
                const speedIncrease = (1 - distance / radius) * 3;
                symbol.speed += speedIncrease;
                
                // Подсвечиваем символы в зоне волны
                for (let j = 0; j < symbol.trail.length; j++) {
                    if (Math.random() < (1 - distance / radius) * 0.5) {
                        symbol.trail[j].highlighted = true;
                        symbol.trail[j].char = this.getRandomSymbol();
                        
                        // Сбрасываем подсветку через некоторое время
                        this.scene.time.delayedCall(
                            500 + Math.random() * 1000,
                            () => {
                                if (symbol && symbol.trail && symbol.trail[j]) {
                                    symbol.trail[j].highlighted = j === 0 && Math.random() < this.config.highlightRate;
                                }
                            }
                        );
                    }
                }
            }
        }
    }
    
    /**
     * Изменить плотность символов
     * @param {number} density - Новая плотность (0-1)
     */
    setDensity(density) {
        this.config.density = Phaser.Math.Clamp(density, 0, 1);
        this.symbols = [];
        this.initSymbols();
    }
    
    /**
     * Изменить скорость символов
     * @param {number} min - Минимальная скорость
     * @param {number} max - Максимальная скорость
     */
    setSpeed(min, max) {
        this.config.speedMin = min;
        this.config.speedMax = max;
        
        // Обновляем скорость существующих символов
        for (const i in this.symbols) {
            if (this.symbols[i]) {
                this.symbols[i].speed = min + Math.random() * (max - min);
            }
        }
    }
    
    /**
     * Задает область, где не должны появляться символы матрицы
     * @param {object} exclusionZone - Объект с координатами зоны исключения {x, y, width, height}
     */
    setExclusionZone(exclusionZone) {
        this.exclusionZone = exclusionZone;
        
        // Перестраиваем символы, чтобы убрать их из зоны исключения
        this.updateSymbolsForExclusionZone();
    }
    
    /**
     * Обновляет символы с учетом зоны исключения
     */
    updateSymbolsForExclusionZone() {
        if (!this.exclusionZone) return;
        
        // Определяем диапазон столбцов, которые попадают в зону исключения
        const startColumn = Math.floor((this.exclusionZone.x - this.config.x) / this.config.symbolWidth);
        const endColumn = Math.ceil((this.exclusionZone.x - this.config.x + this.exclusionZone.width) / this.config.symbolWidth);
        
        // Очищаем символы в зоне исключения
        for (let i = startColumn; i <= endColumn; i++) {
            if (i >= 0 && i < this.columns) {
                delete this.symbols[i];
            }
        }
        
        // Корректируем плотность для оставшейся области
        this.adjustDensityWithExclusion();
    }
    
    /**
     * Корректирует плотность символов с учетом зоны исключения
     */
    adjustDensityWithExclusion() {
        // Если нет зоны исключения, используем обычный метод
        if (!this.exclusionZone) {
            this.initSymbols();
            return;
        }
        
        // Определяем доступные столбцы (те, что не в зоне исключения)
        const availableColumns = [];
        const startColumn = Math.floor((this.exclusionZone.x - this.config.x) / this.config.symbolWidth);
        const endColumn = Math.ceil((this.exclusionZone.x - this.config.x + this.exclusionZone.width) / this.config.symbolWidth);
        
        for (let i = 0; i < this.columns; i++) {
            if (i < startColumn || i > endColumn) {
                availableColumns.push(i);
            }
        }
        
        // Определяем количество активных столбцов с учетом плотности
        const activeColumnsCount = Math.floor(availableColumns.length * this.config.density);
        
        // Если все столбцы уже исключены или плотность нулевая, выходим
        if (activeColumnsCount <= 0) return;
        
        // Выбираем случайные столбцы из доступных
        const selectedColumns = [];
        while (selectedColumns.length < activeColumnsCount) {
            const randomIndex = Math.floor(Math.random() * availableColumns.length);
            const columnIndex = availableColumns[randomIndex];
            
            if (!selectedColumns.includes(columnIndex)) {
                selectedColumns.push(columnIndex);
            }
            
            // Предотвращение бесконечного цикла
            if (selectedColumns.length >= availableColumns.length) break;
        }
        
        // Создаем символы в выбранных столбцах
        for (const columnIndex of selectedColumns) {
            // Если в этом столбце уже есть символы, пропускаем
            if (this.symbols[columnIndex]) continue;
            
            const headY = Math.random() * this.config.height;
            const trail = [];
            
            for (let j = 0; j < this.config.trailLength; j++) {
                trail.push({
                    char: this.getRandomSymbol(),
                    opacity: 1 - (j / this.config.trailLength),
                    highlighted: j === 0 && Math.random() < this.config.highlightRate
                });
            }
            
            this.symbols[columnIndex] = {
                y: headY,
                speed: this.config.speedMin + Math.random() * (this.config.speedMax - this.config.speedMin),
                trail: trail,
                lastChanged: 0
            };
        }
    }
    
    /**
     * Уничтожить эффект и освободить ресурсы
     */
    destroy() {
        if (this.timer) {
            this.timer.remove();
            this.timer = null;
        }
        
        if (this.glitchTimer) {
            this.glitchTimer.remove();
            this.glitchTimer = null;
        }
        
        if (this.config.interactive) {
            this.scene.input.off('pointermove', this.handlePointerMove, this);
            this.scene.input.off('pointerdown', this.createWaveAtPointer, this);
        }
        
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
        
        if (this.canvas) {
            this.scene.textures.remove(this.canvas.key);
            this.canvas = null;
        }
    }
}
