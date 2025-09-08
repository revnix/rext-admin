# Feature Requirements

The basic idea topic generator is done and saving the generated topics is working. However, a lot of work is needed which includes the features as well as improvements in the current implementation.

Below are the features and improvements that are needed in a list which is not in any particular order.

## Features / Improvements

- Topic Builder
    - When I create a new idea in the topic builder, when I go to Your Audience step, it pre-selects the first two options for the audience. It should not do that. 
    - No need for geographic focus in the second step which is "Your Audience".
    - Type of Content step should have these options only:
        - Blog Post or Article
        - Social Media Post
            - Facebook
            - Instagram
            - Twitter
            - LinkedIn
            - TikTok
            - YouTube
    - In Step 4 (Goals & Style), when I select "Other" for any of the questions, it shows the same input field for all the options. It should not do that. Instead, it should show the input field for the specific question.
    - In Step 5 (Fine Tuning): 
        - Remove these fields:
            - Content Language
            - Target Region
        - Use better name for the step which currently is "Fine Tuning".
        - Use better name and explanations for the remaining fields/questions.
        - Make the "Any other requirements?" field bigger and make it first in the list of fields on this step.
        - Add a slider or some field for selecting the number of topic ideas to generate.
    - In Step 6 (Generate Ideas), Instead of showing 3 columns (Core Settings, Audience & Goals, Advanced Options), show all the fields in a grid layout. Each field should show a relevant icon, key/name of the field and value of the field so that user can easily see what they selected and can easily review those.
    - When user clicks on "Generate Ideas", and the topics are being generated, make the popup a bit minimalistic and modern and futuristic. Also add button to cancel the generation process along with close icon. 
        - if user clicks on close icon or cancel button, it should close the popup and the generation process should be cancelled.
        - if user clicks on close icon or cancel button, it should ask for the confirmation to cancel the generation process.

- Results Page
    - instead of showing all the generated results in the same topic builder page, show them in a new page.
    - the new page should have dedicated and better layout for the results.
    - Make each result card minimalistic and modern. There should be a an expand button which opens each result in a popup/modal which shows all the details of that topic including the meta data, keywords, scores etc.
    - The new result page should have a temoporary ID as well. This will help user to not lose the results if they navigate away from the page. The generated results should be saved in the local storage and should be shown in the results page. The ID can be like this in the URL: `ideas/create/results/temporary-id`. 
    - User should be able to select and save the multiple topics as well as individually save the topics.
    - With each result cart, there should be a button which says something like "Write on this topic/Generate content/Write Content" etc. For your context, clicking on that button should take the user to "/flows/create" page with the topic ID in the URL so that it can be used to select the topic for the flow automatically.

- Table on Ideas Page
    - I want to use the same consistent table for all the pages where I have to show the list of anything. There should be a single table component that can be used across all the pages.
    - The table should have:
        - Search box
        - Action Button or Buttons
        - Working Pagination
        - Loading Skeleton
        - No need for any sorting or filtering options for now.

    - Each table can have different columns and different actions so it should support that.
    - Some of the rows in tables can have buttons to perform actions like view, edit, delete, copy, schedule, toggle status etc.
    - Once all the above features are implemented, replace the dummy tables in all the pages with the new table component.
    - I like the Table on Ideas Page, so do all the above mentioned changes in that table and make that table re-usable on all of the pages which can handle any type of data.