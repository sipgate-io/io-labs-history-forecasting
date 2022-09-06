# What does this project do?

We parse from our sipgate-team history all incoming calls, SMS, and Fax. We then analyze from which german area codes most events originate. Finally, the results are visualized on a heatmap of germany.

# Prerequisites:

-   [node.js](https://nodejs.org/en/)
-   [npm](https://www.npmjs.com/)
-   [sipgate-team account](https://www.sipgateteam.de/)
-   [sipgate-team PAT](https://www.sipgate.io/rest-api/authentication#personalAccessToken) with scope `history-read`

# How to run:
Create the `.env` file by copying the `.env.example`. Set the values according to the comment above each variable.

```bash
npm run createData
npm run start
```

open http://0.0.0.0:8000/map/

# How to create test data:

```bash
npm run createTestData
```
