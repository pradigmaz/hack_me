/**
 * YandexSDK - класс для работы с SDK Яндекс Игр
 * Реализован как синглтон для доступа из любой части приложения
 */
class YandexSDK {
    constructor() {
        this.ysdk = null;
        this.initialized = false;
    }

    /**
     * Инициализация SDK Яндекс Игр
     * @returns {Promise} Промис с экземпляром SDK
     */
    init() {
        return new Promise((resolve, reject) => {
            if (window.YaGames) {
                window.YaGames
                    .init()
                    .then(ysdk => {
                        console.log('Yandex SDK initialized');
                        this.ysdk = ysdk;
                        this.initialized = true;
                        window.ysdk = ysdk; // Для доступа из других частей приложения
                        resolve(ysdk);
                    })
                    .catch(error => {
                        console.error('Yandex SDK initialization failed:', error);
                        reject(error);
                    });
            } else {
                console.warn('Yandex SDK not found. Game running in standalone mode.');
                reject(new Error('Yandex SDK not found'));
            }
        });
    }

    /**
     * Проверка, инициализирован ли SDK
     * @returns {boolean} Статус инициализации
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Получение экземпляра SDK
     * @returns {Object|null} Экземпляр SDK или null, если не инициализирован
     */
    getSDK() {
        return this.ysdk;
    }
}

// Создаем глобальный экземпляр для всего приложения
window.yandexSDK = new YandexSDK(); 