// Назва ключа для збереження в localStorage
const STORAGE_KEY = 'not-fight-club-state';

// Початковий (дефолтний) стан, якщо гравець зайшов уперше
const defaultState = {
  playerName: '',
  playerAvatar: 'assets/avatars/ren.gif', // Герой за замовчуванням!
  wins: 0,
  losses: 0,
  currentScreen: 'screen-registration',

  // --- СИСТЕМА АРТЕФАКТІВ ТА ЕКОНОМІКИ ---
  gold: 250, // Стартове золото для покупок або покращень
  
  // Початкові випадкові артефакти з твого скріншота у інвентарі гравця
  artifacts: ['fc1448', 'fc1491', 'fc1862', 'fc1912', 'fc1985'], 
  
  // Слоти під екіпіровані на персонажа предмети
  equippedArtifacts: {
    weapon: null,  // Слот для зброї
    armor: null,   // Слот для нагрудника
    helmet: null,  // Слот для шолома
    boots: null,   // Слот для чобіт
    ring: null     // Слот для біжутерії/магічних предметів
  }
};

// Наш активний стан гри в пам'яті
export let gameState = { ...defaultState };

// Функція завантаження стану з localStorage
export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Мержаємо з defaultState, щоб старі сейви не ламалися при додаванні нових полів
      gameState = { ...defaultState, ...parsed };
    } catch (e) {
      console.error("Помилка читання стану з localStorage:", e);
      gameState = { ...defaultState };
    }
  } else {
    gameState = { ...defaultState };
  }
  return gameState;
}

// Функція збереження поточного стану в localStorage
export function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

// Функція для оновлення окремих полів стану
export function updateState(newData) {
  gameState = { ...gameState, ...newData };
  saveState();
}