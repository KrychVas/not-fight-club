import { gameState, updateState, getPlayerStats } from './state.js';
import { ARTIFACTS_DATABASE } from './artifacts.js';
import { soundManager } from './audio.js';

export const enemyProfiles = {
  'Spider':   { baseDamage: 12, attacksCount: 2, defendsCount: 1, bio: 'A swift and venomous predator.' },
  'Troll':    { baseDamage: 25, attacksCount: 1, defendsCount: 3, bio: 'A heavy powerhouse with incredible defense.' },
  'Boss':     { baseDamage: 20, attacksCount: 2, defendsCount: 2, bio: 'The legendary arena champion.' },
  'Cho':      { baseDamage: 14, attacksCount: 1, defendsCount: 2, bio: 'A disciplined martial artist.' },
  'Gal':      { baseDamage: 16, attacksCount: 2, defendsCount: 1, bio: 'An aggressive dual-wielding berserker.' },
  'Jon':      { baseDamage: 15, attacksCount: 1, defendsCount: 2, bio: 'A balanced and tricky duelist.' },
  'Lodman':   { baseDamage: 18, attacksCount: 2, defendsCount: 2, bio: 'A armored knight with broad strikes.' },
  'Ren':      { baseDamage: 15, attacksCount: 1, defendsCount: 2, bio: 'A swift shadow assassin.' },
  'Ryuken':   { baseDamage: 22, attacksCount: 1, defendsCount: 2, bio: 'Master of lethal precision strikes.' }
};

export let combatState = {
  playerHP: 100,
  enemyHP: 100,
  enemyMaxHP: 100,
  currentEnemyName: '',
  selectedAttackZone: '',
  selectedDefendZones: [],
  enemyEquipment: {} 
};

export function resetBattleUI() {
  const victoryOverlay = document.getElementById('victory-overlay');
  if (victoryOverlay) {
    victoryOverlay.classList.add('hidden');
    victoryOverlay.style.display = 'none';
  }

  const victoryWrapper = document.querySelector('.victory-screen-wrapper');
  if (victoryWrapper) {
    victoryWrapper.remove();
  }

  const combatActions = document.getElementById('combat-actions');
  if (combatActions) {
    combatActions.style.display = 'flex';
    combatActions.classList.remove('hidden');
  }

  const arenaContainer = document.querySelector('.arena-container');
  if (arenaContainer && !document.getElementById('arena-player-avatar')) {
    const playerAvatar = gameState.playerAvatar || 'assets/avatars/ren.gif';
    const enemyName = combatState.currentEnemyName || 'cho';
    const enemyAvatar = `assets/avatars/${enemyName.toLowerCase()}.gif`;

    arenaContainer.innerHTML = `
      <div class="fighter-card player-side">
        <h3>Your Fighter</h3>
        <img id="arena-player-avatar" src="${playerAvatar}" alt="Player">
        <div id="arena-player-name" class="fighter-name">${gameState.playerName || 'Fighter'}</div>
        <div class="hp-bar-container">
          <div id="player-hp-bar" class="hp-bar"></div>
        </div>
        <div id="player-hp-text" style="font-size: 12px; color: #aaa; margin-top: 2px;">100 / 100</div>
      </div>

      <div id="combat-actions" class="combat-actions">
        <h4>Choose 1 attack and 2 defence zones</h4>
        
        <div class="zones-columns-wrapper">
          <div class="zone-column">
            <span style="color: #ff4757; font-size: 12px; font-weight: bold; margin-bottom: 5px;">⚡ ATTACK</span>
            <button type="button" class="btn-zone-attack" data-zone="Head">[1] Head 🪖</button>
            <button type="button" class="btn-zone-attack" data-zone="Neck">[2] Neck 🎯</button>
            <button type="button" class="btn-zone-attack" data-zone="Body">[3] Body 🥋</button>
            <button type="button" class="btn-zone-attack" data-zone="Belly">[4] Belly 🔥</button>
            <button type="button" class="btn-zone-attack" data-zone="Legs">[5] Legs 🥾</button>
          </div>

          <div class="zone-divider" style="width: 1px; background: #444; align-self: stretch;"></div>

          <div class="zone-column">
            <span style="color: #2ed573; font-size: 12px; font-weight: bold; margin-bottom: 5px;">🛡️ DEFEND</span>
            <button type="button" class="btn-zone-defend" data-zone="Head">[Q] Head 🪖</button>
            <button type="button" class="btn-zone-defend" data-zone="Neck">[W] Neck 🎯</button>
            <button type="button" class="btn-zone-defend" data-zone="Body">[E] Body 🥋</button>
            <button type="button" class="btn-zone-defend" data-zone="Belly">[R] Belly 🔥</button>
            <button type="button" class="btn-zone-defend" data-zone="Legs">[T] Legs 🥾</button>
          </div>
        </div>

        <div id="selected-zones-indicator" style="margin: 5px 0; font-size: 12px; font-weight: bold; color: #eccc68; background: #222; padding: 4px 10px; border-radius: 4px; border: 1px solid #444; text-align: center; width: 90%;">
          🎯 A: <span id="indicator-attack" style="color: #ff4757;">None</span> | 🛡️ D: <span id="indicator-defend" style="color: #2ed573;">None</span>
        </div>

        <button id="btn-end-turn" class="btn-primary" disabled style="margin-top: 10px; width: 100%; max-width: 200px; opacity: 0.5; cursor: not-allowed; background-color: #eccc68; color: #000; padding: 8px;">
          EXECUTE TURN ⚔️ [Space]
        </button>
      </div>

      <div class="fighter-card enemy-side">
        <h3>Enemy</h3>
        <img id="arena-enemy-avatar" src="${enemyAvatar}" alt="Enemy">
        <div id="arena-enemy-name" class="fighter-name">${combatState.currentEnemyName || 'Enemy'}</div>
        <div class="hp-bar-container">
          <div id="enemy-hp-bar" class="hp-bar"></div>
        </div>
        <div id="enemy-hp-text" style="font-size: 12px; color: #aaa; margin-top: 2px;">100 / 100</div>
      </div>
    `;
  }

  combatState.selectedAttackZone = '';
  combatState.selectedDefendZones = [];

  document.querySelectorAll('.btn-zone-attack').forEach(b => b.classList.remove('selected-attack'));
  document.querySelectorAll('.btn-zone-defend').forEach(b => b.classList.remove('selected-defend'));

  validateTurnReadiness();
}

export function spawnFloatingText(targetSide, text, type = 'damage') {
  const cardSelector = targetSide === 'player' ? '.player-side' : '.enemy-side';
  const targetCard = document.querySelector(cardSelector);
  
  if (!targetCard) return;

  const floatingEl = document.createElement('div');
  floatingEl.className = `floating-damage ${type}`;
  floatingEl.textContent = text;

  const randomOffsetX = (Math.random() - 0.5) * 40;
  floatingEl.style.marginLeft = `${randomOffsetX}px`;

  targetCard.appendChild(floatingEl);

  setTimeout(() => {
    floatingEl.remove();
  }, 1400);
}

export function saveCombatState() {
  const battleLogEl = document.getElementById('battle-log');
  const logHTML = battleLogEl ? battleLogEl.innerHTML : '';

  const activeBattleData = {
    isInBattle: true,
    playerHP: combatState.playerHP,
    enemyHP: combatState.enemyHP,
    enemyMaxHP: combatState.enemyMaxHP,
    currentEnemyName: combatState.currentEnemyName,
    enemyEquipment: combatState.enemyEquipment,
    battleLogHTML: logHTML
  };

  localStorage.setItem('active_combat_state', JSON.stringify(activeBattleData));
}

export function clearCombatState() {
  localStorage.removeItem('active_combat_state');
}

export function restoreActiveBattle(navigateToScreenCallback) {
  const savedCombat = localStorage.getItem('active_combat_state');
  if (!savedCombat) return false;

  try {
    const data = JSON.parse(savedCombat);

    if (!data.isInBattle || data.playerHP <= 0 || data.enemyHP <= 0) {
      clearCombatState();
      return false;
    }

    combatState.playerHP = data.playerHP;
    combatState.enemyHP = data.enemyHP;
    combatState.enemyMaxHP = data.enemyMaxHP;
    combatState.currentEnemyName = data.currentEnemyName;
    combatState.enemyEquipment = data.enemyEquipment || {};

    const battleLogEl = document.getElementById('battle-log');
    if (battleLogEl && data.battleLogHTML) {
      battleLogEl.innerHTML = data.battleLogHTML;
      battleLogEl.scrollTop = battleLogEl.scrollHeight;
    }

    updateHPBars();

    if (typeof navigateToScreenCallback === 'function') {
      navigateToScreenCallback('screen-battle');
    }

    return true;
  } catch (e) {
    console.error("Error restoring combat state:", e);
    return false;
  }
}

export function getEnemyStats() {
  const profile = enemyProfiles[combatState.currentEnemyName] || { baseDamage: 15 };
  let bonusHP = 0;
  let bonusDmg = 0;

  if (combatState.enemyEquipment) {
    Object.values(combatState.enemyEquipment).forEach(artifactId => {
      const art = ARTIFACTS_DATABASE[artifactId];
      if (art) {
        const hp = art.stats?.hp ?? art.bonusHP ?? 0;
        const dmg = art.stats?.damage ?? art.bonusDamage ?? 0;

        bonusHP += hp;
        bonusDmg += dmg;
      }
    });
  }

  return {
    maxHP: 100 + bonusHP,
    totalDamage: profile.baseDamage + bonusDmg
  };
}

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
  const { maxHP: playerMaxHP } = getPlayerStats();
  const enemyMaxHP = combatState.enemyMaxHP || 100;

  const pBar = document.getElementById('player-hp-bar');
  const pText = document.getElementById('player-hp-text');
  const eBar = document.getElementById('enemy-hp-bar');
  const eText = document.getElementById('enemy-hp-text');

  if (pBar && pText) {
    const playerHpPercent = Math.max(0, Math.min(100, (combatState.playerHP / playerMaxHP) * 100));
    pBar.style.width = `${playerHpPercent}%`;
    pText.textContent = `${combatState.playerHP} / ${playerMaxHP}`;
    pBar.className = 'hp-bar';
    if (playerHpPercent <= 20) pBar.classList.add('danger');
    else if (playerHpPercent <= 50) pBar.classList.add('warning');
  }

  if (eBar && eText) {
    const enemyHpPercent = Math.max(0, Math.min(100, (combatState.enemyHP / enemyMaxHP) * 100));
    eBar.style.width = `${enemyHpPercent}%`;
    eText.textContent = `${combatState.enemyHP} / ${enemyMaxHP}`;
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

function triggerScreenShake() {
  const battleScreen = document.getElementById('screen-battle');
  if (!battleScreen) return;
  battleScreen.classList.add('shake-fx');
  setTimeout(() => battleScreen.classList.remove('shake-fx'), 300);
}

export function executeCombatTurn(onBattleEndCallback) {
  const profile = enemyProfiles[combatState.currentEnemyName] || { baseDamage: 15, attacksCount: 1, defendsCount: 2 };
  const enemyStats = getEnemyStats();
  
  const { bonusDamage } = getPlayerStats();
  const playerBaseDmg = 15 + bonusDamage;

  const enemyAttacks = getRandomZones(profile.attacksCount);
  const enemyDefends = getRandomZones(profile.defendsCount);

  const playerAvatarBase = gameState.playerAvatar || 'assets/avatars/ren.gif';
  const enemyAvatarBase = `assets/avatars/${combatState.currentEnemyName.toLowerCase()}.gif`;

  let hasHitInTurn = false;

  const isPlayerCrit = Math.random() < 0.15;
  const isEnemyBlockingPlayer = enemyDefends.includes(combatState.selectedAttackZone);

  if (isEnemyBlockingPlayer && !isPlayerCrit) {
    soundManager.playBlockSound();
    logMessage(`🛡️ ${combatState.currentEnemyName} successfully BLOCKED ${gameState.playerName}'s attack on ${combatState.selectedAttackZone}!`, 'enemy');
    spawnFloatingText('enemy', '🛡️ BLOCKED', 'blocked');
  } else {
    let damage = playerBaseDmg;
    let critText = '';
    if (isPlayerCrit) {
      damage = Math.floor(damage * 1.5);
      critText = `✨ CRITICAL STRIKE! Pierced through block! `;
      spawnFloatingText('enemy', `💥 -${damage} CRIT!`, 'critical');
    } else {
      spawnFloatingText('enemy', `-${damage}`, 'damage');
    }
    
    soundManager.playHitSound(isPlayerCrit);
    hasHitInTurn = true;

    combatState.enemyHP = Math.max(0, combatState.enemyHP - damage);
    
    updateHPBars();
    
    logMessage(`💥 ${gameState.playerName} hits ${combatState.currentEnemyName} in the ${combatState.selectedAttackZone} for ${damage} HP! ${critText}`, 'player');
    
    triggerHitAnimation(false, enemyAvatarBase);
  }

  enemyAttacks.forEach(attackZone => {
    const isEnemyCrit = Math.random() < 0.15;
    const isPlayerBlockingEnemy = combatState.selectedDefendZones.includes(attackZone);

    if (isPlayerBlockingEnemy && !isEnemyCrit) {
      soundManager.playBlockSound();
      logMessage(`🛡️ ${gameState.playerName} successfully BLOCKED ${combatState.currentEnemyName}'s attack on ${attackZone}!`, 'player');
      spawnFloatingText('player', '🛡️ BLOCKED', 'blocked');
    } else {
      let damage = enemyStats.totalDamage;
      let critText = '';
      if (isEnemyCrit) {
        damage = Math.floor(damage * 1.5);
        critText = `✨ CRITICAL STRIKE! Pierced through block! `;
        spawnFloatingText('player', `💥 -${damage} CRIT!`, 'critical');
      } else {
        spawnFloatingText('player', `-${damage}`, 'damage');
      }

      soundManager.playHitSound(isEnemyCrit);
      hasHitInTurn = true;

      combatState.playerHP = Math.max(0, combatState.playerHP - damage);
      
      updateHPBars();
      
      logMessage(`💥 ${combatState.currentEnemyName} hits ${gameState.playerName} in the ${attackZone} for ${damage} HP! ${critText}`, 'enemy');
      
      triggerHitAnimation(true, playerAvatarBase);
    }
  });

  if (hasHitInTurn) {
    triggerScreenShake();
  }

  updateHPBars();

  combatState.selectedAttackZone = '';
  combatState.selectedDefendZones = [];
  document.querySelectorAll('.btn-zone-attack, .btn-zone-defend').forEach(btn => {
    btn.classList.remove('selected-attack', 'selected-defend');
  });
  validateTurnReadiness();

  saveCombatState();

  if (combatState.playerHP <= 0 && combatState.enemyHP <= 0) {
    clearCombatState();
    soundManager.playDefeatSound();
    logMessage(`🤝 DRAW! Both fighters knocked each other out!`, 'system');
    onBattleEndCallback(false);
  } 
  else if (combatState.enemyHP <= 0) {
    clearCombatState();
    soundManager.playVictorySound();
    logMessage(`🏆 VICTORY! ${gameState.playerName} defeated ${combatState.currentEnemyName}!`, 'system');
    
    let baseName = 'ren';
    const filename = playerAvatarBase.split('/').pop();
    const match = filename.match(/^([a-zA-Z]+)/);
    if (match && match[1]) {
      baseName = match[1].toLowerCase();
    }
    const planeAvatar = `assets/avatars/${baseName}_plane.png`;

    const combatActions = document.getElementById('combat-actions');
    if (combatActions) {
      combatActions.style.display = 'none';
    }

    const arenaContainer = document.querySelector('.arena-container');
    if (arenaContainer) {
      const victoryWrapper = document.createElement('div');
      victoryWrapper.className = 'victory-screen-wrapper';
      victoryWrapper.style.cssText = 'width: 100%; text-align: center; padding: 20px; background: rgba(46, 213, 115, 0.1); border: 2px solid #2ed573; border-radius: 8px; animation: fadeIn 0.3s ease;';
      victoryWrapper.innerHTML = `
        <h2 style="color: #2ed573; font-size: 28px; font-weight: bold; margin-bottom: 15px; letter-spacing: 2px; text-transform: uppercase;"> WINNER: ${gameState.playerName} 🏆 </h2>
        <div style="width: 100%; overflow: hidden; border-radius: 6px; border: 1px solid #444; background: #111; padding: 15px 0; display: flex; justify-content: center;">
          <img src="${planeAvatar}" style="max-width: 100%; height: auto; image-rendering: pixelated; object-fit: contain;" alt="Victory Animation">
        </div>
      `;
      arenaContainer.appendChild(victoryWrapper);
    }
    
    onBattleEndCallback(true);
  } 
  else if (combatState.playerHP <= 0) {
    clearCombatState();
    soundManager.playDefeatSound();
    logMessage(`💀 DEFEATED! ${combatState.currentEnemyName} won this battle.`, 'system');
    
    const enemyNameLower = combatState.currentEnemyName.toLowerCase();
    const planeAvatar = `assets/avatars/${enemyNameLower}_plane.png`;

    const combatActions = document.getElementById('combat-actions');
    if (combatActions) {
      combatActions.style.display = 'none';
    }

    const arenaContainer = document.querySelector('.arena-container');
    if (arenaContainer) {
      const victoryWrapper = document.createElement('div');
      victoryWrapper.className = 'victory-screen-wrapper';
      victoryWrapper.style.cssText = 'width: 100%; text-align: center; padding: 20px; background: rgba(255, 71, 87, 0.1); border: 2px solid #ff4757; border-radius: 8px; animation: fadeIn 0.3s ease;';
      victoryWrapper.innerHTML = `
        <h2 style="color: #ff4757; font-size: 28px; font-weight: bold; margin-bottom: 15px; letter-spacing: 2px; text-transform: uppercase;"> WINNER: ${combatState.currentEnemyName} 💀 </h2>
        <div style="width: 100%; overflow: hidden; border-radius: 6px; border: 1px solid #444; background: #111; padding: 15px 0; display: flex; justify-content: center;">
          <img src="${planeAvatar}" style="max-width: 100%; height: auto; image-rendering: pixelated; object-fit: contain;" alt="Victory Animation">
        </div>
      `;
      arenaContainer.appendChild(victoryWrapper);
    }

    onBattleEndCallback(false);
  }
}