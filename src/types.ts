// 明日方舟天赋养成模拟器 - 类型定义

// 九种天赋属性
export type TalentType = '勇气' | '体魄' | '毅力' | '信念' | '灵巧' | '智慧' | '魅力' | '感知' | '感应';

// 属性配置
export interface TalentConfig {
  name: TalentType;
  totalMax: number;  // 总上限
  currentMax: number; // 当前等级上限
  current: number;   // 当前值
}

// 阶段配置
export interface StageConfig {
  minLevel: number;
  maxLevel: number;
  totalPoints: number;  // 该阶段可加点总数
  costPerPoint: number; // 每次加点消耗
}

// 干员数据
export interface Operator {
  id: string;
  name: string;
  avatar: string;
  talents: TalentConfig[];
  currentLevel: number;  // 当前精二等级 (1-70)
}

// 游戏状态
export interface GameState {
  talentPoints: number;  // 玩家拥有的天赋点
  selectedOperator: string | null;
  operators: Operator[];
  weightParamN: number;  // 权重计算参数n，默认0.3
  guidanceStones: GuidanceStone[];  // 5种引导石
  critEnabled: boolean;  // 暴击开关，默认true
  critRate: number;  // 暴击概率X，默认20%（0.2）
  critStones: CritStone[];  // 暴击石
  nextCritGuaranteed: boolean;  // 下次是否必定暴击（使用暴击石后）
}

// 加点结果
export interface UpgradeResult {
  success: boolean;
  upgradedTalent?: TalentType;
  cost?: number;
  message: string;
  isCrit?: boolean;  // 是否触发暴击
  addedPoints?: number;  // 实际增加的点数
}

// 等级阶段定义
// 1-29级：未解锁（不能加点）
// 30级：解锁阶段1（最多14点，消耗10）
// 50级：解锁阶段2（最多28点，消耗20）
// 70级：解锁阶段3（最多42点，消耗50）
export const LEVEL_STAGES: StageConfig[] = [
  { minLevel: 30, maxLevel: 49, totalPoints: 14, costPerPoint: 10 },
  { minLevel: 50, maxLevel: 69, totalPoints: 28, costPerPoint: 20 },
  { minLevel: 70, maxLevel: 70, totalPoints: 42, costPerPoint: 50 },
];

// 未解锁阶段（1-29级）
export const LOCKED_STAGE: StageConfig = {
  minLevel: 1,
  maxLevel: 29,
  totalPoints: 0,
  costPerPoint: 0,
};

// 根据等级获取当前阶段
export function getStageByLevel(level: number): StageConfig {
  // 1-29级未解锁
  if (level < 30) {
    return LOCKED_STAGE;
  }
  
  for (const stage of LEVEL_STAGES) {
    if (level >= stage.minLevel && level <= stage.maxLevel) {
      return stage;
    }
  }
  
  // 70级以上按满级处理
  return LEVEL_STAGES[LEVEL_STAGES.length - 1];
}

// 计算属性当前上限
export function calculateCurrentMax(totalMax: number, level: number): number {
  const stage = getStageByLevel(level);
  
  // 未解锁阶段，当前上限为0
  if (stage.totalPoints === 0) {
    return 0;
  }
  
  const ratio = stage.totalPoints / 42; // 42是总点数
  // 确保是整数，且不超过总上限
  return Math.min(Math.round(totalMax * ratio), totalMax);
}

// 获取所有9种属性类型
export const ALL_TALENT_TYPES: TalentType[] = [
  '勇气', '体魄', '毅力', '信念', '灵巧', '智慧', '魅力', '感知', '感应'
];

// ==================== 属性分类系统 ====================
// 维度1：攻 / 防 / 辅
export type CombatType = '攻' | '防' | '辅';
// 维度2：生理 / 心理
export type NatureType = '生理' | '心理';

// 属性分类映射（正确版本）
export const TALENT_COMBAT_TYPE: Record<TalentType, CombatType> = {
  '勇气': '攻',
  '体魄': '防',
  '毅力': '防',
  '信念': '防',
  '灵巧': '攻',
  '智慧': '攻',
  '魅力': '辅',
  '感知': '辅',
  '感应': '辅',
};

export const TALENT_NATURE_TYPE: Record<TalentType, NatureType> = {
  '勇气': '心理',
  '体魄': '生理',
  '毅力': '心理',
  '信念': '心理',
  '灵巧': '生理',
  '智慧': '生理',
  '魅力': '生理',
  '感知': '心理',
  '感应': '心理',
};

// ==================== 引导石系统 ====================
export type GuidanceStoneType = '攻' | '防' | '辅' | '生理' | '心理';

export interface GuidanceStone {
  type: GuidanceStoneType;
  name: string;
  count: number;
  selected: boolean;
  disabled: boolean;
}

// 创建初始引导石
export function createInitialGuidanceStones(): GuidanceStone[] {
  return [
    { type: '攻', name: '引导石-攻', count: 10, selected: false, disabled: false },
    { type: '防', name: '引导石-防', count: 10, selected: false, disabled: false },
    { type: '辅', name: '引导石-辅', count: 10, selected: false, disabled: false },
    { type: '生理', name: '引导石-生理', count: 10, selected: false, disabled: false },
    { type: '心理', name: '引导石-心理', count: 10, selected: false, disabled: false },
  ];
}

// 检查属性是否符合引导石条件
export function isTalentMatchGuidanceStone(
  talentName: TalentType,
  stoneType: GuidanceStoneType
): boolean {
  if (stoneType === '攻' || stoneType === '防' || stoneType === '辅') {
    return TALENT_COMBAT_TYPE[talentName] === stoneType;
  }
  return TALENT_NATURE_TYPE[talentName] === stoneType;
}

// ==================== 暴击石系统 ====================
export type CritStoneType = '初级' | '高级';

export interface CritStone {
  type: CritStoneType;
  name: string;
  count: number;
  selected: boolean;
  minPoints: number;  // 最低总加点数要求（初级14，高级28）
  maxPoints: number;  // 最高总加点数限制（初级27，高级无限制用999）
}

// 创建初始暴击石
export function createInitialCritStones(): CritStone[] {
  return [
    { type: '初级', name: '初级暴击石', count: 5, selected: false, minPoints: 14, maxPoints: 27 },
    { type: '高级', name: '高级暴击石', count: 5, selected: false, minPoints: 28, maxPoints: 999 },
  ];
}

// 检查暴击石是否可用
export function isCritStoneAvailable(stone: CritStone, totalAdded: number): boolean {
  return totalAdded >= stone.minPoints && totalAdded <= stone.maxPoints && stone.count > 0;
}
