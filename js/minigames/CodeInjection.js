/**
 * CodeInjection - класс мини-игры по внедрению кода
 * Реализует механику размещения блоков кода в правильной последовательности
 */
class CodeInjection {
    /**
     * Конструктор класса CodeInjection
     * @param {Phaser.Scene} scene - Сцена Phaser
     * @param {object} config - Конфигурация мини-игры
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        
        // Настройки по умолчанию
        this.config = {
            x: config.x || this.scene.cameras.main.width / 2,
            y: config.y || this.scene.cameras.main.height / 2 - 50,
            width: config.width || 600,
            height: config.height || 400,
            difficulty: config.difficulty || 'normal',
            onSuccess: config.onSuccess || null,
            onFail: config.onFail || null,
            onProgress: config.onProgress || null
        };
        
        // Параметры сложности
        this.difficultyParams = {
            'easy': {
                blockCount: 4,
                timeLimit: 60,  // Время в секундах
                distraction: 1  // Количество лишних блоков-отвлечений
            },
            'normal': {
                blockCount: 6,
                timeLimit: 45,
                distraction: 2
            },
            'hard': {
                blockCount: 8,
                timeLimit: 30,
                distraction: 3
            }
        }[this.config.difficulty];
        
        // Состояние игры
        this.state = {
            active: false,
            completed: false,
            failed: false,
            currentSequence: [],
            correctSequence: [],
            blocks: [],
            timeLeft: this.difficultyParams.timeLimit
        };
        
        // Графические элементы
        this.graphics = {
            blocks: [],
            dropZones: [],
            timer: null
        };
        
        // Контейнер для элементов
        this.container = this.scene.add.container(this.config.x, this.config.y);
        
        // Интервал обновления таймера
        this.timerInterval = null;
        
        // Шаблоны блоков кода
        this.codeTemplates = [
            // Шаблон 1: Обход брандмауэра
            [
                { id: 0, text: 'let port = findOpenPort();', description: 'Поиск открытого порта' },
                { id: 1, text: 'socket.connect(port);', description: 'Подключение к порту' },
                { id: 2, text: 'let credentials = getCredentials();', description: 'Получение учетных данных' },
                { id: 3, text: 'sendAuthPacket(credentials);', description: 'Отправка пакета аутентификации' },
                { id: 4, text: 'if (checkAccess()) {', description: 'Проверка доступа' },
                { id: 5, text: '  bypassFirewall();', description: 'Обход брандмауэра' },
                { id: 6, text: '  return SUCCESS;', description: 'Возврат успеха' },
                { id: 7, text: '}', description: 'Закрытие условия' }
            ],
            
            // Шаблон 2: Извлечение данных
            [
                { id: 0, text: 'let target = findDataStorage();', description: 'Поиск хранилища данных' },
                { id: 1, text: 'let encryptionKey = decodeKey();', description: 'Декодирование ключа шифрования' },
                { id: 2, text: 'let fileSystem = mountRemoteFS(target);', description: 'Монтирование удаленной файловой системы' },
                { id: 3, text: 'for (let file of fileSystem.files) {', description: 'Перебор файлов' },
                { id: 4, text: '  if (file.isEncrypted) {', description: 'Проверка шифрования' },
                { id: 5, text: '    file.decrypt(encryptionKey);', description: 'Дешифрование файла' },
                { id: 6, text: '  }', description: 'Закрытие условия' },
                { id: 7, text: '  extractData(file);', description: 'Извлечение данных' }
            ],
            
            // Шаблон 3: SQL-инъекция
            [
                { id: 0, text: "let input = '\\'OR 1=1;--';", description: 'Подготовка SQL-инъекции' },
                { id: 1, text: 'let connection = connectToDatabase();', description: 'Подключение к базе данных' },
                { id: 2, text: 'let query = buildQuery(input);', description: 'Построение запроса' },
                { id: 3, text: 'try {', description: 'Начало блока try' },
                { id: 4, text: '  let result = connection.execute(query);', description: 'Выполнение запроса' },
                { id: 5, text: '  extractPrivileges(result);', description: 'Извлечение привилегий' },
                { id: 6, text: '} catch (e) {', description: 'Обработка исключений' },
                { id: 7, text: '  logError(e);', description: 'Логирование ошибки' }
            ]
        ];
        
        // Блоки-отвлечения
        this.distractionBlocks = [
            { text: 'socket.disconnect();', description: 'Отключение от сокета' },
            { text: 'console.log("Access denied");', description: 'Вывод отказа доступа' },
            { text: 'throw new Error("Invalid request");', description: 'Выброс исключения' },
            { text: 'return null;', description: 'Возврат null' },
            { text: 'system.shutdown();', description: 'Выключение системы' },
            { text: 'deleteDatabase();', description: 'Удаление базы данных' }
        ];
        
        // Инициализация игры
        this.init();
    }
    
    /**
     * Инициализация игры
     */
    init() {
        // Очищаем контейнер
        this.container.removeAll(true);
        
        // Создаем фон для игрового поля
        const background = this.scene.add.rectangle(
            0, 0,
            this.config.width, this.config.height,
            0x000000, 0.5
        );
        background.setOrigin(0.5);
        this.container.add(background);
        
        // Выбираем случайный шаблон кода
        const templateIndex = Math.floor(Math.random() * this.codeTemplates.length);
        const codeTemplate = this.codeTemplates[templateIndex];
        
        // Выбираем подмножество блоков для текущей сложности
        this.state.correctSequence = codeTemplate.slice(0, this.difficultyParams.blockCount);
        
        // Создаем блоки
        this.createBlocks();
        
        // Создаем зоны для размещения блоков
        this.createDropZones();
        
        // Создаем таймер
        this.createTimer();
        
        // Отображаем инструкции
        this.showInstructions();
        
        // Запускаем игру
        this.startGame();
    }
    
    /**
     * Создание блоков кода
     */
    createBlocks() {
        const blockWidth = 320;
        const blockHeight = 40;
        const startX = -this.config.width / 2 + blockWidth / 2 + 20;
        const startY = -this.config.height / 2 + blockHeight / 2 + 60;
        
        // Создаем копию правильной последовательности
        const blocks = [...this.state.correctSequence];
        
        // Добавляем блоки-отвлечения
        for (let i = 0; i < this.difficultyParams.distraction; i++) {
            const distractionIndex = Math.floor(Math.random() * this.distractionBlocks.length);
            blocks.push({ 
                id: -1 - i, // Отрицательные ID для блоков-отвлечений
                text: this.distractionBlocks[distractionIndex].text, 
                description: this.distractionBlocks[distractionIndex].description 
            });
        }
        
        // Перемешиваем блоки
        this.shuffleArray(blocks);
        
        // Сохраняем блоки
        this.state.blocks = blocks;
        
        // Создаем графические представления блоков
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            const blockX = startX;
            const blockY = startY + i * (blockHeight + 10);
            
            // Создаем фон блока
            const background = this.scene.add.rectangle(
                blockX, blockY,
                blockWidth, blockHeight,
                0x333333
            );
            background.setStrokeStyle(1, 0x666666);
            background.setOrigin(0.5);
            
            // Добавляем текст блока
            const text = this.scene.add.text(
                blockX, blockY,
                block.text,
                {
                    fontFamily: 'monospace',
                    fontSize: 14,
                    color: '#00BFFF'
                }
            );
            text.setOrigin(0.5);
            
            // Делаем блок интерактивным
            background.setInteractive();
            this.scene.input.setDraggable(background);
            
            // Сохраняем ссылки
            block.background = background;
            block.textObject = text;
            block.originalX = blockX;
            block.originalY = blockY;
            block.placed = false;
            
            // Добавляем в контейнер
            this.container.add(background);
            this.container.add(text);
            this.graphics.blocks.push({ background, text, block });
        }
        
        // Добавляем обработчики событий для перетаскивания
        this.setupDragEvents();
    }
    
    /**
     * Создание зон для размещения блоков
     */
    createDropZones() {
        const zoneWidth = 320;
        const zoneHeight = 40;
        const startX = this.config.width / 2 - zoneWidth / 2 - 20;
        const startY = -this.config.height / 2 + zoneHeight / 2 + 60;
        
        // Создаем зоны для правильной последовательности
        for (let i = 0; i < this.state.correctSequence.length; i++) {
            const zoneX = startX;
            const zoneY = startY + i * (zoneHeight + 10);
            
            // Создаем зону
            const zone = this.scene.add.rectangle(
                zoneX, zoneY,
                zoneWidth, zoneHeight,
                0x222222
            );
            zone.setStrokeStyle(1, 0x444444);
            zone.setOrigin(0.5);
            
            // Создаем номер зоны
            const number = this.scene.add.text(
                zoneX - zoneWidth / 2 + 15, zoneY,
                (i + 1).toString(),
                {
                    fontFamily: 'monospace',
                    fontSize: 14,
                    color: '#666666'
                }
            );
            number.setOrigin(0.5);
            
            // Делаем зону интерактивной для приема блоков
            zone.setInteractive();
            zone.input.dropZone = true;
            
            // Сохраняем данные зоны
            zone.zoneId = i;
            zone.block = null;
            
            // Добавляем в контейнер
            this.container.add(zone);
            this.container.add(number);
            this.graphics.dropZones.push({ zone, number });
        }
    }
    
    /**
     * Настройка обработчиков событий перетаскивания
     */
    setupDragEvents() {
        // Начало перетаскивания
        this.scene.input.on('dragstart', (pointer, gameObject) => {
            // Находим блок по объекту фона
            const blockInfo = this.findBlockByBackground(gameObject);
            if (blockInfo) {
                // Подсвечиваем блок
                gameObject.setFillStyle(0x555555);
                
                // Поднимаем блок на передний план
                this.container.bringToTop(gameObject);
                this.container.bringToTop(blockInfo.block.textObject);
                
                // Если блок был размещен, освобождаем зону
                if (blockInfo.block.placed) {
                    this.clearZone(blockInfo.block.zone);
                    blockInfo.block.placed = false;
                    blockInfo.block.zone = null;
                    
                    // Обновляем текущую последовательность
                    this.updateCurrentSequence();
                }
            }
        });
        
        // Процесс перетаскивания
        this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            // Перемещаем блок
            gameObject.x = dragX;
            gameObject.y = dragY;
            
            // Находим блок по объекту фона
            const blockInfo = this.findBlockByBackground(gameObject);
            if (blockInfo) {
                // Перемещаем текст вместе с блоком
                blockInfo.block.textObject.x = dragX;
                blockInfo.block.textObject.y = dragY;
            }
        });
        
        // Конец перетаскивания
        this.scene.input.on('dragend', (pointer, gameObject) => {
            // Находим блок по объекту фона
            const blockInfo = this.findBlockByBackground(gameObject);
            if (blockInfo) {
                // Возвращаем цвет
                gameObject.setFillStyle(0x333333);
                
                // Если блок не размещен, возвращаем на исходную позицию
                if (!blockInfo.block.placed) {
                    gameObject.x = blockInfo.block.originalX;
                    gameObject.y = blockInfo.block.originalY;
                    blockInfo.block.textObject.x = blockInfo.block.originalX;
                    blockInfo.block.textObject.y = blockInfo.block.originalY;
                }
            }
        });
        
        // Событие входа в зону
        this.scene.input.on('dragenter', (pointer, gameObject, dropZone) => {
            // Подсвечиваем зону при входе блока
            dropZone.setFillStyle(0x444444);
        });
        
        // Событие выхода из зоны
        this.scene.input.on('dragleave', (pointer, gameObject, dropZone) => {
            // Возвращаем цвет зоны
            dropZone.setFillStyle(0x222222);
        });
        
        // Событие сброса в зону
        this.scene.input.on('drop', (pointer, gameObject, dropZone) => {
            // Находим блок по объекту фона
            const blockInfo = this.findBlockByBackground(gameObject);
            
            // Если зона не занята, размещаем блок
            if (blockInfo && dropZone.block === null) {
                // Центрируем блок в зоне
                gameObject.x = dropZone.x;
                gameObject.y = dropZone.y;
                blockInfo.block.textObject.x = dropZone.x;
                blockInfo.block.textObject.y = dropZone.y;
                
                // Отмечаем блок как размещенный
                blockInfo.block.placed = true;
                blockInfo.block.zone = dropZone;
                
                // Отмечаем зону как занятую
                dropZone.block = blockInfo.block;
                
                // Обновляем текущую последовательность
                this.updateCurrentSequence();
                
                // Проверяем завершение игры
                this.checkCompletion();
            } else {
                // Если зона занята или что-то пошло не так, возвращаем блок
                gameObject.x = blockInfo.block.originalX;
                gameObject.y = blockInfo.block.originalY;
                blockInfo.block.textObject.x = blockInfo.block.originalX;
                blockInfo.block.textObject.y = blockInfo.block.originalY;
            }
            
            // Возвращаем цвет зоны
            dropZone.setFillStyle(0x222222);
        });
    }
    
    /**
     * Поиск информации о блоке по его фону
     * @param {Phaser.GameObjects.Rectangle} background - Фон блока
     * @returns {object|null} - Информация о блоке или null
     */
    findBlockByBackground(background) {
        for (const blockInfo of this.graphics.blocks) {
            if (blockInfo.background === background) {
                return blockInfo;
            }
        }
        return null;
    }
    
    /**
     * Очистка зоны (удаление размещенного блока)
     * @param {Phaser.GameObjects.Rectangle} zone - Зона для очистки
     */
    clearZone(zone) {
        if (zone && zone.block) {
            zone.block = null;
        }
    }
    
    /**
     * Обновление текущей последовательности блоков
     */
    updateCurrentSequence() {
        this.state.currentSequence = [];
        
        // Проходим по всем зонам и собираем ID размещенных блоков
        for (const zoneInfo of this.graphics.dropZones) {
            const { zone } = zoneInfo;
            if (zone.block) {
                this.state.currentSequence.push(zone.block.id);
            } else {
                this.state.currentSequence.push(null);
            }
        }
        
        // Вызываем колбэк прогресса
        if (this.config.onProgress) {
            // Вычисляем процент заполненных зон
            const filledZones = this.state.currentSequence.filter(id => id !== null).length;
            const progress = filledZones / this.state.correctSequence.length * 100;
            this.config.onProgress(progress);
        }
    }
    
    /**
     * Проверка завершения игры
     */
    checkCompletion() {
        // Проверяем, все ли зоны заполнены
        const allZonesFilled = this.state.currentSequence.every(id => id !== null);
        
        if (allZonesFilled) {
            // Проверяем правильность последовательности
            const isCorrect = this.state.currentSequence.every((id, index) => 
                id === this.state.correctSequence[index].id);
            
            if (isCorrect) {
                // Успешное завершение
                this.state.completed = true;
                this.stopTimer();
                
                // Показываем анимацию успеха
                this.showCompletionAnimation();
                
                // Вызываем колбэк успеха
                if (this.config.onSuccess) {
                    this.config.onSuccess();
                }
            } else {
                // Неправильная последовательность
                this.showErrorAnimation();
            }
        }
    }
    
    /**
     * Показ анимации завершения
     */
    showCompletionAnimation() {
        // Подсвечиваем блоки
        for (let i = 0; i < this.graphics.dropZones.length; i++) {
            const zoneInfo = this.graphics.dropZones[i];
            
            if (zoneInfo.zone.block) {
                // Анимация пульсации блока
                this.scene.tweens.add({
                    targets: zoneInfo.zone.block.background,
                    fillColor: 0x00FF41,
                    duration: 300,
                    delay: i * 100,
                    yoyo: true,
                    repeat: 1
                });
                
                // Анимация текста
                this.scene.tweens.add({
                    targets: zoneInfo.zone.block.textObject,
                    scale: 1.2,
                    duration: 300,
                    delay: i * 100,
                    yoyo: true,
                    repeat: 1
                });
            }
        }
        
        // Добавляем текст успеха
        const successText = this.scene.add.text(
            0, 0,
            'КОД УСПЕШНО ВНЕДРЕН!',
            {
                fontFamily: 'monospace',
                fontSize: 24,
                color: '#00FF41',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 }
            }
        );
        successText.setOrigin(0.5);
        this.container.add(successText);
        
        // Анимация появления текста
        successText.alpha = 0;
        this.scene.tweens.add({
            targets: successText,
            alpha: 1,
            y: -20,
            duration: 500
        });
    }
    
    /**
     * Показ анимации ошибки
     */
    showErrorAnimation() {
        // Анимация встряски блоков
        for (const zoneInfo of this.graphics.dropZones) {
            if (zoneInfo.zone.block) {
                // Определяем, верно ли размещен блок
                const correctId = this.state.correctSequence[zoneInfo.zone.zoneId].id;
                const isCorrect = zoneInfo.zone.block.id === correctId;
                
                if (!isCorrect) {
                    // Подсвечиваем неверный блок
                    this.scene.tweens.add({
                        targets: zoneInfo.zone.block.background,
                        x: '+=10',
                        duration: 50,
                        yoyo: true,
                        repeat: 3,
                        onComplete: () => {
                            zoneInfo.zone.block.background.setFillStyle(0xFF073A, 0.5);
                            // Возвращаем нормальный цвет через время
                            this.scene.time.delayedCall(500, () => {
                                zoneInfo.zone.block.background.setFillStyle(0x333333);
                            });
                        }
                    });
                }
            }
        }
        
        // Увеличиваем счетчик ошибок или применяем штраф по времени
        this.state.timeLeft = Math.max(1, this.state.timeLeft - 5); // Штраф 5 секунд
        this.updateTimerDisplay();
    }
    
    /**
     * Создание таймера
     */
    createTimer() {
        // Создаем текст таймера
        this.graphics.timer = this.scene.add.text(
            0, -this.config.height / 2 - 10,
            `Время: ${this.state.timeLeft}`,
            {
                fontFamily: 'monospace',
                fontSize: 16,
                color: '#FFFFFF'
            }
        );
        this.graphics.timer.setOrigin(0.5, 1);
        this.container.add(this.graphics.timer);
    }
    
    /**
     * Показ инструкций
     */
    showInstructions() {
        // Создаем текст инструкций
        const instructions = this.scene.add.text(
            0, this.config.height / 2 + 10,
            'Перетащите блоки кода в правильном порядке справа.\nИспользуйте только подходящие блоки для успешного внедрения кода.',
            {
                fontFamily: 'monospace',
                fontSize: 14,
                color: '#FFFFFF',
                align: 'center'
            }
        );
        instructions.setOrigin(0.5, 0);
        this.container.add(instructions);
    }
    
    /**
     * Запуск игры
     */
    startGame() {
        this.state.active = true;
        this.startTimer();
    }
    
    /**
     * Запуск таймера
     */
    startTimer() {
        // Сбрасываем время
        this.state.timeLeft = this.difficultyParams.timeLimit;
        this.updateTimerDisplay();
        
        // Запускаем интервал обновления
        this.timerInterval = this.scene.time.addEvent({
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
        // Уменьшаем оставшееся время
        this.state.timeLeft--;
        this.updateTimerDisplay();
        
        // Проверяем истечение времени
        if (this.state.timeLeft <= 0) {
            this.timeOut();
        }
    }
    
    /**
     * Обновление отображения таймера
     */
    updateTimerDisplay() {
        this.graphics.timer.setText(`Время: ${this.state.timeLeft}`);
        
        // Меняем цвет при приближении к концу времени
        if (this.state.timeLeft <= 10) {
            this.graphics.timer.setColor('#FF073A');
        }
    }
    
    /**
     * Остановка таймера
     */
    stopTimer() {
        if (this.timerInterval) {
            this.timerInterval.remove();
            this.timerInterval = null;
        }
    }
    
    /**
     * Обработка истечения времени
     */
    timeOut() {
        this.state.failed = true;
        this.state.active = false;
        this.stopTimer();
        
        // Показываем анимацию неудачи
        this.showFailAnimation();
        
        // Вызываем колбэк неудачи
        if (this.config.onFail) {
            this.config.onFail();
        }
    }
    
    /**
     * Показ анимации неудачи
     */
    showFailAnimation() {
        // Затемняем игровое поле
        const overlay = this.scene.add.rectangle(
            0, 0,
            this.config.width, this.config.height,
            0x000000, 0.7
        );
        overlay.setOrigin(0.5);
        this.container.add(overlay);
        
        // Добавляем текст неудачи
        const failText = this.scene.add.text(
            0, 0,
            'ВНЕДРЕНИЕ ПРЕРВАНО!',
            {
                fontFamily: 'monospace',
                fontSize: 24,
                color: '#FF073A',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 }
            }
        );
        failText.setOrigin(0.5);
        this.container.add(failText);
        
        // Анимация появления текста
        failText.alpha = 0;
        this.scene.tweens.add({
            targets: failText,
            alpha: 1,
            y: -20,
            duration: 500
        });
        
        // Эффект глитча
        if (this.scene.game.globals && this.scene.game.globals.glitch) {
            this.scene.game.globals.glitch.applyToPhaserObject(
                this.scene,
                overlay,
                { intensity: 0.5, duration: 1000 }
            );
        }
    }
    
    /**
     * Перемешивание массива
     * @param {array} array - Массив для перемешивания
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    /**
     * Обновление логики игры
     */
    update() {
        // В базовой версии не требуется дополнительная логика обновления
    }
    
    /**
     * Сброс игры
     */
    reset() {
        this.stopTimer();
        this.init();
    }
    
    /**
     * Уничтожение объекта игры
     */
    destroy() {
        this.stopTimer();
        this.container.destroy();
    }
}