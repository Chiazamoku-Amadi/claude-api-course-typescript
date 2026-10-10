import { addUserMessage, chat, type Message } from "../index.ts";
import { PromptEvaluator } from "./prompt_evaluator.ts";
import type { PromptInputsSpec } from "./types.ts";

// Create an instance of PromptEvaluator
// Increase maxConcurrentTasks for greater concurrency, but beware of rate limit errors!
const evaluator = new PromptEvaluator({ maxConcurrentTasks: 1 });

const dataset = await evaluator.generateDataset({
  taskDescription:
    "Write a compact, concise 1 day meal plan for a single athlete", // Describe the purpose or goal of the prompt you're trying to test
  promptInputsSpec: {
    height: "Athlete's height in cm",
    weight: "Athlete's weight in kg",
    goal: "Goal of the athlete",
    restrictions: "Dietary restrictions of the athlete",
  }, // Describe the different inputs that your prompt requires
  numCases: 3, // Number of test cases to generate (recommend keeping this low if you're getting rate limit errors)
  outputFile: "src/prompt_engineering/05_providing_examples/dataset.json", // Where to write the generated dataset
});

// Define and run the prompt you want to evaluate, returning the raw model output
// This function is executed once for each test case
const runPrompt = (promptInputs: PromptInputsSpec) => {
  const prompt = `Generate a one-day meal plan for an athlete that meets their dietary restrictions.

    <athlete_information>
    - Height: ${promptInputs["height"]}
    - Weight: ${promptInputs["weight"]}
    - Goal: ${promptInputs["goal"]}
    - Dietary restrictions: ${promptInputs["restrictions"]}
    </athlete_information>

    Guidelines:
    1. Include accurate daily calorie amount
    2. Show protein, fat, and carb amounts
    3. Specify when to eat each meal
    4. Use only foods that fit restrictions
    5. List all portion sizes in grams
    6. Keep budget-friendly if mentioned

    Here is an example with a sample input and an ideal output:
    <sample_input>
      height: 185
      weight: 68
      goal: muscle building
      restrictions: none
    </sample_input>

    <ideal_output>
      # One-Day Muscle Building Meal Plan
      **Athlete: 185cm, 68kg | Goal: Muscle Building**

      ---

      ## Daily Nutritional Targets
      - **Calories: 3,200 kcal**
      - **Protein: 170g** (2.5g per kg bodyweight)
      - **Carbohydrates: 380g** (5.6g per kg)
      - **Fat: 85g** (1.25g per kg)

      ---

      ## MEAL PLAN

      ### **BREAKFAST** (7:00 AM)
      *Calories: 650 | P: 30g | C: 85g | F: 18g*

      - Oatmeal: 80g dry
      - Whole eggs: 3 large (150g)
      - Banana: 120g
      - Almond butter: 15g
      - Honey: 10g

      **Preparation:** Cook oats with water, top with scrambled eggs, sliced banana, and almond butter drizzle.

      ---

      ### **Mid-Morning Snack** (10:30 AM)
      *Calories: 320 | P: 35g | C: 35g | F: 5g*

      - Greek yogurt (0%): 250g
      - Granola: 40g
      - Blueberries: 80g
      - Protein powder (whey): 30g

      **Preparation:** Layer yogurt with granola and berries, mix in protein powder.

      ---

      ### **LUNCH** (1:00 PM)
      *Calories: 850 | P: 55g | C: 95g | F: 22g*

      - Chicken breast (grilled): 200g
      - Brown rice (cooked): 200g
      - Sweet potato (baked): 150g
      - Olive oil: 10g
      - Broccoli: 150g

      **Preparation:** Season and grill chicken, serve with rice, sweet potato, and steamed broccoli drizzled with olive oil.

      ---

      ### **Pre-Workout Snack** (3:30 PM)
      *Calories: 280 | P: 12g | C: 50g | F: 4g*

      - White bread: 60g
      - Peanut butter: 20g
      - Apple: 180g

      **Preparation:** Toast bread, spread peanut butter, serve with sliced apple on the side.

      ---

      ### **DINNER** (7:00 PM)
      *Calories: 900 | P: 60g | C: 95g | F: 22g*

      - Lean ground beef (90/10): 200g
      - Pasta (whole wheat, cooked): 180g
      - Tomato sauce: 120g
      - Olive oil: 8g
      - Parmesan cheese: 20g
      - Spinach: 100g

      **Preparation:** Brown beef with garlic, simmer with sauce, toss with cooked pasta, spinach, and cheese.

      ---

      ### **Evening Snack** (9:30 PM)
      *Calories: 200 | P: 30g | C: 10g | F: 4g*

      - Casein protein shake: 40g powder
      - Whole milk: 200ml
      - Almonds: 15g

      **Preparation:** Blend casein powder with milk, top with almonds. (Casein digests slowly—ideal before bed)

      ---

      ## Daily Totals
      | Macro | Target | Actual | Status |
      |-------|--------|--------|--------|
      | **Calories** | 3,200 | 3,200 | ✓ |
      | **Protein** | 170g | 172g | ✓ |
      | **Carbs** | 380g | 375g | ✓ |
      | **Fat** | 85g | 85g | ✓ |

      ---

      ## Key Notes for Muscle Building:
      ✓ **Protein distributed:** ~30g per meal for optimal muscle protein synthesis  
      ✓ **Post-lunch carbs:** Support afternoon training  
      ✓ **Pre-workout fuel:** Simple carbs + fat for sustained energy  
      ✓ **
    </ideal_output>

    This example meal plan comprehensively addresses all mandatory requirements with precision. It provides a daily caloric total, detailed macronutrient breakdown, and six meals with exact foods, portions, and timing.
  `;

  let messages: Message[] = [];
  addUserMessage(messages, prompt);

  return chat(messages);
};

const results = await evaluator.runEvaluation({
  runPromptFunction: runPrompt,
  datasetFile: "src/prompt_engineering/05_providing_examples/dataset.json",
  extraCriteria: `
  The output should contain:
  - Daily caloric total
  - Macronutrient breakdown
  - Meals with exact foods, portions, and timing
  `,
});

// Console Logs
// Generated 1/3 test cases
// Generated 2/3 test cases
// Generated 3/3 test cases
// Graded 1/3 test cases
// Graded 2/3 test cases
// Graded 3/3 test cases
// Average score: 8.333333333333334
