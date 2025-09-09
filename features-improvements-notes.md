# Feature Requirements

The basic idea topic generator is done and saving the generated topics is working. However, a lot of work is needed which includes the features as well as improvements in the current implementation.

Below are the features and improvements that are needed in a list which is not in any particular order.

## Features / Improvements

### Topic Builder
Currently I think I'm asking too many questions in the topic builder. I need to reduce the number of questions and make the questions more specific. I want to only ask the questions that are necessary to generate the topics. I'll ask rest of the questions when I'll create the content based on the topic.

So:
- Please reduce the number of questions in the topic builder. Only keep the questions that are necessary to generate the topics.
- Please make the questions more specific.
- Please avaoid unnecessary questions.
- Once the questions are reduced, please update the questions in these:
    - 
  - update any schema, validation logic and transformation etc to match with the new questions.
  - topic-questions.jsonc
  - topic-questions.md

Once you're done with these, let me know which fields I should remove from the bacekend (which is built using LangGraph/FastAPI in another repo). I'll remove those so the topic generation works as expected.

### Questions UI/UX
Currently the questions are not in a good UI/UX. Keep the sidebar as it is but in the content area where you asks the questions, completly revamp that. 

What I like most is something like TypeForm. I also want to use icons with different questions or their options. I want the whole questionnaire/wizard to look great, easy to use and intuitive.

Please make the topic wizard fun to finish / fill.
