/**
 * BootScene - сцена загрузки ресурсов
 * Первая сцена, которая запускается при старте игры
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    
    preload() {
        // Создаем текст с информацией о загрузке
        const loadingText = this.add.text(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2 - 50,
            this.game.globals.i18n ? this.game.globals.i18n.get('common.loading') : 'Загрузка...', 
            { 
                fontFamily: 'monospace', 
                fontSize: 20, 
                color: '#00FF41' 
            }
        );
        loadingText.setOrigin(0.5);
        
        // Прогресс-бар загрузки
        const progressBox = this.add.graphics();
        const progressBar = this.add.graphics();
        
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(
            this.cameras.main.width / 2 - 160, 
            this.cameras.main.height / 2, 
            320, 30
        );
        
        // Текст с процентами загрузки
        const percentText = this.add.text(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2 + 50,
            '0%', 
            { 
                fontFamily: 'monospace', 
                fontSize: 18, 
                color: '#00FF41' 
            }
        );
        percentText.setOrigin(0.5);
        
        // Эффект мерцания для стилизации
        this.tweens.add({
            targets: loadingText,
            alpha: 0.5,
            duration: 500,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
        });
        
        // Обработчики событий загрузки
        this.load.on('progress', (value) => {
            // Обновляем прогресс-бар
            progressBar.clear();
            progressBar.fillStyle(0x00FF41, 1);
            progressBar.fillRect(
                this.cameras.main.width / 2 - 150, 
                this.cameras.main.height / 2 + 5, 
                300 * value, 
                20
            );
            // Обновляем текст с процентами
            percentText.setText(parseInt(value * 100) + '%');
        });
        
        this.load.on('complete', () => {
            // Скрываем элементы загрузки
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            
            // Создаем анимированный логотип
            this.createAnimatedLogo();
        });
        
        // Загружаем языковые файлы
        this.loadLanguages();
        
        // Для тестирования добавим небольшую задержку
        this.load.image('test', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
        
        // Добавим искусственную задержку для демонстрации экрана загрузки
        for (let i = 0; i < 50; i++) {
            this.load.image(`test${i}`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
        }
    }
    
    create() {
        // Создаем эффект "матричного дождя" в фоне
        this.matrixEffect = new MatrixEffect(this, {
            width: this.cameras.main.width,
            height: this.cameras.main.height,
            fontSize: 14,
            density: 0.5, // Уменьшаем плотность для экрана загрузки
            interactive: false
        });
        
        // Инициализируем глобальные объекты
        this.initGlobals();
    }
    
    /**
     * Создание анимированного логотипа
     */
    createAnimatedLogo() {
        this.logoAnimation = new LogoAnimation(this, {
            text: this.game.globals.i18n ? this.game.globals.i18n.get('menu.title') : 'ЦИФРОВОЕ ПРОНИКНОВЕНИЕ',
            duration: 3000,
            fontSize: 36,
            onComplete: () => {
                const continueText = this.add.text(
                    this.cameras.main.width / 2, 
                    this.cameras.main.height / 2 + 100,
                    this.game.globals.i18n ? this.game.globals.i18n.get('common.continue') : 'Продолжить',
                    { 
                        fontFamily: 'monospace', 
                        fontSize: 18, 
                        color: '#00FF41' 
                    }
                );
                continueText.setOrigin(0.5);
                continueText.setInteractive();
                
                this.tweens.add({
                    targets: continueText,
                    alpha: 0.5,
                    duration: 500,
                    ease: 'Power2',
                    yoyo: true,
                    repeat: -1
                });
                
                continueText.on('pointerup', () => {
                    if (this.game.globals.languagesLoaded) {
                        this.goToNextScene();
                    } else {
                        continueText.setText(this.game.globals.i18n ? 
                            this.game.globals.i18n.get('common.loading') : 'Загрузка...');
                        
                        const checkLanguagesInterval = setInterval(() => {
                            if (this.game.globals.languagesLoaded) {
                                clearInterval(checkLanguagesInterval);
                                this.goToNextScene();
                            }
                        }, 100);
                    }
                });
                
                this.input.on('pointerup', () => {
                    if (this.game.globals.languagesLoaded) {
                        this.goToNextScene();
                    }
                });
            }
        });
        
        this.logoAnimation.start();
    }
    
    /**
     * Загрузка языков
     */
    loadLanguages() {
        this.game.globals.languagesLoaded = false;
        
        if (this.game.globals.i18n) {
            try {
                this.game.globals.i18n.loadDictionary('ru', ru);
                this.game.globals.i18n.loadDictionary('en', en);
                this.game.globals.i18n.loadDictionary('tr', tr);
                
                console.log('Языковые словари загружены');
                
                let language = this.game.globals.settings.language || 'ru';
                
                this.game.globals.i18n.setLanguage(language);
                this.game.globals.settings.language = language;
                this.game.globals.languagesLoaded = true;
            } catch (e) {
                console.error('Ошибка загрузки языковых словарей:', e);
            }
        }
    }
    
    /**
     * Переход к следующей сцене
     */
    goToNextScene() {
        // Проверяем, есть ли сохраненные настройки языка
        const savedLanguage = localStorage.getItem('hacker_sim_language');
        // Если язык уже выбран пользователем, идем в главное меню
        // иначе показываем экран выбора языка
        const nextScene = savedLanguage ? 'MenuScene' : 'LanguageScene';
        
        this.scene.start(nextScene);
    }
    
    /**
     * Инициализация глобальных объектов и настроек
     */
    initGlobals() {
        if (!this.game.globals.textGenerator) {
            this.game.globals.textGenerator = new TextGenerator();
        }
        
        if (!this.game.globals.glitch) {
            this.game.globals.glitch = new Glitch();
        }
        
        if (!this.game.globals.settings) {
            this.game.globals.settings = {
                difficulty: 'normal',
                soundVolume: 0.7,
                musicVolume: 0.5,
                terminalSpeed: 20
            };
        }
        
        if (!this.game.globals.player) {
            this.game.globals.player = {
                level: 1,
                reputation: 0,
                tools: [],
                completedHacks: 0,
                currentPosition: null
            };
        }
        
        if (!this.game.globals.gameState) {
            this.game.globals.gameState = {
                currentLevel: null,
                discoveredSystems: [],
                activeHacks: []
            };
        }
    }
}
