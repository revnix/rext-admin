# Topic Questions

Topic Generation Wizard: Comprehensive Questions & Options

To create a best-in-class topic generation tool that works for any industry and any content type, we need to gather detailed information from the user through a step-by-step wizard. Below is a detailed list of all necessary (must-have) questions and optional/advanced questions, along with possible answer options or example responses for each. Each question is designed as a single step (one question at a time) for optimal UI/UX. We provide two variations of the wizard flow to handle different user scenarios: one where the user already has a specific topic in mind, and one where the user is starting with a general industry context.

These questions cover essential context such as the content’s target audience, purpose, tone/voice, etc., which are key elements in effective content planning. We also include the content format and distribution channel (e.g. blog vs. video, social media platform) because tone and style often vary by content type and channel (for example, a playful tone on social media vs. a formal tone in a whitepaper). Additionally, allowing the user to specify target keywords can help generate more relevant and SEO-friendly topic ideas.

Variation A: User Has a Specific Topic in Mind (Subject-First Flow)

In this flow, the wizard begins by asking for the specific subject or keyword the user wants to build content around, then collects additional details to refine the topic suggestions.

Primary Topic/Subject – Input type: Text (single-line). (Required)
The main topic, subject, or keyword that the user wants content ideas for. The user should enter a short phrase or a few words describing the subject.
Sample inputs:

"Artificial Intelligence in healthcare"

"Budget travel tips for students"

"Sustainable fashion trends"

Industry or Domain – Input type: Dropdown (single-select). (Required)
The industry or broad domain that the content relates to. This provides context for tailoring the topic ideas to a specific field. (If the subject is very niche, the closest relevant industry should be chosen.)
Options (examples):

Technology / IT

Healthcare / Medical

Finance / Banking

Education / E-Learning

Travel / Hospitality

Food / Culinary

Fashion / Beauty

Business / Entrepreneurship

Marketing / Advertising

Science / Research

Sports / Fitness

Lifestyle / Personal Development

Government / Public Policy

Other – If "Other" is selected, a text input appears to specify the industry.

Content Type/Format – Input type: Dropdown (single-select). (Required)
The format or type of content for which topics are being generated. This helps shape the style of the topic ideas (e.g. a video topic might differ from a blog article topic).
Options:

Blog Post / Article

Social Media Post

Video Content

Podcast Episode

Infographic

E-book / Guide

Case Study

Whitepaper / Report

Email Newsletter

Presentation / Webinar

Press Release

Other – If "Other" is selected, a text input appears to specify the content format.

Platform/Channel (if applicable) – Input type: Dropdown (single-select). (Conditionally Required)
This question appears only if a specific platform is relevant to the chosen content type (for example, for social media posts or videos). It identifies where the content will be published, which can influence the tone or style.
Options (shown if applicable):

For Social Media Posts: Facebook, Instagram, Twitter (X), LinkedIn, TikTok, Other (specify)

For Video Content: YouTube, TikTok, Instagram (Reels/IGTV), Vimeo, Other (specify)
(If "Other" is selected, a text input will allow the user to specify the platform or channel.)

Target Audience or Persona – Input type: Text (short description). (Optional/Advanced)
A description of the intended audience for the content. Knowing the audience helps in generating topics with the appropriate angle, complexity, and tone. (This is optional, but providing it can lead to more tailored and relevant topics.)
Sample inputs:

"Tech-savvy millennials interested in personal finance"

"CFOs and finance executives at large companies"

"High school students learning chemistry"

Content Goal/Purpose – Input type: Dropdown (single-select). (Optional/Advanced)
The primary goal of the content – what you want to achieve or what the audience should get from it. This guides the angle of the topic suggestions (e.g. an educational vs. a promotional topic).
Options:

Educate or Inform (provide knowledge or how-tos)

Entertain/Engage (capture interest, amuse, or engage the audience)

Inspire or Motivate

Persuade/Convince (e.g. influence opinion or behavior)

Promote a Product/Service (marketing intent)

Drive SEO Traffic (focus on search rankings)

Establish Thought Leadership (build brand/author as an authority)

Other – If none of the above fits, allow the user to specify another goal.

Tone/Voice – Input type: Multi-select (checkboxes). (Optional/Advanced)
The desired tone or writing style for the content. Multiple tones can be selected if applicable. This helps ensure the generated topics match the brand or intent (for example, a topic can be phrased more seriously or playfully).
Options:

Professional / Formal

Informal / Conversational

Friendly / Approachable

Humorous / Playful

Serious / Authoritative

Technical / Analytical

Simple / Beginner-friendly (layman’s terms)

Inspirational / Motivational

Other (specify a custom tone, if needed)
Example selections: "Professional and informative" or "Casual, conversational tone". (If multiple tones are selected, the content voice should blend them appropriately.)

Keywords or Key Phrases to Include – Input type: Text (could allow multiple values). (Optional/Advanced)
Specific words or phrases that the user wants to be central to the topics (for SEO or emphasis). The user can enter multiple keywords separated by commas. These will guide the generator to include or focus on certain concepts.
Sample inputs:

"AI, machine learning, patient data" (for a topic on AI in healthcare)

"budget travel, backpacking, cheap flights" (for travel-related content)

"sustainability, eco-friendly, recycling" (for environmental content)

Excluded Topics or Constraints – Input type: Text. (Optional/Advanced)
Any specific angles, subtopics, or content elements that should be avoided in the generated ideas. This helps filter out unwanted suggestions.
Sample inputs:

"Exclude any topics about politics or controversial issues."

"Avoid mentioning competitor names in the topics."

"No basic how-to tutorials (audience already knows the basics)."

Number of Ideas Required – Input type: Number (or slider). (Optional)
How many content topic ideas the user wants to generate. The user can specify a number or use a slider. (If not specified, a default (e.g. 5 ideas) can be used.)

Allowed range: 1 to 10 ideas (for example).

Sample value: 5 (to receive five topic suggestions).

Additional Notes/Context – Input type: Textarea (multi-line text). (Optional/Advanced)
Any other instructions or context the user wants to provide. This could include background information, a specific angle they have in mind, or anything that doesn't fit into the other fields.
Sample note: "Our brand voice is very playful, and we recently covered basic AI topics, so focus on advanced angles. Also, tie the topic to recent trends if possible."

Flow Logic & Dependencies (Variation A): In this subject-first flow, Step 1 (Primary Topic) is filled out first. Subsequent questions (Industry, Content Type, etc.) further refine how the topic ideas will be generated. Some fields appear only when relevant: e.g., the Platform question (Step 4) is shown only if the content type is "Social Media Post" or "Video Content". If the user selects "Other" in industry or content type, an additional text field will prompt them to specify the custom value. All questions marked optional/advanced can be skipped – they are meant to improve quality but are not absolutely required for generating topics.

Variation B: User Does NOT Have a Specific Topic (Industry-First Flow)

In this flow, the user starts with a general industry or area of interest (without providing a specific subject upfront). The wizard then optionally allows narrowing down to a subtopic, followed by the other refining questions. This is useful if the user is looking for popular or trending topics in a broad domain.

Industry or Domain – Input type: Dropdown (single-select). (Required)
The broad industry or field of interest for which the user wants to generate content ideas. This sets the general context for all suggestions.
Options: (same as in Variation A Step 2)

Technology / IT

Healthcare / Medical

Finance / Banking

Education / E-Learning

Travel / Hospitality

Food / Culinary

Fashion / Beauty

Business / Entrepreneurship

Marketing / Advertising

Science / Research

Sports / Fitness

Lifestyle / Personal Development

Government / Public Policy

Other – If selected, a text input appears to specify the industry.

Specific Topic Focus (within the industry) – Input type: Text. (Optional)
An optional field for the user to enter a more specific theme, subtopic, or angle within the chosen industry. If the user has a particular area of interest in mind, they can specify it here; otherwise, this can be left blank to get broad topic suggestions for the industry. (This step refines the suggestions similarly to the "Primary Topic" in Variation A, but is not required.)
Sample inputs: (if Industry = Healthcare)

"AI applications for diagnostics"

"Mental health awareness in workplaces"
(If left blank, the tool will assume a broad approach, possibly suggesting trending or general topics in the chosen industry.)

Content Type/Format – Input type: Dropdown (single-select). (Required)
The type of content for which ideas are needed. (Same list of options as Variation A Step 3, including Blog, Social Media, Video, Podcast, etc., with an Other option.) This ensures the topics generated are suitable for the intended format.
Options:

Blog Post / Article

Social Media Post

Video Content

Podcast Episode

Infographic

E-book / Guide

Case Study

Whitepaper / Report

Email Newsletter

Presentation / Webinar

Press Release

Other (specify if not listed)

Platform/Channel (if applicable) – Input type: Dropdown (single-select). (Conditionally Required)
Shown only for content types where a specific platform matters (social media or video). (Same logic and options as Variation A Step 4.) The user selects the platform to tailor topic ideas appropriately for that channel.
Options:

For social posts: Facebook, Instagram, Twitter (X), LinkedIn, TikTok, Other (specify)

For video content: YouTube, TikTok, Instagram Reels/Video, Vimeo, Other (specify)

Target Audience or Persona – Input type: Text. (Optional/Advanced)
Who the content is intended for. (Same as Variation A Step 5.) Describing the audience helps generate topics that will appeal to that group. This can include demographics, professional roles, interests, or expertise level.
Sample inputs:

"Small business owners in the retail sector"

"College students studying computer science"

"New parents researching baby care products"

Content Goal/Purpose – Input type: Dropdown. (Optional/Advanced)
The main objective of the content. (Same as Variation A Step 6.) This influences the direction of topic ideas (e.g., an informational goal vs. a sales goal will yield different kinds of topics).
Options:

Educate / Inform

Entertain / Engage

Inspire / Empower

Persuade / Convince

Promote a Product/Service

Drive SEO Traffic

Establish Thought Leadership

Other (custom goal)

Tone/Voice – Input type: Multi-select (checkboxes). (Optional/Advanced)
The desired tone or style of the content. (Same as Variation A Step 7.) Multiple tones can be selected to capture nuance. This ensures the suggested topics fit the style (e.g. serious vs. quirky) that the user wants.
Options:

Formal / Professional

Casual / Conversational

Friendly / Warm

Humorous / Fun

Serious / Academic

Technical / Complex

Simple / Accessible

Inspirational / Uplifting

Other (specify)

Keywords or Key Phrases to Include – Input type: Text (multi-value). (Optional/Advanced)
Any specific keywords the user wants to emphasize. (Same as Variation A Step 8.) If provided, the tool will focus on these terms when generating ideas. The user can list multiple keywords, separated by commas.
Sample inputs:

"cybersecurity, data breach, encryption" (for tech security content)

"vegan, plant-based, nutrition" (for food/health content)

Excluded Topics or Constraints – Input type: Text. (Optional/Advanced)
Anything the user wants to avoid in the suggestions. (Same as Variation A Step 9.) This helps filter out irrelevant or undesired topics.
Sample inputs:

"Avoid any topics about last year's product line"

"Exclude political or highly technical discussions"

Number of Ideas Required – Input type: Number. (Optional)
The number of topic ideas to generate. (Same as Variation A Step 10.) User can choose a number (e.g., 5 by default).

Range: 1–10 (for example), default could be 5.

Additional Notes/Context – Input type: Textarea. (Optional/Advanced)
Any other information or preferences. (Same as Variation A Step 11.) This can include contextual info or special requests.
Sample note: "Our audience is global, so topics should have international appeal. Also, we prefer topics with a positive tone."

Flow Logic & Dependencies (Variation B): In this industry-first flow, the Industry is selected at Step 1, and an optional focus can be provided at Step 2 (if the user has a particular subtopic in mind, otherwise they skip it). Then the flow converges with Variation A: Content Type, Platform (conditional), and the various optional refinement questions. As before, platform is asked only if needed, and "Other" selections trigger an additional input to specify details. Optional advanced questions (audience, purpose, tone, keywords, excludes, notes) can be shown in an "Advanced options" section or otherwise indicated as skippable for a basic quick idea generation.