/**
 * TerminalScene - сцена командного терминала
 * Предоставляет интерфейс для взаимодействия с игровым миром через команды
 */
class TerminalScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TerminalScene' });
    }
    
    init(data) {
        // Получаем данные из предыдущей сцены
        this.previousScene = data.previousScene || 'MenuScene';
        this.missionData = data.missionData || null;
        this.returnCallback = data.returnCallback || null;
        
        // Состояние терминала
        this.terminalState = {
            booted: false,
            loggedIn: false,
            admin: false,
            currentDirectory: '/home/user',
            discoveredCommands: [],
            discoveredFiles: [],
            executedScripts: []
        };
    }
    
    create() {
        // Создаем эффект "матричного дождя" в фоне
        this.matrixEffect = new MatrixEffect(this, {
            width: this.cameras.main.width,
            height: this.cameras.main.height,
            fontSize: 24, // Увеличенный размер шрифта для лучшей видимости
            depth: 0,
            density: 0.5, // Настраиваем плотность для более аутентичного вида
            interactive: true,
            color: '#00FF41', // Насыщенный зеленый цвет как в оригинальной Матрице
            highlightColor: '#5FFF5F', // Яркий зеленый для подсветки
            glitchRate: 0.015, // Умеренная вероятность глитчей
            glitchIntensity: 0.6, // Настраиваем интенсивность глитчей
            trailLength: 12, // Удлиненные "хвосты" символов
            bloomEffect: true // Включаем эффект свечения
        });
        
        // Создаем обработчик клика для создания волн в матрице
        this.input.on('pointerdown', (pointer) => {
            // Проверяем, что клик был не на терминале
            if (!this.terminal.isPointInside(pointer.x, pointer.y)) {
                // Создаем волну в матрице
                this.matrixEffect.createWave(pointer.x, pointer.y, 180, 1200);
            }
        });
        
        // Создаем "стеклянный" терминал с эффектом стекломорфизма
        this.terminal = new Terminal(this, {
            x: this.cameras.main.width / 2 - 575,
            y: this.cameras.main.height / 2 - 425,
            width: 1150,
            height: 850,
            depth: 20,
            fontSize: 22,
            lineHeight: 1.4,
            promptText: '[ГОСТЬ@СИСТЕМА]$ ',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: '#00FF41',
            textColor: '#00FF41',
            useGlassmorphism: true
        });
        
        // Настраиваем зону исключения для матрицы вокруг терминала
        this.matrixEffect.setExclusionZone({
            x: this.cameras.main.width / 2 - 605,
            y: this.cameras.main.height / 2 - 455,
            width: 1210,
            height: 910
        });
        
        // Добавляем эффект подсветки терминала при нажатии клавиш
        this.input.keyboard.on('keydown', () => {
            if (this.terminal.isActive()) {
                // Альтернативный способ подсветки без использования glowBorder
                // Добавляем временный эффект вспышки на границе терминала
                const flash = this.add.rectangle(
                    this.terminal.container.x, 
                    this.terminal.container.y,
                    this.terminal.config.width, 
                    this.terminal.config.height,
                    0x00FF41, 0.2
                );
                flash.setStrokeStyle(2, 0x00FF41, 0.5);
                flash.setOrigin(0);
                
                // Анимация исчезновения вспышки
                this.tweens.add({
                    targets: flash,
                    alpha: 0,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => {
                        flash.destroy();
                    }
                });
            }
        });
        
        // Регистрируем команды терминала
        this.registerTerminalCommands();
        
        // Запускаем последовательность загрузки
        this.bootSequence();
        
        // Добавляем обработчик клавиши ESC для выхода
        this.input.keyboard.on('keydown-ESC', this.exitTerminal, this);
    }
    
    /**
     * Загрузочная последовательность терминала
     */
    bootSequence() {
        // Последовательность загрузки
        const bootLines = [
            '================================',
            '  ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ КИБЕР-Т',
            '================================',
            '',
            'Загрузка микроядра............ ОК',
            'Проверка памяти............... ОК',
            'Инициализация устройств....... ОК',
            'Проверка файловой системы..... ОК',
            'Загрузка сервисов безопасности. ОК',
            'Подключение к сети............ ПРЕДУПРЕЖДЕНИЕ',
            'Обнаружены подозрительные пакеты',
            'Перехват пакетов включен',
            '',
            'Система готова. Введите "help" для получения списка команд.',
            '================================',
            ''
        ];
        
        // Выводим с анимацией
        this.terminal.writeOutput(bootLines, { speed: 20 });
        
        // Меняем приглашение командной строки после входа
        this.terminal.setPromptText('[ЮЗЕР@СИСТЕМА]$');
        
        // Устанавливаем состояние загрузки
        this.terminalState.booted = true;
    }
    
    /**
     * Регистрация команд терминала
     */
    registerTerminalCommands() {
        // Базовые команды
        this.terminal.registerCommand(
            'help',
            'Показать список доступных команд',
            this.commandHelp.bind(this)
        );
        
        this.terminal.registerCommand(
            'clear',
            'Очистить экран терминала',
            () => this.terminal.clearScreen()
        );
        
        this.terminal.registerCommand(
            'echo',
            'Вывести текст на экран',
            (args) => this.terminal.writeOutput(args.join(' ')),
            'echo <текст>'
        );
        
        this.terminal.registerCommand(
            'ls',
            'Показать содержимое текущей директории',
            this.commandLs.bind(this)
        );
        
        this.terminal.registerCommand(
            'cd',
            'Сменить текущую директорию',
            this.commandCd.bind(this),
            'cd <директория>'
        );
        
        this.terminal.registerCommand(
            'cat',
            'Показать содержимое файла',
            this.commandCat.bind(this),
            'cat <файл>'
        );
        
        this.terminal.registerCommand(
            'scan',
            'Сканировать сетевые узлы',
            this.commandScan.bind(this)
        );
        
        this.terminal.registerCommand(
            'connect',
            'Подключиться к удаленной системе',
            this.commandConnect.bind(this),
            'connect <адрес>'
        );
        
        this.terminal.registerCommand(
            'hack',
            'Запустить взлом системы',
            this.commandHack.bind(this),
            'hack <цель>'
        );
        
        this.terminal.registerCommand(
            'decrypt',
            'Расшифровать файл',
            this.commandDecrypt.bind(this),
            'decrypt <файл>'
        );
        
        this.terminal.registerCommand(
            'status',
            'Показать статус системы',
            this.commandStatus.bind(this)
        );
        
        this.terminal.registerCommand(
            'exit',
            'Выйти из терминала',
            this.exitTerminal.bind(this)
        );
        
        // Добавляем команды настроек
        this.terminal.registerCommand(
            'options',
            'Показать настройки игры',
            this.commandOptions.bind(this)
        );
        
        this.terminal.registerCommand(
            'setopt',
            'Изменить настройку',
            this.commandSetOption.bind(this),
            'setopt <настройка> <значение>'
        );
    }
    
    /**
     * Команда help - показать список доступных команд
     */
    commandHelp() {
        // Основные команды
        const basicCommands = [
            'help - Показать список доступных команд',
            'ls - Показать содержимое текущей директории',
            'cd - Сменить текущую директорию',
            'cat - Показать содержимое файла',
            'scan - Сканировать сетевые узлы',
            'connect - Подключиться к удаленной системе',
            'hack - Запустить взлом системы',
            'decrypt - Расшифровать файл',
            'status - Показать статус системы',
            'options - Показать настройки игры',
            'setopt - Изменить настройку',
            'exit - Выйти из терминала'
        ];
        
        // Дополнительные команды (могут быть открыты по мере прогресса)
        const advancedCommands = [];
        
        // Если открыты дополнительные команды, добавляем их
        if (this.terminalState.admin) {
            advancedCommands.push(
                'sudo - Выполнить команду с правами администратора',
                'rm - Удалить файл',
                'chmod - Изменить права доступа к файлу',
                'killall - Завершить все процессы'
            );
        }
        
        // Выводим команды
        this.terminal.writeOutput('Базовые команды:');
        this.terminal.writeOutput(basicCommands.join('\n'));
        
        // Если есть продвинутые команды, выводим их
        if (advancedCommands.length > 0) {
            this.terminal.writeOutput('\nПродвинутые команды:');
            this.terminal.writeOutput(advancedCommands.join('\n'));
        }
    }
    
    /**
     * Команда ls - показать содержимое текущей директории
     */
    commandLs() {
        // Определяем содержимое в зависимости от текущей директории
        let contents = [];
        
        switch (this.terminalState.currentDirectory) {
            case '/home/user':
                contents = [
                    'documents/',
                    'downloads/',
                    'scripts/',
                    '.bash_history',
                    'notes.txt'
                ];
                break;
                
            case '/home/user/documents':
                contents = [
                    'mission_briefing.txt',
                    'contacts.txt',
                    'passwords.enc'
                ];
                break;
                
            case '/home/user/downloads':
                contents = [
                    'exploit.sh',
                    'decoder.bin',
                    'network_map.dat'
                ];
                break;
                
            case '/home/user/scripts':
                contents = [
                    'scan_network.sh',
                    'decrypt_file.py',
                    'crack_password.js'
                ];
                break;
                
            case '/var/log':
                contents = [
                    'system.log',
                    'access.log',
                    'network.log',
                    'errors.log'
                ];
                break;
                
            case '/etc':
                contents = [
                    'passwd',
                    'shadow',
                    'hosts',
                    'config/'
                ];
                break;
                
            default:
                contents = [
                    'Нет доступа к данной директории'
                ];
        }
        
        // Добавляем открытые скрытые файлы, если они есть для этой директории
        // Здесь можно реализовать логику для скрытых файлов
        
        // Выводим содержимое
        if (contents.length > 0) {
            // Разделяем на файлы и директории для разного цвета
            const directories = contents.filter(item => item.endsWith('/'));
            const files = contents.filter(item => !item.endsWith('/'));
            
            // Выводим директории
            if (directories.length > 0) {
                // Используем цветное форматирование для директорий
                this.terminal.writeOutput(directories.join('  '), { color: '#00BFFF' });
            }
            
            // Выводим файлы
            if (files.length > 0) {
                this.terminal.writeOutput(files.join('  '), { color: '#FFFFFF' });
            }
        } else {
            this.terminal.writeOutput('Директория пуста');
        }
    }
    
    /**
     * Команда cd - сменить директорию
     * @param {string[]} args - Аргументы команды
     */
    commandCd(args) {
        // Если аргументы не указаны, выводим текущую директорию
        if (args.length === 0) {
            this.terminal.writeOutput(`Текущая директория: ${this.terminalState.currentDirectory}`);
            return;
        }
        
        const targetDir = args[0];
        
        // Обработка специальных случаев
        if (targetDir === '.') {
            // Текущая директория, ничего не делаем
            return;
        } else if (targetDir === '..') {
            // Родительская директория
            const parts = this.terminalState.currentDirectory.split('/');
            
            // Если мы не в корне, переходим на уровень выше
            if (parts.length > 1) {
                parts.pop();
                this.terminalState.currentDirectory = parts.join('/') || '/';
                this.terminal.writeOutput(`Директория изменена на: ${this.terminalState.currentDirectory}`);
            } else {
                this.terminal.writeOutput('Вы уже находитесь в корневой директории');
            }
            return;
        }
        
        // Определяем доступные директории в зависимости от текущей
        let availableDirs = [];
        
        switch (this.terminalState.currentDirectory) {
            case '/':
                availableDirs = ['home', 'var', 'etc', 'usr', 'bin'];
                break;
                
            case '/home':
                availableDirs = ['user', 'admin'];
                break;
                
            case '/home/user':
                availableDirs = ['documents', 'downloads', 'scripts'];
                break;
                
            case '/var':
                availableDirs = ['log', 'tmp', 'www'];
                break;
                
            case '/etc':
                availableDirs = ['config'];
                break;
                
            // Добавьте другие директории по необходимости
        }
        
        // Проверяем, существует ли директория
        if (availableDirs.includes(targetDir)) {
            // Обновляем текущий путь
            if (this.terminalState.currentDirectory === '/') {
                this.terminalState.currentDirectory = `/${targetDir}`;
            } else {
                this.terminalState.currentDirectory = `${this.terminalState.currentDirectory}/${targetDir}`;
            }
            
            this.terminal.writeOutput(`Директория изменена на: ${this.terminalState.currentDirectory}`);
        } else {
            this.terminal.writeOutput(`Директория "${targetDir}" не существует`);
        }
    }
    
    /**
     * Команда cat - показать содержимое файла
     * @param {string[]} args - Аргументы команды
     */
    commandCat(args) {
        // Если аргументы не указаны, выводим ошибку
        if (args.length === 0) {
            this.terminal.writeOutput('Использование: cat <файл>');
            return;
        }
        
        const filename = args[0];
        
        // Определяем содержимое в зависимости от файла и директории
        let fileContent = null;
        
        // Проверяем существование файла в текущей директории
        switch (`${this.terminalState.currentDirectory}/${filename}`) {
            case '/home/user/notes.txt':
                fileContent = [
                    'ЗАМЕТКИ:',
                    '- Проверить уязвимости в системе',
                    '- Зашифровать важные данные',
                    '- Связаться с контактом по поводу новой миссии',
                    '- Пароль от FTP: zxc123456'
                ];
                break;
                
            case '/home/user/documents/mission_briefing.txt':
                fileContent = [
                    'МИССИЯ: "h4ck/me"',
                    '',
                    'Цель: Получить доступ к защищенным данным корпорации "КиберТек"',
                    '',
                    'Этапы:',
                    '1. Сканирование сети для обнаружения уязвимых узлов',
                    '2. Внедрение в периметр безопасности',
                    '3. Обход защитных систем',
                    '4. Извлечение данных',
                    '',
                    'ВНИМАНИЕ: Сохраняйте низкий профиль для избежания обнаружения.'
                ];
                break;
                
            case '/home/user/documents/contacts.txt':
                fileContent = [
                    'КОНТАКТЫ:',
                    '',
                    'Хакер "Фантом" - специалист по обходу файрволов',
                    '  > Связь: через зашифрованный канал #7842',
                    '',
                    'Инженер "Кобальт" - специалист по аппаратной безопасности',
                    '  > Связь: только через защищенный терминал',
                    '',
                    'Посредник "Нексус" - обеспечивает связь с заказчиком',
                    '  > Связь: встреча в виртуальном пространстве, координаты в файле vault.dat'
                ];
                break;
                
            case '/var/log/access.log':
                fileContent = [
                    '192.168.1.253 - - [02/Feb/2023:12:34:56 +0000] "GET /admin HTTP/1.1" 403 287',
                    '192.168.1.253 - - [02/Feb/2023:12:35:10 +0000] "GET /login HTTP/1.1" 200 1024',
                    '192.168.1.253 - - [02/Feb/2023:12:35:30 +0000] "POST /login HTTP/1.1" 302 0',
                    '10.0.0.5 - - [02/Feb/2023:13:15:42 +0000] "GET /dashboard HTTP/1.1" 200 8192',
                    '10.0.0.5 - - [02/Feb/2023:13:20:15 +0000] "GET /files HTTP/1.1" 200 4096',
                    '10.0.0.5 - - [02/Feb/2023:13:25:33 +0000] "GET /files/secret.doc HTTP/1.1" 403 287',
                    '45.89.123.5 - - [02/Feb/2023:15:42:18 +0000] "GET / HTTP/1.1" 200 1536',
                    '45.89.123.5 - - [02/Feb/2023:15:42:30 +0000] "GET /api HTTP/1.1" 404 560'
                ];
                break;
                
            // Добавьте другие файлы по необходимости
                
            default:
                if (filename.endsWith('.enc')) {
                    fileContent = [
                        'ÖØÕþæûçû×ñûìþØÕûñä×ÖØ×ñûØëþØöûçû×êäìû×û',
                        'Öìêûë×ûØÕìþûìþëþç×ÕìçûçÕììý×êØÖçìëûþØêäØþ',
                        'ëþûïçûìýÖ×ØëêæçûæØäþç×êäìûýûØìýìýæûþØÖçêþ',
                        'Файл зашифрован. Используйте команду decrypt для расшифровки.'
                    ];
                } else if (filename.endsWith('.sh') || filename.endsWith('.py') || filename.endsWith('.js')) {
                    fileContent = [
                        'Исполняемый файл. Используйте команду "run" для запуска.'
                    ];
                } else {
                    this.terminal.writeOutput(`Файл "${filename}" не найден`);
                }
        }
        
        // Выводим содержимое файла, если он найден
        if (fileContent) {
            this.terminal.writeOutput(fileContent.join('\n'));
        }
    }
    
    /**
     * Команда scan - сканирование сети
     */
    commandScan() {
        // Имитация сканирования
        this.terminal.writeOutput('Инициализация сканирования сети...');
        
        // Симуляция процесса сканирования с задержкой
        this.time.delayedCall(1000, () => {
            this.terminal.writeOutput('Поиск открытых портов...');
            
            this.time.delayedCall(1500, () => {
                this.terminal.writeOutput('Определение активных узлов...');
                
                this.time.delayedCall(2000, () => {
                    this.terminal.writeOutput('Сканирование завершено.\n');
                    
                    // Выводим результаты сканирования
                    const scanResults = [
                        'Обнаружено узлов: 5',
                        '',
                        'УЗЕЛ 1:',
                        '  Адрес: 192.168.1.10',
                        '  Тип: Файрвол',
                        '  Порты: 22 (SSH), 443 (HTTPS)',
                        '  Уязвимость: Не обнаружено',
                        '',
                        'УЗЕЛ 2:',
                        '  Адрес: 192.168.1.20',
                        '  Тип: Сервер',
                        '  Порты: 21 (FTP), 22 (SSH), 80 (HTTP), 3306 (MySQL)',
                        '  Уязвимость: Устаревшая версия FTP-сервера',
                        '',
                        'УЗЕЛ 3:',
                        '  Адрес: 192.168.1.30',
                        '  Тип: Рабочая станция',
                        '  Порты: 445 (SMB)',
                        '  Уязвимость: Не обнаружено',
                        '',
                        'УЗЕЛ 4:',
                        '  Адрес: 192.168.1.40',
                        '  Тип: База данных',
                        '  Порты: 1433 (MSSQL)',
                        '  Уязвимость: Слабый пароль администратора',
                        '',
                        'УЗЕЛ 5:',
                        '  Адрес: 192.168.1.50',
                        '  Тип: Контроллер домена',
                        '  Порты: 53 (DNS), 389 (LDAP)',
                        '  Уязвимость: Не обнаружено'
                    ];
                    
                    this.terminal.writeOutput(scanResults.join('\n'));
                    
                    // Добавляем в список обнаруженных узлов (для использования в других командах)
                    this.terminalState.discoveredHosts = [
                        { address: '192.168.1.10', type: 'Файрвол', vulnerability: null },
                        { address: '192.168.1.20', type: 'Сервер', vulnerability: 'ftp' },
                        { address: '192.168.1.30', type: 'Рабочая станция', vulnerability: null },
                        { address: '192.168.1.40', type: 'База данных', vulnerability: 'password' },
                        { address: '192.168.1.50', type: 'Контроллер домена', vulnerability: null }
                    ];
                });
            });
        });
    }
    
    /**
     * Команда connect - подключение к удаленной системе
     * @param {string[]} args - Аргументы команды
     */
    commandConnect(args) {
        // Если аргументы не указаны, выводим ошибку
        if (args.length === 0) {
            this.terminal.writeOutput('Использование: connect <адрес>');
            return;
        }
        
        const address = args[0];
        
        // Проверяем, существует ли узел с таким адресом
        if (!this.terminalState.discoveredHosts) {
            this.terminal.writeOutput('Необходимо сначала выполнить сканирование сети (scan)');
            return;
        }
        
        const host = this.terminalState.discoveredHosts.find(h => h.address === address);
        
        if (!host) {
            this.terminal.writeOutput(`Узел с адресом ${address} не найден`);
            return;
        }
        
        // Симуляция подключения
        this.terminal.writeOutput(`Подключение к ${address}...`);
        
        // Задержка для имитации процесса
        this.time.delayedCall(1500, () => {
            // В зависимости от типа узла разный результат
            switch (host.type) {
                case 'Файрвол':
                    this.terminal.writeOutput('Соединение заблокировано файрволом. Требуется обход защиты.');
                    break;
                    
                case 'Сервер':
                    this.terminal.writeOutput('Соединение установлено.');
                    this.terminal.writeOutput('Необходима аутентификация. Введите учетные данные:');
                    
                    // Меняем приглашение командной строки
                    this.terminal.setPromptText(`[ГОСТЬ@${address}]$ `);
                    
                    // Устанавливаем текущего хоста
                    this.terminalState.currentHost = host;
                    break;
                    
                case 'База данных':
                    this.terminal.writeOutput('Соединение с базой данных установлено.');
                    this.terminal.writeOutput('SQL> ');
                    
                    // Меняем приглашение командной строки
                    this.terminal.setPromptText(`[SQL@${address}]> `);
                    
                    // Устанавливаем текущего хоста
                    this.terminalState.currentHost = host;
                    break;
                    
                default:
                    this.terminal.writeOutput('Соединение установлено.');
                    
                    // Меняем приглашение командной строки
                    this.terminal.setPromptText(`[УДАЛЕННО@${address}]$ `);
                    
                    // Устанавливаем текущего хоста
                    this.terminalState.currentHost = host;
            }
        });
    }
    
    /**
     * Команда hack - запуск взлома системы
     * @param {string[]} args - Аргументы команды
     */
    commandHack(args) {
        // Если аргументы не указаны, пытаемся взломать текущую систему
        const target = args.length > 0 ? args[0] : (this.terminalState.currentHost ? this.terminalState.currentHost.address : null);
        
        if (!target) {
            this.terminal.writeOutput('Использование: hack <цель>');
            this.terminal.writeOutput('Цель может быть адресом узла или идентификатором локального файла');
            return;
        }
        
        // Проверяем, является ли цель узлом или файлом
        if (target.includes('.')) {
            // Возможно это узел с IP-адресом
            if (this.terminalState.discoveredHosts && this.terminalState.discoveredHosts.find(h => h.address === target)) {
                // Это узел, запускаем взлом узла
                this.hackHost(target);
            } else {
                // Возможно это файл
                this.terminal.writeOutput(`Попытка взлома файла ${target}...`);
                
                this.time.delayedCall(1000, () => {
                    if (target.endsWith('.enc')) {
                        this.terminal.writeOutput('Обнаружен зашифрованный файл. Используйте команду decrypt.');
                    } else {
                        this.terminal.writeOutput(`Файл ${target} не требует взлома или не существует.`);
                    }
                });
            }
        } else {
            // Если цель не содержит точки, это может быть локальный ресурс
            this.terminal.writeOutput(`Ресурс "${target}" не найден.`);
        }
    }
    
    /**
     * Взлом удаленного узла
     * @param {string} address - Адрес узла
     */
    hackHost(address) {
        // Получаем данные об узле
        const host = this.terminalState.discoveredHosts.find(h => h.address === address);
        
        if (!host) {
            this.terminal.writeOutput(`Узел с адресом ${address} не найден`);
            return;
        }
        
        // Проверяем, есть ли уязвимость
        if (!host.vulnerability) {
            this.terminal.writeOutput(`Начало взлома ${address}...`);
            
            this.time.delayedCall(2000, () => {
                this.terminal.writeOutput('Анализ защитных механизмов...');
                
                this.time.delayedCall(2000, () => {
                    this.terminal.writeOutput('Не найдено уязвимостей для эксплуатации.');
                    this.terminal.writeOutput('Взлом не удался. Требуется дополнительная разведка или другой вектор атаки.');
                });
            });
            return;
        }
        
        // Если уязвимость есть, запускаем соответствующую мини-игру
        this.terminal.writeOutput(`Начало взлома ${address} через уязвимость ${host.vulnerability}...`);
        
        this.time.delayedCall(1500, () => {
            // Приостанавливаем текущую сцену
            this.scene.pause();
            
            // Определяем тип мини-игры в зависимости от уязвимости
            let hackType;
            switch (host.vulnerability) {
                case 'ftp':
                    hackType = 'network';
                    break;
                case 'password':
                    hackType = 'password';
                    break;
                default:
                    hackType = 'code';
            }
            
            // Запускаем сцену взлома
            this.scene.launch('HackingScene', {
                type: hackType,
                difficulty: this.game.globals.settings.difficulty,
                target: host
            });
            
            // Подписываемся на событие завершения взлома
            this.game.events.once('hackingComplete', this.onHackingComplete, this);
        });
    }
    
    /**
     * Обработчик завершения взлома
     * @param {object} result - Результат взлома
     */
    onHackingComplete(result) {
        // Возобновляем сцену терминала
        this.scene.resume();
        
        // Обрабатываем результат
        if (result.success) {
            this.terminal.writeOutput('Взлом успешно завершен!');
            this.terminal.writeOutput('Доступ получен.');
            
            // Меняем состояние в зависимости от типа взлома
            if (result.target && result.target.type === 'База данных') {
                this.terminal.writeOutput('\nИзвлечение данных...');
                
                this.time.delayedCall(1500, () => {
                    const data = [
                        'Получены данные:',
                        '',
                        'ПОЛЬЗОВАТЕЛИ:',
                        '  admin:hash(s3cur3P@ssw0rd)',
                        '  user1:hash(qwerty123)',
                        '  system:hash(syst3mR00t)',
                        '',
                        'КОНФИГУРАЦИЯ:',
                        '  security_level: medium',
                        '  encryption: aes-256',
                        '  backup_server: 192.168.1.60'
                    ];
                    
                    this.terminal.writeOutput(data.join('\n'));
                    
                    // Добавляем новый узел в список обнаруженных
                    if (this.terminalState.discoveredHosts && !this.terminalState.discoveredHosts.find(h => h.address === '192.168.1.60')) {
                        this.terminalState.discoveredHosts.push({
                            address: '192.168.1.60',
                            type: 'Сервер резервного копирования',
                            vulnerability: 'backup'
                        });
                        
                        this.terminal.writeOutput('\nОбнаружен новый узел: 192.168.1.60');
                    }
                });
            } else {
                this.terminal.writeOutput('Привилегии повышены.');
                this.terminal.writeOutput('Получен доступ администратора.');
                
                // Меняем приглашение командной строки
                if (this.terminalState.currentHost) {
                    this.terminal.setPromptText(`[АДМИН@${this.terminalState.currentHost.address}]# `);
                } else {
                    this.terminal.setPromptText('[АДМИН@СИСТЕМА]# ');
                }
                
                // Устанавливаем права администратора
                this.terminalState.admin = true;
            }
        } else {
            this.terminal.writeOutput('Взлом не удался!');
            this.terminal.writeOutput('Системой безопасности зафиксирована попытка несанкционированного доступа.');
            this.terminal.writeOutput('Соединение разорвано.');
            
            // Возвращаем стандартное приглашение командной строки
            this.terminal.setPromptText('[ЮЗЕР@СИСТЕМА]$ ');
            
            // Сбрасываем текущий хост
            this.terminalState.currentHost = null;
        }
    }
    
    /**
     * Команда decrypt - расшифровка файла
     * @param {string[]} args - Аргументы команды
     */
    commandDecrypt(args) {
        // Если аргументы не указаны, выводим ошибку
        if (args.length === 0) {
            this.terminal.writeOutput('Использование: decrypt <файл>');
            return;
        }
        
        const filename = args[0];
        
        // Проверяем, существует ли файл и является ли он зашифрованным
        if (!filename.endsWith('.enc')) {
            this.terminal.writeOutput(`Файл ${filename} не является зашифрованным`);
            return;
        }
        
        // Симуляция расшифровки
        this.terminal.writeOutput(`Попытка расшифровки файла ${filename}...`);
        
        // Задержка для имитации процесса
        this.time.delayedCall(1500, () => {
            // Определяем содержимое в зависимости от файла
            let decryptedContent = null;
            
            switch (`${this.terminalState.currentDirectory}/${filename}`) {
                case '/home/user/documents/passwords.enc':
                    decryptedContent = [
                        'СПИСОК ПАРОЛЕЙ:',
                        '',
                        'Сервер FTP: user/p@ssw0rd',
                        'База данных: admin/database123',
                        'Почтовый ящик: user@example.com/mail2023',
                        'VPN: vpn_user/secure456',
                        '',
                        'Главный пароль к хранилищу данных:',
                        'M@sterKey2023X'
                    ];
                    break;
                    
                // Добавьте другие зашифрованные файлы по необходимости
                    
                default:
                    this.terminal.writeOutput('Не удалось расшифровать файл. Неизвестный формат или поврежденные данные.');
                    return;
            }
            
            // Если содержимое определено, выводим его
            if (decryptedContent) {
                this.terminal.writeOutput('Расшифровка успешна!\n');
                this.terminal.writeOutput(decryptedContent.join('\n'));
            }
        });
    }
    
    /**
     * Команда status - показать статус системы
     */
    commandStatus() {
        // Формируем информацию о статусе
        const statusInfo = [
            'СТАТУС СИСТЕМЫ:',
            '',
            `Текущий пользователь: ${this.terminalState.admin ? 'Администратор' : 'Стандартный пользователь'}`,
            `Текущая директория: ${this.terminalState.currentDirectory}`,
            `Подключен к: ${this.terminalState.currentHost ? this.terminalState.currentHost.address : 'локальной системе'}`,
            '',
            'СТАТИСТИКА:',
            `  Обнаружено узлов: ${this.terminalState.discoveredHosts ? this.terminalState.discoveredHosts.length : 0}`,
            `  Взломано узлов: ${this.terminalState.hackedHosts ? this.terminalState.hackedHosts.length : 0}`,
            `  Расшифровано файлов: ${this.terminalState.decryptedFiles ? this.terminalState.decryptedFiles.length : 0}`
        ];
        
        // Выводим статус
        this.terminal.writeOutput(statusInfo.join('\n'));
    }
    
    /**
     * Выход из терминала
     */
    exitTerminal() {
        // Если мы подключены к удаленной системе, отключаемся
        if (this.terminalState.currentHost) {
            this.terminal.writeOutput(`Отключение от ${this.terminalState.currentHost.address}...`);
            this.terminalState.currentHost = null;
            
            // Возвращаем стандартное приглашение командной строки
            this.terminal.setPromptText('[ЮЗЕР@СИСТЕМА]$ ');
            return;
        }
        
        // Иначе выходим из терминала
        this.terminal.writeOutput('Завершение сеанса терминала...');
        
        // Задержка для анимации
        this.time.delayedCall(1000, () => {
            // Возвращаемся к предыдущей сцене
            this.scene.stop();
            this.scene.resume(this.previousScene);
            
            // Вызываем колбэк возврата, если он есть
            if (this.returnCallback) {
                this.returnCallback();
            }
        });
    }
    
    /**
     * Команда options - показать настройки игры
     */
    commandOptions() {
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
     * Команда setopt - изменить настройку
     * @param {string[]} args - Аргументы команды (имя_настройки, значение)
     */
    commandSetOption(args) {
        if (args.length < 2) {
            this.terminal.writeOutput('Ошибка: Недостаточно аргументов. Используйте "setopt <настройка> <значение>"');
            return;
        }
        
        const option = args[0].toLowerCase();
        const value = args[1];
        const settings = this.game.globals.settings;
        
        switch (option) {
            case 'difficulty':
                if (['easy', 'normal', 'hard'].includes(value)) {
                    settings.difficulty = value;
                    this.terminal.writeOutput(`Сложность установлена на: ${value}`);
                } else {
                    this.terminal.writeOutput('Ошибка: Допустимые значения сложности: easy, normal, hard');
                }
                break;
                
            case 'soundvolume':
                const soundVol = parseInt(value);
                if (!isNaN(soundVol) && soundVol >= 0 && soundVol <= 100) {
                    settings.soundVolume = soundVol / 100;
                    this.terminal.writeOutput(`Громкость звуков установлена на: ${soundVol}%`);
                } else {
                    this.terminal.writeOutput('Ошибка: Громкость должна быть числом от 0 до 100');
                }
                break;
                
            case 'musicvolume':
                const musicVol = parseInt(value);
                if (!isNaN(musicVol) && musicVol >= 0 && musicVol <= 100) {
                    settings.musicVolume = musicVol / 100;
                    this.terminal.writeOutput(`Громкость музыки установлена на: ${musicVol}%`);
                } else {
                    this.terminal.writeOutput('Ошибка: Громкость должна быть числом от 0 до 100');
                }
                break;
                
            case 'terminalspeed':
                const speed = parseInt(value);
                if (!isNaN(speed) && speed >= 10 && speed <= 50) {
                    settings.terminalSpeed = speed;
                    this.terminal.writeOutput(`Скорость терминала установлена на: ${speed}мс`);
                } else {
                    this.terminal.writeOutput('Ошибка: Скорость должна быть числом от 10 до 50');
                }
                break;
                
            default:
                this.terminal.writeOutput(`Ошибка: Неизвестная настройка "${option}"`);
                break;
        }
        
        // Сохраняем настройки в локальное хранилище
        localStorage.setItem('hacker_sim_settings', JSON.stringify(settings));
    }
    
    update() {
        // Логика обновления, если необходима
    }
}