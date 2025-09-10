# Feature Requirements

## Overview

I'm done with the basic topic generator which is currently generating the topics and saving the generated topics. However, a lot of work is needed which includes the features as well as improvements in the current implementation of the Topic Builder.

Apart of that, I want to improve the UI/UX of the Results Page.

Below are the features and improvements that are needed in a list which is not in any particular order.

## Features / Improvements in Topic Builder

- Overall Questions Feedback:
  - The questions are vertically aligned and because of this, there's too much space between the steps and the questions. Please reduce the space between the steps and the questions. 
  - Move Question x of y to the top of the question.
  - make the options text a bit bigger and make the icon size a bit bigger as well.
  - We should show max 3 options (radio/checkbox) in a row. Also the title of the option as well as description of the option should word-wrap so that it doesn't overflow.
  - make the size of the options (radio/checkbox) consistent.
  - Suggestions should be based on the previous answers. Example: Target audience should be purely based on the industry.
  - Checkboxes are showing double border. Keep the original rounded border but remove the extra square border when selected.
  - Options like Buttons, Suggestions to select etc should show cursor:pointer when hovered.
  - There's an issue with questions like target audience where we can select multiple options and they added as chip in the input. This is fine, however, when I type something, and I press enter, it moves to next question. Moving to next question after pressing enter is fine but when I'm in that field and I've typed something, and I press enter, it should add the typed text as a chip in the input and if I press enter again, it should move to next question.
  - The Review Step is showing some values without chip and some valudes in chip. All should show consistently. If there are radio/checkboxes selected previously, then in the review step, these should show as comma seperated.
  - If I click on Edit icon in the review step, it goes to that step and let me edit, however, I've to keep pressing next all the way to the end again and again. There should be some way or better approach for user who if already filled the whole questions, and if they update somehting, they should be able to jump into the review step again.


- Questions Steps/Timeline:
  - With current UI, we can't see the full sentence/title of the step. Instead, I think we should use 1/2 word step title.
  - The progress bar should be behind the steps circle. It should give the timeline vibe.
  - No need for mentioning the Step numbers as well as % percentage completion. Active/remaining step + progress bar behind it is enough.

- Questions Specific Feedback:
  - Question 1: I want to explore my industry should be first option and should be selected by default.
  - Question 2: Who are you creating this for? should be first option and should be selected by default.

## Features / Improvements in Results Page

- We don't need the Edit Settings button. Change the Regenerate button text and clicking on it should start from scratch again.
- I should be able to select a topic by clicking on the topic card
- We don't need the CMD+C etc support for the topic cards.
- We don't need the export button and functionality on the results page.
- We don't need the Write Content button for the multiple selected topics. Write button will show individually for each topic.
- We don't need the delete button for the multiple selected topics. We also don't need thtese actions for any topic's dropdown: Regenerate, Export, Delete.
- The actions we need are: View Topic, Save Topic, Write Content, Copy Topic.
- All of these actions should show in beautiful chips with icons and.
- We also don't need the score and description and other details like keyword and tags etc by default on each topic card. Only title and a rounded circular progress bar and action chips are enough. We can see the full details when user will click on the view topic.
- View Topic modal should be converted to a big offnanvas type of Drawer with a close button on the top right. Just like when someone clicks on a job on Upwork. Similar to Notifications sidebar/drawer but with big width and all the details related to the topic.
- All the details related to the topic should show in the drawer with nice UI/UX, icons, scores, action buttons etc.
- The whole topic card should be clickable and should open the drawer. It should show the cursor:pointer when hovered.
- We should remove all the filters and sorting options form the results page at all. Results should be sorted based on the overall score which user can see either in the circular progress bar or in the drawer when they click on the topic card.