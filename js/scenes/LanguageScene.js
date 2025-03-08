/**
 * Сцена выбора языка
 * Позволяет пользователю выбрать язык интерфейса игры
 */
class LanguageScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LanguageScene' });
    }

    /**
     * Предварительная загрузка ресурсов
     */
    preload() {
        // Загрузка необходимых ресурсов для сцены
        this.load.image('background', 'assets/backgrounds/matrix_dark.jpg');
        
        // Анимация загрузки
        let loadingText = this.add.text(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2, 
            'Загрузка...', 
            { 
                font: '24px Arial', 
                fill: '#00FF00' 
            }
        ).setOrigin(0.5);
        
        // Событие прогресса загрузки
        this.load.on('progress', function (value) {
            loadingText.setText(`Загрузка: ${Math.floor(value * 100)}%`);
        });
        
        // Очистка текста после загрузки
        this.load.on('complete', function () {
            loadingText.destroy();
        });
    }

    /**
     * Создание элементов сцены
     */
    create() {
        // Устанавливаем фон
        this.add.image(0, 0, 'background').setOrigin(0).setDisplaySize(
            this.cameras.main.width,
            this.cameras.main.height
        );
        
        // Получаем доступ к объекту i18n из глобальных настроек
        const i18n = this.game.globals.i18n;
        
        // Создаем заголовок
        const titleText = this.add.text(
            this.cameras.main.width / 2,
            100,
            'Выберите язык / Select Language / Dil Seçin',
            {
                font: '32px Arial',
                fill: '#00FF00',
                stroke: '#003300',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // Настройка параметров стиля для кнопок
        const buttonStyle = {
            font: '24px Arial',
            fill: '#00FF00',
            stroke: '#003300',
            strokeThickness: 1,
            backgroundColor: '#000000'
        };
        
        // Создаем кнопки выбора языка
        this.createLanguageButton('ru', 'Русский', 200, buttonStyle);
        this.createLanguageButton('en', 'English', 300, buttonStyle);
        this.createLanguageButton('tr', 'Türkçe', 400, buttonStyle);
        
        // Эффект матрицы (если есть)
        if (this.game.globals.matrixEnhancer) {
            this.game.globals.matrixEnhancer.applyGlitchEffect();
        }
    }
    
    /**
     * Создаёт кнопку выбора языка
     * @param {string} langCode - Код языка
     * @param {string} langName - Название языка
     * @param {number} y - Позиция по вертикали
     * @param {object} style - Стиль текста
     */
    createLanguageButton(langCode, langName, y, style) {
        // Создаем текст-кнопку
        const button = this.add.text(
            this.cameras.main.width / 2,
            y,
            langName,
            style
        ).setOrigin(0.5);
        
        // Делаем кнопку интерактивной
        button.setInteractive({ useHandCursor: true });
        
        // Эффекты наведения
        button.on('pointerover', () => {
            button.setStyle({ fill: '#FFFFFF' });
            this.tweens.add({
                targets: button,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100
            });
        });
        
        button.on('pointerout', () => {
            button.setStyle({ fill: '#00FF00' });
            this.tweens.add({
                targets: button,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        
        // Обработка клика
        button.on('pointerdown', () => {
            // Получаем доступ к i18n из глобальных настроек
            const i18n = this.game.globals.i18n;
            
            // Меняем язык
            i18n.setLanguage(langCode);
            
            // Сохраняем выбор языка в локальное хранилище
            localStorage.setItem('hacker_sim_language', langCode);
            
            // Обновляем настройки игры
            this.game.globals.settings.language = langCode;
            
            // Дополнительный эффект при клике
            this.cameras.main.flash(500, 0, 255, 0, 0.3);
            
            // Звуковой эффект (если есть)
            if (this.sound.get('click')) {
                this.sound.play('click');
            }
            
            // Переходим на следующую сцену
            this.time.delayedCall(500, () => {
                this.scene.start('MenuScene');
            });
        });
    }
    
    /**
     * Обновление сцены
     */
    update() {
        // Здесь можно добавить анимации или другие обновления сцены
    }
} 