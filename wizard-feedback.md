# Idea / Topic Builder Feedback

I built the topic builder page on /ideas/create. I want to improve the UI and User Experience of the whole wizard.

For that, I would like you to work on all the feedback points one by one.

## Feedback Points:

All the feedback points are in random order. You need to decide which one to work on first.

- The First Step: Getting Started:
    - The first question "How would you like to start?", the UI needs to be changed for the options. We can use the RadioGroup component for this just like the rest of the steps.
    - Show the next questions in this step based on the selected option of the first question.

- The Second Step: Your Audience:
    - The First Question: "Who are you creating this for?", the UI needs to be changed for the options. I think we can use the CheckboxGroup component for this but in Full Row.
    - Show the next questions having checkboxes/radios in full rows as well.
        - For the question experience level, show 3 options in a row.
        - For the question audience size, show 2 options in a row.
    - For the question "Geographic focus", we can use the Dropdown component for the options.

- The Third Step: Content Type:
    - The First Question about what type of content this will be: Show 4 options in a row.
    - For the question "Platform", we can show the optipons in radiogroup component. 4 options in a row.

- The Fourth Step: Your Content Goal:
    - The First Question: "What do you want to achieve?", show 4 options in a row.
    - For the question "style of content", show 4 options in a row.
    - For the question "tone", show 4 options in a row.

- The Fifth Step: Fine-tune:
    - This should be the questions order on this step:
        1. Content Language
        2. Target Region
        3. Any specific topics to focus on?
        4. Anything to avoid?
        5. Content Timing Preference (show 3 options in a full row)
        6. Originality Preference (show 3 options in a full row)
        7. Any other requirements?

- The Sixth Step: Generate Ideas:
    - There should not be much boxes. Currently there are 3 boxes, 1 for core settings, one for audience goals and one for your request. All these should be shown in a single box or no box but in column layout. Maybe 3 columns and value under each heading. Maybe use icon with the heading of each item.
    - No need to show number of ideas in this step.

- General:
    - Make overall question labels/titles a bit bigger so that they are easy to read.
    - Make sure all the mandoatory/required are highlighted with a red asterisk and make sure the validations are working for all the questions.
    - If I fill a step X, and I still need to go to Step Y, don't make the step Z green until I reach the step Z even though Step Y has all the fields optional.
    - I think we should show the next/previous buttons on the top of the form as well just like we are doing in the bottom of the form.

- After Generate:
    - If I click on Generate Topic, it should:
        - Replace the whole sidebar + fields etc and only show the loading state. Loading state should be nice and related to AI, which gives the vibe of AI is working on something.
        - After the loading state, it should show the generated ideas in a nice detailed layout.
        - User should be able to select/check multiple ideas from the generated ideas list.
        - Each generated idea:
            - Should be on it's own row
            - Should have a title
            - Should have a description
            - Should have a score
            - Should have a save button
            - any nessary meta details should be shown.
        - User should be able to save the selected ideas to the library.