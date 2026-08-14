import type { HeroStory } from '#shared/types/careerId'

export const HERO_EXAMPLE_ROLES = ['engineer', 'customerService', 'manager'] as const

export type HeroExampleRole = (typeof HERO_EXAMPLE_ROLES)[number]

export const HERO_EXAMPLE_ROLE_LABELS: Record<HeroExampleRole, string> = {
  engineer: 'Engineer',
  customerService: 'Customer Service',
  manager: 'Manager'
}

export type HeroWizardDetailField = Exclude<keyof HeroStory,
  | 'id'
  | 'profileId'
  | 'title'
  | 'sourceExperienceId'
  | 'displayOrder'
  | 'deletedAt'
  | 'isDeleted'
  | 'createdAt'
  | 'updatedAt'
>

export type ExperienceLinkChoice = 'yes' | 'no' | null

export type HeroWizardStepValue
  = | 'basics'
    | 'hurdle'
    | 'expectation'
    | 'response'
    | 'outcome'
    | 'review'

export interface HeroWizardField {
  key: string
  tag: string
  label: string
  prompt: string
  dbField: HeroWizardDetailField
  examples: Record<HeroExampleRole, string>
}

export interface HeroWizardSection {
  key: 'hurdle' | 'expectation' | 'response' | 'outcome'
  letter: 'H' | 'E' | 'R' | 'O'
  title: string
  question: string
  description: string
  fields: readonly HeroWizardField[]
}

export type HeroWizardDraft = {
  title: string
  sourceExperienceId: number | null
} & Record<HeroWizardDetailField, string>

export const HERO_WIZARD_SECTIONS = [
  {
    key: 'hurdle',
    letter: 'H',
    title: 'The Hurdle',
    question: 'What challenge did you face?',
    description: 'Set the scene: the problem, how big it was, and why it mattered. This gives your story stakes.',
    fields: [
      {
        key: 'problem',
        tag: 'PROBLEM',
        label: 'The Specific Challenge',
        prompt: 'What was the specific problem or opportunity you identified?',
        dbField: 'hurdleProblem',
        examples: {
          engineer: 'Legacy customer portal was slow and causing 40% of all support tickets',
          customerService: 'Customers were abandoning calls after long holds because reps couldn’t find answers quickly',
          manager: 'Average call handle time was 12 minutes, causing long wait times and abandoned calls'
        }
      },
      {
        key: 'scope',
        tag: 'SCOPE',
        label: 'Size & Scale',
        prompt: 'How big was the problem? Who or what was affected?',
        dbField: 'hurdleScope',
        examples: {
          engineer: '500,000 users across 3 geographic regions',
          customerService: 'About 150 calls a day across my queue',
          manager: '40-person call center handling 800+ customer calls daily'
        }
      },
      {
        key: 'stakes',
        tag: 'STAKES',
        label: 'Why It Mattered',
        prompt: 'What was at risk? Why did this matter to the business or team?',
        dbField: 'hurdleStakes',
        examples: {
          engineer: '$2M in annual contracts at risk due to declining customer satisfaction',
          customerService: 'Frustrated customers were leaving negative reviews that hurt renewal conversations',
          manager: 'Satisfaction scores dropping below 70%, risking loss of a major retail client contract'
        }
      }
    ]
  },
  {
    key: 'expectation',
    letter: 'E',
    title: 'The Expectation',
    question: 'What were you responsible for achieving?',
    description: 'Define what you were on the hook for — your role, your targets, and the boundaries you worked within.',
    fields: [
      {
        key: 'role',
        tag: 'ROLE',
        label: 'Your Responsibility',
        prompt: 'What was your role or authority in addressing this challenge?',
        dbField: 'expectationRole',
        examples: {
          engineer: 'Lead engineer with full technical decision authority',
          customerService: 'Frontline rep handling escalated billing and account issues',
          manager: 'Team lead responsible for 8 customer service representatives'
        }
      },
      {
        key: 'goals',
        tag: 'GOALS',
        label: 'Targets to Achieve',
        prompt: 'What were you trying to accomplish? What were the goals or targets?',
        dbField: 'expectationGoals',
        examples: {
          engineer: 'Replace portal within 6 months and reduce support tickets by 30%',
          customerService: 'Resolve calls on the first contact without escalating to a supervisor',
          manager: 'Reduce average handle time to under 8 minutes while maintaining quality scores above 85%'
        }
      },
      {
        key: 'constraints',
        tag: 'CONSTRAINTS',
        label: 'Limits & Boundaries',
        prompt: 'What constraints did you operate under? (budget, timeline, resources, etc.)',
        dbField: 'expectationConstraints',
        examples: {
          engineer: 'Zero downtime requirement, no additional budget for infrastructure',
          customerService: 'No authority to change policy — had to work within existing scripts',
          manager: '90-day deadline, no budget for new tools or formal training programs'
        }
      }
    ]
  },
  {
    key: 'response',
    letter: 'R',
    title: 'The Response',
    question: 'How did you tackle it?',
    description: 'The heart of the story: what you actually did, what you used, and what got in the way.',
    fields: [
      {
        key: 'actions',
        tag: 'ACTIONS',
        label: 'Steps You Took',
        prompt: 'What specific actions did you take? Walk through your approach step-by-step.',
        dbField: 'responseActions',
        examples: {
          engineer: 'Architected microservices replacement platform, led 5-person implementation team, implemented blue-green deployment strategy',
          customerService: 'Built a personal cheat-sheet of common fixes, asked senior reps for shortcuts, followed up after tricky calls',
          manager: 'Created a quick-reference guide for top 20 issues, ran daily 15-minute team huddles, set up peer shadowing'
        }
      },
      {
        key: 'tools',
        tag: 'TOOLS',
        label: 'Technologies & Resources',
        prompt: 'What tools, technologies, or systems did you use?',
        dbField: 'responseTools',
        examples: {
          engineer: 'React, Node.js, PostgreSQL, AWS Lambda, Docker, GitHub Actions',
          customerService: 'CRM notes, internal knowledge base, shared team chat',
          manager: 'CRM system, Excel call-tracking templates, internal wiki for documentation'
        }
      },
      {
        key: 'challenges',
        tag: 'CHALLENGES',
        label: 'Obstacles Overcome',
        prompt: 'What obstacles did you encounter and how did you overcome them?',
        dbField: 'responseChallenges',
        examples: {
          engineer: 'Achieving zero-downtime migration, migrating data from legacy system, coordinating across 3 time zones',
          customerService: 'Some issues needed manager overrides I didn’t have access to',
          manager: 'Pushback from experienced reps who felt micromanaged, balancing speed with quality'
        }
      }
    ]
  },
  {
    key: 'outcome',
    letter: 'O',
    title: 'The Outcome',
    question: 'What resulted from your work?',
    description: 'Show the payoff — what you delivered, the numbers behind it, and the ripple effects.',
    fields: [
      {
        key: 'deliverable',
        tag: 'DELIVERABLE',
        label: 'What You Delivered',
        prompt: 'What did you create, build, or implement?',
        dbField: 'outcomeDeliverable',
        examples: {
          engineer: 'Modern customer portal with self-service knowledge base and real-time analytics',
          customerService: 'A troubleshooting cheat-sheet later adopted by 3 teammates',
          manager: 'Standardized response templates and troubleshooting flowcharts for the whole center'
        }
      },
      {
        key: 'metrics',
        tag: 'METRICS',
        label: 'Quantifiable Results',
        prompt: 'What numbers, percentages, or measurable improvements resulted?',
        dbField: 'outcomeMetrics',
        examples: {
          engineer: 'Reduced support tickets by 45% (200/week to 110/week), improved page load time from 8s to 1.2s',
          customerService: 'Raised my first-contact resolution rate from 61% to 82%',
          manager: 'Cut handle time from 12 to 7.5 minutes, raised satisfaction from 68% to 88%'
        }
      },
      {
        key: 'impact',
        tag: 'IMPACT',
        label: 'Broader Impact',
        prompt: 'What organizational effects, recognition, or broader significance resulted?',
        dbField: 'outcomeImpact',
        examples: {
          engineer: 'Retained $2M in at-risk contracts, promoted to senior engineer',
          customerService: 'Recognized in a team meeting, asked to help train 2 new hires',
          manager: 'Retained a $500K client contract, guide adopted across all 3 call centers'
        }
      }
    ]
  }
] as const satisfies readonly HeroWizardSection[]

type MappedHeroWizardDbField = (typeof HERO_WIZARD_SECTIONS)[number]['fields'][number]['dbField']
type MissingHeroWizardDbField = Exclude<HeroWizardDetailField, MappedHeroWizardDbField>
const _heroWizardConfigMapsEveryDetailField: [MissingHeroWizardDbField] extends [never] ? true : false = true
void _heroWizardConfigMapsEveryDetailField

export const HERO_WIZARD_DETAIL_FIELDS: HeroWizardDetailField[] = HERO_WIZARD_SECTIONS.flatMap(
  section => section.fields.map(field => field.dbField)
)

export function createEmptyHeroWizardDraft(): HeroWizardDraft {
  const details = Object.fromEntries(
    HERO_WIZARD_DETAIL_FIELDS.map(field => [field, ''])
  ) as Record<HeroWizardDetailField, string>

  return {
    title: '',
    sourceExperienceId: null,
    ...details
  }
}

export function isHeroFieldFilled(value: string | null | undefined): boolean {
  return (value ?? '').trim().length > 0
}

export function countFilledHeroDetails(draft: HeroWizardDraft): number {
  return HERO_WIZARD_DETAIL_FIELDS.filter(field => isHeroFieldFilled(draft[field])).length
}

export function isHeroSectionFilled(section: HeroWizardSection, draft: HeroWizardDraft): boolean {
  return section.fields.every(field => isHeroFieldFilled(draft[field.dbField]))
}

export function nextHeroExampleRole(current: HeroExampleRole): HeroExampleRole {
  const index = HERO_EXAMPLE_ROLES.indexOf(current)
  return HERO_EXAMPLE_ROLES[(index + 1) % HERO_EXAMPLE_ROLES.length]!
}

export const HERO_WIZARD_STEP_ORDER: HeroWizardStepValue[] = [
  'basics',
  'hurdle',
  'expectation',
  'response',
  'outcome',
  'review'
]

export function heroSectionUpdatePayload(
  section: HeroWizardSection,
  draft: HeroWizardDraft
): Partial<Record<HeroWizardDetailField, string | null>> {
  const payload: Partial<Record<HeroWizardDetailField, string | null>> = {}
  for (const field of section.fields) {
    payload[field.dbField] = draft[field.dbField].trim() || null
  }
  return payload
}

export function heroWizardFullUpdatePayload(draft: HeroWizardDraft) {
  const details = Object.fromEntries(
    HERO_WIZARD_DETAIL_FIELDS.map(field => [field, draft[field].trim() || null])
  ) as Record<HeroWizardDetailField, string | null>

  return {
    title: draft.title.trim(),
    sourceExperienceId: draft.sourceExperienceId,
    ...details
  }
}

export function applyHeroStoryToDraft(story: HeroStory): HeroWizardDraft {
  const draft = createEmptyHeroWizardDraft()
  draft.title = story.title ?? ''
  draft.sourceExperienceId = story.sourceExperienceId ?? null
  for (const field of HERO_WIZARD_DETAIL_FIELDS) {
    draft[field] = story[field] ?? ''
  }
  return draft
}
