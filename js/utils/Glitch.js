/**
 * Glitch - класс для создания эффектов глитча и цифровых искажений
 */
class Glitch {
    constructor() {
        // Базовые настройки эффектов глитча
        this.settings = {
            intensity: 0.5,
            duration: 500,
            interval: 100
        };
    }
    
    /**
     * Применить эффект глитча к DOM-элементу
     * @param {HTMLElement} element - Целевой элемент
     * @param {object} options - Настройки эффекта (intensity, duration, interval)
     * @param {function} callback - Функция, вызываемая после завершения эффекта
     */
    applyToDOMElement(element, options = {}, callback = null) {
        const settings = { ...this.settings, ...options };
        const originalTransform = element.style.transform || '';
        const originalFilter = element.style.filter || '';
        let glitchInterval;
        let elapsed = 0;
        
        // Добавляем класс для CSS-эффектов
        element.classList.add('glitch');
        
        // Функция для одной итерации эффекта глитча
        const glitchStep = () => {
            const offsetX = (Math.random() - 0.5) * 10 * settings.intensity;
            const offsetY = (Math.random() - 0.5) * 10 * settings.intensity;
            const skewX = (Math.random() - 0.5) * 5 * settings.intensity;
            const blur = Math.random() * 2 * settings.intensity;
            const rgbOffset = Math.floor(Math.random() * 10) * settings.intensity;
            
            // Применяем трансформации и фильтры
            element.style.transform = `${originalTransform} translate(${offsetX}px, ${offsetY}px) skewX(${skewX}deg)`;
            element.style.filter = `${originalFilter} blur(${blur}px) hue-rotate(${Math.random() * 360}deg)`;
            
            // С некоторой вероятностью добавляем смещение RGB
            if (Math.random() < 0.3) {
                element.style.textShadow = `${rgbOffset}px 0 rgba(255,0,0,0.5), -${rgbOffset}px 0 rgba(0,255,255,0.5)`;
            }
            
            elapsed += settings.interval;
            
            // Проверяем, не истекло ли время эффекта
            if (elapsed >= settings.duration) {
                clearInterval(glitchInterval);
                
                // Возвращаем исходный вид
                element.style.transform = originalTransform;
                element.style.filter = originalFilter;
                element.style.textShadow = '';
                element.classList.remove('glitch');
                
                // Вызываем callback, если он предоставлен
                if (callback && typeof callback === 'function') {
                    callback();
                }
            }
        };
        
        // Запускаем интервал для эффекта глитча
        glitchInterval = setInterval(glitchStep, settings.interval);
        glitchStep(); // Вызываем сразу для немедленного эффекта
    }
    
    /**
     * Применить эффект глитча к тексту (замена символов)
     * @param {string} text - Исходный текст
     * @param {number} intensity - Интенсивность (0-1), сколько символов заменить
     * @param {string} charSet - Набор символов для замены
     * @returns {string} - Искаженный текст
     */
    glitchText(text, intensity = 0.3, charSet = '01!@#$%ãæÂÀç×þÞ¢£¥€©®™±') {
        let result = '';
        
        for (let i = 0; i < text.length; i++) {
            // С вероятностью, зависящей от интенсивности, заменяем символ
            if (Math.random() < intensity) {
                result += charSet.charAt(Math.floor(Math.random() * charSet.length));
            } else {
                result += text.charAt(i);
            }
        }
        
        return result;
    }
    
    /**
     * Создать эффект глитча для объекта Phaser
     * @param {Phaser.Scene} scene - Текущая сцена
     * @param {Phaser.GameObjects.GameObject} gameObject - Объект для применения эффекта
     * @param {object} options - Настройки эффекта
     */
    applyToPhaserObject(scene, gameObject, options = {}) {
        const settings = { ...this.settings, ...options };
        const originalX = gameObject.x;
        const originalY = gameObject.y;
        const originalAlpha = gameObject.alpha;
        const originalTint = gameObject.tintTopLeft;
        let iterations = Math.floor(settings.duration / settings.interval);
        
        // Эффект для одной итерации
        const applyGlitchStep = () => {
            if (iterations <= 0) {
                // Восстанавливаем исходное состояние
                gameObject.x = originalX;
                gameObject.y = originalY;
                gameObject.alpha = originalAlpha;
                gameObject.tint = originalTint;
                return;
            }
            
            // Вычисляем случайные смещения
            const offsetX = (Math.random() - 0.5) * 20 * settings.intensity;
            const offsetY = (Math.random() - 0.5) * 20 * settings.intensity;
            const alphaChange = Math.random() * 0.5 * settings.intensity;
            
            // Применяем эффекты
            gameObject.x = originalX + offsetX;
            gameObject.y = originalY + offsetY;
            gameObject.alpha = originalAlpha - alphaChange;
            
            // С некоторой вероятностью меняем оттенок
            if (Math.random() < 0.3) {
                const r = Math.floor(Math.random() * 255);
                const g = Math.floor(Math.random() * 255);
                const b = Math.floor(Math.random() * 255);
                gameObject.setTint(Phaser.Display.Color.GetColor(r, g, b));
            }
            
            iterations--;
            
            // Планируем следующую итерацию
            scene.time.delayedCall(settings.interval, applyGlitchStep);
        };
        
        // Запускаем эффект
        applyGlitchStep();
    }
}
