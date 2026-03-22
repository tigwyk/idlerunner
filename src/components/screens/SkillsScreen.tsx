import { useGameStore } from '@/store/gameStore'
import { SKILL_NAMES } from '@/game/config'
import type { SkillType } from '@/types'

export default function SkillsScreen() {
  const { runner } = useGameStore()
  const skills = Object.keys(runner.skills) as SkillType[]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-2">Skills</h2>
        <p className="text-sm text-gray-500">Train skills by performing related actions during runs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {skills.map((skillType) => (
          <SkillCard key={skillType} skillType={skillType} skill={runner.skills[skillType]} />
        ))}
      </div>

      <div className="card">
        <h3 className="font-medium text-gray-300 mb-4">Skill Effects</h3>
        <div className="space-y-4">
          <SkillEffect 
            name="Scavenging"
            description="Increases resource collection from all sources."
            formula="+5% per level"
          />
          <SkillEffect 
            name="Combat"
            description="Increases damage and accuracy in combat encounters."
            formula="+5% damage, +2% accuracy per level"
          />
          <SkillEffect 
            name="Hacking"
            description="Increases success rate for hacking locked doors and containers."
            formula="+3% hack chance per level"
          />
        </div>
      </div>
    </div>
  )
}

function SkillCard({ skillType, skill }: { skillType: SkillType; skill: import('@/types').Skill }) {
  const xpPercent = (skill.xp / skill.xpToNext) * 100

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-200">{SKILL_NAMES[skillType]}</h3>
          <p className="text-xs text-gray-500">Level {skill.level}</p>
        </div>
        {skill.masteryLevel > 0 && (
          <span className="px-2 py-0.5 rounded text-xs bg-primary-900 text-primary-300">
            Mastery {skill.masteryLevel}
          </span>
        )}
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Experience</span>
          <span className="text-gray-400">
            {formatXp(skill.xp)} / {formatXp(skill.xpToNext)}
          </span>
        </div>
        <div className="stat-bar">
          <div 
            className="stat-bar-fill bg-primary-500"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>

      <div className="text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Current Bonus</span>
          <span className="text-success-400">+{calculateBonus(skillType, skill.level)}%</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
        {getSkillDescription(skillType)}
      </div>
    </div>
  )
}

function SkillEffect({ name, description, formula }: { name: string; description: string; formula: string }) {
  return (
    <div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-300">{name}</span>
        <span className="text-xs text-primary-400">{formula}</span>
      </div>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  )
}

function calculateBonus(skillType: SkillType, level: number): number {
  switch (skillType) {
    case 'scavenging': return (level - 1) * 5
    case 'combat': return (level - 1) * 5
    case 'hacking': return (level - 1) * 3
    default: return 0
  }
}

function getSkillDescription(skillType: SkillType): string {
  switch (skillType) {
    case 'scavenging': return 'Trained by collecting resources and looting containers.'
    case 'combat': return 'Trained by defeating enemies in combat.'
    case 'hacking': return 'Trained by successfully hacking locked doors and systems.'
    default: return ''
  }
}

function formatXp(num: number): string {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
