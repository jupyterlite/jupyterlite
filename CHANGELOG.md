# CHANGELOG

## v0.1.0a1 (Unreleased)

### `jupyter lite` CLI

- [#147] adds initial CLI tooling for building and extending JupyterLite sites

### pyolite

- [#145] adds initial pyolite widgets support
- [#129] adds initial pyolite plotly support

[#129]: https://github.com/jtpio/jupyterlite/pull/145
[#145]: https://github.com/jtpio/jupyterlite/pull/145
[#147]: https://github.com/jtpio/jupyterlite/pull/147

## [v0.1.0a0](https://github.com/jtpio/jupyterlite/releases/tag/v0.1.0a0)

([full changelog](https://github.com/jtpio/jupyterlite/compare/20c89112b481d520946608f3dcd17c09b5bbe372...v0.1.0a0))

## New features added

- Add support for checkpoints [#47](https://github.com/jtpio/jupyterlite/pull/47)
  ([@jtpio](https://github.com/jtpio))
- Add a p5.js kernel [#44](https://github.com/jtpio/jupyterlite/pull/44)
  ([@jtpio](https://github.com/jtpio))
- Add a JupyterLab Classic frontend [#33](https://github.com/jtpio/jupyterlite/pull/33)
  ([@jtpio](https://github.com/jtpio))
- Add support for theming scrollbars [#19](https://github.com/jtpio/jupyterlite/pull/19)
  ([@jtpio](https://github.com/jtpio))
- Add a Pyodide kernel [#14](https://github.com/jtpio/jupyterlite/pull/14)
  ([@jtpio](https://github.com/jtpio))

## Enhancements made

- Add CI job to create GitHub releases and upload assets
  [#117](https://github.com/jtpio/jupyterlite/pull/117)
  ([@jtpio](https://github.com/jtpio))
- Add vega extension, basic support for `altair`
  [#113](https://github.com/jtpio/jupyterlite/pull/113)
  ([@jtpio](https://github.com/jtpio))
- Support disabledExtensions [#102](https://github.com/jtpio/jupyterlite/pull/102)
  ([@bollwyvl](https://github.com/bollwyvl))
- Add more examples [#100](https://github.com/jtpio/jupyterlite/pull/100)
  ([@jtpio](https://github.com/jtpio))
- Support settings overrides, add basic tour
  [#98](https://github.com/jtpio/jupyterlite/pull/98)
  ([@bollwyvl](https://github.com/bollwyvl))
- Add user content [#94](https://github.com/jtpio/jupyterlite/pull/94)
  ([@bollwyvl](https://github.com/bollwyvl))
- add wordmark [#93](https://github.com/jtpio/jupyterlite/pull/93)
  ([@bollwyvl](https://github.com/bollwyvl))
- Filled-in logo icons [#92](https://github.com/jtpio/jupyterlite/pull/92)
  ([@bollwyvl](https://github.com/bollwyvl))
- federated extensions, webpack sharing, deploying/configuring docs
  [#58](https://github.com/jtpio/jupyterlite/pull/58)
  ([@bollwyvl](https://github.com/bollwyvl))
- First steps towards an improved Pyodide kernel
  [#57](https://github.com/jtpio/jupyterlite/pull/57)
  ([@jtpio](https://github.com/jtpio))
- Convert the web worker to TypeScript
  [#43](https://github.com/jtpio/jupyterlite/pull/43)
  ([@jtpio](https://github.com/jtpio))
- Add support for creating directories
  [#36](https://github.com/jtpio/jupyterlite/pull/36)
  ([@jtpio](https://github.com/jtpio))
- Set Pyodide as the default kernel [#29](https://github.com/jtpio/jupyterlite/pull/29)
  ([@jtpio](https://github.com/jtpio))
- Use localforage to store the settings
  [#28](https://github.com/jtpio/jupyterlite/pull/28)
  ([@jtpio](https://github.com/jtpio))
- Configure the Pyodide URL [#26](https://github.com/jtpio/jupyterlite/pull/26)
  ([@jtpio](https://github.com/jtpio))
- Store offline notebooks and files [#24](https://github.com/jtpio/jupyterlite/pull/24)
  ([@jtpio](https://github.com/jtpio))
- Basic session and contents management
  [#21](https://github.com/jtpio/jupyterlite/pull/21)
  ([@jtpio](https://github.com/jtpio))
- Add theme-darcula to the build [#12](https://github.com/jtpio/jupyterlite/pull/12)
  ([@jtpio](https://github.com/jtpio))
- Fix saving theme preference to the settings
  [#2](https://github.com/jtpio/jupyterlite/pull/2) ([@jtpio](https://github.com/jtpio))

## Bugs fixed

- Send iopub messages to all clients [#52](https://github.com/jtpio/jupyterlite/pull/52)
  ([@jtpio](https://github.com/jtpio))
- Add a simple sync primitive to process one kernel message at a time
  [#42](https://github.com/jtpio/jupyterlite/pull/42)
  ([@jtpio](https://github.com/jtpio))
- Do not show the "New Terminal" button in Classic
  [#37](https://github.com/jtpio/jupyterlite/pull/37)
  ([@jtpio](https://github.com/jtpio))
- Remove the IFrame on dispose [#32](https://github.com/jtpio/jupyterlite/pull/32)
  ([@jtpio](https://github.com/jtpio))
- Fix duplicate Theme entry in the settings
  [#8](https://github.com/jtpio/jupyterlite/pull/8) ([@jtpio](https://github.com/jtpio))

## Maintenance and upkeep improvements

- Add the logconsole extension [#123](https://github.com/jtpio/jupyterlite/pull/123)
  ([@jtpio](https://github.com/jtpio))
- Remove unused application package
  [#120](https://github.com/jtpio/jupyterlite/pull/120)
  ([@jtpio](https://github.com/jtpio))
- Add some jupyterlab renderers to the demo site
  [#115](https://github.com/jtpio/jupyterlite/pull/115)
  ([@jtpio](https://github.com/jtpio))
- Update yarn.lock with retrolab alpha 1 packages
  [#108](https://github.com/jtpio/jupyterlite/pull/108)
  ([@jtpio](https://github.com/jtpio))
- Drop Vercel deployment [#106](https://github.com/jtpio/jupyterlite/pull/106)
  ([@jtpio](https://github.com/jtpio))
- Update to `3.1.0-alpha.10` lab packages and retrolab
  [#89](https://github.com/jtpio/jupyterlite/pull/89)
  ([@jtpio](https://github.com/jtpio))
- Improve error handling in pyolite [#78](https://github.com/jtpio/jupyterlite/pull/78)
  ([@jtpio](https://github.com/jtpio))
- Fix node dev server for unslashed endpoints, vanity try URLs on docs, fix binder
  [#75](https://github.com/jtpio/jupyterlite/pull/75)
  ([@bollwyvl](https://github.com/bollwyvl))
- Add CI job to deploy to Vercel [#68](https://github.com/jtpio/jupyterlite/pull/68)
  ([@jtpio](https://github.com/jtpio))
- add stopgap http server with mime types from python
  [#62](https://github.com/jtpio/jupyterlite/pull/62)
  ([@bollwyvl](https://github.com/bollwyvl))
- Update to JupyterLab Classic 0.1.10
  [#56](https://github.com/jtpio/jupyterlite/pull/56)
  ([@jtpio](https://github.com/jtpio))
- Rename lab app to @jupyterlite/app-lab
  [#54](https://github.com/jtpio/jupyterlite/pull/54)
  ([@jtpio](https://github.com/jtpio))
- Handle extra slash with the classic opener
  [#53](https://github.com/jtpio/jupyterlite/pull/53)
  ([@jtpio](https://github.com/jtpio))
- Minor cleanup: align versions and remove unused file
  [#51](https://github.com/jtpio/jupyterlite/pull/51)
  ([@jtpio](https://github.com/jtpio))
- Update developer experience [#48](https://github.com/jtpio/jupyterlite/pull/48)
  ([@bollwyvl](https://github.com/bollwyvl))
- Move web worker to a separate file [#38](https://github.com/jtpio/jupyterlite/pull/38)
  ([@jtpio](https://github.com/jtpio))
- Add the cell tags extension [#25](https://github.com/jtpio/jupyterlite/pull/25)
  ([@jtpio](https://github.com/jtpio))
- Update to the latest pyodide alpha 0.17.0a2
  [#20](https://github.com/jtpio/jupyterlite/pull/20)
  ([@jtpio](https://github.com/jtpio))
- Split server components [#10](https://github.com/jtpio/jupyterlite/pull/10)
  ([@jtpio](https://github.com/jtpio))
- Add placeholder for tests [#5](https://github.com/jtpio/jupyterlite/pull/5)
  ([@jtpio](https://github.com/jtpio))
- Temporary mock of workspaces to handle page reloads
  [#4](https://github.com/jtpio/jupyterlite/pull/4) ([@jtpio](https://github.com/jtpio))

## Documentation improvements

- Mention the RTD preview in the contributing guide
  [#107](https://github.com/jtpio/jupyterlite/pull/107)
  ([@jtpio](https://github.com/jtpio))
- Update README.md [#87](https://github.com/jtpio/jupyterlite/pull/87)
  ([@RichardScottOZ](https://github.com/RichardScottOZ))
- Fix link to contributing guide in README.md
  [#82](https://github.com/jtpio/jupyterlite/pull/82)
  ([@jtpio](https://github.com/jtpio))
- Update README demo links to point to RTD
  [#72](https://github.com/jtpio/jupyterlite/pull/72)
  ([@jtpio](https://github.com/jtpio))
- Add TypeScript API documentation with typedoc
  [#69](https://github.com/jtpio/jupyterlite/pull/69)
  ([@bollwyvl](https://github.com/bollwyvl))
- Add docs build for ReadTheDocs [#64](https://github.com/jtpio/jupyterlite/pull/64)
  ([@bollwyvl](https://github.com/bollwyvl))
- update README correcting some typos and adding Basthon
  [#49](https://github.com/jtpio/jupyterlite/pull/49)
  ([@kikocorreoso](https://github.com/kikocorreoso))

## Other merged PRs

- Add list of federated extensions for the demo site
  [#84](https://github.com/jtpio/jupyterlite/pull/84)
  ([@jtpio](https://github.com/jtpio))
- Read settings url from the page config
  [#3](https://github.com/jtpio/jupyterlite/pull/3) ([@jtpio](https://github.com/jtpio))

## Contributors to this release

([GitHub contributors page for this release](https://github.com/jtpio/jupyterlite/graphs/contributors?from=2011-01-01&to=2021-06-02&type=c))

[@bollwyvl](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Abollwyvl+updated%3A2011-01-01..2021-06-02&type=Issues)
|
[@github-actions](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Agithub-actions+updated%3A2011-01-01..2021-06-02&type=Issues)
|
[@jtpio](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Ajtpio+updated%3A2011-01-01..2021-06-02&type=Issues)
|
[@kikocorreoso](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Akikocorreoso+updated%3A2011-01-01..2021-06-02&type=Issues)
|
[@lrowe](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Alrowe+updated%3A2011-01-01..2021-06-02&type=Issues)
|
[@psychemedia](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Apsychemedia+updated%3A2011-01-01..2021-06-02&type=Issues)
|
[@RichardScottOZ](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3ARichardScottOZ+updated%3A2011-01-01..2021-06-02&type=Issues)
|
[@vercel](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Avercel+updated%3A2011-01-01..2021-06-02&type=Issues)
