---
title: Community Driven Radio - Version Bumping - Documentation
---

Having version numbers is not critical for our project, but 
we can benefit from it if we have multiple clients running 
on different versions, or if we publish it as a package.

## What to do?

After a PR is merged, which includes significant changes, 
you can bump the version number like this:

```
    npm version patch -m "Version %s"
    git push
    git push --tags
```
_@ref:_ https://gist.github.com/mdb/4206372

Use `major` for a big release, `minor` for feature changes, `patch` for a quick fix. (Version `major`.`minor`.`patch`)