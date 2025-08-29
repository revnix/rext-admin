# Topic Builder Context

Steps
1) Wizard steps (in order)

Step 1 — Industry/Domain

Step 2 — Audience (Persona)

Step 3 — Channel / Format

Step 4 — Content Goal / Style

Step 5 — Seed Inputs (optional)

Step 6 — Region & Language (optional)

Step 7 — Constraints & Tone (optional)

Step 8 — Review → Generate

Tip: put “Advanced (optional)” fields inside collapsible sections so beginners aren’t overwhelmed.

2) What to ask in each step (simple wording)
Step 1 — Industry/Domain

Question: “Which industry or domain is this for?”

Control: Combobox (type to search + pick) with examples; allow free text.

Examples: Technology, Education, Healthcare (YMYL), Finance (YMYL), Real Estate, E-commerce, HR, Marketing, Legal (YMYL), Fitness, Travel, etc.

Step 2 — Audience (Persona)

Question: “Who are you writing for?”

Control: Chips/checkboxes + free text.

Show suggestions based on Step 1 (dependent):

If Education → Student, Teacher, Parent, Principal, Counselor

If Finance → Retail Investor, Accountant, SMB Owner, CFO, Student

If Healthcare → Patient, Caregiver, Doctor, Nurse, Hospital Admin

If HR → Job Seeker, Recruiter, HR Manager, People Ops

Always include Other (type your own)

Optional extra: “Reader level?” (Beginner / Intermediate / Expert)

Step 3 — Channel / Format

Question: “Where will you use these ideas?”

Control: Toggle buttons (multi-select): Blog/Website, LinkedIn, X (Twitter), Facebook, YouTube (video), Newsletter.

Dependent defaults:

If YouTube selected → later prefer titles/hooks that fit video.

If Social selected → later add short hooks / threads / carousels.

Step 4 — Content Goal / Style

Question: “What type of content do you want?”

Control: Checkbox group:

Tutorial / How-to

Explainer / Beginner guide

News / Update / Trend

Opinion / Thought leadership

Listicle / Checklist / Playbook

Case study / Story

Comparison (X vs Y)

FAQs / Common questions

Optional sliders/toggles:

“Fresh & trending” vs “Evergreen”

“Safe/Conventional” vs “Original/Contrarian”

Step 5 — Seed Inputs (optional)

Question: “Any keywords, products, competitors, or links to consider?”

Control: Tag input + textarea.

Fields:

Keywords/tags (e.g., “headless CMS”, “payroll automation”)

Competitor domains (e.g., example.com)

Reference links (articles to learn from)

“Any special instructions?” (free text)

What these do: Seeds guide the AI and help find gaps; competitors help avoid copycat ideas.

Step 6 — Region & Language (optional)

Question: “Target region and language?”

Control: Selects.

Fields: Country/region (e.g., US, UK, Pakistan), Language (e.g., English, Urdu).

Step 7 — Constraints & Tone (optional)

Question: “Any rules or tone to follow?”

Control: Checkboxes + textarea.

Fields:

Tone: Professional, Friendly, Funny, Academic, Simple English.

Length preference: Short ideas / Detailed titles.

YMYL toggle (auto-on if industry is Health/Finance/Legal): “This is sensitive (health/finance/legal). Keep extra accurate and neutral.”

Don’ts (e.g., no brand mentions, no technical jargon, etc.)

Step 8 — Review → Generate

Question: “Does this look right?”

Control: Summary card + “Back” / “Generate ideas”.

Show: All chosen answers; allow edits before generating.

3) Dependencies (when options change based on previous answers)

Industry → Persona suggestions:
Example: If user chose Education, next step should offer Student, Teacher, Parent, Principal as quick chips, plus “Other”.

Channel → Title style:
If Social selected, later generate shorter, punchier ideas + hook lines. If YouTube, include video-style titles.

YMYL industries → Turn on “Sensitive content” guard:
If Healthcare/Finance/Legal, show a note: “We’ll keep topics factual and non-advisory.”

Region/Language → Localized phrasing:
If Urdu + Pakistan, aim for local examples and language.

4) Full question bank (exhaustive; mark optional)

Core (keep simple):

Industry/Domain (required)

Audience (required)

Channel(s) (optional)

Content Goal/Style (required)

Seed keywords (optional)

Competitor domains / Links (optional)

Region & Language (optional)

Constraints & Tone (optional)

Reader level (optional)

Fresh vs Evergreen (optional)

Safe vs Original (optional)

Hidden/auto (no user action, done by app if possible):

Detect YMYL from industry (health/finance/legal → true)

(Later) Light SERP/PAA scan for “common questions” (free; can be skipped if no scraping)

5) After user answers — how to generate

Collect all answers into a JSON object (easy to pass around, log, test).

Build a dynamic prompt that:

Pastes the JSON as context,

Tells the model exactly what fields to return,

Requests 10–20 ideas with a short “why it works” note,

Requests simple scores (0–1) for relevance/freshness/novelty (so you can sort).

Example JSON payload

{
  "industry": "Education",
  "audience": ["Teacher", "Parent"],
  "reader_level": "Beginner",
  "channels": ["Blog", "LinkedIn"],
  "content_goal": ["Tutorial", "News"],
  "seeds": {
    "keywords": ["project-based learning", "AI in classroom"],
    "competitors": ["edutopia.org"],
    "links": ["https://example.com/ai-in-education"],
    "instructions": "Keep ideas practical and classroom-ready."
  },
  "region": "Pakistan",
  "language": "English",
  "constraints": {
    "tone": ["Simple English", "Friendly"],
    "ymyl": false,
    "donts": ["No product endorsements"]
  },
  "preferences": {
    "fresh_vs_evergreen": "fresh",
    "safe_vs_original": "balanced"
  }
}

7) What the model should return (schema)
[
  {
    "title": "AI in Classrooms: A Simple Starter Guide for Teachers",
    "angle": "Practical first steps with low-cost tools and classroom examples.",
    "channel_fit": ["Blog", "LinkedIn"],
    "audience_fit": ["Teacher"],
    "why_it_works": "Addresses a common beginner need with clear actions.",
    "scores": { "relevance": 0.92, "freshness": 0.78, "novelty": 0.65 },
    "tags": ["tutorial","explainer","education","ai"]
  }
]


In UI, sort by relevance (desc), then let users re-sort by freshness or novelty.

8) Result screen (what to show)

List of ideas with:

Title

1-line angle

Badges: audience, channel, tags

Tiny score bars/dots (relevance/freshness/novelty)

Actions: Save, Edit title, Copy, Regenerate similar, Discard

Bulk actions: Save selected → create Topics; Regenerate batch.

9) Shadcn/ui component suggestions

Shell: Card within a container; custom stepper (Tabs or simple progress with steps).

Inputs: Select/Combobox, Badge/Chip (for multi picks), Textarea, Switch, Slider, Accordion (for Advanced).

Results: Card per idea, Badge for tags, small Progress bars for scores, Button group for actions.

Help: HoverCard or small “i” tooltips with simple explanations.

10) Simple definitions (to keep in tooltips)

Persona: who will read (e.g., teachers, SMB owners).

Content pillar: big category (e.g., Nutrition, HR).

Constraints: rules (tone, don’ts).

YMYL: sensitive topics affecting health/money/law → be cautious.

SERP/PAA: Google results & “People Also Ask” questions → show common questions.

JTBD: reader’s job/goal the content helps (e.g., “learn X in 1 hour”).

MECE: ideas don’t overlap and cover all main areas.

Dedupe/Cluster/Canonicalize: remove duplicates, group similar, keep one final clean version.

(You can keep these as tooltip text or a small “Help” sheet.)

11) Extra UX tips

Beginner first, power later: Show only 4–5 core fields; hide the rest under “Advanced”.

Smart defaults: If user skips seeds, still generate good ideas.

Dependent chips: Change persona suggestions based on industry.

Skip buttons: Let users skip optional steps quickly.

Save presets: Allow saving a wizard preset per client/project.


=============


Wizard Steps and Questions

Step 1: Select Industry/Domain – Ask the user which industry or domain the topic should be about. For example: “Which industry or domain is your content related to?” (e.g. Education, Healthcare, Technology, Finance, etc.). This establishes the broad context for the topic.

Step 2: Identify the Audience Persona – Based on the chosen industry, ask who the target audience or persona is. For example: “Who is your target audience in this domain?” If the user selected Education in Step 1, you might offer options like Student, Teacher, Parent, School Administrator etc. If they chose Healthcare, options could be Doctor, Patient, Nurse, Healthcare Administrator, etc. This step is dependent on the previous answer – the persona choices are tailored to the selected industry
nngroup.com
. (Dependency example: if domain = Education, next-step persona options are Student, Teacher, Parent, whereas if domain = Business, personas might be Entrepreneur, Customer, Manager, etc.)

Step 3: Choose Content Format/Type – Ask what type of content or format the user is planning to create, since topic ideas can vary by format. For example: “What format will this content be? Are you looking for a blog post topic, a social media post idea, a video topic, etc.?” Offering a selection (Blog Article, Social Media Post, Video, Podcast, Infographic, etc.) helps the AI tailor the topic idea to the medium (a blog topic might be phrased differently than a video idea).

Step 4: Define the Content’s Goal/Purpose – Ask about the primary goal or purpose of the content. For example: “What is the main goal of this content? To inform/educate, to persuade/market, to entertain, or to inspire?” The answer (e.g. educate readers about X, or persuade customers to try Y) will influence the angle of the topic. A topic meant to educate might be a how-to or explainer, while a topic to persuade could focus on benefits or success stories.

Step 5: Specify a Focus or Keyword (Optional) – (This step can be optional.) Ask if there’s any specific subject, keyword, or problem the user wants to focus on. For example: “Do you have a specific subtopic or keyword in mind? (Optional – you can skip if you just want general ideas)”. If the user provides a particular interest (e.g. “integrating technology in the classroom” for Education/Teacher), the resulting topic will be more targeted. If they skip this, the AI will generate a broad but relevant topic idea.

Step 6: Determine Output Preferences (Optional) – You might ask if they want a single topic or multiple suggestions. For example: “How many topic ideas would you like to get (e.g. just one best idea or a few options to choose from)?” This manages the user’s expectations for the output. (If not asked explicitly, you could default to a reasonable number like 3 ideas.)

UX Note: Try to keep the number of steps minimal (ideally 3–5 steps for a wizard) by only asking necessary questions
ux.stackexchange.com
. Combine related info if possible and skip any irrelevant steps. For a better user experience, you can mark the focus/keyword and output-preference steps as optional so that inexperienced users aren’t overwhelmed
ux.stackexchange.com
. This way, users only see and answer what’s relevant to their situation, and they can skip details they don’t care about (keeping the process efficient and user-friendly
ux.stackexchange.com
).

Dependent & Dynamic Questions

Use Dynamic Option Lists: Implement branching logic so that some questions adapt based on earlier answers (this is a common practice in wizards
nngroup.com
). For example, the persona options (Step 2) should depend on the selected industry/domain. If a user chooses Education, it makes sense to show persona options like Student/Teacher/Parent rather than unrelated personas. If they choose E-commerce, you might list personas like Shopper, Store Owner, Marketer. This ensures each user only sees relevant options, reducing confusion and making the wizard feel personalized
nngroup.com
nngroup.com
.

Adapt Subsequent Questions if Needed: You can apply similar logic for other steps. For instance, if the content format (Step 3) is “Video”, you might tweak the wording of the next question to say “What do you want the video to achieve?” instead of “What do you want the article to achieve?”. The core question (content goal) remains the same, but small phrasing changes make the wizard feel context-aware. Similarly, if a user chose a persona of “Student”, you might adjust examples in later questions to fit a student’s perspective. This dynamic adaptation makes the wizard more intuitive.

Complete List of Questions to Ask

(Here’s a consolidated list of all the questions the wizard should cover, in order, for optimal topic generation results:)

Industry/Domain: “Which industry or domain is this topic for?” (Options: Education, Healthcare, Technology, Finance, etc.)

Audience Persona: “Who is your target audience or persona in this domain?” (Options depend on industry, e.g. Student/Teacher/Parent for Education, Doctor/Nurse/Patient for Healthcare, Developer/CTO/End-User for Tech, etc.)

Content Format: “What type of content are you planning to create?” (Options: Blog post, Social media post, Video, Podcast, etc.)

Content Goal/Purpose: “What is the primary goal of this content?” (Options or free text: To educate/inform, To persuade/market a product, To entertain/engage, To inspire, etc.)

Specific Focus or Keyword (Optional): “Any specific topic, keyword, or problem you want to focus on? (Optional)” (Free text input, e.g. “time management for students” or “AI in healthcare”)

Number of Ideas (Optional): “How many topic suggestions would you like to receive?” (Options: One perfect idea, 3 ideas, 5 ideas, etc. or default to a few if skipped.)

These questions cover the who, what, and why needed for topic generation. By gathering industry, audience, format, purpose, and any specific focus, you give the AI a well-rounded brief. (As AI experts suggest, providing details like target audience, niche, and content type helps the AI generate ideas tailored to your audience and brand voice
flowhunt.io
.)

Generating the Topic from Collected Answers

Collect User Responses: As the user progresses through the wizard, capture each answer. By the end, you will have a small set of data (which can be stored as variables or a JSON object) containing all the inputs – e.g. { "industry": "Education", "persona": "Teacher", "format": "Blog post", "goal": "Inform about new teaching strategies", "focus": "technology in the classroom", "num_ideas": 3 }.

Assemble a Prompt with Context: Use the collected answers to build a single prompt for the AI that includes all relevant details. This prompt should clearly instruct the model what to do, incorporating every answer the user provided (this makes the prompt dynamic, since its content changes based on user input). For example, you might create a prompt like: “Generate 3 engaging blog post topics for the Education industry. The target audience is a teacher, and the goal is to inform them about integrating technology in the classroom. Provide creative, specific topic ideas that would appeal to a teacher.” All the user’s answers are woven into this one prompt.

Single Prompt vs. Multiple: It’s best to send one single prompt to the AI model that contains all the information, rather than multiple prompts. A single well-crafted prompt ensures the model considers all context at once and produces a cohesive result. (Multiple prompts would complicate the flow and aren’t necessary here, since we can gather everything first and then generate the topic in one go.) This makes the experience faster and simpler for the user – they click “Generate Topic” once at the end, instead of waiting through several back-and-forth steps.

Prompt Format: There’s no strict requirement to literally use JSON in the prompt – the key is to present the info clearly. You can simply write it in natural language or a list format. For instance, you could feed the model a prompt like: “Industry: Education; Audience: Teacher; Format: Blog post; Goal: Inform about new teaching strategies; Focus: technology in the classroom. Task: Given this context, generate 3 relevant and interesting topic ideas.” The AI will understand this structured context. Alternatively, a conversational instruction as shown in the earlier example works well.

Generate and Display: Once the prompt is sent, the AI will return the topic idea(s). The wizard can then display the results to the user, possibly formatted nicely as a list of topic titles or brief descriptions.

Crafting an Effective Dynamic Prompt

Incorporate Each Answer: Ensure the prompt template has placeholders for each piece of information from the wizard. For example: “Generate [number] [format] topic ideas for the [industry] industry, aimed at a [persona]. The content’s goal is to [goal]. [If focus provided: Focus on 
𝑓
𝑜
𝑐
𝑢
𝑠
focus as the subject.]” This way, the prompt adapts dynamically to whatever the user inputs.

Be Clear and Specific: Clearly state the task in the prompt (e.g. “Generate X topic ideas…” or “Suggest a topic…”). Mention the domain and audience so the AI stays relevant. If the user provided a specific focus, highlight that in the prompt so the AI centers the ideas around it. The more specific and structured the prompt, the better tailored the output will be.

One Prompt is Sufficient: You do not need multiple prompts for topic generation. All the context can be included in one go, which the AI will use to produce the result. This single dynamic prompt approach keeps the user experience seamless – the user answers the questions, then sees the final output, without extra steps in between.

Example Prompt (for illustration): “You are a helpful assistant. Suggest 3 interesting blog post topics for the Education domain. The content is for a teacher and aims to inform about technology integration in the classroom. Provide concise and catchy topic ideas.” – This prompt would yield a few tailored topic suggestions. You can adjust wording and instructions as needed (e.g. tone, or asking for titles vs descriptions) depending on your requirements.

Additional Tips for a Great UI/UX Wizard

Keep it Short and Relevant: Only include necessary steps that add value to the topic generation. Extra, unnecessary questions will frustrate users. Aim for a minimal number of steps (around 3–5 steps total is a good target
ux.stackexchange.com
) to avoid overwhelming the user.

Use Plain Language and Examples: Phrase questions in simple terms and consider adding a short example or placeholder. For instance, for the focus keyword step, the placeholder might say “e.g. ‘solar energy’ or ‘time management’ (optional)”. This helps users understand what to input.

Show Progress and Allow Back Navigation: Indicate which step the user is on (e.g. “Step 2 of 5”) so they feel in control. Allow them to go Back to previous questions to change an answer if needed. This is standard in wizard design and prevents frustration if someone wants to tweak an earlier choice.

Dynamic Adaptation: As discussed, make the wizard feel smart by only showing relevant options or steps based on prior answers
nngroup.com
. Users will appreciate that they don’t have to sift through irrelevant choices. For example, don’t show a persona list full of unrelated roles – filter it to match the industry selection.

Optional Steps and Defaults: Clearly mark optional questions as optional, and if a user skips them, handle it gracefully (e.g. the prompt can simply omit that detail). Providing sensible default behavior (like default number of ideas or a general topic if no specific focus given) ensures the wizard can still proceed smoothly even if some inputs are left blank. Remember, **less time and effort to fill out the wizard means a better user experience】
ux.stackexchange.com
.

Confirmation/Summary: It can be useful to show a brief summary of the selected answers on the final step before generation (e.g. “You chose: Education, Teacher, Blog post, Goal = inform, Focus = tech in classroom”). The user can confirm this looks correct, then hit the Generate button. This minimizes the chance of mis-generation due to a wrong selection and gives users one last opportunity to review their inputs.

Polish the Results Display: Once the AI generates the topic(s), present them clearly. If multiple ideas are returned, use a numbered list or bullet points so they’re easy to read. This completes the wizard experience – the user has gone from input to a set of results in a guided, easy way.