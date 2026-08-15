const itemIds = [
  
  1448, 1449, 1450, 1451, 1453, 1454, 1455, 1456, 1459, 1462, 1463, 1465, 1466, 1476,
  1482, 1483, 1487, 1488, 1491, 1504, 1505, 1506, 1507, 1508, 1509, 1510, 1512, 1513,
  1516, 1517, 1518, 1519, 1520, 1603, 1677, 1678, 1679, 1680, 1682, 1684, 1685, 1689,
  
  1648, 1651,
  
  1862, 1863, 1884, 1885, 1886, 1888, 1901, 1903, 1904, 1905, 1906, 1910, 
  2049, 2050, 2104,
  
  1912, 1913, 1919, 1920, 1921, 1923, 1925, 1926, 1933, 1936, 1941, 1943, 1944, 1953,
  1957, 1964, 1965, 1966, 1967, 1974, 1978, 1981, 1982, 2016, 2052, 2053, 2054,
  
  1985, 1987, 1988, 1989, 1990, 1996, 1998, 2041, 2042, 2043, 2055, 2056,
  
  2002, 2003, 2009, 2010, 2012, 2014, 2018, 2025, 2026, 2027, 2036,
  
  2154, 2155, 2156, 2157, 2158, 2159
];

function generateArtifact(id) {
  const fullId = `fc${id}`;
  const iconPath = `assets/items/${fullId}.png`;
  
  let slot = 'ring';      
  let name = `Mystic Artifact #${id}`;
  let bonusDamage = 0;
  let bonusHP = 0;

  if (id <= 1603 || (id >= 1677 && id <= 1689)) {
    slot = 'weapon';
    name = `Vanguard Weapon #${id}`;
    bonusDamage = Math.floor((id % 10) + 5); 
  } else if ((id >= 1862 && id <= 1910) || id === 2049 || id === 2050 || id === 2104) {
    slot = 'armor';
    name = `Guardian Plate #${id}`;
    bonusHP = Math.floor((id % 5) * 10 + 20); 
  } else if ((id >= 1912 && id <= 1982) || (id >= 2052 && id <= 2054)) {
    slot = 'helmet';
    name = `Warlord Helm #${id}`;
    bonusHP = Math.floor((id % 4) * 5 + 15);
    bonusDamage = Math.floor(id % 3);
  } else if ((id >= 1985 && id <= 2043) || id === 2055 || id === 2056) {
    slot = 'boots';
    name = `Stalker Boots #${id}`;
    bonusHP = Math.floor((id % 3) * 5 + 10);
    bonusDamage = Math.floor((id % 2) + 1);
  }

  let description = '';
  if (bonusDamage > 0) description += `⚔️ +${bonusDamage} Damage `;
  if (bonusHP > 0) description += `❤️ +${bonusHP} Max HP`;

  return {
    id: fullId,
    name: name,
    slot: slot,
    bonusDamage: bonusDamage,
    bonusHP: bonusHP,
    stats: { hp: bonusHP, damage: bonusDamage }, 
    icon: iconPath,
    description: description.trim()
  };
}

export const ARTIFACTS_DATABASE = {};
itemIds.forEach(id => {
  const artifact = generateArtifact(id);
  ARTIFACTS_DATABASE[artifact.id] = artifact;
});