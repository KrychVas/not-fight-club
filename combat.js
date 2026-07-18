import { gameState, updateState } from './state.js';

// Унікальні профілі супротивників з ТЗ
export const enemyProfiles = {
  'Spider':  { baseDamage: 12, attacksCount: 2, defendsCount: 1 },
  'Troll':   { baseDamage: 25, attacksCount: 1, defendsCount: 3 },
  'Boss':    { baseDamage: 20, attacksCount: 2, defendsCount: 2 },
  'Cho':     { baseDamage: 14, attacksCount: 1, defendsCount: 2 },
  'Gal':     { baseDamage: 16, attacksCount: 2, defendsCount: 1 },
  'Jon':     { baseDamage: 15, attacksCount: 1, defendsCount: 2 },
  'Lodman':  { baseDamage: 18, attacksCount: 2, defendsCount: 2 },
  'Ren':     { baseDamage: 15, attacksCount: 1, defendsCount: 2 },
  'Ryuken':  { baseDamage: 22, attacksCount: 1, defendsCount: 2 }
};

// Стан поточного бою
export let combatState = {
  playerHP: 100,
  enemyHP: 100,
  currentEnemyName: '',
  selectedAttackZone: '',
  selectedDefendZones: []
};

// Функція для додавання записів у лог бою
export function logMessage(text, type = 'system') {
  const battleLog = document.getElementById('battle-log');
  if (!battleLog) return;
  const msg = document.createElement('div');
  msg.className = `log-message log-${type}`;
  msg.textContent = text;
  battleLog.appendChild(msg);
  battleLog.scrollTop = battleLog.scrollHeight;
}

// Функція оновлення смужок HP на екрані
export function updateHPBars() {
  const pBar = document.getElementById('player-hp-bar');
  const pText = document.getElementById('player-hp-text');
  const eBar = document.getElementById('enemy-hp-bar');
  const eText = document.getElementById('enemy-hp-text');

  if (pBar && pText) {
    pBar.style.width = `${combatState.playerHP}%`;
    pText.textContent = `${combatState.playerHP} / 100`;
    pBar.className = 'hp-bar';
    if (combatState.playerHP <= 20) pBar.classList.add('danger');
    else if (combatState.playerHP <= 50) pBar.classList.add('warning');
  }

  if (eBar && eText) {
    eBar.style.width = `${combatState.enemyHP}%`;
    eText.textContent = `${combatState.enemyHP} / 100`;
    eBar.className = 'hp-bar';
    if (combatState.enemyHP <= 20) eBar.classList.add('danger');
    else if (combatState.enemyHP <= 50) eBar.classList.add('warning');
  }
}

// Перевірка: якщо вибрано 1 атаку та 2 захисти — вмикаємо кнопку ходу
export function validateTurnReadiness() {
  const btnEndTurn = document.getElementById('btn-end-turn');
  if (!btnEndTurn) return;

  if (combatState.selectedAttackZone && combatState.selectedDefendZones.length === 2) {
    btnEndTurn.disabled = false;
    btnEndTurn.style.opacity = '1';
    btnEndTurn.style.cursor = 'pointer';
  } else {
    btnEndTurn.disabled = true;
    btnEndTurn.style.opacity = '0.5';
    btnEndTurn.style.cursor = 'not-allowed';
  }
}

// Отримання випадкових зон для ШІ (без повторів за один хід)
function getRandomZones(count) {
  const zones = ['Head', 'Neck', 'Body', 'Belly', 'Legs'];
  const result = [];
  while (result.length < count) {
    const randomIndex = Math.floor(Math.random() * zones.length);
    const chosenZone = zones.splice(randomIndex, 1)[0];
    result.push(chosenZone);
  }
  return result;
}

// Обробка одного ходу (Симуляція зіткнення)
export function executeCombatTurn(onBattleEndCallback) {
  const profile = enemyProfiles[combatState.currentEnemyName] || { baseDamage: 15, attacksCount: 1, defendsCount: 2 };
  const playerBaseDmg = 15;

  const enemyAttacks = getRandomZones(profile.attacksCount);
  const enemyDefends = getRandomZones(profile.defendsCount);

  // 1. Атака Гравця
  const isPlayerCrit = Math.random() < 0.15;
  const isEnemyBlockingPlayer = enemyDefends.includes(combatState.selectedAttackZone);

  if (isEnemyBlockingPlayer && !isPlayerCrit) {
    logMessage(`🛡️ ${combatState.currentEnemyName} successfully BLOCKED ${gameState.playerName}'s attack on ${combatState.selectedAttackZone}!`, 'enemy');
  } else {
    let damage = playerBaseDmg;
    let critText = '';
    if (isPlayerCrit) {
      damage = Math.floor(damage * 1.5);
      critText = `✨ CRITICAL STRIKE! Pierced through block! `;
    }
    combatState.enemyHP = Math.max(0, combatState.enemyHP - damage);
    logMessage(`💥 ${gameState.playerName} hits ${combatState.currentEnemyName} in the ${combatState.selectedAttackZone} for ${damage} HP! ${critText}`, 'player');
  }

  // 2. Атаки Ворога
  enemyAttacks.forEach(attackZone => {
    const isEnemyCrit = Math.random() < 0.15;
    const isPlayerBlockingEnemy = combatState.selectedDefendZones.includes(attackZone);

    if (isPlayerBlockingEnemy && !isEnemyCrit) {
      logMessage(`🛡️ ${gameState.playerName} successfully BLOCKED ${combatState.currentEnemyName}'s attack on ${attackZone}!`, 'player');
    } else {
      let damage = profile.baseDamage;
      let critText = '';
      if (isEnemyCrit) {
        damage = Math.floor(damage * 1.5);
        critText = `✨ CRITICAL STRIKE! Pierced through block! `;
      }
      combatState.playerHP = Math.max(0, combatState.playerHP - damage);
      logMessage(`💥 ${combatState.currentEnemyName} hits ${gameState.playerName} in the ${attackZone} for ${damage} HP! ${critText}`, 'enemy');
    }
  });

  updateHPBars();

  // Очищення вибору для наступного ходу
  combatState.selectedAttackZone = '';
  combatState.selectedDefendZones = [];
  document.querySelectorAll('.btn-zone-attack, .btn-zone-defend').forEach(btn => {
    btn.classList.remove('selected-attack', 'selected-defend');
  });
  validateTurnReadiness();

  // Перевірка результату бою
  if (combatState.playerHP <= 0 && combatState.enemyHP <= 0) {
    logMessage(`🤝 DRAW! Both fighters knocked each other out!`, 'system');
    onBattleEndCallback(false);
  } else if (combatState.enemyHP <= 0) {
    logMessage(`🏆 VICTORY! ${gameState.playerName} defeated ${combatState.currentEnemyName}!`, 'system');
    onBattleEndCallback(true);
  } else if (combatState.playerHP <= 0) {
    logMessage(`💀 DEFEATED! ${combatState.currentEnemyName} won this battle.`, 'system');
    onBattleEndCallback(false);
  }
}