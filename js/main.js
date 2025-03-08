/**
 * Модификации в main.js
 */

// Объявляем глобальные переменные (оставляем как есть)
let matrixEnhancer = null;

// Ждем, пока документ полностью загрузится
window.addEventListener('load', function() {
    // Инициализация игры напрямую, без Яндекс SDK
    initGame();
});

/**
 * Инициализация игры
 */
function initGame() {
    // Инициализируем систему локализации
    const i18n = new I18n();
    
    // Конфигурация игры (оставляем как есть)
    const config = {
        type: Phaser.AUTO,
        width: 1200,
        height: 800,
        parent: 'game-container',
        backgroundColor: '#000000',
        scene: [
            BootScene,
            LanguageScene, // Добавляем новую сцену выбора языка
            MenuScene,
            GameScene,
            HackingScene,
            TerminalScene
        ],
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        pixelArt: false
    };

    // Создание экземпляра игры
    const game = new Phaser.Game(config);

    // Глобальные переменные игры
    game.globals = {
        // Настройки игры
        settings: {
            language: 'ru', // Язык по умолчанию
            difficulty: 'normal',
            soundVolume: 0.7,
            musicVolume: 0.5,
            terminalSpeed: 20, // Скорость ввода текста в терминале (мс)
            matrixEffects: true // Включены ли дополнительные эффекты матрицы
        },
        // Данные игрока
        player: {
            level: 1,
            reputation: 0,
            tools: [],
            completedHacks: 0
        },
        // Состояние игры
        gameState: {
            currentLevel: null,
            discoveredSystems: [],
            activeHacks: []
        },
        // Система локализации
        i18n: i18n
    };

    // Инициализируем систему локализации
    // Пытаемся загрузить сохраненный язык из локального хранилища
    const savedLanguage = localStorage.getItem('hacker_sim_language');
    const defaultLanguage = savedLanguage || 'ru';
    
    i18n.init(defaultLanguage);
    game.globals.settings.language = defaultLanguage;
    i18n.setLanguage(defaultLanguage);

    // Обработка изменения размера окна
    window.addEventListener('resize', function() {
        game.scale.refresh();
    });
    
    // Инициализация улучшенной матрицы после небольшой задержки, 
    // чтобы дать время загрузиться всем элементам
    setTimeout(() => {
        // Инициализируем MatrixEnhancer
        matrixEnhancer = new MatrixEnhancer({
            glitchInterval: 8000, // Интервал между глитчами (мс)
            glitchDuration: 400, // Продолжительность глитча (мс)
            additionalGlitches: game.globals.settings.matrixEffects,
            screenFlickers: game.globals.settings.matrixEffects
        });
        
        // Сохраняем ссылку на enhancer в глобальных настройках
        game.globals.matrixEnhancer = matrixEnhancer;
        
        console.log('Matrix effect enhancer initialized');
    }, 1000);
}