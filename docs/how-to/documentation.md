---
title: Community Driven Radio - Documentation on How to make documentation
---

For the [JSDocs](../jsdocs):

- Update documentation in the appropriate `.js` files, in the docblocks
- Run `npm run publish-docs` to publish your changes to github pages

For the [Documentation files](../):

- Update the appropriate `.md` files in the `docs/` folder
- Run `npm run publish-docs` to publish your changes to github pages

Note: _Always include documentation changes with your pull requests when it's needed_

Note: _Run the `npm run publish-docs` script after the PR has been merged to master, there's no staging_

<a href="#" id="show-publish-docs-explanation">Show me how the `npm run publish-docs` script works</a>

<div id="hidden-publish-docs-explanation" style="display:none">
It's best to check the documentation inside the file (`server/scripts/publish-gh-pages.js`) if you're going to work on it.
<br />
If you're having issues with it, first of all, let me know (git blame).
<br />
If you're reading the output of the script, then there's a lot going on, but it's not that complicated.
<br />
But what does it do?
<br />
- Generates the jsdocs in the current branch you're on, 
inside the `docs/jsdocs/` folder (_Step 1_)
<br />
- Copies the whole `docs/` folder to a temp directory (_Step 3_)
<br />
- Switches over to `gh-pages` branch, 
replaces everything there with the contents of that temp dir (_Steps 8-10_)
<br />
- Commits the changes, pushes to origin (_Step 11_)
<br />
- It will bring you back to the branch you were on initially
and stash/unstash any changes that you had (_Steps 6, 7, 13_)
<br />
- It will clean up the generated files/folders from your temp dirs 
and in the `docs/` folder (_Steps 2, 5, 9, 12_)
<br />
- It will move the current root `.gitignore` file to the `gh-pages` branch, 
this prevents issues with ignored files when switching branches (_Step 4_)
<br />
- Currently it won't stop on errors, it will rather skip ahead. This is mainly because
all output from the `git` commands is in the stdErr output
</div>
<script type="text/javascript">
    // simple, but effective one-time-use toggle button
    document.getElementById("show-publish-docs-explanation").onclick = function() {
        document.getElementById("hidden-publish-docs-explanation").style.display = "initial";
    }
</script>