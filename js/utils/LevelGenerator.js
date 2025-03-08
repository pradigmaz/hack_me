/**
 * LevelGenerator - класс для процедурной генерации уровней
 */
class LevelGenerator {
    constructor(config = {}) {
        // Настройки генератора
        this.config = {
            width: config.width || 50,
            height: config.height || 50,
            minRooms: config.minRooms || 5,
            maxRooms: config.maxRooms || 10,
            minRoomSize: config.minRoomSize || 4,
            maxRoomSize: config.maxRoomSize || 10,
            difficulty: config.difficulty || 'normal',
            levelType: config.levelType || 'network' // 'network', 'server', 'database'
        };
        
        // Символы для представления элементов уровня
        this.symbols = {
            wall: '#',
            floor: '.',
            door: '+',
            player: '@',
            firewall: 'F',
            dataPacket: 'D',
            terminal: 'T',
            empty: ' '
        };
        
        // Типы объектов на уровне
        this.objectTypes = {
            firewall: {
                count: { easy: 3, normal: 5, hard: 8 },
                symbol: this.symbols.firewall
            },
            dataPacket: {
                count: { easy: 5, normal: 3, hard: 2 },
                symbol: this.symbols.dataPacket
            },
            terminal: {
                count: { easy: 3, normal: 2, hard: 1 },
                symbol: this.symbols.terminal
            }
        };
        
        // Инициализация генератора случайных чисел
        this.seed = config.seed || Date.now();
        this.rng = this.createRNG(this.seed);
    }
    
    /**
     * Создать простой генератор псевдослучайных чисел на основе seed
     * @param {number} seed - Начальное значение
     * @returns {function} - Функция-генератор случайных чисел от 0 до 1
     */
    createRNG(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }
    
    /**
     * Сгенерировать случайное число в заданном диапазоне
     * @param {number} min - Минимальное значение
     * @param {number} max - Максимальное значение
     * @returns {number} - Случайное целое число
     */
    getRandomInt(min, max) {
        return Math.floor(this.rng() * (max - min + 1)) + min;
    }
    
    /**
     * Инициализировать пустую карту
     * @returns {string[][]} - Пустая карта
     */
    initEmptyMap() {
        const map = [];
        for (let y = 0; y < this.config.height; y++) {
            const row = [];
            for (let x = 0; x < this.config.width; x++) {
                row.push(this.symbols.empty);
            }
            map.push(row);
        }
        return map;
    }
    
    /**
     * Сгенерировать комнату на карте
     * @param {string[][]} map - Карта уровня
     * @param {number} x - Координата X верхнего левого угла
     * @param {number} y - Координата Y верхнего левого угла
     * @param {number} width - Ширина комнаты
     * @param {number} height - Высота комнаты
     */
    createRoom(map, x, y, width, height) {
        // Создаем стены
        for (let i = x; i < x + width; i++) {
            for (let j = y; j < y + height; j++) {
                if (i === x || i === x + width - 1 || j === y || j === y + height - 1) {
                    if (i >= 0 && i < this.config.width && j >= 0 && j < this.config.height) {
                        map[j][i] = this.symbols.wall;
                    }
                } else {
                    if (i >= 0 && i < this.config.width && j >= 0 && j < this.config.height) {
                        map[j][i] = this.symbols.floor;
                    }
                }
            }
        }
        
        // Возвращаем информацию о комнате
        return {
            x, y, width, height,
            centerX: Math.floor(x + width / 2),
            centerY: Math.floor(y + height / 2)
        };
    }
    
    /**
     * Создать коридор между двумя точками
     * @param {string[][]} map - Карта уровня
     * @param {number} x1 - Начальная координата X
     * @param {number} y1 - Начальная координата Y
     * @param {number} x2 - Конечная координата X
     * @param {number} y2 - Конечная координата Y
     */
    createCorridor(map, x1, y1, x2, y2) {
        // Сначала идем по X
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            if (x >= 0 && x < this.config.width && y1 >= 0 && y1 < this.config.height) {
                if (map[y1][x] === this.symbols.wall) {
                    map[y1][x] = this.symbols.door;
                } else if (map[y1][x] === this.symbols.empty) {
                    map[y1][x] = this.symbols.floor;
                }
            }
        }
        
        // Затем идем по Y
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            if (x2 >= 0 && x2 < this.config.width && y >= 0 && y < this.config.height) {
                if (map[y][x2] === this.symbols.wall) {
                    map[y][x2] = this.symbols.door;
                } else if (map[y][x2] === this.symbols.empty) {
                    map[y][x2] = this.symbols.floor;
                }
            }
        }
    }
    
    /**
     * Разместить объекты на карте
     * @param {string[][]} map - Карта уровня
     * @param {array} rooms - Массив комнат
     */
    placeObjects(map, rooms) {
        const difficulty = this.config.difficulty;
        const objects = [];
        
        // Для каждого типа объектов
        for (const [type, info] of Object.entries(this.objectTypes)) {
            const count = info.count[difficulty];
            
            for (let i = 0; i < count; i++) {
                // Выбираем случайную комнату, исключая первую (стартовую)
                const roomIndex = this.getRandomInt(1, rooms.length - 1);
                const room = rooms[roomIndex];
                
                // Находим случайную позицию внутри комнаты
                let x, y;
                let attempts = 0;
                
                do {
                    x = this.getRandomInt(room.x + 1, room.x + room.width - 2);
                    y = this.getRandomInt(room.y + 1, room.y + room.height - 2);
                    attempts++;
                } while (map[y][x] !== this.symbols.floor && attempts < 50);
                
                if (attempts < 50) {
                    map[y][x] = info.symbol;
                    objects.push({ type, x, y });
                }
            }
        }
        
        return objects;
    }
    
    /**
     * Сгенерировать уровень
     * @returns {object} - Сгенерированный уровень с картой и объектами
     */
    generateLevel() {
        // Инициализируем пустую карту
        const map = this.initEmptyMap();
        
        // Определяем количество комнат
        const numRooms = this.getRandomInt(this.config.minRooms, this.config.maxRooms);
        const rooms = [];
        
        // Создаем комнаты
        for (let i = 0; i < numRooms; i++) {
            // Определяем размеры комнаты
            const roomWidth = this.getRandomInt(this.config.minRoomSize, this.config.maxRoomSize);
            const roomHeight = this.getRandomInt(this.config.minRoomSize, this.config.maxRoomSize);
            
            // Определяем позицию комнаты
            const x = this.getRandomInt(1, this.config.width - roomWidth - 1);
            const y = this.getRandomInt(1, this.config.height - roomHeight - 1);
            
            // Проверяем перекрытие с существующими комнатами
            let overlaps = false;
            for (const room of rooms) {
                if (x < room.x + room.width + 1 && 
                    x + roomWidth + 1 > room.x && 
                    y < room.y + room.height + 1 && 
                    y + roomHeight + 1 > room.y) {
                    overlaps = true;
                    break;
                }
            }
            
            // Если нет перекрытия, создаем комнату
            if (!overlaps) {
                const room = this.createRoom(map, x, y, roomWidth, roomHeight);
                rooms.push(room);
                
                // Соединяем с предыдущей комнатой (кроме первой)
                if (i > 0) {
                    const prevRoom = rooms[i - 1];
                    this.createCorridor(map, prevRoom.centerX, prevRoom.centerY, room.centerX, room.centerY);
                }
            }
        }
        
        // Размещаем игрока в первой комнате
        if (rooms.length > 0) {
            const startRoom = rooms[0];
            map[startRoom.centerY][startRoom.centerX] = this.symbols.player;
            
            // Запоминаем стартовую позицию
            const startPosition = { x: startRoom.centerX, y: startRoom.centerY };
            
            // Размещаем объекты
            const objects = this.placeObjects(map, rooms);
            
            // Возвращаем сгенерированный уровень
            return {
                map,
                rooms,
                startPosition,
                objects,
                width: this.config.width,
                height: this.config.height,
                levelType: this.config.levelType,
                difficulty: this.config.difficulty,
                seed: this.seed
            };
        }
        
        // В случае неудачи возвращаем пустую карту
        return { map, rooms: [], startPosition: { x: 0, y: 0 }, objects: [] };
    }
    
    /**
     * Преобразовать карту в строку для вывода
     * @param {string[][]} map - Карта уровня
     * @returns {string} - Строковое представление карты
     */
    mapToString(map) {
        return map.map(row => row.join('')).join('\n');
    }
}
