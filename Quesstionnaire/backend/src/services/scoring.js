const BASE = { E: 100, M: 200, H: 300 };

function calcScore({ difficulty, weightsPassed, weightsTotal, earlyBonusPercent, remainingTimeMs, contestDurationMs }) {
  const base = BASE[difficulty] || 0;
  if (weightsTotal <= 0) return 0;
  const partial = Math.floor((weightsPassed / weightsTotal) * base);
  if (weightsPassed !== weightsTotal) return partial;
  if (!contestDurationMs || contestDurationMs <= 0) return partial;
  const bonus = Math.floor(base * (earlyBonusPercent / 100) * (remainingTimeMs / contestDurationMs));
  const maxBonus = Math.floor(base * (earlyBonusPercent / 100));
  return Math.min(base + maxBonus, base + Math.max(0, bonus));
}

module.exports = { calcScore };
