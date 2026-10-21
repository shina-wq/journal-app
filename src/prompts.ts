import { Mood } from './types.js';

const DEFAULT_PROMPT = "What's on your mind?";

const generalPrompts: string[] = [
  DEFAULT_PROMPT,
  'What made today different from yesterday?',
  'What are you grateful for right now?',
  'Describe one moment from today you want to remember.',
];

// Record<Mood, ...> makes every mood need prompts: adding a mood to the enum is a compile error here until it has some.
const moodPrompts: Record<Mood, string[]> = {
  [Mood.HAPPY]: [
    'What made you smile today?',
    'Who would you like to share this feeling with?',
    'How can you bring a bit of today into tomorrow?',
  ],
  [Mood.SAD]: [
    "What's weighing on you right now?",
    'What would you say to a friend who felt this way?',
    'What small thing might help you feel a little better?',
  ],
  [Mood.MOTIVATED]: [
    'What are you excited to work on?',
    "What's one step you can take today?",
    'What sparked this energy?',
  ],
  [Mood.STRESSED]: [
    "What's on your plate right now?",
    "What's one thing you can let go of today?",
    'What would make tomorrow a little easier?',
  ],
  [Mood.CALM]: [
    'What helped you feel at peace today?',
    'What do you notice around you right now?',
    'What do you want to hold on to from this moment?',
  ],
};

// Picks a random prompt for the mood (or a general one), avoiding the one currently shown.
export function pickPrompt(mood: Mood | null, current = ''): string {
  const options = (mood ? moodPrompts[mood] : generalPrompts).filter((prompt) => prompt !== current);
  return options[Math.floor(Math.random() * options.length)] ?? DEFAULT_PROMPT;
}
