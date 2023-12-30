# Tawlo is a career development social media project

<h1 align = "center">
    <img src = "https://github.com/Joazen544/tawlo/assets/136336516/fd088ee2-71e1-49aa-aa5e-842523b2e0cc">
</h1>

Click [here](http://www.joazen.website) to visit.

Tawlo is a platform for helping people to have better career development.

People can share useful information and their own experience about career with others. They can also discuss specific topics on forums, and meet other users through pairing feature once they are curious to other industries.

## <a id="table"></a>Table of content

- [Skills](#skills)
- [Main features](#main_feature)
- [How to run it yourself](#how_to_run)
- [Plan to do next](#to_to_next)

## <a id="skills"></a>Skills

- TypeScript
- Nodejs
- Express
- MongoDB
  - Mongoose
  - Atlas
  - Atlas Search
- Redis
- AWS services
  - EC2
  - Load Balancer
  - S3 Bucket
  - CloudFront
- React

## <a id="main_feature"></a>Features

### Structures

<h1 align = "center">
    <img src = "https://github.com/Joazen544/tawlo/assets/136336516/6ed1ec9e-d741-43ce-badf-9e2bb8633bc7">
</h1>

1. The server was deployed on AWS EC2.
2. Frontend was written with React in Vite.
3. Static files were uploaded to AWS S3 bucket, and served by AWS CloudFront.
4. AWS load balancer was set between client and server for future horizontal scaling needs.
5. Database was deployed on MongoDB Atlas.
6. Searching and relevant features were powered by Atlas Search.

### Personal posts wall

https://github.com/Joazen544/tawlo/assets/136336516/f047df3a-cbb4-4914-8260-821d4a8efd2a

Home page would auto recommend users posts they're interested in. Basically based on:

1. The tags user often interacts with
2. Post time
3. Read post before or not

### Tracking user preference

https://github.com/Joazen544/tawlo/assets/136336516/9397aa85-5bc6-47cf-b974-92bda977411c

Once user likes, upvotes, comments on a post. The tags of the post will be updated to user database and be used to recommend posts in future.

#### How does it work?

The tags are stored in MongoDB as an array of object called 'preference', each object has two properties: 'name' and 'number'.

Once new tags occur, it will:

1. Increase the number of existing tags in 'preference'.
2. Check if those not existing tags duplicate with the last few tags, which means they appeared last time, too. If so, exchange them with one of the former tag in 'preference'.
3. Sort the array by number.
4. Replace the last few tags with remain new tags.

So this mechanism can produce a LFU fixed length array to record user preferences.

### Create posts

https://github.com/Joazen544/tawlo/assets/136336516/9914942b-097c-420a-83b9-7db26b522588

When user creates a post, they'll need to add tags to it. And server will recommend relevant tags according to other posts once user enters the first one.

### Filtering

https://github.com/Joazen544/tawlo/assets/136336516/a9a9d5bb-63b4-4b70-93dd-c9d25f4b00ea

If user only wants to see specific themes of posts. They can use the filter. And all the post would at least have one of the filter chosen.
It will still recommend posts according user preference.

### Searching

https://github.com/Joazen544/tawlo/assets/136336516/2be90e87-8a15-483c-8c4f-e3299c1d0c31

The searching is driven by Atlas Search. And user can add double quotes to make the key word a "must" for the results.

### Matching

https://github.com/Joazen544/tawlo/assets/136336516/b04defa4-a6e9-46aa-bcaa-b0b4ecaa233f

The matching is also driven by Atlas Search, each user needs to fill in "to ask" and "to share" topics (can fill in multiple topics in same time).
And at least one of the "ask" and one of the "share" needs to match for pairing up.

## <a id="to_to_next"></a>Plan to do next

1. Add "Boolean search" to searching.
2. Let users customizde preference tags by themselves.
3. Use AI or string dealing to auto generate tags for posts, so users don't need to add by themselves.
