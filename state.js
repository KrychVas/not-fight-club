// Назва ключа для збереження в localStorage
const STORAGE_KEY = 'not-fight-club-state';

// Початковий (дефолтний) стан, якщо гравець зайшов уперше
const defaultState = {
  playerName: '',
  playerAvatar: 'assets/avatars/ren.gif', // Твій крутий блондин за замовчуванням!
  wins: 0,
  losses: 0,
  currentScreen: 'screen-registration'
};

// Наш активний стан гри в пам'яті
export let gameState = { ...defaultState };

// Функція завантаження стану з localStorage
export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      gameState = JSON.parse(saved);
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