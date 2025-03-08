/**
 * Player - класс игрока (цифрового аватара)
 * Отвечает за управление и взаимодействие с игровым миром
 */
class Player {
    /**
     * Конструктор класса Player
     * @param {Phaser.Scene} scene - Сцена Phaser
     * @param {number} x - Начальная позиция X
     * @param {number} y - Начальная позиция Y
     * @param {object} config - Конфигурация игрока
     */
    constructor(scene, x, y, config = {}) {
        this.scene = scene;
        
        // Настройки по умолчанию
        this.config = {
            speed: config.speed || 150,
            size: config.size || 32,
            symbol: config.symbol || '@',
            color: config.color || '#00FF41',
            glowColor: config.glowColor || 0x00FF41,
            depth: config.depth || 20
        };
        
        // Создаем физический спрайт
        this.sprite = scene.physics.add.sprite(x, y, null);
        this.sprite.setSize(this.config.size * 0.7, this.config.size * 0.7);
        this.sprite.setCollideWorldBounds(true);
        
        // Визуальное представление - символ '@'
        this.text = scene.add.text(x, y, this.config.symbol, {
            fontFamily: 'monospace',
            fontSize: this.config.size * 0.8,
            color: this.config.color
        });
        this.text.setOrigin(0.5);
        this.text.setDepth(this.config.depth);
        
        // Добавляем эффект свечения
        this.glowEffect = scene.add.graphics();
        this.glowEffect.setDepth(this.config.depth - 5);
        
        // Состояние игрока
        this.state = {
            health: 100,
            invulnerable: false,
            dataCollected: 0,
            nearTerminal: false,
            isMoving: false
        };
        
        // Добавляем ссылку на игрока в спрайт для доступа в коллбэках
        this.sprite.player = this;
        
        // Инициализируем эффекты
        this.initEffects();
    }
    
    /**
     * Инициализация визуальных эффектов
     */
    initEffects() {
        // Анимация пульсации для эффекта свечения
        this.scene.tweens.add({
            targets: this,
            glowRadius: { from: this.config.size * 0.6, to: this.config.size * 0.8 },
            glowAlpha: { from: 0.2, to: 0.1 },
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Начальные значения для анимации
        this.glowRadius = this.config.size * 0.6;
        this.glowAlpha = 0.2;
    }
    
    /**
     * Основной метод обновления
     * @param {object} controls - Объект с состоянием элементов управления
     */
    update(controls) {
        // Обновляем движение
        this.updateMovement(controls);
        
        // Обновляем позицию текста
        this.text.setPosition(this.sprite.x, this.sprite.y);
        
        // Обновляем эффект свечения
        this.updateGlowEffect();
        
        // Обработка взаимодействия
        this.handleInteraction(controls);
    }
    
    /**
     * Обновление движения игрока
     * @param {object} controls - Объект с состоянием элементов управления
     */
    updateMovement(controls) {
        // Сброс скорости
        this.sprite.setVelocity(0);
        
        // Флаг движения
        let isMoving = false;
        
        // Перемещение по горизонтали
        if (controls.left.some(key => key.isDown)) {
            this.sprite.setVelocityX(-this.config.speed);
            isMoving = true;
        } else if (controls.right.some(key => key.isDown)) {
            this.sprite.setVelocityX(this.config.speed);
            isMoving = true;
        }
        
        // Перемещение по вертикали
        if (controls.up.some(key => key.isDown)) {
            this.sprite.setVelocityY(-this.config.speed);
            isMoving = true;
        } else if (controls.down.some(key => key.isDown)) {
            this.sprite.setVelocityY(this.config.speed);
            isMoving = true;
        }
        
        // Нормализация диагонального движения
        if (this.sprite.body.velocity.x !== 0 && this.sprite.body.velocity.y !== 0) {
            this.sprite.body.velocity.normalize().scale(this.config.speed);
        }
        
        // Обновляем состояние движения
        if (this.state.isMoving !== isMoving) {
            this.state.isMoving = isMoving;
            
            // Изменяем внешний вид при движении
            if (isMoving) {
                // Увеличиваем интенсивность свечения при движении
                this.scene.tweens.add({
                    targets: this,
                    glowAlpha: 0.3,
                    duration: 200
                });
            } else {
                // Уменьшаем интенсивность свечения при остановке
                this.scene.tweens.add({
                    targets: this,
                    glowAlpha: 0.2,
                    duration: 200
                });
            }
        }
    }
    
    /**
     * Обновление эффекта свечения
     */
    updateGlowEffect() {
        // Очищаем предыдущее свечение
        this.glowEffect.clear();
        
        // Рисуем новое свечение
        this.glowEffect.fillStyle(this.config.glowColor, this.glowAlpha);
        this.glowEffect.fillCircle(this.sprite.x, this.sprite.y, this.glowRadius);
    }
    
    /**
     * Обработка взаимодействия с миром
     * @param {object} controls - Объект с состоянием элементов управления
     */
    handleInteraction(controls) {
        // Проверяем нажатие клавиши взаимодействия
        const interactPressed = controls.interact.some(key => Phaser.Input.Keyboard.JustDown(key));
        
        // Если клавиша взаимодействия нажата и игрок находится рядом с терминалом
        if (interactPressed && this.state.nearTerminal) {
            // Событие взаимодействия с терминалом
            this.scene.events.emit('terminal-interact', this.nearTerminalObject);
        }
    }
    
    /**
     * Установка состояния "рядом с терминалом"
     * @param {boolean} near - Находится ли игрок рядом с терминалом
     * @param {object} terminal - Объект терминала (если рядом)
     */
    setNearTerminal(near, terminal = null) {
        this.state.nearTerminal = near;
        this.nearTerminalObject = terminal;
    }
    
    /**
     * Сбор пакета данных
     */
    collectData() {
        // Увеличиваем счетчик собранных данных
        this.state.dataCollected++;
        
        // Эффект при сборе данных
        this.scene.tweens.add({
            targets: this.text,
            scale: 1.3,
            duration: 200,
            yoyo: true
        });
        
        // Возвращаем количество собранных данных
        return this.state.dataCollected;
    }
    
    /**
     * Получение урона
     * @param {number} amount - Количество урона
     * @returns {boolean} - True если игрок еще жив, иначе False
     */
    damage(amount) {
        // Если игрок неуязвим, игнорируем урон
        if (this.state.invulnerable) return true;
        
        // Уменьшаем здоровье
        this.state.health = Math.max(0, this.state.health - amount);
        
        // Устанавливаем временную неуязвимость
        this.state.invulnerable = true;
        
        // Эффект получения урона
        this.scene.tweens.add({
            targets: this.text,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                // Снимаем неуязвимость
                this.state.invulnerable = false;
            }
        });
        
        // Эффект глитча на экране
        if (this.scene.game.globals && this.scene.game.globals.glitch) {
            this.scene.game.globals.glitch.applyToPhaserObject(
                this.scene,
                this.scene.cameras.main,
                { intensity: 0.3, duration: 500 }
            );
        }
        
        // Возвращаем состояние игрока (жив/мертв)
        return this.state.health > 0;
    }
    
    /**
     * Применить эффект отбрасывания
     * @param {number} x - Координата X источника отбрасывания
     * @param {number} y - Координата Y источника отбрасывания
     * @param {number} force - Сила отбрасывания
     */
    knockback(x, y, force = 200) {
        // Вычисляем угол между игроком и источником
        const angle = Phaser.Math.Angle.Between(x, y, this.sprite.x, this.sprite.y);
        
        // Применяем импульс в противоположном от источника направлении
        this.sprite.setVelocity(
            Math.cos(angle) * force,
            Math.sin(angle) * force
        );
        
        // Устанавливаем таймер для остановки отбрасывания
        this.scene.time.delayedCall(
            200,
            () => {
                if (this.sprite.active) {
                    this.sprite.setVelocity(0, 0);
                }
            }
        );
    }
    
    /**
     * Эффект глитча для игрока
     * @param {number} intensity - Интенсивность эффекта (0-1)
     * @param {number} duration - Длительность эффекта (мс)
     */
    glitchEffect(intensity = 0.5, duration = 500) {
        // Если в сцене доступен глобальный эффект глитча
        if (this.scene.game.globals && this.scene.game.globals.glitch) {
            // Применяем эффект к тексту игрока
            const originalText = this.text.text;
            const glitchedText = this.scene.game.globals.glitch.glitchText(
                originalText,
                intensity
            );
            
            // Меняем текст на глитч-версию
            this.text.setText(glitchedText);
            
            // Возвращаем оригинальный текст через указанное время
            this.scene.time.delayedCall(
                duration,
                () => {
                    if (this.text && this.text.active) {
                        this.text.setText(originalText);
                    }
                }
            );
        }
    }
    
    /**
     * Уничтожение объекта игрока
     */
    destroy() {
        if (this.text) this.text.destroy();
        if (this.glowEffect) this.glowEffect.destroy();
        if (this.sprite) this.sprite.destroy();
    }
}