# WREXT API Integration

There's a task 4 and it's subtasks about "Task 4: Develop AI Service Integration Layer".

We don't need this approach. We don't need to implement OpenAI API Client directly neither we need to use groq api fallback and create prompot template generator etc.

We have an existing backend built using LangGraph which is already taking care of the AI service integration. We just need to use it's APIs into our frontend.

For now, we can use below endpoint for generating the topics:

````
curl http://127.0.0.1:2024/api/topic/generate-topic \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{
  "wizardMode": "",
  "industry": "",
  "industry_other": "",
  "industry_specific_focus": "",
  "content_type": "",
  "content_type_other": "",
  "platform": "",
  "platform_other": "",
  "audience": "",
  "reader_level": "",
  "audience_size": "",
  "demographic_age": [
    ""
  ],
  "demographic_location": [
    ""
  ],
  "purpose": [
    ""
  ],
  "purpose_other": "",
  "content_goal": [
    ""
  ],
  "tone": [
    ""
  ],
  "tone_other": "",
  "keywords": "",
  "notes": "",
  "additional_notes": "",
  "num_ideas": 1,
  "region": "",
  "language": "english",
  "content_timing_preference": "",
  "content_originality_preference": "",
  "fresh_vs_evergreen": "",
  "safe_vs_original": "",
  "exclude": "",
  "focus": "",
  "subject": "",
  "timestamp": ""
}'
````

You need to analyze the codebase and the above enpdoint with the object we send in the POST request and then do the implementation when I click on Generate Topics.

Fo far that, analyze codebase, existing task 4 and all the subtasks, update task # 4 and add/update/remove any subtask if needed based on the above requirement.

Keep in mind to take care of the tech stack we planned to use in the @wrext-tech-stack.md file.