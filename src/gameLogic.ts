// 明日方舟天赋养成模拟器 - 核心逻辑
import type { Operator, TalentConfig, UpgradeResult, GameState, GuidanceStoneType, CritStoneType } from './types';
import { getStageByLevel, isTalentMatchGuidanceStone } from './types';

// 计算干员当前已加的总点数
export function getTotalAddedPoints(operator: Operator): number {
  return operator.talents.reduce((sum, t) => sum + t.current, 0);
}

// 计算干员当前阶段的已加点数
export function getCurrentStagePoints(operator: Operator): number {
  const total = getTotalAddedPoints(operator);
  const stage = getStageByLevel(operator.currentLevel);
  
  if (stage.totalPoints === 14) return total;
  if (stage.totalPoints === 28) return total - 14;
  return total - 28;
}

// 计算当前阶段的剩余可加点数
export function getRemainingPointsInStage(operator: Operator): number {
  const stage = getStageByLevel(operator.currentLevel);
  const totalAdded = getTotalAddedPoints(operator);
  return stage.totalPoints - totalAdded;
}

// 计算每次加点消耗的天赋点
export function getCostPerUpgrade(operator: Operator): number {
  const totalAdded = getTotalAddedPoints(operator);
  if (totalAdded < 14) return 10;
  if (totalAdded < 28) return 20;
  return 50;
}

// 计算属性权重（新公式）
// Wi = (1 / (当前值 + 1)^n) × (当前阶段上限 - 当前值) × 100
export function calculateTalentWeight(talent: TalentConfig, n: number): number {
  if (talent.current >= talent.currentMax) return 0;
  // (当前值 + 1)的n次方
  const denominator = Math.pow(talent.current + 1, n);
  // 当前阶段上限 - 当前值
  const remainingSpace = talent.currentMax - talent.current;
  // 计算权重并乘以100
  return (1 / denominator) * remainingSpace * 100;
}

// 计算引导石消耗倍数：14-27点1倍，28点以上2倍
export function getStoneCostMultiplier(totalAdded: number): number {
  return totalAdded >= 28 ? 2 : 1;
}

// 清理无效的引导石勾选状态
// 当引导石数量不足以支付当前消耗时，自动取消勾选
export function cleanupInvalidGuidanceStones(
  guidanceStones: GameState['guidanceStones'],
  totalAdded: number
): GameState['guidanceStones'] {
  const stoneCostMultiplier = getStoneCostMultiplier(totalAdded);
  
  return guidanceStones.map(stone => {
    // 如果勾选了但数量不足，自动取消勾选
    if (stone.selected && stone.count < stoneCostMultiplier) {
      return { ...stone, selected: false };
    }
    return stone;
  });
}

// 执行加点（支持引导石和暴击）
export function upgradeTalent(state: GameState, operatorId: string): UpgradeResult & { consumedStone?: GuidanceStoneType; consumedCritStone?: CritStoneType } {
  const operator = state.operators.find(o => o.id === operatorId);
  if (!operator) {
    return { success: false, message: '干员不存在' };
  }

  const cost = getCostPerUpgrade(operator);
  
  // 检查天赋点是否足够
  if (state.talentPoints < cost) {
    return { success: false, message: '天赋点不足' };
  }

  // 检查是否还有属性未达上限（等级只影响上限，不影响可加多少点）
  const hasUpgradableTalent = operator.talents.some(t => t.current < t.totalMax);
  if (!hasUpgradableTalent) {
    return { success: false, message: '所有属性已达总上限' };
  }

  // 获取当前阶段和已加点数
  const totalAdded = getTotalAddedPoints(operator);
  
  // 计算引导石消耗倍数
  const stoneCostMultiplier = getStoneCostMultiplier(totalAdded);
  
  // 先清理无效的引导石勾选状态（数量不足时自动取消勾选）
  const cleanedStones = cleanupInvalidGuidanceStones(state.guidanceStones, totalAdded);
  
  // 获取所有选中的引导石（必须已加14点后才可使用）
  const selectedStones = totalAdded >= 14 
    ? cleanedStones.filter(s => s.selected && s.count > 0)
    : [];
  
  // 检查引导石数量是否足够（28点以上需要每种2个）
  if (selectedStones.length > 0) {
    const insufficientStones = selectedStones.filter(s => s.count < stoneCostMultiplier);
    if (insufficientStones.length > 0) {
      const stoneNames = insufficientStones.map(s => s.name).join('、');
      return { success: false, message: `${stoneNames} 数量不足（需要${stoneCostMultiplier}个）` };
    }
  }

  // 获取选中的暴击石
  const selectedCritStone = state.critStones.find(s => s.selected && s.count > 0);

  // 筛选可升级的属性
  let upgradableTalents = operator.talents.filter(t => t.current < t.currentMax);
  
  // 如果有引导石，取交集筛选（属性必须同时符合所有选中的引导石）
  if (selectedStones.length > 0) {
    upgradableTalents = upgradableTalents.filter(t => 
      selectedStones.every(stone => isTalentMatchGuidanceStone(t.name, stone.type))
    );
  }

  if (upgradableTalents.length === 0) {
    return { success: false, message: '所有属性已达当前上限' };
  }

  // 加权随机选择
  const weights = upgradableTalents.map(t => ({
    talent: t,
    weight: calculateTalentWeight(t, state.weightParamN),
  }));

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  if (totalWeight <= 0) {
    return { success: false, message: '没有可升级的属性' };
  }

  let random = Math.random() * totalWeight;
  let selectedTalent: TalentConfig | null = null;
  
  for (const { talent, weight } of weights) {
    random -= weight;
    if (random <= 0) {
      selectedTalent = talent;
      break;
    }
  }
  
  if (!selectedTalent) {
    selectedTalent = weights[weights.length - 1]?.talent || null;
  }

  if (!selectedTalent) {
    return { success: false, message: '没有可升级的属性' };
  }

  // 暴击判定
  let isCrit = false;
  let addedPoints = 1;
  let consumedCritStoneType: CritStoneType | undefined;

  // 检查是否使用暴击石（优先判定）
  if (selectedCritStone) {
    // 抑制暴击石：必定不暴击，只加1点
    if (selectedCritStone.isInhibitor) {
      isCrit = false;
      addedPoints = 1;
      consumedCritStoneType = selectedCritStone.type;
    } else {
      // 普通暴击石（初级/高级）：必定暴击，加2点
      isCrit = true;
      addedPoints = 2;
      consumedCritStoneType = selectedCritStone.type;
    }
  } else if (state.critEnabled) {
    // 随机暴击判定
    isCrit = Math.random() < state.critRate;
    addedPoints = isCrit ? 2 : 1;
  }

  // 允许暴击超出总上限1点（只在暴击时）
  if (isCrit && selectedTalent.current + addedPoints > selectedTalent.totalMax) {
    // 暴击允许超出上限1点
    addedPoints = selectedTalent.totalMax - selectedTalent.current + 1; // 填满剩余空间再多1点
  }

  const critText = isCrit ? '暴击！' : '';
  const pointsText = addedPoints >= 2 ? '+2' : '+1';

  return {
    success: true,
    upgradedTalent: selectedTalent.name,
    cost,
    message: `${critText}${selectedTalent.name} ${pointsText}`,
    consumedStones: selectedStones.length > 0 ? selectedStones.map(s => s.type) : undefined,
    stoneCostMultiplier,
    consumedCritStone: consumedCritStoneType,
    isCrit,
    addedPoints,
    cleanedStones, // 返回清理后的引导石状态
  };
}

// 更新游戏状态（加点后）
export function applyUpgrade(
  state: GameState, 
  result: UpgradeResult & { consumedStone?: GuidanceStoneType; consumedCritStone?: CritStoneType; cleanedStones?: GameState['guidanceStones'] }, 
  operatorId: string
): GameState {
  if (!result.success || !result.cost) return state;

  const addedPoints = result.addedPoints || 1;
  const stoneCostMultiplier = result.stoneCostMultiplier || 1;

  // 如果有清理后的引导石状态，先应用；否则使用当前状态
  const baseGuidanceStones = result.cleanedStones || state.guidanceStones;

  return {
    ...state,
    talentPoints: state.talentPoints - result.cost,
    operators: state.operators.map(o => {
      if (o.id !== operatorId) return o;
      
      return {
        ...o,
        talents: o.talents.map(t => {
          if (t.name !== result.upgradedTalent) return t;
          // 允许暴击超出上限1点
          const newCurrent = t.current + addedPoints;
          const maxAllowed = t.totalMax + 1; // 允许超出1点
          return { ...t, current: Math.min(newCurrent, maxAllowed) };
        }),
        totalSpent: o.totalSpent + (result.cost || 0),  // 累加实际消耗
      };
    }),
    // 消耗引导石（支持多倍消耗），同时保留清理后的选中状态
    guidanceStones: result.consumedStones && result.consumedStones.length > 0
      ? baseGuidanceStones.map(s => {
          if (!result.consumedStones!.includes(s.type)) return s;
          const newCount = s.count - stoneCostMultiplier;
          return { ...s, count: newCount, selected: newCount > 0 };
        })
      : baseGuidanceStones,
    // 消耗暴击石（数量归0时才取消勾选）
    critStones: result.consumedCritStone
      ? state.critStones.map(s =>
          s.type === result.consumedCritStone
            ? { ...s, count: s.count - 1, selected: s.count > 1 }
            : s
        )
      : state.critStones,
  };
}
