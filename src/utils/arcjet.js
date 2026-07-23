import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";

const aj = arcjet({
  
  key: process.env.ARCJET_KEY,
  rules: [
    shield({ mode: "LIVE" }),

    detectBot({
      mode: "LIVE", 
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
      ],
    }),

    slidingWindow({
      mode: "LIVE",
      max: 10,
      interval: "15m",
    }),
  ],
});

export default aj