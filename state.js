import { ARTIFACTS_DATABASE } from './artifacts.js';

const STORAGE_KEY = 'not-fight-club-state';

// Початковий стан гри
const defaultState = {
  playerName: '',
  playerAvatar: null, // Початково null, щоб блок прев'ю приховувався до вибору героя
  wins: 0,
  losses: 0,
  currentScreen: 'screen-registration',

  gold: 250,
  
  // Додаємо всі артефакти з нашої динамічної бази даних в інвентар
  artifacts: Object.keys(ARTIFACTS_DATABASE), 
  
  equippedArtifacts: {
    weapon: null,
    armor: null,
    helmet: null,
    boots: null,
    ring: null
  }
};

export let gameState = { ...defaultState };

export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      gameState = { ...defaultState, ...parsed };
      
      // Гарантуємо, що нові артефакти з бази підтягнуться, якщо масив був застарілим
      if (!gameState.artifacts || gameState.artifacts.length < 10) {
        gameState.artifacts = Object.keys(ARTIFACTS_DATABASE);
      }
    } catch (e) {
      console.error("Error reading localStorage state:", e);
      gameState = { ...defaultState };
    }
  } else {
    gameState = { ...defaultState };
  }
  return gameState;
}

export function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

export function updateState(newData) {
  gameState = { ...gameState, ...newData };
  saveState();
}

// --- ФУНКЦІЯ ОБЧИСЛЕННЯ ПІДСУМКОВИХ ХАРАКТЕРИСТИК (З УРАХУВАННЯМ АРТЕФАКТІВ) ---
export function getPlayerStats() {
  let maxHP = 100;
  let bonusDamage = 0;

  if (gameState.equippedArtifacts) {
    Object.values(gameState.equippedArtifacts).forEach(artifactId => {
      if (artifactId && ARTIFACTS_DATABASE[artifactId]) {
        const item = ARTIFACTS_DATABASE[artifactId];
        
        // Підтримка обох варіантів структури статів (прямі поля та nested object)
        const hp = item.bonusHP ?? item.stats?.hp ?? 0;
        const dmg = item.bonusDamage ?? item.stats?.damage ?? 0;

        maxHP += hp;
        bonusDamage += dmg;
      }
    });
  }

  return { maxHP, bonusDamage };
}