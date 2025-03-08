/**
 * Terminal - класс для эмуляции терминала
 * Обеспечивает интерфейс в стиле командной строки
 */
class Terminal {
    /**
     * Конструктор класса Terminal
     * @param {Phaser.Scene} scene - Сцена Phaser
     * @param {object} config - Конфигурация терминала
     */
    constructor(scene, config) {
        this.scene = scene;
        
        // Настройки по умолчанию или переданные в конфигурации
        this.config = {
            x: config.x || 0,
            y: config.y || 0,
            width: config.width || 600,
            height: config.height || 400,
            padding: config.padding || 20,
            backgroundColor: config.backgroundColor || 'rgba(0, 0, 0, 0.8)',
            borderColor: config.borderColor || '#00FF41',
            fontSize: config.fontSize || 14,
            fontFamily: config.fontFamily || 'monospace',
            lineHeight: config.lineHeight || 1.2, // Добавлен параметр для межстрочного интервала
            textColor: config.textColor || '#00FF41',
            promptText: config.promptText || '>',
            typingSpeed: config.typingSpeed || scene.game.globals?.settings?.terminalSpeed || 20,
            maxLines: config.maxLines || 100,
            depth: config.depth || 10,
            useGlassmorphism: config.useGlassmorphism !== undefined ? config.useGlassmorphism : true // Включен ли эффект стекломорфизма
        };
        
        // Контейнер для всех элементов терминала
        this.container = scene.add.container(this.config.x, this.config.y);
        this.container.setDepth(this.config.depth);
        
        // Создаем щит вокруг терминала для предотвращения проникновения матрицы
        if (this.config.useGlassmorphism) {
            this.shield = scene.add.rectangle(
                -30, -30, 
                this.config.width + 60, this.config.height + 60, 
                0x000000, 0.5
            );
            this.shield.setOrigin(0);
            this.shield.setDepth(this.config.depth - 1);
            this.container.add(this.shield);
        }
        
        // Фон терминала с эффектом стекломорфизма
        this.background = scene.add.rectangle(
            0, 0, 
            this.config.width, this.config.height, 
            Phaser.Display.Color.HexStringToColor(this.config.backgroundColor.replace('rgba', 'rgb').replace(/[^0-9,]/g, '')).color,
            this.config.backgroundColor.includes('rgba') ? parseFloat(this.config.backgroundColor.match(/,([^)]+)\)/)[1]) : 1
        );
        this.background.setOrigin(0);
        this.container.add(this.background);
        
        // Создаем DOM-элемент для блика на стекле вместо градиента в Phaser
        if (document.getElementById('terminal-light-effect')) {
            document.getElementById('terminal-light-effect').remove();
        }
        const lightEffect = document.createElement('div');
        lightEffect.id = 'terminal-light-effect';
        lightEffect.className = 'terminal-light-effect';
        document.getElementById('game-container').appendChild(lightEffect);
        
        // Позиционируем блик относительно терминала
        lightEffect.style.left = `${this.config.x + 20}px`;
        lightEffect.style.top = `${this.config.y + 20}px`;
        
        // Анимируем блик через CSS
        lightEffect.style.animation = 'moveLight 15s infinite alternate ease-in-out';
        
        // Создаем стили для анимации, если их еще нет
        if (!document.getElementById('light-effect-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'light-effect-styles';
            styleSheet.textContent = `
                @keyframes moveLight {
                    0% { transform: translate(30px, 30px) scale(1); opacity: 0.5; }
                    25% { transform: translate(70%, 20%) scale(1.2); opacity: 0.7; }
                    50% { transform: translate(50%, 50%) scale(0.8); opacity: 0.6; }
                    75% { transform: translate(20%, 70%) scale(1.5); opacity: 0.4; }
                    100% { transform: translate(80%, 80%) scale(1); opacity: 0.7; }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        // Рамка терминала
        this.border = scene.add.rectangle(
            0, 0, 
            this.config.width, this.config.height, 
            0x000000, 0
        );
        this.border.setOrigin(0);
        this.border.setStrokeStyle(1, 0x00FF41, 1);
        this.container.add(this.border);
        
        // Дополнительный свет от рамки (внешнее свечение)
        this.borderGlow = scene.add.rectangle(
            -2, -2, 
            this.config.width + 4, this.config.height + 4, 
            0x000000, 0
        );
        this.borderGlow.setOrigin(0);
        this.borderGlow.setStrokeStyle(2, 0x00FF41, 0.2);
        this.container.add(this.borderGlow);
        
        // Создаем заголовок терминала
        this.headerContainer = scene.add.container(this.config.padding, this.config.padding);
        this.container.add(this.headerContainer);
        
        // Фон для заголовка (для улучшения контраста)
        this.headerBg = scene.add.rectangle(
            -this.config.padding, 
            -this.config.padding, 
            this.config.width, 
            60, // Увеличиваем высоту заголовка с 50 до 60
            0x000000, 0.5
        );
        this.headerBg.setOrigin(0);
        this.headerContainer.add(this.headerBg);
        
        // Заголовок
        this.headerText = scene.add.text(0, 0, 'TERMINAL v1.0', {
            fontFamily: this.config.fontFamily,
            fontSize: this.config.fontSize + 4, // Увеличиваем размер заголовка на 4 (было +2)
            color: '#0FFF50', // Ярко-зеленый для заголовка
            stroke: '#003300', 
            strokeThickness: 2 // Обводка для улучшения читабельности
        });
        this.headerContainer.add(this.headerText);
        
        // Разделительная линия
        this.headerLine = scene.add.graphics();
        this.headerLine.lineStyle(1, 0x00FF41, 1);
        this.headerLine.lineBetween(0, this.headerText.height + 12, this.config.width - this.config.padding * 2, this.headerText.height + 12); // Увеличиваем отступ с 10 до 12
        this.headerContainer.add(this.headerLine);
        
        // Содержимое терминала (вывод)
        this.contentContainer = scene.add.container(this.config.padding, this.headerText.height + this.config.padding + 25); // Увеличиваем отступ с 20 до 25
        this.container.add(this.contentContainer);
        
        // Фон для контента (для лучшего контраста)
        this.contentBg = scene.add.rectangle(
            -this.config.padding + 10, 
            -this.config.padding + 10, 
            this.config.width - 20, 
            this.config.height - 120, // Увеличиваем высоту содержимого
            0x001005, 0.5
        );
        this.contentBg.setOrigin(0);
        this.contentBg.setStrokeStyle(1, 0x00FF41, 0.2);
        this.contentContainer.add(this.contentBg);
        
        // Текст вывода
        this.outputText = scene.add.text(0, 0, '', {
            fontFamily: this.config.fontFamily,
            fontSize: this.config.fontSize,
            color: this.config.textColor,
            wordWrap: { width: this.config.width - this.config.padding * 2 },
            lineSpacing: (this.config.lineHeight - 1) * this.config.fontSize // Добавлен межстрочный интервал
        });
        this.contentContainer.add(this.outputText);
        
        // Контейнер для строки ввода
        this.inputContainer = scene.add.container(this.config.padding, this.config.height - this.config.padding - 40); // Увеличиваем отступ с 30 до 40
        this.container.add(this.inputContainer);
        
        // Фон для строки ввода (для лучшего контраста)
        this.inputBg = scene.add.rectangle(
            -this.config.padding + 10, 
            -10, 
            this.config.width - 20, 
            35, // Увеличиваем высоту с 30 до 35
            0x001505, 0.6
        );
        this.inputBg.setOrigin(0);
        this.inputBg.setStrokeStyle(1, 0x00FF41, 0.3);
        this.inputContainer.add(this.inputBg);
        
        // Текст промпта
        this.promptText = scene.add.text(0, 0, this.config.promptText, {
            fontFamily: this.config.fontFamily,
            fontSize: this.config.fontSize,
            color: '#CCFFCC',
            lineSpacing: (this.config.lineHeight - 1) * this.config.fontSize, // Добавлен межстрочный интервал
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#00FF41',
                blur: 6,
                stroke: true,
                fill: true
            }
        });
        this.inputContainer.add(this.promptText);
        
        // Исправляем промпт на более корректный [USER@SYSTEM]$
        if (this.config.promptText === '>' || this.config.promptText === '[ГОСТЬ@СИСТЕМА]$') {
            this.promptText.setText('[USER@SYSTEM]$');
        }
        
        // Текст ввода пользователя
        this.inputText = scene.add.text(this.promptText.width + 10, 0, '', {
            fontFamily: this.config.fontFamily,
            fontSize: this.config.fontSize,
            color: '#FFFFFF',
            lineSpacing: (this.config.lineHeight - 1) * this.config.fontSize // Добавлен межстрочный интервал
        });
        this.inputContainer.add(this.inputText);
        
        // Центрируем элементы ввода по вертикали
        this.promptText.setY(this.config.fontSize / 3);
        this.inputText.setY(this.config.fontSize / 3);
        
        // Курсор
        this.cursor = scene.add.rectangle(
            this.promptText.width + 10, 
            this.config.fontSize / 3, 
            8, 
            this.config.fontSize * 1.1, // Увеличиваем высоту курсора для лучшей видимости
            0x00FF41
        );
        this.cursor.setOrigin(0, 0);
        this.inputContainer.add(this.cursor);
        
        // Анимация курсора
        this.cursorTween = scene.tweens.add({
            targets: this.cursor,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        // Текущий ввод пользователя
        this.userInput = '';
        
        // История команд
        this.commandHistory = [];
        this.historyIndex = -1;
        
        // Состояние терминала
        this.state = {
            active: true,  // Активен ли терминал для ввода
            animating: false,  // Находится ли в процессе анимации вывода
            lines: [],  // Строки вывода
            history: [],  // История команд
            commands: {}  // Словарь зарегистрированных команд
        };
        
        // Обработка ввода с клавиатуры
        scene.input.keyboard.on('keydown', this.handleKeyInput, this);
        
        // Приветственное сообщение
        this.writeOutput([
            'Добро пожаловать в Цифровое Пространство',
            'Введите "help" для получения списка доступных команд.',
            ''
        ]);
    }
    
    /**
     * Обработчик ввода с клавиатуры
     * @param {object} event - Событие keydown
     */
    handleKeyInput(event) {
        if (!this.state.active) return;
        
        // Предотвращаем прокрутку страницы стрелками и обработку системных сочетаний клавиш
        const preventDefaultKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];
        if (preventDefaultKeys.includes(event.key)) {
            event.preventDefault();
        }
        
        // История команд
        if (event.key === 'ArrowUp') {
            // Переход к предыдущей команде
            if (this.state.historyIndex > 0) {
                this.state.historyIndex--;
                this.userInput = this.state.history[this.state.historyIndex] || '';
                this.updateInputDisplay();
            }
            return;
        }
        
        if (event.key === 'ArrowDown') {
            // Переход к следующей команде
            if (this.state.historyIndex < this.state.history.length) {
                this.state.historyIndex++;
                this.userInput = this.state.history[this.state.historyIndex] || '';
                this.updateInputDisplay();
            }
            return;
        }
        
        // Отправка команды
        if (event.key === 'Enter') {
            this.processCommand(this.userInput);
            return;
        }
        
        // Удаление символа
        if (event.key === 'Backspace') {
            if (this.userInput.length > 0) {
                this.userInput = this.userInput.slice(0, -1);
                this.updateInputDisplay();
            }
            return;
        }
        
        // Игнорируем служебные клавиши
        if (event.key.length > 1) return;
        
        // Добавляем символ к вводу
        this.userInput += event.key;
        this.updateInputDisplay();
        
        // Эффект подсветки курсора при вводе (без использования glowBorder)
        this.cursor.setAlpha(1); // Делаем курсор полностью видимым
        
        // Легкий эффект вибрации при печати
        if (Math.random() < 0.3) { // 30% шанс вибрации
            this.scene.cameras.main.shake(50, 0.001, false);
        }
    }
    
    /**
     * Обновляет отображение текста ввода
     */
    updateInputDisplay() {
        this.inputText.setText(this.userInput);
        this.cursor.x = this.promptText.width + 10 + this.inputText.width;
    }
    
    /**
     * Обработка введенной команды
     * @param {string} commandText - Текст команды
     */
    processCommand(commandText) {
        const trimmedCommand = commandText.trim();
        
        // Добавляем команду в историю и сбрасываем индекс
        if (trimmedCommand) {
            this.state.history.push(trimmedCommand);
            this.state.historyIndex = this.state.history.length;
        }
        
        // Очищаем ввод
        this.userInput = '';
        this.updateInputDisplay();
        
        // Выводим команду в терминал
        if (trimmedCommand) {
            const displayPrompt = this.config.promptText === '>' ? '[USER@SYSTEM]$' : this.config.promptText;
            this.writeOutput(`${displayPrompt} ${trimmedCommand}`);
        } else {
            const displayPrompt = this.config.promptText === '>' ? '[USER@SYSTEM]$' : this.config.promptText;
            this.writeOutput(displayPrompt);
        }
        
        // Если команда пустая, просто выводим новую строку
        if (!trimmedCommand) return;
        
        // Разбиваем команду на части (команда и аргументы)
        const parts = trimmedCommand.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        // Ищем команду в списке зарегистрированных команд
        const registeredCommand = this.state.commands[command];
        
        // Если команда найдена, вызываем соответствующую функцию
        if (registeredCommand) {
            try {
                registeredCommand.callback(args);
            } catch (error) {
                this.writeOutput(`Ошибка выполнения команды: ${error.message}`, { style: 'error' });
                console.error('Terminal command error:', error);
            }
        } else {
            this.writeOutput(`Команда не найдена: ${command}. Введите "help" для списка команд.`, { style: 'error' });
        }
    }
    
    /**
     * Написать текст в терминал с эффектом печати
     * @param {string|string[]} text - Текст или массив строк для вывода
     * @param {object} options - Дополнительные опции (скорость, цвет и т.д.)
     */
    writeOutput(text, options = {}) {
        // Конвертируем одиночную строку в массив
        const lines = Array.isArray(text) ? text : [text];
        
        // Настройки вывода
        const outputOptions = {
            speed: options.speed || this.config.typingSpeed,
            color: options.color || this.config.textColor,
            instant: options.instant || false,
            callback: options.callback || null
        };
        
        // Если уже идет анимация, добавляем новые строки в очередь
        if (this.state.animating && !outputOptions.instant) {
            this.state.lines = this.state.lines.concat(lines.map(line => ({
                text: line,
                options: outputOptions
            })));
            return;
        }
        
        // Устанавливаем флаг анимации
        this.state.animating = !outputOptions.instant;
        
        // Если нужно вывести мгновенно
        if (outputOptions.instant) {
            // Добавляем все строки сразу
            const currentText = this.outputText.text;
            const newText = currentText + (currentText ? '\n' : '') + lines.join('\n');
            this.outputText.setText(newText);
            this.outputText.setColor(outputOptions.color);
            
            // Прокрутка вниз при необходимости
            this.scrollOutputToBottom();
            
            // Вызываем callback, если он есть
            if (outputOptions.callback) {
                outputOptions.callback();
            }
            return;
        }
        
        // Анимированный вывод текста
        let currentLine = 0;
        let lineCharIndex = 0;
        const originalText = this.outputText.text;
        const addCharacter = () => {
            if (currentLine < lines.length) {
                // Текущая строка
                const line = lines[currentLine];
                
                // Добавляем символ
                if (lineCharIndex === 0) {
                    // Начало новой строки
                    this.outputText.setText(
                        this.outputText.text + 
                        (this.outputText.text ? '\n' : '') + 
                        line.charAt(0)
                    );
                    lineCharIndex = 1;
                } else if (lineCharIndex < line.length) {
                    // Добавление символа к текущей строке
                    this.outputText.setText(
                        this.outputText.text + line.charAt(lineCharIndex)
                    );
                    lineCharIndex++;
                } else {
                    // Конец строки
                    currentLine++;
                    lineCharIndex = 0;
                }
                
                // Прокрутка вниз при необходимости
                this.scrollOutputToBottom();
                
                // Продолжаем анимацию
                if (currentLine < lines.length || lineCharIndex < (lines[currentLine] ? lines[currentLine].length : 0)) {
                    this.scene.time.delayedCall(outputOptions.speed, addCharacter);
                } else {
                    // Анимация завершена
                    this.state.animating = false;
                    
                    // Вызываем callback, если он есть
                    if (outputOptions.callback) {
                        outputOptions.callback();
                    }
                    
                    // Проверяем, есть ли еще строки в очереди
                    if (this.state.lines.length > 0) {
                        const nextOutput = this.state.lines.shift();
                        this.writeOutput(nextOutput.text, nextOutput.options);
                    }
                }
            }
        };
        
        // Запускаем анимацию
        addCharacter();
    }
    
    /**
     * Прокрутка текста вывода до конца
     * Улучшенная версия с контролем высоты контейнера и поддержкой пользовательской прокрутки
     */
    scrollOutputToBottom() {
        // Получаем текущие строки
        const lines = this.outputText.text.split('\n');
        
        // Определяем максимальную высоту области вывода с учетом нового размера шрифта
        // Увеличиваем отступ снизу, чтобы текст не наезжал на строку ввода
        const maxHeight = this.config.height - this.config.padding * 3 - this.headerText.height - this.inputContainer.height - 60;
        
        // Определяем приблизительную высоту текста
        const lineHeight = this.config.fontSize * this.config.lineHeight; // Учитываем межстрочное расстояние
        const currentTextHeight = lines.length * lineHeight;
        
        // Если текст превышает допустимую высоту, обрезаем старые строки
        if (currentTextHeight > maxHeight) {
            // Рассчитываем, сколько строк помещается в видимую область
            const visibleLines = Math.floor(maxHeight / lineHeight);
            
            // Определяем, сколько строк нужно удалить
            const linesToRemove = lines.length - visibleLines + 1; // Добавляем 1 для лучшей видимости последних строк
            
            if (linesToRemove > 0) {
                // Обрезаем старые строки, оставляя только видимые
                this.outputText.setText(lines.slice(linesToRemove).join('\n'));
            }
        }
        
        // Устанавливаем правильную позицию Y для текста вывода
        const outputY = this.config.padding + this.headerText.height + 10;
        this.outputText.setY(outputY);
        
        // Сбрасываем позицию прокрутки на нижний край
        this.contentScrollPosition = 0;
        
        // Вызываем updateScrollPosition только если метод существует и это функция
        if (typeof this.updateScrollPosition === 'function') {
            this.updateScrollPosition();
        }
    }
    
    /**
     * Регистрирует новую команду терминала
     * @param {string} name - Имя команды
     * @param {string} description - Описание команды
     * @param {function} callback - Функция обработки команды
     * @param {string} usage - Пример использования (опционально)
     */
    registerCommand(name, description, callback, usage = null) {
        this.state.commands[name.toLowerCase()] = {
            name,
            description,
            callback,
            usage
        };
    }
    
    /**
     * Показывает справку по всем зарегистрированным командам
     */
    showHelp() {
        const commandList = Object.values(this.state.commands)
            .map(cmd => `${cmd.name}: ${cmd.description}${cmd.usage ? ` (Пример: ${cmd.usage})` : ''}`)
            .join('\n');
        
        this.writeOutput('Доступные команды:\n' + commandList);
    }
    
    /**
     * Очищает экран терминала
     */
    clearScreen() {
        this.outputText.setText('');
        this.scrollOutputToBottom();
    }
    
    /**
     * Установить активность терминала
     * @param {boolean} active - Флаг активности
     */
    setActive(active) {
        this.state.active = active;
        this.cursor.visible = active;
        if (!active) {
            this.cursorTween.paused = true;
            this.cursor.setAlpha(0);
        } else {
            this.cursorTween.paused = false;
            this.cursor.setAlpha(1);
        }
    }
    
    /**
     * Показать/скрыть терминал
     * @param {boolean} visible - Флаг видимости
     */
    setVisible(visible) {
        this.container.visible = visible;
    }
    
    /**
     * Проверяет, находится ли точка внутри терминала
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @returns {boolean} - true, если точка внутри терминала
     */
    isPointInside(x, y) {
        // Получаем глобальные координаты контейнера
        const bounds = this.container.getBounds();
        
        // Если используется эффект стекломорфизма, учитываем "щит" вокруг терминала
        if (this.config.useGlassmorphism) {
            // Расширяем границы на размер щита
            return x >= bounds.x - 30 && 
                   x <= bounds.x + bounds.width + 30 && 
                   y >= bounds.y - 30 && 
                   y <= bounds.y + bounds.height + 30;
        }
        
        // Иначе просто проверяем, попадает ли точка в терминал
        return x >= bounds.x && 
               x <= bounds.x + bounds.width && 
               y >= bounds.y && 
               y <= bounds.y + bounds.height;
    }
    
    /**
     * Уничтожить терминал и освободить ресурсы
     */
    destroy() {
        this.scene.input.keyboard.off('keydown', this.handleKeyInput, this);
        
        if (this.cursorTween) {
            this.cursorTween.destroy();
        }
        
        // Удаляем световой эффект
        const lightEffect = document.getElementById('terminal-light-effect');
        if (lightEffect) {
            lightEffect.remove();
        }
        
        this.container.destroy();
    }
}
