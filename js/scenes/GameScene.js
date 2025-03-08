/**
 * GameScene - основная игровая сцена
 * Отвечает за генерацию уровня, отображение игрока и игровых объектов
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    init(data) {
        // Получаем данные из предыдущей сцены
        this.isTutorial = data.tutorial || false;
        
        // Инициализируем основные объекты
        this.player = null;
        this.objects = {
            dataPacks: [],
            firewalls: [],
            terminals: []
        };
        
        // Флаг, указывающий, что уровень полностью загружен
        this.levelLoaded = false;
        
        // Настройки управления
        this.controls = {
            up: null,
            down: null,
            left: null,
            right: null,
            interact: null
        };
        
        // Флаг открытия терминала
        this.terminalOpen = false;
    }
    
    create() {
        // Создаем эффект "матричного дождя" в фоне
        this.matrixEffect = new MatrixEffect(this, {
            width: this.cameras.main.width,
            height: this.cameras.main.height,
            fontSize: 14,
            depth: 0,
            density: 0.5, // Снижаем плотность для лучшей производительности в игре
            interactive: true
        });
        
        // Создаем интерфейс терминала (будет скрыт до вызова)
        this.terminal = new Terminal(this, {
            x: this.cameras.main.width / 2 - 400,
            y: this.cameras.main.height / 2 - 300,
            width: 800,
            height: 600,
            depth: 100, // Выше других элементов
            fontSize: 16,
            promptText: '[ИГРОК@СИСТЕМА]$',
            backgroundColor: 'rgba(0, 0, 0, 0.9)'
        });
        
        // Скрываем терминал по умолчанию
        this.terminal.setVisible(false);
        
        // Генерируем уровень
        this.generateLevel();
        
        // Настраиваем клавиши управления
        this.setupControls();
        
        // Отображаем стартовую информацию
        this.showStartInfo();
        
        // Настраиваем систему столкновений
        this.setupCollisions();
        
        // Настраиваем камеру
        this.cameras.main.startFollow(this.player);
        
        // Добавляем событие паузы по клавише ESC
        this.input.keyboard.on('keydown-ESC', this.togglePause, this);
        
        // Добавляем событие вызова терминала по клавише TAB
        this.input.keyboard.on('keydown-TAB', this.toggleTerminal, this);
                
        // Добавляем обработчик изменения размера окна
        this.scale.on('resize', this.handleResize, this);
    }
    
    /**
     * Генерация игрового уровня
     */
    generateLevel() {
        // Определяем настройки для генератора уровней
        const levelConfig = {
            width: 50,
            height: 50,
            minRooms: 5,
            maxRooms: 10,
            minRoomSize: 4,
            maxRoomSize: 8,
            difficulty: this.game.globals.settings.difficulty,
            levelType: 'network'
        };
        
        // Создаем генератор уровней
        const generator = new LevelGenerator(levelConfig);
        
        // Генерируем уровень
        const level = generator.generateLevel();
        
        // Сохраняем сгенерированный уровень
        this.level = level;
        this.game.globals.gameState.currentLevel = level;
        
        // Создаем игровое поле
        this.createGameField(level);
        
        // Создаем игрока
        this.createPlayer(level.startPosition);
        
        // Размещаем объекты на уровне
        this.placeObjects(level.objects);
        
        // Установка флага загрузки уровня
        this.levelLoaded = true;
    }
    
    /**
     * Создание игрового поля на основе карты уровня
     * @param {object} level - Объект сгенерированного уровня
     */
    createGameField(level) {
        // Размер ячейки для отображения
        const cellSize = 32;
        
        // Создаем группы для разных типов тайлов
        this.fieldElements = {
            walls: this.physics.add.staticGroup(),
            floors: this.add.group(),
            doors: this.physics.add.staticGroup()
        };
        
        // Проходим по карте и создаем соответствующие элементы
        for (let y = 0; y < level.map.length; y++) {
            for (let x = 0; x < level.map[y].length; x++) {
                const symbol = level.map[y][x];
                const posX = x * cellSize + cellSize / 2;
                const posY = y * cellSize + cellSize / 2;
                
                switch (symbol) {
                    case '#': // Стена
                        this.createWall(posX, posY, cellSize);
                        break;
                    case '.': // Пол
                        this.createFloor(posX, posY, cellSize);
                        break;
                    case '+': // Дверь
                        this.createDoor(posX, posY, cellSize);
                        break;
                }
            }
        }
        
        // Устанавливаем границы мира на основе размера карты
        this.physics.world.setBounds(
            0, 0,
            level.width * cellSize,
            level.height * cellSize
        );
    }
    
    /**
     * Создание стены
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @param {number} size - Размер ячейки
     */
    createWall(x, y, size) {
        const wall = this.fieldElements.walls.create(x, y, null);
        
        // Настраиваем физическое тело
        wall.setSize(size, size);
        wall.refreshBody();
        
        // Визуальное представление (генерация символов)
        const wallColor = '#066364';
        const text = this.add.text(x, y, '#', {
            fontFamily: 'monospace',
            fontSize: size * 0.8,
            color: wallColor
        });
        text.setOrigin(0.5);
        text.setDepth(10);
        
        // Добавляем эффект мерцания с минимальной интенсивностью
        this.tweens.add({
            targets: text,
            alpha: 0.7,
            duration: 1500 + Math.random() * 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    /**
     * Создание пола
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @param {number} size - Размер ячейки
     */
    createFloor(x, y, size) {
        // Для пола используем просто символ без коллизий
        const floorColor = '#0A4A4C';
        const text = this.add.text(x, y, '.', {
            fontFamily: 'monospace',
            fontSize: size * 0.5,
            color: floorColor
        });
        text.setOrigin(0.5);
        text.setDepth(5);
        
        this.fieldElements.floors.add(text);
    }
    
    /**
     * Создание двери
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @param {number} size - Размер ячейки
     */
    createDoor(x, y, size) {
        const door = this.fieldElements.doors.create(x, y, null);
        
        // Настройка физического тела (сначала без коллизии)
        door.setSize(size, size);
        door.refreshBody();
        door.body.enable = false; // Дверь по умолчанию открыта
        
        // Визуальное представление
        const doorColor = '#00BFFF';
        const text = this.add.text(x, y, '+', {
            fontFamily: 'monospace',
            fontSize: size * 0.8,
            color: doorColor
        });
        text.setOrigin(0.5);
        text.setDepth(10);
        
        // Добавляем эффект мерцания
        this.tweens.add({
            targets: text,
            alpha: 0.6,
            duration: 500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Сохраняем ссылку на текст в объекте двери
        door.text = text;
    }
    
    /**
     * Создание игрока
     * @param {object} position - Начальная позиция игрока {x, y}
     */
    createPlayer(position) {
        // Размер ячейки
        const cellSize = 32;
        
        // Создаем спрайт игрока
        this.player = this.physics.add.sprite(
            position.x * cellSize + cellSize / 2,
            position.y * cellSize + cellSize / 2,
            null
        );
        
        // Настройка физического тела
        this.player.setSize(cellSize * 0.7, cellSize * 0.7);
        this.player.setCollideWorldBounds(true);
        
        // Визуальное представление - символ '@'
        const playerColor = '#00FF41';
        const text = this.add.text(0, 0, '@', {
            fontFamily: 'monospace',
            fontSize: cellSize * 0.8,
            color: playerColor
        });
        text.setOrigin(0.5);
        text.setDepth(20);
        
        // Привязываем текст к игроку
        this.player.text = text;
        
        // Добавляем эффект свечения
        const glowEffect = this.add.graphics();
        this.player.glowEffect = glowEffect;
        this.player.glowEffect.setDepth(15);
        
        // Обновляем позицию текста и свечения при обновлении сцены
        this.player.update = () => {
            text.setPosition(this.player.x, this.player.y);
            
            // Обновление эффекта свечения
            glowEffect.clear();
            glowEffect.fillStyle(0x00FF41, 0.1);
            glowEffect.fillCircle(this.player.x, this.player.y, cellSize * 0.6);
        };
        
        // Сохраняем начальную позицию игрока
        this.game.globals.player.currentPosition = {
            x: position.x,
            y: position.y
        };
    }
    
    /**
     * Размещение объектов на уровне
     * @param {array} objects - Массив объектов из генератора уровня
     */
    placeObjects(objects) {
        const cellSize = 32;
        
        // Проходим по всем объектам и создаем их
        objects.forEach(obj => {
            const x = obj.x * cellSize + cellSize / 2;
            const y = obj.y * cellSize + cellSize / 2;
            
            switch (obj.type) {
                case 'dataPacket':
                    this.createDataPacket(x, y, cellSize);
                    break;
                case 'firewall':
                    this.createFirewall(x, y, cellSize);
                    break;
                case 'terminal':
                    this.createTerminalObject(x, y, cellSize);
                    break;
            }
        });
    }
    
    /**
     * Создание пакета данных (собираемый объект)
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @param {number} size - Размер ячейки
     */
    createDataPacket(x, y, size) {
        // Создаем объект пакета данных
        const dataPacket = this.physics.add.sprite(x, y, null);
        dataPacket.setSize(size * 0.6, size * 0.6);
        
        // Визуальное представление
        const packetColor = '#FFFF00';
        const text = this.add.text(x, y, 'D', {
            fontFamily: 'monospace',
            fontSize: size * 0.6,
            color: packetColor
        });
        text.setOrigin(0.5);
        text.setDepth(15);
        
        // Добавляем эффект мерцания
        this.tweens.add({
            targets: text,
            alpha: 0.7,
            scale: 1.1,
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Сохраняем ссылку на текст
        dataPacket.text = text;
        
        // Добавляем в группу пакетов данных
        this.objects.dataPacks.push(dataPacket);
    }
    
    /**
     * Создание файрвола (препятствие)
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @param {number} size - Размер ячейки
     */
    createFirewall(x, y, size) {
        // Создаем объект файрвола
        const firewall = this.physics.add.sprite(x, y, null);
        firewall.setSize(size * 0.7, size * 0.7);
        
        // Визуальное представление
        const firewallColor = '#FF073A';
        const text = this.add.text(x, y, 'F', {
            fontFamily: 'monospace',
            fontSize: size * 0.7,
            color: firewallColor
        });
        text.setOrigin(0.5);
        text.setDepth(15);
        
        // Эффект для файрвола - вращение и пульсация
        this.tweens.add({
            targets: text,
            angle: 360,
            duration: 5000,
            repeat: -1
        });
        
        this.tweens.add({
            targets: text,
            scale: 1.2,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Добавляем движение - патрулирование области
        this.setupFirewallMovement(firewall, x, y, size * 3);
        
        // Сохраняем ссылку на текст
        firewall.text = text;
        
        // Добавляем в группу файрволов
        this.objects.firewalls.push(firewall);
    }
    
    /**
     * Настройка движения файрвола - патрулирование
     * @param {Phaser.Physics.Arcade.Sprite} firewall - Объект файрвола
     * @param {number} centerX - Центральная точка X для патрулирования
     * @param {number} centerY - Центральная точка Y для патрулирования
     * @param {number} radius - Радиус патрулирования
     */
    setupFirewallMovement(firewall, centerX, centerY, radius) {
        // Скорость движения
        const speed = 60 + Math.random() * 40;
        
        // Начальный угол
        let angle = Math.random() * Math.PI * 2;
        
        // Сохраняем центр
        firewall.patrolCenter = { x: centerX, y: centerY };
        firewall.patrolRadius = radius;
        firewall.patrolAngle = angle;
        firewall.patrolSpeed = speed / 1000; // Скорость изменения угла
        
        // Метод обновления позиции
        firewall.update = (time, delta) => {
            // Обновляем угол
            firewall.patrolAngle += firewall.patrolSpeed * delta;
            
            // Вычисляем новую позицию
            const newX = firewall.patrolCenter.x + Math.cos(firewall.patrolAngle) * firewall.patrolRadius;
            const newY = firewall.patrolCenter.y + Math.sin(firewall.patrolAngle) * firewall.patrolRadius;
            
            // Устанавливаем позицию
            firewall.setPosition(newX, newY);
            
            // Обновляем позицию текста
            if (firewall.text) {
                firewall.text.setPosition(newX, newY);
            }
        };
    }
    
    /**
     * Создание терминала (объект для взаимодействия)
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @param {number} size - Размер ячейки
     */
    createTerminalObject(x, y, size) {
        // Создаем объект терминала
        const terminalObj = this.physics.add.sprite(x, y, null);
        terminalObj.setSize(size * 0.6, size * 0.6);
        
        // Визуальное представление
        const terminalColor = '#00BFFF';
        const text = this.add.text(x, y, 'T', {
            fontFamily: 'monospace',
            fontSize: size * 0.6,
            color: terminalColor
        });
        text.setOrigin(0.5);
        text.setDepth(15);
        
        // Эффект мигающего курсора
        const cursor = this.add.text(x + size * 0.2, y, '_', {
            fontFamily: 'monospace',
            fontSize: size * 0.6,
            color: terminalColor
        });
        cursor.setOrigin(0.5);
        cursor.setDepth(15);
        
        this.tweens.add({
            targets: cursor,
            alpha: 0,
            duration: 500,
            ease: 'Power1',
            yoyo: true,
            repeat: -1
        });
        
        // Сохраняем ссылки
        terminalObj.text = text;
        terminalObj.cursor = cursor;
        
        // Имитация терминальных сообщений
        terminalObj.messages = [
            'ДОСТУП К СЕТИ',
            'ДАННЫЕ ЗАЩИЩЕНЫ',
            'ТРЕБУЕТСЯ ВЗЛОМ'
        ];
        
        // Добавляем в группу терминалов
        this.objects.terminals.push(terminalObj);
    }
    
    /**
     * Настройка управления
     */
    setupControls() {
        // Настраиваем клавиши WASD и стрелки
        this.controls.up = this.input.keyboard.addKeys(['W', 'UP']);
        this.controls.down = this.input.keyboard.addKeys(['S', 'DOWN']);
        this.controls.left = this.input.keyboard.addKeys(['A', 'LEFT']);
        this.controls.right = this.input.keyboard.addKeys(['D', 'RIGHT']);
        this.controls.interact = this.input.keyboard.addKeys(['E', 'SPACE']);
    }
    
    /**
     * Настройка системы столкновений
     */
    setupCollisions() {
        // Столкновение игрока со стенами
        this.physics.add.collider(this.player, this.fieldElements.walls);
        
        // Столкновение игрока с дверями (если они закрыты)
        this.physics.add.collider(this.player, this.fieldElements.doors);
        
        // Перекрытие с пакетами данных
        this.physics.add.overlap(
            this.player,
            this.objects.dataPacks,
            this.collectDataPacket,
            null,
            this
        );
        
        // Перекрытие с файрволами
        this.physics.add.overlap(
            this.player,
            this.objects.firewalls,
            this.hitFirewall,
            null,
            this
        );
        
        // Перекрытие с терминалами
        this.physics.add.overlap(
            this.player,
            this.objects.terminals,
            this.nearTerminal,
            null,
            this
        );
    }
    
    /**
     * Показать стартовую информацию
     */
    showStartInfo() {
        // Создаем информационное окно
        const infoBox = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            500,
            300,
            0x000000,
            0.8
        );
        infoBox.setDepth(50);
        infoBox.setScrollFactor(0);
        
        // Текст информации
        const infoText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 80,
            'ЦИФРОВОЕ ПРОСТРАНСТВО',
            {
                fontFamily: 'monospace',
                fontSize: 24,
                color: '#00FF41',
                align: 'center'
            }
        );
        infoText.setOrigin(0.5);
        infoText.setDepth(51);
        infoText.setScrollFactor(0);
        
        // Описание уровня
        const levelType = this.level.levelType.toUpperCase();
        const descText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 30,
            `ТИП: ${levelType} | СЛОЖНОСТЬ: ${this.level.difficulty.toUpperCase()}`,
            {
                fontFamily: 'monospace',
                fontSize: 16,
                color: '#00BFFF',
                align: 'center'
            }
        );
        descText.setOrigin(0.5);
        descText.setDepth(51);
        descText.setScrollFactor(0);
        
        // Подсказки по управлению
        const helpText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 20,
            'Управление:\n' +
            'WASD или Стрелки - перемещение\n' +
            'E или Пробел - взаимодействие\n' +
            'TAB - открыть/закрыть терминал\n' +
            'ESC - пауза/меню',
            {
                fontFamily: 'monospace',
                fontSize: 14,
                color: '#FFFFFF',
                align: 'center'
            }
        );
        helpText.setOrigin(0.5);
        helpText.setDepth(51);
        helpText.setScrollFactor(0);
        
        // Текст для начала
        const startText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 120,
            'Нажмите любую клавишу для начала',
            {
                fontFamily: 'monospace',
                fontSize: 16,
                color: '#00FF41',
                align: 'center'
            }
        );
        startText.setOrigin(0.5);
        startText.setDepth(51);
        startText.setScrollFactor(0);
        
        // Анимация мигания текста
        this.tweens.add({
            targets: startText,
            alpha: 0.5,
            duration: 500,
            ease: 'Power1',
            yoyo: true,
            repeat: -1
        });
        
        // Группа элементов информационного окна
        const infoElements = [infoBox, infoText, descText, helpText, startText];
        
        // Обработчик нажатия клавиши для продолжения
        const continueGame = () => {
            // Удаляем обработчик
            this.input.keyboard.off('keydown', continueGame);
            
            // Анимация скрытия информационного окна
            this.tweens.add({
                targets: infoElements,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    // Удаляем элементы
                    infoElements.forEach(element => element.destroy());
                }
            });
        };
        
        // Добавляем обработчик нажатия клавиши
        this.input.keyboard.on('keydown', continueGame);
    }
    
    /**
     * Переключение терминала (открыть/закрыть)
     */
    toggleTerminal() {
        this.terminalOpen = !this.terminalOpen;
        
        // Показываем/скрываем терминал
        this.terminal.setVisible(this.terminalOpen);
        this.terminal.setActive(this.terminalOpen);
        
        // Если терминал открыт, отключаем управление игроком
        if (this.terminalOpen) {
            this.player.setVelocity(0, 0);
        }
    }
    
    /**
     * Переключение паузы
     */
    togglePause() {
        // Если терминал открыт, закрываем его вместо паузы
        if (this.terminalOpen) {
            this.toggleTerminal();
            return;
        }
        
        if (this.scene.isPaused('GameScene')) {
            this.scene.resume('GameScene');
        } else {
            this.scene.pause('GameScene');
            // Здесь можно показать меню паузы
        }
    }
    
    /**
     * Сбор пакета данных
     * @param {Phaser.Physics.Arcade.Sprite} player - Игрок
     * @param {Phaser.Physics.Arcade.Sprite} dataPacket - Пакет данных
     */
    collectDataPacket(player, dataPacket) {
        // Анимация сбора
        this.tweens.add({
            targets: [dataPacket, dataPacket.text],
            scale: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                // Удаляем пакет из массива
                this.objects.dataPacks = this.objects.dataPacks.filter(p => p !== dataPacket);
                
                // Удаляем объекты
                dataPacket.text.destroy();
                dataPacket.destroy();
                
                // Показываем уведомление
                this.showNotification('Данные получены!', '#FFFF00');
                
                // Обновляем счетчик собранных пакетов
                // TODO: Добавить логику подсчета и отображения
            }
        });
    }
    
    /**
     * Столкновение с файрволом
     * @param {Phaser.Physics.Arcade.Sprite} player - Игрок
     * @param {Phaser.Physics.Arcade.Sprite} firewall - Файрвол
     */
    hitFirewall(player, firewall) {
        // Проверяем, не был ли игрок недавно атакован (защита от множественных вызовов)
        if (player.invulnerable) return;
        
        // Устанавливаем временную неуязвимость
        player.invulnerable = true;
        
        // Эффект отбрасывания
        const angle = Phaser.Math.Angle.Between(firewall.x, firewall.y, player.x, player.y);
        player.setVelocity(
            Math.cos(angle) * 200,
            Math.sin(angle) * 200
        );
        
        // Эффект мигания игрока
        this.tweens.add({
            targets: player.text,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                // Снимаем неуязвимость
                player.invulnerable = false;
            }
        });
        
        // Эффект глитча на экране
        this.game.globals.glitch.applyToPhaserObject(
            this,
            this.cameras.main,
            { intensity: 0.3, duration: 500 }
        );
        
        // Показываем уведомление об опасности
        this.showNotification('Внимание! Файрвол!', '#FF073A');
        
        // TODO: Добавить логику урона или другие последствия
    }
    
    /**
     * Нахождение рядом с терминалом
     * @param {Phaser.Physics.Arcade.Sprite} player - Игрок
     * @param {Phaser.Physics.Arcade.Sprite} terminal - Терминал
     */
    nearTerminal(player, terminal) {
        // Если не нажата клавиша взаимодействия, просто показываем подсказку
        if (!Phaser.Input.Keyboard.JustDown(this.controls.interact.E) && 
            !Phaser.Input.Keyboard.JustDown(this.controls.interact.SPACE)) {
            
            // Показываем подсказку над терминалом
            if (!terminal.hint) {
                terminal.hint = this.add.text(
                    terminal.x,
                    terminal.y - 20,
                    '[E] Взаимодействие',
                    {
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: '#FFFFFF',
                        backgroundColor: '#000000'
                    }
                );
                terminal.hint.setOrigin(0.5);
                terminal.hint.setDepth(30);
                
                // Анимация появления
                terminal.hint.alpha = 0;
                this.tweens.add({
                    targets: terminal.hint,
                    alpha: 1,
                    duration: 200
                });
            }
            
            return;
        }
        
        // Скрываем подсказку
        if (terminal.hint) {
            terminal.hint.destroy();
            terminal.hint = null;
        }
        
        // Запускаем сцену взлома
        this.launchHackingScene(terminal);
    }
    
    /**
     * Запуск сцены взлома
     * @param {Phaser.Physics.Arcade.Sprite} terminal - Терминал для взлома
     */
    launchHackingScene(terminal) {
        // Сохраняем текущее состояние
        this.game.globals.gameState.lastTerminalPosition = {
            x: terminal.x,
            y: terminal.y
        };
        
        // Генерируем случайный тип мини-игры
        const minigameTypes = ['password', 'network', 'code'];
        const randomType = minigameTypes[Math.floor(Math.random() * minigameTypes.length)];
        
        // Запускаем сцену взлома
        this.scene.launch('HackingScene', {
            type: randomType,
            difficulty: this.game.globals.settings.difficulty
        });
        
        // Останавливаем текущую сцену
        this.scene.pause();
    }
    
    /**
     * Показать уведомление
     * @param {string} text - Текст уведомления
     * @param {string} color - Цвет текста (HEX)
     */
    showNotification(text, color = '#00FF41') {
        // Создаем текст уведомления
        const notification = this.add.text(
            this.cameras.main.width / 2,
            100,
            text,
            {
                fontFamily: 'monospace',
                fontSize: 18,
                color: color,
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: { x: 15, y: 10 }
            }
        );
        notification.setOrigin(0.5);
        notification.setDepth(100);
        notification.setScrollFactor(0);
        
        // Анимация появления и исчезновения
        notification.alpha = 0;
        this.tweens.add({
            targets: notification,
            alpha: 1,
            y: 80,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.tweens.add({
                    targets: notification,
                    alpha: 0,
                    y: 60,
                    delay: 2000,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        notification.destroy();
                    }
                });
            }
        });
    }
    
    update(time, delta) {
        // Если уровень еще не загружен, пропускаем обновление
        if (!this.levelLoaded) return;
        
        // Если терминал открыт, пропускаем обновление игровой логики
        if (this.terminalOpen) return;
        
        // Обновляем позицию игрока
        this.updatePlayerMovement();
        
        // Обновляем игрока (текст и свечение)
        if (this.player && this.player.update) {
            this.player.update();
        }
        
        // Обновляем файрволы
        this.objects.firewalls.forEach(firewall => {
            if (firewall && firewall.update) {
                firewall.update(time, delta);
            }
        });
    }
    
    /**
     * Обновление движения игрока
     */
    updatePlayerMovement() {
        // Скорость движения
        const speed = 150;
        
        // Сброс скорости
        this.player.setVelocity(0);
        
        // Перемещение по горизонтали
        if (this.controls.left.A.isDown || this.controls.left.LEFT.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.controls.right.D.isDown || this.controls.right.RIGHT.isDown) {
            this.player.setVelocityX(speed);
        }
        
        // Перемещение по вертикали
        if (this.controls.up.W.isDown || this.controls.up.UP.isDown) {
            this.player.setVelocityY(-speed);
        } else if (this.controls.down.S.isDown || this.controls.down.DOWN.isDown) {
            this.player.setVelocityY(speed);
        }
        
        // Нормализация диагонального движения
        if (this.player.body.velocity.x !== 0 && this.player.body.velocity.y !== 0) {
            this.player.body.velocity.normalize().scale(speed);
        }
    }
}