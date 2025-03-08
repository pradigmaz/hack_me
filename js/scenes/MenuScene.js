/**
 * MenuScene - сцена главного меню
 * Оформлена в виде терминала с интерактивными опциями
 */
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }
    
    create() {
        // Создаем эффект "матричного дождя" в фоне
        this.matrixEffect = new MatrixEffect(this, {
            width: this.cameras.main.width,
            height: this.cameras.main.height,
            fontSize: 14,
            depth: 0,
            density: 0.7,
            interactive: true
        });
        
        // Создаем терминал для меню
        this.terminal = new Terminal(this, {
            x: this.cameras.main.width / 2 - 400,
            y: this.cameras.main.height / 2 - 300,
            width: 800,
            height: 600,
            depth: 10,
            fontSize: 16,
            promptText: '[USER@SYSTEM]$',
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
        });
        
        // Регистрируем команды для меню
        this.registerMenuCommands();
        
        // Показываем приветственное сообщение
        this.showWelcomeMessage();
        
        // Добавляем обработчик событий для клика по экрану
        // Для мобильных устройств или случайного клика
        this.input.on('pointerdown', (pointer) => {
            // Создаем волну в матричном эффекте
            this.matrixEffect.createWave(pointer.x, pointer.y, 150, 1000);
        });
    }
    
    /**
     * Регистрация команд для терминала в меню
     */
    registerMenuCommands() {
        // Команда start - начать игру
        this.terminal.registerCommand(
            'start', 
            'Начать новую игру', 
            () => this.startGame()
        );
        
        // Команда options - настройки
        this.terminal.registerCommand(
            'options', 
            'Показать и изменить настройки игры', 
            () => this.showOptions()
        );
        
        // Команда info - информация об игре
        this.terminal.registerCommand(
            'info', 
            'Показать информацию об игре', 
            () => this.showGameInfo()
        );
        
        // Команда tutorial - обучение
        this.terminal.registerCommand(
            'tutorial', 
            'Запустить обучение', 
            () => this.startTutorial()
        );
        
        // Команда exit - выход (перезагрузка страницы)
        this.terminal.registerCommand(
            'exit', 
            'Выйти из игры', 
            () => this.exitGame()
        );
        
        // Команда setopt - изменить настройку
        this.terminal.registerCommand(
            'setopt', 
            'Изменить настройку игры', 
            (args) => this.setOption(args),
            'setopt <имя_настройки> <значение>'
        );
    }
    
    /**
     * Показать приветственное сообщение
     */
    showWelcomeMessage() {
        const welcomeLines = [
            '================================',
            '     ЦИФРОВОЕ ПРОНИКНОВЕНИЕ    ',
            '================================',
            '',
            'Добро пожаловать в симулятор хакера',
            'Введите команду для начала работы:',
            '',
            '  start     - Начать новую игру',
            '  options   - Настройки',
            '  info      - Информация об игре',
            '  tutorial  - Обучение',
            '  exit      - Выход',
            '',
            'Для получения полного списка команд введите "help"',
            '================================',
            ''
        ];
        
        this.terminal.writeOutput(welcomeLines, { speed: 10 });
    }
    
    /**
     * Запуск новой игры
     */
    startGame() {
        this.terminal.writeOutput('Инициализация новой сессии...');
        
        // Сброс данных игрока при новой игре
        this.game.globals.player = {
            level: 1,
            reputation: 0,
            tools: [],
            completedHacks: 0,
            currentPosition: null
        };
        
        // Сброс состояния игры
        this.game.globals.gameState = {
            currentLevel: null,
            discoveredSystems: [],
            activeHacks: []
        };
        
        // Задержка для эффекта
        this.time.delayedCall(1500, () => {
            this.terminal.writeOutput([
                'Генерация цифрового пространства...',
                'Загрузка векторов проникновения...',
                'Калибровка инструментов...',
                'Всё готово. Запуск...'
            ], {
                speed: 30,
                callback: () => {
                    // Переход к игровой сцене
                    this.time.delayedCall(1000, () => {
                        this.scene.start('GameScene');
                    });
                }
            });
        });
    }
    
    /**
     * Показать настройки игры
     */
    showOptions() {
        const settings = this.game.globals.settings;
        const optionsLines = [
            'НАСТРОЙКИ:',
            '',
            `  Сложность: ${settings.difficulty}`,
            `  Громкость звуков: ${settings.soundVolume * 100}%`,
            `  Громкость музыки: ${settings.musicVolume * 100}%`,
            `  Скорость терминала: ${settings.terminalSpeed}мс`,
            '',
            'Чтобы изменить настройку, используйте команду "setopt":',
            '  setopt difficulty <easy|normal|hard>',
            '  setopt soundVolume <0-100>',
            '  setopt musicVolume <0-100>',
            '  setopt terminalSpeed <10-50>'
        ];
        
        this.terminal.writeOutput(optionsLines);
    }
    
    /**
     * Изменить настройку
     * @param {string[]} args - Аргументы команды (имя_настройки, значение)
     */
    setOption(args) {
        if (args.length < 2) {
            this.terminal.writeOutput('Использование: setopt <имя_настройки> <значение>');
            return;
        }
        
        const setting = args[0];
        const value = args[1];
        const settings = this.game.globals.settings;
        
        switch (setting) {
            case 'difficulty':
                if (['easy', 'normal', 'hard'].includes(value)) {
                    settings.difficulty = value;
                    this.terminal.writeOutput(`Сложность изменена на: ${value}`);
                } else {
                    this.terminal.writeOutput('Допустимые значения: easy, normal, hard');
                }
                break;
                
            case 'soundVolume':
                const soundVolume = parseInt(value) / 100;
                if (soundVolume >= 0 && soundVolume <= 1) {
                    settings.soundVolume = soundVolume;
                    this.terminal.writeOutput(`Громкость звуков изменена на: ${value}%`);
                } else {
                    this.terminal.writeOutput('Допустимые значения: 0-100');
                }
                break;
                
            case 'musicVolume':
                const musicVolume = parseInt(value) / 100;
                if (musicVolume >= 0 && musicVolume <= 1) {
                    settings.musicVolume = musicVolume;
                    this.terminal.writeOutput(`Громкость музыки изменена на: ${value}%`);
                } else {
                    this.terminal.writeOutput('Допустимые значения: 0-100');
                }
                break;
                
            case 'terminalSpeed':
                const speed = parseInt(value);
                if (speed >= 10 && speed <= 50) {
                    settings.terminalSpeed = speed;
                    this.terminal.writeOutput(`Скорость терминала изменена на: ${speed}мс`);
                } else {
                    this.terminal.writeOutput('Допустимые значения: 10-50');
                }
                break;
                
            default:
                this.terminal.writeOutput(`Неизвестная настройка: ${setting}`);
        }
    }
    
    /**
     * Показать информацию об игре
     */
    showGameInfo() {
        const infoLines = [
            'ОБ ИГРЕ:',
            '',
            '  "Цифровое проникновение" - симулятор хакера в стиле киберпанк',
            '',
            '  Основные возможности:',
            '   - Исследование цифрового пространства',
            '   - Взлом систем и сбор данных',
            '   - Избегание обнаружения антивирусными программами',
            '   - Решение хакерских головоломок',
            '   - Улучшение навыков и инструментов',
            '',
            '  Управление:',
            '   - WASD или стрелки - перемещение',
            '   - E или SPACE - взаимодействие',
            '   - TAB - открыть/закрыть терминал',
            '   - ESC - пауза/меню',
            '',
            '  Версия: 1.0.0',
            '  (C) 2023 Цифровое пространство'
        ];
        
        this.terminal.writeOutput(infoLines);
    }
    
    /**
     * Запустить обучение
     */
    startTutorial() {
        this.terminal.writeOutput('Запуск обучающей симуляции...');
        
        // Настройка параметров обучения
        this.game.globals.gameState.isTutorial = true;
        
        // Задержка для эффекта
        this.time.delayedCall(1500, () => {
            this.terminal.writeOutput([
                'Загрузка базовых инструкций...',
                'Подготовка тренировочного окружения...',
                'Все готово. Начинаем обучение...'
            ], {
                speed: 30,
                callback: () => {
                    // Переход к обучению
                    this.time.delayedCall(1000, () => {
                        this.scene.start('GameScene', { tutorial: true });
                    });
                }
            });
        });
    }
    
    /**
     * Выйти из игры (перезагрузка страницы)
     */
    exitGame() {
        this.terminal.writeOutput([
            'Завершение сессии...',
            'Очистка данных...',
            'Выход из системы...'
        ], {
            speed: 30,
            callback: () => {
                this.time.delayedCall(1000, () => {
                    // В веб-игре перезагружаем страницу
                    window.location.reload();
                });
            }
        });
    }
}
