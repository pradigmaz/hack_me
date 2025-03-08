/**
 * Firewall - класс препятствий (файрволов)
 * Представляет собой опасные объекты, которых игрок должен избегать
 */
class Firewall {
    /**
     * Конструктор класса Firewall
     * @param {Phaser.Scene} scene - Сцена Phaser
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @param {object} config - Конфигурация файрвола
     */
    constructor(scene, x, y, config = {}) {
        this.scene = scene;
        
        // Настройки по умолчанию
        this.config = {
            size: config.size || 32,
            symbol: config.symbol || 'F',
            color: config.color || '#FF073A',
            damage: config.damage || 10,
            patrolRadius: config.patrolRadius || 96,
            patrolSpeed: config.patrolSpeed || 0.001,
            rotationSpeed: config.rotationSpeed || 0.1,
            pulseDuration: config.pulseDuration || 1000,
            pulseScale: config.pulseScale || 1.2,
            depth: config.depth || 15
        };
        
        // Создаем физический спрайт
        this.sprite = scene.physics.add.sprite(x, y, null);
        this.sprite.setSize(this.config.size * 0.7, this.config.size * 0.7);
        
        // Центральная точка для патрулирования
        this.patrolCenter = {
            x: x,
            y: y
        };
        
        // Начальный угол патрулирования
        this.patrolAngle = Math.random() * Math.PI * 2;
        
        // Визуальное представление
        this.text = scene.add.text(x, y, this.config.symbol, {
            fontFamily: 'monospace',
            fontSize: this.config.size * 0.7,
            color: this.config.color
        });
        this.text.setOrigin(0.5);
        this.text.setDepth(this.config.depth);
        
        // Эффект опасного свечения
        this.glow = scene.add.graphics();
        this.glow.fillStyle(parseInt(this.config.color.replace('#', '0x')), 0.2);
        this.glow.fillCircle(x, y, this.config.size * 0.6);
        this.glow.setDepth(this.config.depth - 1);
        
        // Добавляем ссылку на объект в спрайт для доступа в коллбэках
        this.sprite.firewall = this;
        
        // Тип файрвола (для разных типов)
        this.firewallType = config.firewallType || 'standard';
        
        // Величина урона
        this.damage = this.config.damage;
        
        // Инициализируем анимации
        this.initAnimations();
    }
    
    /**
     * Инициализация анимаций
     */
    initAnimations() {
        // Эффект вращения
        this.scene.tweens.add({
            targets: this.text,
            angle: 360,
            duration: 5000,
            repeat: -1
        });
        
        // Эффект пульсации
        this.scene.tweens.add({
            targets: this.text,
            scale: this.config.pulseScale,
            duration: this.config.pulseDuration,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Анимация свечения
        this.scene.tweens.add({
            targets: this.glow,
            alpha: { from: 0.3, to: 0.1 },
            duration: this.config.pulseDuration / 2,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    /**
     * Обновление состояния файрвола
     * @param {number} time - Текущее время
     * @param {number} delta - Время с последнего обновления
     */
    update(time, delta) {
        // Обновляем угол патрулирования
        this.patrolAngle += this.config.patrolSpeed * delta;
        
        // Вычисляем новую позицию
        const newX = this.patrolCenter.x + Math.cos(this.patrolAngle) * this.config.patrolRadius;
        const newY = this.patrolCenter.y + Math.sin(this.patrolAngle) * this.config.patrolRadius;
        
        // Устанавливаем позицию спрайта
        this.sprite.setPosition(newX, newY);
        
        // Обновляем позицию текста
        this.text.setPosition(newX, newY);
        
        // Обновляем позицию эффекта свечения
        this.glow.clear();
        this.glow.fillStyle(parseInt(this.config.color.replace('#', '0x')), 0.2);
        this.glow.fillCircle(newX, newY, this.config.size * 0.6);
    }
    
    /**
     * Столкновение с игроком
     * @param {Player} player - Игрок, столкнувшийся с файрволом
     */
    hit(player) {
        // Наносим урон игроку
        const isAlive = player.damage(this.damage);
        
        // Отбрасываем игрока
        player.knockback(this.sprite.x, this.sprite.y);
        
        // Эффект столкновения
        this.createHitEffect();
        
        // Возвращаем состояние игрока (жив/мертв)
        return isAlive;
    }
    
    /**
     * Создание эффекта при столкновении
     */
    createHitEffect() {
        // Создаем эмиттер частиц
        const particles = this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle', {
            frame: 0,
            lifespan: 300,
            speed: { min: 100, max: 200 },
            scale: { start: 0.5, end: 0 },
            quantity: 15,
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
                lifespan: 300,
                speed: { min: 100, max: 200 },
                scale: { start: 0.5, end: 0 },
                quantity: 15,
                blendMode: 'ADD'
            });
        }
        
        // Кратковременное увеличение размера для эффекта удара
        this.scene.tweens.add({
            targets: this.text,
            scale: 1.5,
            duration: 100,
            yoyo: true
        });
        
        // Удаляем частицы после завершения анимации
        this.scene.time.delayedCall(300, () => {
            if (particles && particles.active) {
                particles.destroy();
            }
        });
    }
    
    /**
     * Изменение типа патрулирования
     * @param {string} type - Тип патрулирования ('circle', 'line', 'random')
     */
    setPatrolType(type) {
        this.patrolType = type;
        
        // Для линейного патрулирования нужны дополнительные параметры
        if (type === 'line') {
            // Определяем две точки для линейного патрулирования
            const angle = Math.random() * Math.PI * 2;
            const distance = this.config.patrolRadius;
            
            this.patrolPoints = [
                {
                    x: this.patrolCenter.x + Math.cos(angle) * distance,
                    y: this.patrolCenter.y + Math.sin(angle) * distance
                },
                {
                    x: this.patrolCenter.x + Math.cos(angle + Math.PI) * distance,
                    y: this.patrolCenter.y + Math.sin(angle + Math.PI) * distance
                }
            ];
            
            this.patrolDirection = 0;
            this.patrolProgress = 0;
        }
    }
    
    /**
     * Обновление линейного патрулирования
     * @param {number} delta - Время с последнего обновления
     */
    updateLinePatrol(delta) {
        // Если не заданы точки патрулирования, возвращаемся
        if (!this.patrolPoints) return;
        
        // Обновляем прогресс
        this.patrolProgress += this.config.patrolSpeed * delta * 2;
        
        // Если достигли конца, меняем направление
        if (this.patrolProgress >= 1) {
            this.patrolProgress = 1;
            this.patrolDirection = 1 - this.patrolDirection;
        } else if (this.patrolProgress <= 0) {
            this.patrolProgress = 0;
            this.patrolDirection = 1 - this.patrolDirection;
        }
        
        // Определяем текущие точки
        const fromPoint = this.patrolPoints[this.patrolDirection];
        const toPoint = this.patrolPoints[1 - this.patrolDirection];
        
        // Вычисляем позицию на линии
        const newX = Phaser.Math.Linear(fromPoint.x, toPoint.x, this.patrolProgress);
        const newY = Phaser.Math.Linear(fromPoint.y, toPoint.y, this.patrolProgress);
        
        // Устанавливаем позицию
        this.sprite.setPosition(newX, newY);
        this.text.setPosition(newX, newY);
        
        // Обновляем свечение
        this.glow.clear();
        this.glow.fillStyle(parseInt(this.config.color.replace('#', '0x')), 0.2);
        this.glow.fillCircle(newX, newY, this.config.size * 0.6);
    }
    
    /**
     * Изменение скорости патрулирования
     * @param {number} speed - Новая скорость патрулирования
     */
    setPatrolSpeed(speed) {
        this.config.patrolSpeed = speed;
    }
    
    /**
     * Изменение радиуса патрулирования
     * @param {number} radius - Новый радиус патрулирования
     */
    setPatrolRadius(radius) {
        this.config.patrolRadius = radius;
    }
    
    /**
     * Уничтожение объекта файрвола
     */
    destroy() {
        if (this.text) this.text.destroy();
        if (this.glow) this.glow.destroy();
        if (this.sprite) this.sprite.destroy();
    }
}