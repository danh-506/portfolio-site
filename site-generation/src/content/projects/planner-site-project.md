---
title: "Planner Web App Project"
category: software
description: "Built on my own time, a web app which features a calendar function, keeping track of dates, times, and events. Using mainly Javascript to function, the javascript accesses the loclStorage of the browser to save events and manipulates the DOM to allow the user to see the events on the calendar."
links:
  - label: "GitHub repo"
    url: "https://github.com/danh-506/planner-site-project"
  - label: "Live demo"
    url: "https://portfolio-site-dh.netlify.app"
---

Built on my own time, using AI to write the code (mainly for speed) but was heavily supervised by me (to uphold quality of the site and provide the exact details on how I want the code to be written / features to work). The planner mainly relies on Javascript, to manipulate the DOM (to add/remove event elements from the calendar) and use the localStorage (to store all events made by user). The planner saves all content in the localStorage so cross device syncing would not be supported but it does give a better sense of security since it will eliminate the possibility of network and server side attacks (however since data is not encrypted on the localStorage itself so security vulnerabilities will only occur if an attacker has physical access to the device, where they could just see the stuff in the storage or inject scripts through the user input fields to potentially remotely collect calendar events). Javascript was also incorporated with CSS to make a theme picker for the site, wherethe Javascript would add an attribute to the html tag on the main html of the site which would change the look of the site thorugh CSS (this makes the JS small and fast and keeps the presentational elements to be handled solely by the CSS)