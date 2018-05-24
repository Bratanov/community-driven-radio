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

0. Set the YouTube API key as an environment variable:

	- For Windows:

		`SET YOUTUBE_API_KEY=mykeyhere`

	- For Linux/MacOS:

        `export YOUTUBE_API_KEY=mykeyhere`
   
0. Run the project:

    `node radio` or `npm start`

0. _Alternatively_, you can combine the previous steps with:

    `SET YOUTUBE_API_KEY=mykeyhere && node radio`
   
    or use the provided shell script:
   
    - `cp start.sh.sample start.sh` - copy the example script

    - `vi start.sh` - update with your API key
   
    - `./start.sh` - sets API key and runs project

## Contributions

Any contributions are welcome, you can open new issues with bug reports/feature requests/questions or you can make pull requests with your work. Try to follow our code organization and naming conventions.

If you want to get started with a task you can check out the active issues [here](../../issues), fork the project, work on it and when ready, open a pull request [here](../../pulls). 

Good luck and happy coding!
