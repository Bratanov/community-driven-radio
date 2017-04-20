const childProcess = require('child_process');
const path = require('path');
const os = require('os');
const logger = require('../core/logger');
const packageJson = require('../../package.json');
const fsExtra = require('fs-extra');

// File locations
const DOCS_TEMP_DIR = path.normalize(os.tmpdir() + '/community-driven-radio-gh-pages-temp/');
const JSDOC_PATH = path.normalize('./node_modules/.bin/jsdoc');
const DOCS_DIR = path.normalize('docs/');
const JSDOCS_DIR = path.normalize('docs/jsdocs/');
const README_FILE = path.normalize('docs/jsdocs-readme.md');
const COPY_OPTIONS = {
	preserveTimestamps: true
};
/**
 * The name of the branch you're on will be
 * saved here, so it can be switched back
 * @type {string}
 */
let branchName = "";
/**
 * Indicates that changes were stashed prior to
 * switching branches that need to be unstashed
 * @type {boolean}
 */
let changesStashed = false;

const commands = [
	/**
	 * Step 1:
	 * 	- Generate jsdocs in `docs/jsdocs/`
	 */
	`${JSDOC_PATH} server/core/ --destination ${JSDOCS_DIR} -t node_modules/docdash --readme ${README_FILE}`,
	/**
	 * Step 2:
	 *  - Cleanup temp folder (if any) from previous operations
	 */
	function cleanTempDir(next) {
		fsExtra.emptyDir(DOCS_TEMP_DIR, next)
	},
	/**
	 * Step 3:
	 *  - Copy `docs/` to a temp folder
	 */
	function copyDocsToTemp(next) {
		fsExtra.copy(DOCS_DIR, DOCS_TEMP_DIR, COPY_OPTIONS, next)
	},
	/**
	 * Step 4:
	 *  - Copy project .gitignore to temp folder (so it's transferred to gh-pages branch)
	 */
	function copyGitignoreFile(next) {
		fsExtra.copy('.gitignore', DOCS_TEMP_DIR + '.gitignore', COPY_OPTIONS, next);
	},
	/**
	 * Step 5:
	 *  - Remove generated jsdocs from `docs/jsdocs/`
	 */
	function cleanGeneratedDocs(next) {
		fsExtra.emptyDir(JSDOCS_DIR, next);
	},
	/**
	 * Step 6:
	 *  - Stash current changes, note if anything got stashed
	 */
	`git add --all`,
	function gitStash(next) {
		executeSingleItem('git stash', (err, out) => {
			// TODO: That's pretty ugly, any git versions it won't work on, should we do a git diff, or git status?
			if(out.indexOf('No local changes to save') === -1) {
				changesStashed = true;
			}
			return next(err, out);
		})
	},
	/**
	 * Step 7:
	 *  - Save the name of the current branch, so we can go back to it
	 *  Requires Git 1.6.3+, source: http://stackoverflow.com/questions/1417957/show-just-the-current-branch-in-git
	 */
	function saveBranchName(next) {
		executeSingleItem('git rev-parse --abbrev-ref HEAD', (err, out) => {
			// default to master
			branchName = out.trim() || 'master';

			return next(err, out);
		})
	},
	/**
	 * Step 8:
	 *  - Switch to gh-pages branch
	 */
	`git fetch`,
	`git checkout gh-pages`,
	`git pull origin gh-pages`,
	/**
	 * Step 9:
	 *  - cleanup all files (sirech - old documentation)
	 */
	`git rm -rf .`, // delete everything in the gh-pages branch
	/**
	 * Step 10:
	 *  - Copy contents of `docs/` folder in the temp dir into root directory
	 */
	function copyTempToCurrent(next) {
		fsExtra.copy(DOCS_TEMP_DIR, '.', COPY_OPTIONS, next);
	},
	/**
	 * Step 11:
	 *  - Commit, push to `gh-pages` branch
	 */
	`git add --all`,
	`git commit -m "Updated docs for Version ${packageJson.version}"`,
	`git push origin gh-pages`,
	/**
	 * Step 12:
	 *  - Cleanup temp dir
	 */
	function cleanTempDir(next) {
		fsExtra.remove(DOCS_TEMP_DIR, next);
	},
	/**
	 * Step 13:
	 *  - Go back to the branch you were on initially
	 */
	function gitCheckoutInitialBranch(next) {
		executeSingleItem(`git checkout ${branchName}`, next);
	},
	function unstashIfNeeded(next) {
		if(changesStashed) {
			executeSingleItem('git stash pop', next);
		} else {
			next();
		}
	},
	/**
	 * Step 14:
	 *  - For the superstitious
	 */
	function printSuccess(next) {
		console.log('SUCCESS! :)');
		return next();
	}
];

/**
 * Takes in an item (string command or function) and executes it
 * Errors or stdErrors get piped to first argument in next()
 *
 * @param item
 * @param next
 */
function executeSingleItem(item, next) {
	if(typeof item === 'function') {
		logger.info('Executing function', item.name);

		return item(next);
	} else if(typeof item === 'string') {
		logger.info('Executing command', item);

		return childProcess.exec(item, (err, stdOut, stdErr) => {
			if(err || stdErr) return next(err || stdErr);

			return next(null, stdOut)
		});
	}
}

/**
 * Receives an array of commands and
 * executes each of them recursively
 */
(function executeAsyncronously(arrayOfCommands) {
	if(commands.length === 0) {
		logger.info('DONE!');
		return;
	}
	let currentCommand = commands.shift();
	executeSingleItem(currentCommand, (err, response) => {
		if(err) {
			logger.error(`Command: '${currentCommand}' failed with error:\n${err}`);
		} else {
			logger.info(`Current command: '${currentCommand}' executed without errors.\nOutput:\n${response}`);
		}
		// keep going
		return executeAsyncronously(arrayOfCommands);
	});
})(commands);