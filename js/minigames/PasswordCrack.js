/**
 * PasswordCrack - класс мини-игры по взлому пароля
 * Реализует механику поиска правильного символа в сетке
 */
class PasswordCrack {
    /**
     * Конструктор класса PasswordCrack
     * @param {Phaser.Scene} scene - Сцена Phaser
     * @param {object} config - Конфигурация мини-игры
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        
        // Настройки по умолчанию
        this.config = {
            x: config.x || this.scene.cameras.main.width / 2,
            y: config.y || this.scene.cameras.main.height / 2 - 50,
            difficulty: config.difficulty || 'normal',
            onSuccess: config.onSuccess || null,
            onFail: config.onFail || null,
            onProgress: config.onProgress || null
        };
        
        // Размер сетки в зависимости от сложности
        this.gridSize = {
            'easy': 4,
            'normal': 5,
            'hard': 6
        }[this.config.difficulty];
        
        // Состояние игры
        this.state = {
            attempts: 0,
            maxAttempts: {
                'easy': 5,
                'normal': 3,
                'hard': 2
            }[this.config.difficulty],
            passwordFound: false,
            passwordPosition: { x: 0, y: 0 },
            correctSymbol: '',
            gridCells: []
        };
        
        // Контейнер для элементов
        this.container = this.scene.add.container(this.config.x, this.config.y);
        
        // Инициализация игры
        this.init();
    }
    
    /**
     * Инициализация игры
     */
    init() {
        // Очищаем контейнер
        this.container.removeAll(true);
        
        // Генерируем пароль (позицию правильного символа в сетке)
        this.state.passwordPosition = {
            x: Math.floor(Math.random() * this.gridSize),
            y: Math.floor(Math.random() * this.gridSize)
        };
        
        // Размер ячейки
        const cellSize = 50;
        
        // Получаем генератор символов из сцены или создаем новый
        this.textGenerator = this.scene.game.globals.textGenerator || new TextGenerator();
        
        // Создаем сетку с символами
        this.state.gridCells = [];
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                // Вычисляем позицию ячейки
                const cellX = (x - this.gridSize / 2 + 0.5) * cellSize;
                const cellY = (y - this.gridSize / 2 + 0.5) * cellSize;
                
                // Создаем фон ячейки
                const cell = this.scene.add.rectangle(
                    cellX, cellY,
                    cellSize - 4,
                    cellSize - 4,
                    0x333333
                );
                
                // Создаем символ
                let symbol;
                if (x === this.state.passwordPosition.x && y === this.state.passwordPosition.y) {
                    // Правильный символ (целевой)
                    symbol = this.textGenerator.getRandomChar('matrix');
                    this.state.correctSymbol = symbol;
                } else {
                    // Случайный символ
                    symbol = this.textGenerator.getRandomChar('matrix');
                }
                
                // Добавляем текст
                const text = this.scene.add.text(
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
                    this.checkCell(x, y, cell, text);
                });
                
                // Эффект при наведении
                cell.on('pointerover', () => {
                    cell.setFillStyle(0x555555);
                });
                
                cell.on('pointerout', () => {
                    cell.setFillStyle(0x333333);
                });
                
                // Добавляем элементы в контейнер
                this.container.add(cell);
                this.container.add(text);
                
                // Сохраняем ячейку для дальнейшего использования
                this.state.gridCells.push({ cell, text, x, y });
            }
        }
        
        // Подсказка
        const hint = this.scene.add.text(
            0,
            (this.gridSize / 2 + 1) * cellSize,
            'Найдите правильный символ. "Горячая" область подсвечивается при приближении.',
            {
                fontFamily: 'monospace',
                fontSize: 16,
                color: '#FFFFFF',
                align: 'center'
            }
        );
        hint.setOrigin(0.5);
        this.container.add(hint);
        
        // Сбрасываем состояние игры
        this.state.attempts = 0;
        this.state.passwordFound = false;
    }
    
    /**
     * Проверка выбранной ячейки
     * @param {number} x - Координата X ячейки
     * @param {number} y - Координата Y ячейки
     * @param {Phaser.GameObjects.Rectangle} cell - Ячейка
     * @param {Phaser.GameObjects.Text} text - Текст символа
     */
    checkCell(x, y, cell, text) {
        // Если пароль уже найден, выходим
        if (this.state.passwordFound) return;
        
        // Проверяем, является ли выбранная ячейка правильной
        if (x === this.state.passwordPosition.x && y === this.state.passwordPosition.y) {
            // Правильная ячейка
            cell.setFillStyle(0x00FF41);
            text.setColor('#FFFFFF');
            
            // Устанавливаем флаг найденного пароля
            this.state.passwordFound = true;
            
            // Анимация успешного выбора
            this.scene.tweens.add({
                targets: [cell, text],
                scale: 1.2,
                duration: 200,
                yoyo: true,
                onComplete: () => {
                    // Вызываем колбэк успеха
                    if (this.config.onSuccess) {
                        this.config.onSuccess(this.state.correctSymbol);
                    }
                }
            });
        } else {
            // Неправильная ячейка
            cell.setFillStyle(0xFF073A);
            
            // Увеличиваем счетчик попыток
            this.state.attempts++;
            
            // Анимация неудачного выбора
            this.scene.tweens.add({
                targets: cell,
                alpha: 0.5,
                duration: 200,
                yoyo: true,
                repeat: 2
            });
            
            // Вычисляем "расстояние" до правильной ячейки
            const distance = Math.abs(x - this.state.passwordPosition.x) + Math.abs(y - this.state.passwordPosition.y);
            
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
            const hintText = this.scene.add.text(
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
            this.container.add(hintText);
            
            // Скрываем подсказку через некоторое время
            this.scene.time.delayedCall(1000, () => {
                hintText.destroy();
            });
            
            // Проверяем, не превышено ли максимальное количество попыток
            if (this.state.attempts >= this.state.maxAttempts) {
                // Вызываем колбэк неудачи
                if (this.config.onFail) {
                    this.config.onFail();
                }
            } else {
                // Вызываем колбэк прогресса
                if (this.config.onProgress) {
                    this.config.onProgress(this.state.attempts, this.state.maxAttempts);
                }
            }
        }
    }
    
    /**
     * Обновление логики игры
     * @param {Phaser.Input.Pointer} pointer - Указатель (мышь/тач)
     */
    update(pointer) {
        // Если пароль уже найден или указатель неактивен, выходим
        if (this.state.passwordFound || !pointer.active) return;
        
        // Конвертируем координаты в локальные для контейнера
        const containerPoint = this.container.getLocalPoint(pointer.x, pointer.y);
        
        // Сбрасываем подсветку всех ячеек
        for (const cellInfo of this.state.gridCells) {
            // Если ячейка уже выбрана, не сбрасываем ее цвет
            if (cellInfo.cell.fillColor === 0x00FF41 || cellInfo.cell.fillColor === 0xFF073A) {
                continue;
            }
            cellInfo.cell.setFillStyle(0x333333);
        }
        
        let closestCell = null;
        let minDistance = Infinity;
        
        // Проходим по всем ячейкам и находим ближайшую к указателю
        for (const cellInfo of this.state.gridCells) {
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
            const targetDistance = Math.abs(closestCell.x - this.state.passwordPosition.x) + 
                                  Math.abs(closestCell.y - this.state.passwordPosition.y);
            
            // Изменяем цвет в зависимости от расстояния, если ячейка еще не выбрана
            if (closestCell.cell.fillColor !== 0x00FF41 && closestCell.cell.fillColor !== 0xFF073A) {
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
    
    /**
     * Сброс игры
     */
    reset() {
        this.init();
    }
    
    /**
     * Уничтожение объекта игры
     */
    destroy() {
        this.container.destroy();
    }
}