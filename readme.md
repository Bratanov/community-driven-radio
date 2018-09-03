# Community Driven Radio

A DevLabs Project

<img src="https://avatars0.githubusercontent.com/u/10864739?v=3&amp;s=200" alt="DevLabs" width="100" style="max-width:100%;">

## Dependencies

- NodeJS Version 6.10.0+ (ES6 Compatible)
- npm v6.0.1

## How to install

`npm install`

## How to run

0. This project requires a YouTube API key to work.

    Get one from: https://console.developers.google.com/apis/credentials 

    (Read their docs here: https://developers.google.com/youtube/)

0. Create .env file using .env.sample as template.

    `cp .env.sample .env`

0. Set your YouTube API key as an environment variable in the newly created .env file.

0. Generate frontend assets.

    `npm run build:css`

0. Run the project.

    `npm start`

0. Run the project in develop mode. _This will rebuild your css bundle every time you make a change in .scss source file._

    `npm run develop`

## Contributions

Any contributions are welcome, you can open new issues with bug reports/feature requests/questions or you can make pull requests with your work. Try to follow our code organization and naming conventions.

If you want to get started with a task you can check out the active issues [here](../../issues), fork the project, work on it and when ready, open a pull request [here](../../pulls). 

Good luck and happy coding!
