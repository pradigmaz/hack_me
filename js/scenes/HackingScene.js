/**
 * HackingScene - сцена взлома (мини-игры)
 * Содержит различные мини-игры для взлома систем
 */
class HackingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HackingScene' });
    }
    
    init(data) {
        // Получаем данные из предыдущей сцены
        this.hackType = data.type || 'password'; // Тип мини-игры (password, network, code)
        this.difficulty = data.difficulty || 'normal'; // Сложность
        
        // Состояние взлома
        this.hackState = {
            started: false,
            completed: false,
            failed: false,
            timeLeft: 60, // Время на взлом (в секундах)
            progress: 0, // Прогресс взлома (0-100%)
            attempts: 0 // Количество попыток
        };
        
        // Максимальное количество попыток в зависимости от сложности
        this.maxAttempts = {
            'easy': 5,
            'normal': 3,
            'hard': 2
        }[this.difficulty];
        
        // Элементы интерфейса
        this.ui = {
            terminal: null,
            progressBar: null,
            timeText: null,
            attemptsText: null,
            hackingElements: []
        };
    }
    
    create() {
        // Создаем фон с матричным эффектом
        this.matrixEffect = new MatrixEffect(this, {
            width: this.cameras.main.width,
            height: this.cameras.main.height,
            fontSize: 14,
            depth: 0,
            density: 0.7,
            interactive: true
        });
        
        // Создаем интерфейс
        this.createUI();
        
        // Инициализируем выбранную мини-игру
        this.initHackingGame();
        
        // Запускаем таймер
        this.startTimer();
        
        // Добавляем обработчик клавиши ESC для выхода
        this.input.keyboard.on('keydown-ESC', this.exitHacking, this);
    }
    
    /**
     * Создание элементов интерфейса
     */
    createUI() {
        // Заголовок
        this.add.text(
            this.cameras.main.width / 2,
            30,
            `ВЗЛОМ СИСТЕМЫ: ${this.getHackTypeName().toUpperCase()}`,
            {
                fontFamily: 'monospace',
                fontSize: 24,
                color: '#00FF41',
                align: 'center'
            }
        ).setOrigin(0.5, 0);
        
        // Подзаголовок
        this.add.text(
            this.cameras.main.width / 2,
            70,
            `Сложность: ${this.difficulty.toUpperCase()}`,
            {
                fontFamily: 'monospace',
                fontSize: 16,
                color: '#00BFFF',
                align: 'center'
            }
        ).setOrigin(0.5, 0);
        
        // Панель прогресса
        const progressBg = this.add.rectangle(
            this.cameras.main.width / 2,
            100,
            400,
            20,
            0x333333
        ).setOrigin(0.5, 0);
        
        this.ui.progressBar = this.add.rectangle(
            this.cameras.main.width / 2 - 200 + 1,
            100 + 1,
            0,
            18,
            0x00FF41
        ).setOrigin(0, 0);
        
        // Оставшееся время
        this.ui.timeText = this.add.text(
            20,
            20,
            `Время: ${this.hackState.timeLeft}`,
            {
                fontFamily: 'monospace',
                fontSize: 16,
                color: '#FFFFFF'
            }
        );
        
        // Количество попыток
        this.ui.attemptsText = this.add.text(
            this.cameras.main.width - 20,
            20,
            `Попытки: ${this.hackState.attempts}/${this.maxAttempts}`,
            {
                fontFamily: 'monospace',
                fontSize: 16,
                color: '#FFFFFF'
            }
        ).setOrigin(1, 0);
        
        // Контейнер для элементов мини-игры
        this.hackContainer = this.add.container(
            0,
            150
        );
    }
    
    /**
     * Получить название типа взлома
     * @returns {string} - Название типа взлома
     */
    getHackTypeName() {
        switch (this.hackType) {
            case 'password':
                return 'Взлом пароля';
            case 'network':
                return 'Трассировка сети';
            case 'code':
                return 'Инъекция кода';
            default:
                return 'Взлом системы';
        }
    }
    
    /**
     * Инициализация выбранной мини-игры
     */
    initHackingGame() {
        // Очищаем контейнер
        this.hackContainer.removeAll(true);
        
        // Удаляем старый терминал
        if (this.ui.terminal) {
            this.ui.terminal.destroy();
        }
        
        // Инициализируем соответствующую мини-игру
        switch (this.hackType) {
            case 'password':
                this.initPasswordCrack();
                break;
            case 'network':
                this.initNetworkTrace();
                break;
            case 'code':
                this.initCodeInjection();
                break;
            default:
                this.initPasswordCrack(); // По умолчанию
        }
        
        // Устанавливаем флаг начала игры
        this.hackState.started = true;
    }
    
    /**
     * Запуск таймера
     */
    startTimer() {
        // Таймер обратного отсчета
        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }
    
    /**
     * Обновление таймера
     */
    updateTimer() {
        // Если взлом завершен, останавливаем таймер
        if (this.hackState.completed || this.hackState.failed) return;
        
        // Уменьшаем оставшееся время
        this.hackState.timeLeft--;
        
        // Обновляем текст таймера
        this.ui.timeText.setText(`Время: ${this.hackState.timeLeft}`);
        
        // Если время вышло, завершаем взлом с неудачей
        if (this.hackState.timeLeft <= 0) {
            this.failHacking('Время вышло!');
        }
        
        // Изменяем цвет таймера в зависимости от оставшегося времени
        if (this.hackState.timeLeft <= 10) {
            this.ui.timeText.setColor('#FF073A');
            
            // Мигание при критическом времени
            if (this.hackState.timeLeft <= 5) {
                this.ui.timeText.alpha = this.ui.timeText.alpha === 1 ? 0.5 : 1;
            }
        }
    }
    
    /**
     * Обновление прогресса взлома
     * @param {number} progress - Процент выполнения (0-100)
     */
    updateProgress(progress) {
        // Обновляем состояние
        this.hackState.progress = Phaser.Math.Clamp(progress, 0, 100);
        
        // Обновляем индикатор прогресса
        this.ui.progressBar.width = (this.hackState.progress / 100) * 398; // 398 = ширина фона - 2
        
        // Если прогресс достиг 100%, завершаем взлом с успехом
        if (this.hackState.progress >= 100) {
            this.completeHacking();
        }
    }
    
    /**
     * Увеличение количества попыток
     */
    incrementAttempts() {
        // Увеличиваем счетчик попыток
        this.hackState.attempts++;
        
        // Обновляем текст
        this.ui.attemptsText.setText(`Попытки: ${this.hackState.attempts}/${this.maxAttempts}`);
        
        // Если превышено максимальное количество попыток, завершаем с неудачей
        if (this.hackState.attempts >= this.maxAttempts) {
            this.failHacking('Превышено количество попыток!');
        }
    }
    
    /**
     * Успешное завершение взлома
     */
    completeHacking() {
        // Если взлом уже завершен, выходим
        if (this.hackState.completed || this.hackState.failed) return;
        
        // Устанавливаем состояние
        this.hackState.completed = true;
        
        // Анимация успешного взлома
        this.showResultScreen(true, 'ВЗЛОМ УСПЕШЕН!');
        
        // Возвращаемся к игре через 3 секунды
        this.time.delayedCall(3000, () => {
            this.returnToGame(true);
        });
    }
    
    /**
     * Неудачное завершение взлома
     * @param {string} reason - Причина неудачи
     */
    failHacking(reason = 'Взлом не удался') {
        // Если взлом уже завершен, выходим
        if (this.hackState.completed || this.hackState.failed) return;
        
        // Устанавливаем состояние
        this.hackState.failed = true;
        
        // Анимация неудачного взлома
        this.showResultScreen(false, 'ВЗЛОМ ПРОВАЛЕН!', reason);
        
        // Возвращаемся к игре через 3 секунды
        this.time.delayedCall(3000, () => {
            this.returnToGame(false);
        });
    }
    
    /**
     * Показать экран результата
     * @param {boolean} success - Успешен ли взлом
     * @param {string} title - Заголовок сообщения
     * @param {string} subtitle - Подзаголовок сообщения
     */
    showResultScreen(success, title, subtitle = '') {
        // Фон для сообщения
        const overlay = this.add.rectangle(
            0, 0,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.7
        ).setOrigin(0);
        overlay.setDepth(100);
        
        // Заголовок
        const titleText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            title,
            {
                fontFamily: 'monospace',
                fontSize: 36,
                color: success ? '#00FF41' : '#FF073A',
                align: 'center'
            }
        );
        titleText.setOrigin(0.5);
        titleText.setDepth(101);
        
        // Подзаголовок (причина неудачи)
        if (subtitle) {
            const subtitleText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2 + 20,
                subtitle,
                {
                    fontFamily: 'monospace',
                    fontSize: 24,
                    color: '#FFFFFF',
                    align: 'center'
                }
            );
            subtitleText.setOrigin(0.5);
            subtitleText.setDepth(101);
        }
        
        // Эффект глитча
        if (this.game.globals && this.game.globals.glitch) {
            this.game.globals.glitch.applyToPhaserObject(
                this,
                overlay,
                { intensity: 0.3, duration: 1000 }
            );
        }
    }
    
    /**
     * Возврат к игровой сцене
     * @param {boolean} success - Результат взлома (успех/неудача)
     */
    returnToGame(success) {
        // Останавливаем текущую сцену
        this.scene.stop();
        
        // Возобновляем игровую сцену
        this.scene.resume('GameScene');
        
        // Передаем результат взлома
        this.game.events.emit('hackingComplete', {
            success: success,
            type: this.hackType,
            progress: this.hackState.progress,
            timeLeft: this.hackState.timeLeft
        });
    }
    
    /**
     * Выход из взлома (по ESC)
     */
    exitHacking() {
        // Если взлом уже завершен, ничего не делаем
        if (this.hackState.completed || this.hackState.failed) return;
        
        // Завершаем взлом с неудачей
        this.failHacking('Взлом прерван');
    }
    
    /**
     * Инициализация мини-игры "Взлом пароля"
     */
    initPasswordCrack() {
        // Создаем сетку символов для взлома пароля
        const gridSize = {
            easy: 4,
            normal: 5,
            hard: 6
        }[this.difficulty];
        
        // Создаем контейнер для элементов
        const container = this.add.container(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50
        );
        this.hackContainer.add(container);
        
        // Генерируем пароль (позицию правильного символа в сетке)
        const passwordPosition = {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize)
        };
        
        // Размер ячейки
        const cellSize = 50;
        
        // Генератор символов
        const textGenerator = new TextGenerator();
        
        // Создаем сетку с символами
        const gridCells = [];
        
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                // Вычисляем позицию ячейки
                const cellX = (x - gridSize / 2 + 0.5) * cellSize;
                const cellY = (y - gridSize / 2 + 0.5) * cellSize;
                
                // Создаем фон ячейки
                const cell = this.add.rectangle(
                    cellX, cellY,
                    cellSize - 4,
                    cellSize - 4,
                    0x333333
                );
                
                // Создаем символ
                let symbol;
                if (x === passwordPosition.x && y === passwordPosition.y) {
                    // Правильный символ (целевой)
                    symbol = textGenerator.getRandomChar('matrix');
                    this.correctSymbol = symbol;
                } else {
                    // Случайный символ
                    symbol = textGenerator.getRandomChar('matrix');
                }
                
                // Добавляем текст
                const text = this.add.text(
                    cellX, cellY,
                    symbol,
                    {
                        fontFamily: 'monospace',
                        fontSize: 24,
                        color: '#00BFFF'
                    }
                );
                text.setOrigin(0.5);
                
                // Делаем ячейку интерактивной
                cell.setInteractive();
                
                // Обработчик клика на ячейку
                cell.on('pointerup', () => {
                    this.checkPasswordCell(x, y, passwordPosition, cell, text);
                });
                
                // Эффект при наведении
                cell.on('pointerover', () => {
                    cell.setFillStyle(0x555555);
                });
                
                cell.on('pointerout', () => {
                    cell.setFillStyle(0x333333);
                });
                
                // Добавляем элементы в контейнер
                container.add(cell);
                container.add(text);
                
                // Сохраняем ячейку для дальнейшего использования
                gridCells.push({ cell, text, x, y });
            }
        }
        
        // Подсказка
        const hint = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 100,
            'Найдите правильный символ. "Горячая" область подсвечивается при приближении.',
            {
                fontFamily: 'monospace',
                fontSize: 16,
                color: '#FFFFFF',
                align: 'center'
            }
        );
        hint.setOrigin(0.5);
        this.hackContainer.add(hint);
        
        // Сохраняем данные мини-игры
        this.passwordGame = {
            gridCells,
            passwordPosition,
            lastDistance: Infinity
        };
    }
    
    /**
     * Проверка выбранной ячейки в мини-игре "Взлом пароля"
     * @param {number} x - Координата X ячейки
     * @param {number} y - Координата Y ячейки
     * @param {object} passwordPosition - Позиция правильного символа
     * @param {Phaser.GameObjects.Rectangle} cell - Ячейка
     * @param {Phaser.GameObjects.Text} text - Текст символа
     */
    checkPasswordCell(x, y, passwordPosition, cell, text) {
        // Если взлом уже завершен, выходим
        if (this.hackState.completed || this.hackState.failed) return;
        
        // Проверяем, является ли выбранная ячейка правильной
        if (x === passwordPosition.x && y === passwordPosition.y) {
            // Правильная ячейка
            cell.setFillStyle(0x00FF41);
            text.setColor('#FFFFFF');
            
            // Анимация успешного выбора
            this.tweens.add({
                targets: [cell, text],
                scale: 1.2,
                duration: 200,
                yoyo: true,
                onComplete: () => {
                    // Увеличиваем прогресс
                    const currentProgress = this.hackState.progress;
                    this.updateProgress(currentProgress + 25); // +25% за правильный выбор
                    
                    // Если прогресс меньше 100%, генерируем новую сетку
                    if (this.hackState.progress < 100) {
                        this.time.delayedCall(500, () => {
                            this.initPasswordCrack();
                        });
                    }
                }
            });
        } else {
            // Неправильная ячейка
            cell.setFillStyle(0xFF073A);
            
            // Анимация неудачного выбора
            this.tweens.add({
                targets: cell,
                alpha: 0.5,
                duration: 200,
                yoyo: true,
                repeat: 2
            });
            
            // Вычисляем "расстояние" до правильной ячейки
            const distance = Math.abs(x - passwordPosition.x) + Math.abs(y - passwordPosition.y);
            
            // Определяем "температуру" в зависимости от расстояния
            let message;
            if (distance <= 1) {
                message = 'ГОРЯЧО!';
                cell.setFillStyle(0xFF5500);
            } else if (distance <= 3) {
                message = 'Тепло';
                cell.setFillStyle(0xFFAA00);
            } else {
                message = 'Холодно';
                cell.setFillStyle(0x0088FF);
            }
            
            // Показываем подсказку
            const hintText = this.add.text(
                cell.x, cell.y,
                message,
                {
                    fontFamily: 'monospace',
                    fontSize: 14,
                    color: '#FFFFFF',
                    backgroundColor: '#000000'
                }
            );
            hintText.setOrigin(0.5);
            hintText.setDepth(20);
            
            // Добавляем в текущий контейнер
            this.hackContainer.first.add(hintText);
            
            // Скрываем подсказку через некоторое время
            this.time.delayedCall(1000, () => {
                hintText.destroy();
            });
            
            // Увеличиваем количество попыток
            this.incrementAttempts();
        }
    }
    
    /**
     * Инициализация мини-игры "Трассировка сети"
     * Мини-игра представляет собой лабиринт сети, через который нужно провести сигнал
     */
    initNetworkTrace() {
        // Здесь будет реализация мини-игры "Трассировка сети"
        // Для базовой функциональности предложим упрощенную версию
        
        // Информация о том, что мини-игра еще не полностью реализована
        const comingSoonText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'Мини-игра "Трассировка сети" в разработке.\nИспользуем имитацию для демонстрации.',
            {
                fontFamily: 'monospace',
                fontSize: 18,
                color: '#FFFFFF',
                align: 'center'
            }
        );
        comingSoonText.setOrigin(0.5);
        this.hackContainer.add(comingSoonText);
        
        // Имитация процесса взлома с автоматическим прогрессом
        this.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.hackState.completed && !this.hackState.failed) {
                    // Увеличиваем прогресс на случайную величину
                    const progress = this.hackState.progress + Phaser.Math.Between(1, 3) / 10;
                    this.updateProgress(progress);
                }
            },
            loop: true
        });
    }
    
    /**
     * Инициализация мини-игры "Инъекция кода"
     * Мини-игра представляет собой головоломку, где нужно собрать правильную последовательность кода
     */
    initCodeInjection() {
        // Здесь будет реализация мини-игры "Инъекция кода"
        // Для базовой функциональности предложим упрощенную версию
        
        // Информация о том, что мини-игра еще не полностью реализована
        const comingSoonText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'Мини-игра "Инъекция кода" в разработке.\nИспользуем имитацию для демонстрации.',
            {
                fontFamily: 'monospace',
                fontSize: 18,
                color: '#FFFFFF',
                align: 'center'
            }
        );
        comingSoonText.setOrigin(0.5);
        this.hackContainer.add(comingSoonText);
        
        // Имитация процесса взлома с автоматическим прогрессом
        this.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.hackState.completed && !this.hackState.failed) {
                    // Увеличиваем прогресс на случайную величину
                    const progress = this.hackState.progress + Phaser.Math.Between(1, 3) / 10;
                    this.updateProgress(progress);
                }
            },
            loop: true
        });
    }
    
    update() {
        // Обновляем логику мини-игры
        if (this.hackState.started && !this.hackState.completed && !this.hackState.failed) {
            // Специфичная логика для каждого типа взлома
            switch (this.hackType) {
                case 'password':
                    this.updatePasswordCrack();
                    break;
                case 'network':
                    // Логика для трассировки сети
                    break;
                case 'code':
                    // Логика для инъекции кода
                    break;
            }
        }
    }
    
    /**
     * Обновление логики мини-игры "Взлом пароля"
     */
    updatePasswordCrack() {
        // Если игра инициализирована и есть данные
        if (this.passwordGame && this.passwordGame.gridCells) {
            // Получаем позицию указателя
            const pointer = this.input.activePointer;
            
            // Конвертируем координаты в локальные для контейнера
            const containerPoint = this.hackContainer.first.getLocalPoint(pointer.x, pointer.y);
            
            // Проверяем близость к правильной ячейке
            const passwordPos = this.passwordGame.passwordPosition;
            
            let closestCell = null;
            let minDistance = Infinity;
            
            // Проходим по всем ячейкам и находим ближайшую к указателю
            for (const cellInfo of this.passwordGame.gridCells) {
                const dx = containerPoint.x - cellInfo.cell.x;
                const dy = containerPoint.y - cellInfo.cell.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestCell = cellInfo;
                }
            }
            
            // Если есть ближайшая ячейка и она в пределах досягаемости
            if (closestCell && minDistance < 100) {
                // Вычисляем расстояние до целевой ячейки (манхэттенское)
                const targetDistance = Math.abs(closestCell.x - passwordPos.x) + 
                                      Math.abs(closestCell.y - passwordPos.y);
                
                // Изменяем цвет в зависимости от расстояния
                if (targetDistance === 0) {
                    // Мы на целевой ячейке
                    closestCell.cell.setFillStyle(0x00FF41, 0.5);
                } else if (targetDistance <= 1) {
                    // Очень близко
                    closestCell.cell.setFillStyle(0xFF5500, 0.3);
                } else if (targetDistance <= 3) {
                    // Близко
                    closestCell.cell.setFillStyle(0xFFAA00, 0.2);
                } else {
                    // Далеко
                    closestCell.cell.setFillStyle(0x0088FF, 0.1);
                }
            }
        }
    }
}