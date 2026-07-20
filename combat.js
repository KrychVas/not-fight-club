import { gameState, updateState, getPlayerStats } from './state.js';

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

export let combatState = {
  playerHP: 100,
  enemyHP: 100,
  currentEnemyName: '',
  selectedAttackZone: '',
  selectedDefendZones: []
};

export function logMessage(text, type = 'system') {
  const battleLog = document.getElementById('battle-log');
  if (!battleLog) return;
  const msg = document.createElement('div');
  msg.className = `log-message log-${type}`;
  msg.textContent = text;
  battleLog.appendChild(msg);
  battleLog.scrollTop = battleLog.scrollHeight;
}

export function updateHPBars() {
  const { maxHP } = getPlayerStats();
  const pBar = document.getElementById('player-hp-bar');
  const pText = document.getElementById('player-hp-text');
  const eBar = document.getElementById('enemy-hp-bar');
  const eText = document.getElementById('enemy-hp-text');

  if (pBar && pText) {
    const playerHpPercent = Math.max(0, Math.min(100, (combatState.playerHP / maxHP) * 100));
    pBar.style.width = `${playerHpPercent}%`;
    pText.textContent = `${combatState.playerHP} / ${maxHP}`;
    pBar.className = 'hp-bar';
    if (playerHpPercent <= 20) pBar.classList.add('danger');
    else if (playerHpPercent <= 50) pBar.classList.add('warning');
  }

  if (eBar && eText) {
    const enemyHpPercent = Math.max(0, Math.min(100, combatState.enemyHP));
    eBar.style.width = `${enemyHpPercent}%`;
    eText.textContent = `${combatState.enemyHP} / 100`;
    eBar.className = 'hp-bar';
    if (enemyHpPercent <= 20) eBar.classList.add('danger');
    else if (enemyHpPercent <= 50) eBar.classList.add('warning');
  }
}

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

// АНІМАЦІЯ УРОНУ: Зміна статичної картинки на агресивну
function triggerHitAnimation(isPlayer, baseAvatarPath) {
  const imgElement = document.getElementById(isPlayer ? 'arena-player-avatar' : 'arena-enemy-avatar');
  if (!imgElement) return;

  const dotIdx = baseAvatarPath.lastIndexOf('.');
  const basePath = baseAvatarPath.substring(0, dotIdx);
  
  imgElement.src = `${basePath}3.png`; 

  setTimeout(() => {
    imgElement.src = baseAvatarPath;
  }, 1200);
}

export function executeCombatTurn(onBattleEndCallback) {
  const profile = enemyProfiles[combatState.currentEnemyName] || { baseDamage: 15, attacksCount: 1, defendsCount: 2 };
  
  // Враховуємо додатковий урон від екіпірованих предметів
  const { bonusDamage } = getPlayerStats();
  const playerBaseDmg = 15 + bonusDamage;

  const enemyAttacks = getRandomZones(profile.attacksCount);
  const enemyDefends = getRandomZones(profile.defendsCount);

  // Зберігаємо базові шляхи до поточних бойових аватарок
  const playerAvatarBase = gameState.playerAvatar || 'assets/avatars/ren.gif';
  const enemyAvatarBase = `assets/avatars/${combatState.currentEnemyName.toLowerCase()}.gif`;

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
    
    triggerHitAnimation(false, enemyAvatarBase);
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
      
      triggerHitAnimation(true, playerAvatarBase);
    }
  });

  updateHPBars();

  // Очищення вибору зон на кнопках
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
  } 
  else if (combatState.enemyHP <= 0) {
    logMessage(`🏆 VICTORY! ${gameState.playerName} defeated ${combatState.currentEnemyName}!`, 'system');
    
    // Очищуємо ім'я файлу від цифр на кшталт "ren1.png" чи ".gif", щоб отримати чисте "ren_plane.png"
    let baseName = 'ren';
    const filename = playerAvatarBase.split('/').pop(); // отримаємо наприклад 'ren1.png'
    const match = filename.match(/^([a-zA-Z]+)/); // витягнемо суто літери 'ren'
    if (match && match[1]) {
      baseName = match[1].toLowerCase();
    }
    const planeAvatar = `assets/avatars/${baseName}_plane.png`;

    // Замінюємо `.arena-container` великою тріумфальною панорамою гравця
    const arenaContainer = document.querySelector('.arena-container');
    if (arenaContainer) {
      arenaContainer.innerHTML = `
        <div class="victory-screen-wrapper" style="width: 100%; text-align: center; padding: 20px; background: rgba(46, 213, 115, 0.1); border: 2px solid #2ed573; border-radius: 8px; animation: fadeIn 0.3s ease;">
          <h2 style="color: #2ed573; font-size: 28px; font-weight: bold; margin-bottom: 15px; letter-spacing: 2px; text-transform: uppercase;"> WINNER: ${gameState.playerName} 🏆 </h2>
          <div style="width: 100%; overflow: hidden; border-radius: 6px; border: 1px solid #444; background: #111; padding: 15px 0; display: flex; justify-content: center;">
            <img src="${planeAvatar}" style="max-width: 100%; height: auto; image-rendering: pixelated; object-fit: contain;" alt="Victory Animation">
          </div>
        </div>
      `;
    }
    
    onBattleEndCallback(true);
  } 
  else if (combatState.playerHP <= 0) {
    logMessage(`💀 DEFEATED! ${combatState.currentEnemyName} won this battle.`, 'system');
    
    const enemyNameLower = combatState.currentEnemyName.toLowerCase();
    const planeAvatar = `assets/avatars/${enemyNameLower}_plane.png`;

    // Замінюємо `.arena-container` великою тріумфальною панорамою бота
    const arenaContainer = document.querySelector('.arena-container');
    if (arenaContainer) {
      arenaContainer.innerHTML = `
        <div class="victory-screen-wrapper" style="width: 100%; text-align: center; padding: 20px; background: rgba(255, 71, 87, 0.1); border: 2px solid #ff4757; border-radius: 8px; animation: fadeIn 0.3s ease;">
          <h2 style="color: #ff4757; font-size: 28px; font-weight: bold; margin-bottom: 15px; letter-spacing: 2px; text-transform: uppercase;"> WINNER: ${combatState.currentEnemyName} 💀 </h2>
          <div style="width: 100%; overflow: hidden; border-radius: 6px; border: 1px solid #444; background: #111; padding: 15px 0; display: flex; justify-content: center;">
            <img src="${planeAvatar}" style="max-width: 100%; height: auto; image-rendering: pixelated; object-fit: contain;" alt="Victory Animation">
          </div>
        </div>
      `;
    }

    onBattleEndCallback(false);
  }
}