/**
 * NetworkTrace - класс мини-игры по трассировке сети
 * Реализует механику поиска пути в сетевом лабиринте
 */
class NetworkTrace {
    /**
     * Конструктор класса NetworkTrace
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
                gridSize: 6,
                connections: 3, // Количество соединений между узлами
                nodeTypes: 3,   // Количество типов узлов
                timeLimit: 60   // Время в секундах
            },
            'normal': {
                gridSize: 8,
                connections: 2,
                nodeTypes: 4,
                timeLimit: 45
            },
            'hard': {
                gridSize: 10,
                connections: 2,
                nodeTypes: 5,
                timeLimit: 30
            }
        }[this.config.difficulty];
        
        // Состояние игры
        this.state = {
            active: false,
            completed: false,
            failed: false,
            currentPath: [],
            targetPath: [],
            startNode: null,
            endNode: null,
            timeLeft: this.difficultyParams.timeLimit,
            grid: []
        };
        
        // Графические элементы
        this.graphics = {
            nodes: [],
            connections: [],
            path: null,
            timer: null
        };
        
        // Контейнер для элементов
        this.container = this.scene.add.container(this.config.x, this.config.y);
        
        // Интервал обновления таймера
        this.timerInterval = null;
        
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
        
        // Создаем сетку узлов
        this.generateGrid();
        
        // Создаем узлы и соединения
        this.createNodes();
        
        // Создаем таймер
        this.createTimer();
        
        // Определяем целевой путь
        this.generateTargetPath();
        
        // Отображаем инструкции
        this.showInstructions();
        
        // Запускаем игру
        this.startGame();
    }
    
    /**
     * Генерация сетки узлов
     */
    generateGrid() {
        const { gridSize } = this.difficultyParams;
        const cellWidth = this.config.width / (gridSize + 1);
        const cellHeight = this.config.height / (gridSize + 1);
        
        this.state.grid = [];
        
        // Создаем сетку узлов
        for (let y = 0; y < gridSize; y++) {
            const row = [];
            for (let x = 0; x < gridSize; x++) {
                // Определяем позицию узла
                const nodeX = (x - (gridSize - 1) / 2) * cellWidth;
                const nodeY = (y - (gridSize - 1) / 2) * cellHeight;
                
                // Определяем тип узла (случайно)
                const nodeType = Math.floor(Math.random() * this.difficultyParams.nodeTypes);
                
                // Создаем узел
                const node = {
                    x: nodeX,
                    y: nodeY,
                    gridX: x,
                    gridY: y,
                    type: nodeType,
                    active: false,
                    connections: []
                };
                
                row.push(node);
            }
            this.state.grid.push(row);
        }
        
        // Создаем соединения между узлами
        this.generateConnections();
    }
    
    /**
     * Генерация соединений между узлами
     */
    generateConnections() {
        const { gridSize, connections } = this.difficultyParams;
        
        // Для каждого узла создаем соединения
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const node = this.state.grid[y][x];
                
                // Создаем список возможных соседей
                const possibleNeighbors = [];
                
                // Добавляем соседей в списки (вверх, вниз, влево, вправо)
                if (y > 0) possibleNeighbors.push(this.state.grid[y - 1][x]); // Вверх
                if (y < gridSize - 1) possibleNeighbors.push(this.state.grid[y + 1][x]); // Вниз
                if (x > 0) possibleNeighbors.push(this.state.grid[y][x - 1]); // Влево
                if (x < gridSize - 1) possibleNeighbors.push(this.state.grid[y][x + 1]); // Вправо
                
                // Перемешиваем список возможных соседей
                this.shuffleArray(possibleNeighbors);
                
                // Создаем заданное количество соединений или меньше, если соседей недостаточно
                const numConnections = Math.min(connections, possibleNeighbors.length);
                for (let i = 0; i < numConnections; i++) {
                    const neighbor = possibleNeighbors[i];
                    
                    // Добавляем соединение, если его еще нет
                    if (!this.hasConnection(node, neighbor)) {
                        node.connections.push(neighbor);
                        neighbor.connections.push(node);
                    }
                }
            }
        }
    }
    
    /**
     * Проверка наличия соединения между узлами
     * @param {object} node1 - Первый узел
     * @param {object} node2 - Второй узел
     * @returns {boolean} - Есть ли соединение
     */
    hasConnection(node1, node2) {
        return node1.connections.includes(node2) || node2.connections.includes(node1);
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
     * Создание визуальных представлений узлов и соединений
     */
    createNodes() {
        const { gridSize } = this.difficultyParams;
        const nodeRadius = 15;
        
        // Для каждого узла создаем визуальное представление
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const node = this.state.grid[y][x];
                
                // Создаем соединения
                for (const connection of node.connections) {
                    // Создаем только одно соединение для каждой пары узлов
                    if (connection.gridX > node.gridX || connection.gridY > node.gridY) {
                        const line = this.scene.add.graphics();
                        line.lineStyle(2, 0x4A4A4A, 0.8);
                        line.lineBetween(node.x, node.y, connection.x, connection.y);
                        this.container.add(line);
                        this.graphics.connections.push(line);
                    }
                }
                
                // Определяем цвет узла в зависимости от типа
                const nodeColors = [0x00BFFF, 0x00FF41, 0xFFFF00, 0xFF073A, 0xFF00FF];
                const nodeColor = nodeColors[node.type];
                
                // Создаем графический объект узла
                const circle = this.scene.add.circle(node.x, node.y, nodeRadius, nodeColor, 0.8);
                circle.setInteractive();
                
                // Добавляем текст с типом узла
                const text = this.scene.add.text(
                    node.x, node.y,
                    node.type.toString(),
                    {
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: '#FFFFFF'
                    }
                );
                text.setOrigin(0.5);
                
                // Добавляем обработчики событий
                circle.on('pointerover', () => {
                    circle.setScale(1.2);
                });
                
                circle.on('pointerout', () => {
                    circle.setScale(1);
                });
                
                circle.on('pointerdown', () => {
                    this.selectNode(node, circle);
                });
                
                // Сохраняем ссылки на графические объекты
                node.circle = circle;
                node.text = text;
                
                // Добавляем в контейнер
                this.container.add(circle);
                this.container.add(text);
                this.graphics.nodes.push({ circle, text });
            }
        }
        
        // Выбираем начальный и конечный узлы
        this.selectStartEndNodes();
    }
    
    /**
     * Выбор начального и конечного узлов
     */
    selectStartEndNodes() {
        const { gridSize } = this.difficultyParams;
        
        // Выбираем случайный узел на левой стороне сетки
        const startY = Math.floor(Math.random() * gridSize);
        this.state.startNode = this.state.grid[startY][0];
        
        // Выбираем случайный узел на правой стороне сетки
        const endY = Math.floor(Math.random() * gridSize);
        this.state.endNode = this.state.grid[endY][gridSize - 1];
        
        // Отмечаем узлы визуально
        this.state.startNode.circle.setStrokeStyle(3, 0x00FF41);
        this.state.endNode.circle.setStrokeStyle(3, 0xFF073A);
        
        // Добавляем метки
        const startLabel = this.scene.add.text(
            this.state.startNode.x, this.state.startNode.y - 25,
            'ВХОД',
            {
                fontFamily: 'monospace',
                fontSize: 12,
                color: '#00FF41'
            }
        );
        startLabel.setOrigin(0.5);
        
        const endLabel = this.scene.add.text(
            this.state.endNode.x, this.state.endNode.y - 25,
            'ВЫХОД',
            {
                fontFamily: 'monospace',
                fontSize: 12,
                color: '#FF073A'
            }
        );
        endLabel.setOrigin(0.5);
        
        this.container.add(startLabel);
        this.container.add(endLabel);
        
        // Автоматически добавляем начальный узел в путь
        this.state.currentPath.push(this.state.startNode);
        this.state.startNode.active = true;
    }
    
    /**
     * Генерация целевого пути
     * Находим возможный путь от начального узла к конечному
     */
    generateTargetPath() {
        // Сбрасываем посещенные узлы
        const { gridSize } = this.difficultyParams;
        const visited = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
        
        // Запускаем поиск пути
        this.findPath(this.state.startNode, this.state.endNode, [], visited);
        
        // Если путь не найден, пытаемся снова с другими соединениями
        if (this.state.targetPath.length === 0) {
            // Регенерируем соединения
            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    this.state.grid[y][x].connections = [];
                }
            }
            this.generateConnections();
            
            // Пытаемся найти путь снова
            this.findPath(this.state.startNode, this.state.endNode, [], visited);
        }
    }
    
    /**
     * Рекурсивный алгоритм поиска пути
     * @param {object} current - Текущий узел
     * @param {object} end - Конечный узел
     * @param {array} path - Текущий путь
     * @param {array} visited - Матрица посещенных узлов
     * @returns {boolean} - Найден ли путь
     */
    findPath(current, end, path, visited) {
        // Добавляем текущий узел в путь
        path.push(current);
        
        // Отмечаем как посещенный
        visited[current.gridY][current.gridX] = true;
        
        // Если достигли конечного узла, сохраняем путь
        if (current === end) {
            this.state.targetPath = [...path];
            return true;
        }
        
        // Перебираем все соединения
        for (const next of current.connections) {
            if (!visited[next.gridY][next.gridX]) {
                if (this.findPath(next, end, path, visited)) {
                    return true;
                }
            }
        }
        
        // Если не нашли путь, убираем текущий узел из пути
        path.pop();
        return false;
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
            'Создайте путь от входа к выходу, соединяя узлы одинакового типа.\nНажимайте на узлы чтобы создать путь.',
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
     * Обработка выбора узла
     * @param {object} node - Выбранный узел
     * @param {Phaser.GameObjects.Circle} circle - Графический объект узла
     */
    selectNode(node, circle) {
        // Если игра завершена или не активна, выходим
        if (!this.state.active || this.state.completed || this.state.failed) {
            return;
        }
        
        // Получаем последний узел в текущем пути
        const lastNode = this.state.currentPath[this.state.currentPath.length - 1];
        
        // Проверяем, можно ли добавить узел в путь
        if (this.canAddToPath(node, lastNode)) {
            // Добавляем узел в путь
            this.state.currentPath.push(node);
            node.active = true;
            
            // Подсвечиваем узел
            circle.setFillStyle(circle.fillColor, 1);
            
            // Добавляем линию соединения
            const pathLine = this.scene.add.graphics();
            pathLine.lineStyle(3, 0x00FF41, 0.8);
            pathLine.lineBetween(lastNode.x, lastNode.y, node.x, node.y);
            this.container.add(pathLine);
            
            // Если это конечный узел, проверяем завершение игры
            if (node === this.state.endNode) {
                this.checkCompletion();
            }
            
            // Вызываем колбэк прогресса
            if (this.config.onProgress) {
                const progress = this.state.currentPath.length / this.state.targetPath.length * 100;
                this.config.onProgress(progress);
            }
        } else {
            // Неверный выбор - показываем индикатор ошибки
            const errorIndicator = this.scene.add.circle(node.x, node.y, 20, 0xFF073A, 0.5);
            this.container.add(errorIndicator);
            
            // Анимация исчезновения
            this.scene.tweens.add({
                targets: errorIndicator,
                alpha: 0,
                scale: 1.5,
                duration: 300,
                onComplete: () => {
                    errorIndicator.destroy();
                }
            });
        }
    }
    
    /**
     * Проверка возможности добавления узла в путь
     * @param {object} node - Проверяемый узел
     * @param {object} lastNode - Последний узел в пути
     * @returns {boolean} - Можно ли добавить узел
     */
    canAddToPath(node, lastNode) {
        // Если узел уже в пути, нельзя его добавить снова
        if (node.active) {
            return false;
        }
        
        // Проверяем, есть ли соединение между узлами
        if (!this.hasConnection(node, lastNode)) {
            return false;
        }
        
        // Проверяем, совпадают ли типы узлов
        return node.type === lastNode.type || node === this.state.endNode;
    }
    
    /**
     * Проверка завершения игры
     */
    checkCompletion() {
        this.state.completed = true;
        this.stopTimer();
        
        // Показываем анимацию успеха
        this.showCompletionAnimation();
        
        // Вызываем колбэк успеха
        if (this.config.onSuccess) {
            this.config.onSuccess();
        }
    }
    
    /**
     * Показ анимации завершения
     */
    showCompletionAnimation() {
        // Подсвечиваем весь путь
        for (let i = 0; i < this.state.currentPath.length; i++) {
            const node = this.state.currentPath[i];
            
            // Анимация пульсации узла
            this.scene.tweens.add({
                targets: node.circle,
                scale: 1.3,
                duration: 300,
                delay: i * 100,
                yoyo: true,
                repeat: 1
            });
        }
        
        // Добавляем текст успеха
        const successText = this.scene.add.text(
            0, 0,
            'СОЕДИНЕНИЕ УСТАНОВЛЕНО!',
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
            'СОЕДИНЕНИЕ ПРЕРВАНО!',
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