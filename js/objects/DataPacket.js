/**
 * DataPacket - класс для создания собираемых объектов (пакетов данных)
 */
class DataPacket {
    /**
     * Конструктор класса DataPacket
     * @param {Phaser.Scene} scene - Сцена Phaser
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @param {object} config - Конфигурация пакета данных
     */
    constructor(scene, x, y, config = {}) {
        this.scene = scene;
        
        // Настройки по умолчанию
        this.config = {
            size: config.size || 32,
            symbol: config.symbol || 'D',
            color: config.color || '#FFFF00',
            value: config.value || 1,
            pulseScale: config.pulseScale || 1.1,
            pulseDuration: config.pulseDuration || 800,
            depth: config.depth || 15
        };
        
        // Создаем физический спрайт
        this.sprite = scene.physics.add.sprite(x, y, null);
        this.sprite.setSize(this.config.size * 0.6, this.config.size * 0.6);
        
        // Визуальное представление
        this.text = scene.add.text(x, y, this.config.symbol, {
            fontFamily: 'monospace',
            fontSize: this.config.size * 0.6,
            color: this.config.color
        });
        this.text.setOrigin(0.5);
        this.text.setDepth(this.config.depth);
        
        // Эффект свечения вокруг пакета
        this.glow = scene.add.graphics();
        this.glow.fillStyle(parseInt(this.config.color.replace('#', '0x')), 0.3);
        this.glow.fillCircle(x, y, this.config.size * 0.4);
        this.glow.setDepth(this.config.depth - 1);
        
        // Добавляем ссылку на объект в спрайт для доступа в коллбэках
        this.sprite.dataPacket = this;
        
        // Тип данных (для разных типов пакетов)
        this.dataType = config.dataType || 'standard';
        
        // Значение пакета (сколько "очков" дает)
        this.value = this.config.value;
        
        // Инициализируем анимации
        this.initAnimations();
    }
    
    /**
     * Инициализация анимаций
     */
    initAnimations() {
        // Эффект пульсации
        this.scene.tweens.add({
            targets: this.text,
            scale: this.config.pulseScale,
            alpha: 0.7,
            duration: this.config.pulseDuration,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Анимация свечения
        this.scene.tweens.add({
            targets: this.glow,
            alpha: 0.1,
            duration: this.config.pulseDuration * 1.5,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Случайное вращение (с разной скоростью для разных пакетов)
        if (Math.random() > 0.5) {
            this.scene.tweens.add({
                targets: this.text,
                angle: 360,
                duration: 10000 + Math.random() * 5000,
                repeat: -1
            });
        }
    }
    
    /**
     * Обновление состояния пакета
     */
    update() {
        // В базовой версии ничего не делаем
        // Метод для переопределения в наследниках
    }
    
    /**
     * Сбор пакета данных игроком
     * @param {Player} player - Игрок, собравший пакет
     */
    collect(player) {
        // Анимация сбора
        this.scene.tweens.add({
            targets: [this.text, this.glow],
            scale: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                // Уничтожаем объект после анимации
                this.destroy();
            }
        });
        
        // Создаем частицы при сборе
        this.createCollectParticles();
        
        // Возвращаем значение пакета
        return this.value;
    }
    
    /**
     * Создание частиц при сборе пакета
     */
    createCollectParticles() {
        // Создаем эмиттер частиц
        const particles = this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle', {
            frame: 0,
            lifespan: 500,
            speed: { min: 50, max: 150 },
            scale: { start: 0.4, end: 0 },
            quantity: 10,
            blendMode: 'ADD',
            tint: parseInt(this.config.color.replace('#', '0x'))
        });
        
        // Если текстуры нет, создаем собственные частицы
        if (!particles.texture) {
            // Создаем текстуру для частиц
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(parseInt(this.config.color.replace('#', '0x')), 1);
            graphics.fillCircle(8, 8, 4);
            graphics.generateTexture('particle', 16, 16);
            graphics.destroy();
            
            // Создаем частицы с нашей текстурой
            this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle', {
                lifespan: 500,
                speed: { min: 50, max: 150 },
                scale: { start: 0.4, end: 0 },
                quantity: 10,
                blendMode: 'ADD'
            });
        }
        
        // Удаляем частицы после завершения анимации
        this.scene.time.delayedCall(500, () => {
            if (particles && particles.active) {
                particles.destroy();
            }
        });
    }
    
    /**
     * Создание эффекта притяжения к игроку
     * @param {Phaser.GameObjects.Sprite} playerSprite - Спрайт игрока
     * @param {number} distance - Расстояние, на котором срабатывает притяжение
     * @param {number} force - Сила притяжения
     */
    magnetToPlayer(playerSprite, distance = 100, force = 1) {
        // Проверяем расстояние до игрока
        const dist = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            playerSprite.x, playerSprite.y
        );
        
        // Если игрок в зоне притяжения
        if (dist < distance) {
            // Вычисляем угол к игроку
            const angle = Phaser.Math.Angle.Between(
                this.sprite.x, this.sprite.y,
                playerSprite.x, playerSprite.y
            );
            
            // Сила притяжения обратно пропорциональна расстоянию
            const strength = (1 - dist / distance) * force;
            
            // Притягиваем пакет к игроку
            this.sprite.x += Math.cos(angle) * strength;
            this.sprite.y += Math.sin(angle) * strength;
            
            // Обновляем позицию текста и свечения
            this.text.setPosition(this.sprite.x, this.sprite.y);
            
            // Обновляем позицию эффекта свечения
            this.glow.clear();
            this.glow.fillStyle(parseInt(this.config.color.replace('#', '0x')), 0.3);
            this.glow.fillCircle(this.sprite.x, this.sprite.y, this.config.size * 0.4);
            
            // Возвращаем true, если притяжение активно
            return true;
        }
        
        return false;
    }
    
    /**
     * Уничтожение объекта пакета данных
     */
    destroy() {
        if (this.text) this.text.destroy();
        if (this.glow) this.glow.destroy();
        if (this.sprite) this.sprite.destroy();
    }
}