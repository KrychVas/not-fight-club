import { gameState, loadState, updateState } from './state.js';

// 1. Функція перемикання екранів
function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => {
    screen.classList.add('hidden');
  });

  const activeScreen = document.getElementById(screenId);
  if (activeScreen) {
    activeScreen.classList.remove('hidden');
    // Оновлюємо поточний екран у стані та зберігаємо
    updateState({ currentScreen: screenId });
  }
}

// 2. Ініціалізація гри при завантаженні сторінки
function init() {
  // Завантажуємо збережений стан
  loadState();

  // Якщо ім'я гравця вже збережене, перенаправляємо на головний екран
  if (gameState.playerName) {
    document.getElementById('home-player-name').textContent = gameState.playerName;
    showScreen(gameState.currentScreen === 'screen-registration' ? 'screen-home' : gameState.currentScreen);
  } else {
    // Якщо імені немає — показуємо екран реєстрації
    showScreen('screen-registration');
  }

  // Налаштовуємо слухачі подій
  setupEventListeners();
}

// 3. Обробка кліків та дій користувача
function setupEventListeners() {
  const btnRegister = document.getElementById('btn-register');
  const regInput = document.getElementById('reg-name');

  // Клік по кнопці реєстрації
  btnRegister.addEventListener('click', () => {
    const name = regInput.value.trim();
    if (name === '') {
      alert("Будь ласка, введіть ім'я свого бійця!");
      return;
    }

    // Зберігаємо ім'я у нашому State
    updateState({ playerName: name });

    // Підставляємо ім'я на головний екран
    document.getElementById('home-player-name').textContent = name;

    // Перемикаємо екран на головний
    showScreen('screen-home');
  });
}

// Запускаємо гру, коли DOM готовий
document.addEventListener('DOMContentLoaded', init);