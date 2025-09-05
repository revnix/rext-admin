# Topic Builder Functionality

Work on the following tasks one by one after analyzing the codebase:


## Task 1: Save the topics
Currently I'm able to generate the topics using the endpoint from the backend which is built using LangGraph.

However, I'm not able to save the topics.

I want you to make the save functionality work.

For that, you can use this endpoint:

$ch = curl_init("http://127.0.0.1:2024/api/topic/save-topic");

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'content-api-key: supersecretapikey']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  'topics' => [
    [
      'title' => '',
      'angle' => '',
      'channel_fit' => [
        ''
      ],
      'audience_fit' => [
        ''
      ],
      'scores' => [
        'relevance' => 0,
        'freshness' => 0,
        'novelty' => 0
      ],
      'why_it_works' => '',
      'tags' => [
        ''
      ]
    ]
  ]
]));

curl_exec($ch);

curl_close($ch);

When topics are saved, show appropriate message to the user and give user options to navigate to the topics page or generate new topics.


## Task 2: Get all the topics
Currently I'm able to generate the topics using the endpoint from the backend which is built using LangGraph.

However, I'm not able to get all the topics.

I want you to make the get all the topics functionality work.

For that, you can use this endpoint:

curl http://127.0.0.1:2024/api/topic/get-all-topics

$ch = curl_init("http://127.0.0.1:2024/api/topic/get-topics");

curl_setopt($ch, CURLOPT_HTTPHEADER, ['content-api-key: supersecretapikey']);

curl_exec($ch);

curl_close($ch);

Make sure to show the all the topics in the ideas page. Currently we are showing the dummy content on ideas page.