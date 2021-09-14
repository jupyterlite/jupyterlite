# CHANGELOG

<!-- <START NEW CHANGELOG ENTRY> -->

## 0.1.0a7

([Full Changelog](https://github.com/jupyterlite/jupyterlite/compare/v0.1.0a6...b8f942bd98db0a76b18bbe73b6d9bbada11d3e0a))

### New features added

- Add support for code consoles in Retro [#313](https://github.com/jupyterlite/jupyterlite/pull/313) ([@jtpio](https://github.com/jtpio))

### Enhancements made

- use parent header passed from worker [#307](https://github.com/jupyterlite/jupyterlite/pull/307) ([@madhur-tandon](https://github.com/madhur-tandon))
- use bytes for nested buffers [#280](https://github.com/jupyterlite/jupyterlite/pull/280) ([@madhur-tandon](https://github.com/madhur-tandon))
- Upgrade to Pyodide 0.18.0 [#274](https://github.com/jupyterlite/jupyterlite/pull/274) ([@bollwyvl](https://github.com/bollwyvl))

### Bugs fixed

- access header key after formatResult on whole object [#306](https://github.com/jupyterlite/jupyterlite/pull/306) ([@madhur-tandon](https://github.com/madhur-tandon))

### Maintenance and upkeep improvements

- Add Jupyter Releaser config [#319](https://github.com/jupyterlite/jupyterlite/pull/319) ([@jtpio](https://github.com/jtpio))
- Prevent calling "is_complete" from execution request [#304](https://github.com/jupyterlite/jupyterlite/pull/304) ([@martinRenou](https://github.com/martinRenou))
- Upgrade to JupyterLab 3.1.9, RetroLab 0.3.1 [#302](https://github.com/jupyterlite/jupyterlite/pull/302) ([@bollwyvl](https://github.com/bollwyvl))
- add CPython/PyPy 3.7 test excursions [#301](https://github.com/jupyterlite/jupyterlite/pull/301) ([@bollwyvl](https://github.com/bollwyvl))

### Documentation improvements

- Add ipyvuetify example notebook [#309](https://github.com/jupyterlite/jupyterlite/pull/309) ([@seidlr](https://github.com/seidlr))
-  rename --files to --contents [#295](https://github.com/jupyterlite/jupyterlite/pull/295) ([@nv2k3](https://github.com/nv2k3))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlite/jupyterlite/graphs/contributors?from=2021-07-24&to=2021-09-14&type=c))

[@bollwyvl](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Abollwyvl+updated%3A2021-07-24..2021-09-14&type=Issues) | [@datakurre](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Adatakurre+updated%3A2021-07-24..2021-09-14&type=Issues) | [@jtpio](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Ajtpio+updated%3A2021-07-24..2021-09-14&type=Issues) | [@madhur-tandon](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Amadhur-tandon+updated%3A2021-07-24..2021-09-14&type=Issues) | [@martinRenou](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3AmartinRenou+updated%3A2021-07-24..2021-09-14&type=Issues) | [@nv2k3](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Anv2k3+updated%3A2021-07-24..2021-09-14&type=Issues) | [@seidlr](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Aseidlr+updated%3A2021-07-24..2021-09-14&type=Issues)

<!-- <END NEW CHANGELOG ENTRY> -->

## v0.1.0a6

([full changelog](https://github.com/jupyterlite/jupyterlite/compare/v0.1.0a5...7365c39de145eee5a5d0ea66a9fe6b22198b3616))

### Enhancements made

- Rename --files to --contents, improve local default URLs
  [#292](https://github.com/jupyterlite/jupyterlite/pull/292)
  ([@bollwyvl](https://github.com/bollwyvl))
- fix syntax error showing in JS console
  [#290](https://github.com/jupyterlite/jupyterlite/pull/290)
  ([@madhur-tandon](https://github.com/madhur-tandon))
- Provide `IStateDB` in retro
  [#287](https://github.com/jupyterlite/jupyterlite/pull/287)
  ([@jtpio](https://github.com/jtpio))
- Make sure display_data always contain metadata
  [#269](https://github.com/jupyterlite/jupyterlite/pull/269)
  ([@martinRenou](https://github.com/martinRenou))
- Add RTC colors and usernames
  [#263](https://github.com/jupyterlite/jupyterlite/pull/263)
  ([@jtpio](https://github.com/jtpio))
- add input_request message protocol
  [#253](https://github.com/jupyterlite/jupyterlite/pull/253)
  ([@madhur-tandon](https://github.com/madhur-tandon))
- Support more sources of federated_extension
  [#238](https://github.com/jupyterlite/jupyterlite/pull/238)
  ([@bollwyvl](https://github.com/bollwyvl))

### Maintenance and upkeep improvements

- Update to RetroLab 0.3.0rc1
  [#289](https://github.com/jupyterlite/jupyterlite/pull/289)
  ([@jtpio](https://github.com/jtpio))
- Switch to the organization issue templates
  [#288](https://github.com/jupyterlite/jupyterlite/pull/288)
  ([@jtpio](https://github.com/jtpio))
- Update to jupyterlab 3.1.0rc2
  [#283](https://github.com/jupyterlite/jupyterlite/pull/283)
  ([@bollwyvl](https://github.com/bollwyvl))
- Pin jupyter widgets versions
  [#281](https://github.com/jupyterlite/jupyterlite/pull/281)
  ([@martinRenou](https://github.com/martinRenou))
- Fix possible typo [#272](https://github.com/jupyterlite/jupyterlite/pull/272)
  ([@SimonBiggs](https://github.com/SimonBiggs))
- Add author-email to pyproject.toml
  [#270](https://github.com/jupyterlite/jupyterlite/pull/270)
  ([@jtpio](https://github.com/jtpio))
- Add .eslintcache to the .gitignore
  [#268](https://github.com/jupyterlite/jupyterlite/pull/268)
  ([@jtpio](https://github.com/jtpio))
- Update ESLint dependencies [#240](https://github.com/jupyterlite/jupyterlite/pull/240)
  ([@jtpio](https://github.com/jtpio))
- Upgrade to JupyterLab 3.1.0rc1
  [#207](https://github.com/jupyterlite/jupyterlite/pull/207)
  ([@bollwyvl](https://github.com/bollwyvl))

### Documentation improvements

- Add the architecture diagram
  [#278](https://github.com/jupyterlite/jupyterlite/pull/278)
  ([@jtpio](https://github.com/jtpio))
- add index.html to serve message
  [#260](https://github.com/jupyterlite/jupyterlite/pull/260)
  ([@bollwyvl](https://github.com/bollwyvl))
- Add ipycytoscape to the example federated extensions
  [#257](https://github.com/jupyterlite/jupyterlite/pull/257)
  ([@jtpio](https://github.com/jtpio))
- Add ipycytoscape example [#256](https://github.com/jupyterlite/jupyterlite/pull/256)
  ([@marimeireles](https://github.com/marimeireles))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlite/jupyterlite/graphs/contributors?from=2021-07-13&to=2021-07-24&type=c))

[@bollwyvl](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Abollwyvl+updated%3A2021-07-13..2021-07-24&type=Issues)
|
[@jtpio](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Ajtpio+updated%3A2021-07-13..2021-07-24&type=Issues)
|
[@madhur-tandon](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Amadhur-tandon+updated%3A2021-07-13..2021-07-24&type=Issues)
|
[@marimeireles](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Amarimeireles+updated%3A2021-07-13..2021-07-24&type=Issues)
|
[@martinRenou](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3AmartinRenou+updated%3A2021-07-13..2021-07-24&type=Issues)
|
[@SimonBiggs](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3ASimonBiggs+updated%3A2021-07-13..2021-07-24&type=Issues)

## v0.1.0a5

([Full Changelog](https://github.com/jupyterlite/jupyterlite/compare/v0.1.0a4...1732344e565c0694b034a4de015231ea05d28e4b))

### Enhancements made

- add is_complete message protocol
  [#245](https://github.com/jupyterlite/jupyterlite/pull/245)
  ([@madhur-tandon](https://github.com/madhur-tandon))
- add inspect message [#243](https://github.com/jupyterlite/jupyterlite/pull/243)
  ([@madhur-tandon](https://github.com/madhur-tandon))
- Use importhook for patches [#239](https://github.com/jupyterlite/jupyterlite/pull/239)
  ([@dsblank](https://github.com/dsblank))
- Add patch for PIL.Image.Image._repr_png_
  [#226](https://github.com/jupyterlite/jupyterlite/pull/226)
  ([@dsblank](https://github.com/dsblank))
- ipython refactor [#216](https://github.com/jupyterlite/jupyterlite/pull/216)
  ([@madhur-tandon](https://github.com/madhur-tandon))
- Initial support for real time collaboration
  [#109](https://github.com/jupyterlite/jupyterlite/pull/109)
  ([@jtpio](https://github.com/jtpio))

### Bugs fixed

- Revert importhook for now [#250](https://github.com/jupyterlite/jupyterlite/pull/250)
  ([@jtpio](https://github.com/jtpio))

### Maintenance and upkeep improvements

- Remove the custom theme plugin
  [#205](https://github.com/jupyterlite/jupyterlite/pull/205)
  ([@jtpio](https://github.com/jtpio))

### Documentation improvements

- Add RELEASE.md [#246](https://github.com/jupyterlite/jupyterlite/pull/246)
  ([@jtpio](https://github.com/jtpio))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlite/jupyterlite/graphs/contributors?from=2021-07-08&to=2021-07-12&type=c))

[@bollwyvl](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Abollwyvl+updated%3A2021-07-08..2021-07-12&type=Issues)
|
[@dsblank](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Adsblank+updated%3A2021-07-08..2021-07-12&type=Issues)
|
[@jtpio](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Ajtpio+updated%3A2021-07-08..2021-07-12&type=Issues)
|
[@madhur-tandon](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Amadhur-tandon+updated%3A2021-07-08..2021-07-12&type=Issues)

## v0.1.0a4

([Full Changelog](https://github.com/jupyterlite/jupyterlite/compare/v0.1.0a3...b984c7528204a1d6506464de7dd62363d29ba830))

### Enhancements made

- Add ipympl example [#219](https://github.com/jupyterlite/jupyterlite/pull/219)
  ([@martinRenou](https://github.com/martinRenou))
- Refactor the kernel implementation
  [#214](https://github.com/jupyterlite/jupyterlite/pull/214)
  ([@martinRenou](https://github.com/martinRenou))

### Maintenance and upkeep improvements

- Skip serve tests on MacOS CI
  [#217](https://github.com/jupyterlite/jupyterlite/pull/217)
  ([@bollwyvl](https://github.com/bollwyvl))

### Documentation improvements

- Update links to point to the organization
  [#231](https://github.com/jupyterlite/jupyterlite/pull/231)
  ([@jtpio](https://github.com/jtpio))
- Add status section to the README
  [#230](https://github.com/jupyterlite/jupyterlite/pull/230)
  ([@jtpio](https://github.com/jtpio))
- Add docs to deploy on Netlify
  [#228](https://github.com/jupyterlite/jupyterlite/pull/228)
  ([@jtpio](https://github.com/jtpio))
- Cleanup the Plotly example [#220](https://github.com/jupyterlite/jupyterlite/pull/220)
  ([@jtpio](https://github.com/jtpio))
- Add ipympl example [#219](https://github.com/jupyterlite/jupyterlite/pull/219)
  ([@martinRenou](https://github.com/martinRenou))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlite/jupyterlite/graphs/contributors?from=2021-07-06&to=2021-07-08&type=c))

[@bollwyvl](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Abollwyvl+updated%3A2021-07-06..2021-07-08&type=Issues)
|
[@jtpio](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3Ajtpio+updated%3A2021-07-06..2021-07-08&type=Issues)
|
[@martinRenou](https://github.com/search?q=repo%3Ajupyterlite%2Fjupyterlite+involves%3AmartinRenou+updated%3A2021-07-06..2021-07-08&type=Issues)

## v0.1.0a3

([full changelog](https://github.com/jupyterlite/jupyterlite/compare/v0.1.0a2...2ff4cf17d57a514704b68a51fe05695ff888ac12))

### Enhancements made

- Hoist port and base_url to CLI
  [#212](https://github.com/jupyterlite/jupyterlite/pull/212)
  ([@bollwyvl](https://github.com/bollwyvl))
- Add `jupyterlab-kernelspy` to the demo site
  [#198](https://github.com/jupyterlite/jupyterlite/pull/198)
  ([@jtpio](https://github.com/jtpio))
- Use IPython in Pyolite kernel
  [#171](https://github.com/jupyterlite/jupyterlite/pull/171)
  ([@madhur-tandon](https://github.com/madhur-tandon))

### Bugs fixed

- Resolve absolute path of `out_dir`
  [#200](https://github.com/jupyterlite/jupyterlite/pull/200)
  ([@benabel](https://github.com/benabel))

### Maintenance and upkeep improvements

- move more path logic to traitlets
  [#206](https://github.com/jupyterlite/jupyterlite/pull/206)
  ([@bollwyvl](https://github.com/bollwyvl))
- Add tbump configuration to bump the jupyterlite Python package
  [#204](https://github.com/jupyterlite/jupyterlite/pull/204)
  ([@jtpio](https://github.com/jtpio))

### Documentation improvements

- DOC Deploy to gitlab pages [#203](https://github.com/jupyterlite/jupyterlite/pull/203)
  ([@benabel](https://github.com/benabel))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlite/jupyterlite/graphs/contributors?from=2021-06-30&to=2021-07-06&type=c))

[@benabel](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Abenabel+updated%3A2021-06-30..2021-07-06&type=Issues)
|
[@bollwyvl](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Abollwyvl+updated%3A2021-06-30..2021-07-06&type=Issues)
|
[@jtpio](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Ajtpio+updated%3A2021-06-30..2021-07-06&type=Issues)
|
[@madhur-tandon](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Amadhur-tandon+updated%3A2021-06-30..2021-07-06&type=Issues)
|
[@martinRenou](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3AmartinRenou+updated%3A2021-06-30..2021-07-06&type=Issues)

## v0.1.0a2

([full changelog](https://github.com/jupyterlite/jupyterlite/compare/v0.1.0a1...c8cbb818598435d5fb101ac0cfda29e135388fe4))

### Enhancements made

- Add JupyterLab Miami Nights theme to the demo site, fix theme unloading
  [#180](https://github.com/jupyterlite/jupyterlite/pull/180)
  ([@jtpio](https://github.com/jtpio))

### Bugs fixed

- Handle copying multiple themes
  [#190](https://github.com/jupyterlite/jupyterlite/pull/190)
  ([@jtpio](https://github.com/jtpio))
- Add JupyterLab Miami Nights theme to the demo site, fix theme unloading
  [#180](https://github.com/jupyterlite/jupyterlite/pull/180)
  ([@jtpio](https://github.com/jtpio))

### Maintenance and upkeep improvements

- Update doit default tasks, upload demo app, contributing docs
  [#188](https://github.com/jupyterlite/jupyterlite/pull/188)
  ([@bollwyvl](https://github.com/bollwyvl))
- improve python distribution artifacts
  [#184](https://github.com/jupyterlite/jupyterlite/pull/184)
  ([@bollwyvl](https://github.com/bollwyvl))

### Documentation improvements

- Add screencasts to the README
  [#191](https://github.com/jupyterlite/jupyterlite/pull/191)
  ([@jtpio](https://github.com/jtpio))
- Add link to the demo GitHub Pages repo
  [#189](https://github.com/jupyterlite/jupyterlite/pull/189)
  ([@jtpio](https://github.com/jtpio))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlite/jupyterlite/graphs/contributors?from=2021-06-28&to=2021-06-30&type=c))

[@bollwyvl](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Abollwyvl+updated%3A2021-06-28..2021-06-30&type=Issues)
|
[@jtpio](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Ajtpio+updated%3A2021-06-28..2021-06-30&type=Issues)

## v0.1.0a1

([full changelog](https://github.com/jupyterlite/jupyterlite/compare/v0.1.0a0...da6f39fa9e15bc1d842faa096edded9f57579661))

### New features added

- Try ipycanvas in Pyolite [#159](https://github.com/jupyterlite/jupyterlite/pull/159)
  ([@martinRenou](https://github.com/martinRenou))
- Try ipyleaflet [#156](https://github.com/jupyterlite/jupyterlite/pull/156)
  ([@martinRenou](https://github.com/martinRenou))
- Start python CLI package (alternate)
  [#147](https://github.com/jupyterlite/jupyterlite/pull/147)
  ([@bollwyvl](https://github.com/bollwyvl))
- Support for Comms in the pyolite kernel
  [#145](https://github.com/jupyterlite/jupyterlite/pull/145)
  ([@martinRenou](https://github.com/martinRenou))
- Support for Completion in the pyolite kernel
  [#142](https://github.com/jupyterlite/jupyterlite/pull/142)
  ([@martinRenou](https://github.com/martinRenou))
- example notebook - folium interactive map package
  [#133](https://github.com/jupyterlite/jupyterlite/pull/133)
  ([@psychemedia](https://github.com/psychemedia))
- Add plotly [#129](https://github.com/jupyterlite/jupyterlite/pull/129)
  ([@jtpio](https://github.com/jtpio))

### Enhancements made

- Update to Plotly 5.0.0 final on the demo site
  [#164](https://github.com/jupyterlite/jupyterlite/pull/164)
  ([@jtpio](https://github.com/jtpio))
- Try ipycanvas in Pyolite [#159](https://github.com/jupyterlite/jupyterlite/pull/159)
  ([@martinRenou](https://github.com/martinRenou))
- Try ipyleaflet [#156](https://github.com/jupyterlite/jupyterlite/pull/156)
  ([@martinRenou](https://github.com/martinRenou))
- Start python CLI package (alternate)
  [#147](https://github.com/jupyterlite/jupyterlite/pull/147)
  ([@bollwyvl](https://github.com/bollwyvl))
- Support for Comms in the pyolite kernel
  [#145](https://github.com/jupyterlite/jupyterlite/pull/145)
  ([@martinRenou](https://github.com/martinRenou))
- Support for Completion in the pyolite kernel
  [#142](https://github.com/jupyterlite/jupyterlite/pull/142)
  ([@martinRenou](https://github.com/martinRenou))
- Add a JupyterLite About Dialog
  [#140](https://github.com/jupyterlite/jupyterlite/pull/140)
  ([@jtpio](https://github.com/jtpio))
- example notebook - folium interactive map package
  [#133](https://github.com/jupyterlite/jupyterlite/pull/133)
  ([@psychemedia](https://github.com/psychemedia))
- Add plotly [#129](https://github.com/jupyterlite/jupyterlite/pull/129)
  ([@jtpio](https://github.com/jtpio))

### Bugs fixed

- fix up copy, rename, delete for directories
  [#173](https://github.com/jupyterlite/jupyterlite/pull/173)
  ([@bollwyvl](https://github.com/bollwyvl))
- Pyolite: Fix Matplotlib [#162](https://github.com/jupyterlite/jupyterlite/pull/162)
  ([@martinRenou](https://github.com/martinRenou))
- Fix downloading from the filebrowser
  [#143](https://github.com/jupyterlite/jupyterlite/pull/143)
  ([@jtpio](https://github.com/jtpio))
- Disable `nameFileOnSave` on the demo site
  [#136](https://github.com/jupyterlite/jupyterlite/pull/136)
  ([@jtpio](https://github.com/jtpio))

### Maintenance and upkeep improvements

- Make the Changelog compatible with Jupyter Releaser
  [#179](https://github.com/jupyterlite/jupyterlite/pull/179)
  ([@jtpio](https://github.com/jtpio))
- Add name to the top-level `package.json`
  [#177](https://github.com/jupyterlite/jupyterlite/pull/177)
  ([@jtpio](https://github.com/jtpio))
- add --user for initial pip install in CI
  [#175](https://github.com/jupyterlite/jupyterlite/pull/175)
  ([@bollwyvl](https://github.com/bollwyvl))
- Split up CI into multiple jobs, test on more platforms
  [#172](https://github.com/jupyterlite/jupyterlite/pull/172)
  ([@bollwyvl](https://github.com/bollwyvl))
- Investigate RTD build issues
  [#170](https://github.com/jupyterlite/jupyterlite/pull/170)
  ([@bollwyvl](https://github.com/bollwyvl))
- Update labels used in the template issues
  [#166](https://github.com/jupyterlite/jupyterlite/pull/166)
  ([@jtpio](https://github.com/jtpio))
- Move console.log inside worker
  [#157](https://github.com/jupyterlite/jupyterlite/pull/157)
  ([@martinRenou](https://github.com/martinRenou))
- Add docstrings to the worker
  [#144](https://github.com/jupyterlite/jupyterlite/pull/144)
  ([@jtpio](https://github.com/jtpio))
- add chunkHashname with contenthash in webpack
  [#138](https://github.com/jupyterlite/jupyterlite/pull/138)
  ([@bollwyvl](https://github.com/bollwyvl))
- Fix typos/broken link in example notebook
  [#135](https://github.com/jupyterlite/jupyterlite/pull/135)
  ([@psychemedia](https://github.com/psychemedia))
- Format the folium example [#134](https://github.com/jupyterlite/jupyterlite/pull/134)
  ([@jtpio](https://github.com/jtpio))
- Add ui-components package [#130](https://github.com/jupyterlite/jupyterlite/pull/130)
  ([@jtpio](https://github.com/jtpio))
- Update to JupyterLab alpha 11 packages
  [#128](https://github.com/jupyterlite/jupyterlite/pull/128)
  ([@jtpio](https://github.com/jtpio))
- Build checksums [#126](https://github.com/jupyterlite/jupyterlite/pull/126)
  ([@jtpio](https://github.com/jtpio))

### Documentation improvements

- Add changelog for `v0.1.0a0`
  [#169](https://github.com/jupyterlite/jupyterlite/pull/169)
  ([@jtpio](https://github.com/jtpio))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlite/jupyterlite/graphs/contributors?from=2021-06-02&to=2021-06-28&type=c))

[@benbovy](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Abenbovy+updated%3A2021-06-02..2021-06-28&type=Issues)
|
[@bollwyvl](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Abollwyvl+updated%3A2021-06-02..2021-06-28&type=Issues)
|
[@davidbrochart](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Adavidbrochart+updated%3A2021-06-02..2021-06-28&type=Issues)
|
[@jtpio](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Ajtpio+updated%3A2021-06-02..2021-06-28&type=Issues)
|
[@martinRenou](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3AmartinRenou+updated%3A2021-06-02..2021-06-28&type=Issues)
|
[@psychemedia](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Apsychemedia+updated%3A2021-06-02..2021-06-28&type=Issues)

## v0.1.0a0

([full changelog](https://github.com/jupyterlite/jupyterlite/compare/20c89112b481d520946608f3dcd17c09b5bbe372...v0.1.0a0))

## New features added

- Add support for checkpoints [#47](https://github.com/jupyterlite/jupyterlite/pull/47)
  ([@jtpio](https://github.com/jtpio))
- Add a p5.js kernel [#44](https://github.com/jupyterlite/jupyterlite/pull/44)
  ([@jtpio](https://github.com/jtpio))
- Add a JupyterLab Classic frontend
  [#33](https://github.com/jupyterlite/jupyterlite/pull/33)
  ([@jtpio](https://github.com/jtpio))
- Add support for theming scrollbars
  [#19](https://github.com/jupyterlite/jupyterlite/pull/19)
  ([@jtpio](https://github.com/jtpio))
- Add a Pyodide kernel [#14](https://github.com/jupyterlite/jupyterlite/pull/14)
  ([@jtpio](https://github.com/jtpio))

## Enhancements made

- Add CI job to create GitHub releases and upload assets
  [#117](https://github.com/jupyterlite/jupyterlite/pull/117)
  ([@jtpio](https://github.com/jtpio))
- Add vega extension, basic support for `altair`
  [#113](https://github.com/jupyterlite/jupyterlite/pull/113)
  ([@jtpio](https://github.com/jtpio))
- Support disabledExtensions [#102](https://github.com/jupyterlite/jupyterlite/pull/102)
  ([@bollwyvl](https://github.com/bollwyvl))
- Add more examples [#100](https://github.com/jupyterlite/jupyterlite/pull/100)
  ([@jtpio](https://github.com/jtpio))
- Support settings overrides, add basic tour
  [#98](https://github.com/jupyterlite/jupyterlite/pull/98)
  ([@bollwyvl](https://github.com/bollwyvl))
- Add user content [#94](https://github.com/jupyterlite/jupyterlite/pull/94)
  ([@bollwyvl](https://github.com/bollwyvl))
- add wordmark [#93](https://github.com/jupyterlite/jupyterlite/pull/93)
  ([@bollwyvl](https://github.com/bollwyvl))
- Filled-in logo icons [#92](https://github.com/jupyterlite/jupyterlite/pull/92)
  ([@bollwyvl](https://github.com/bollwyvl))
- federated extensions, webpack sharing, deploying/configuring docs
  [#58](https://github.com/jupyterlite/jupyterlite/pull/58)
  ([@bollwyvl](https://github.com/bollwyvl))
- First steps towards an improved Pyodide kernel
  [#57](https://github.com/jupyterlite/jupyterlite/pull/57)
  ([@jtpio](https://github.com/jtpio))
- Convert the web worker to TypeScript
  [#43](https://github.com/jupyterlite/jupyterlite/pull/43)
  ([@jtpio](https://github.com/jtpio))
- Add support for creating directories
  [#36](https://github.com/jupyterlite/jupyterlite/pull/36)
  ([@jtpio](https://github.com/jtpio))
- Set Pyodide as the default kernel
  [#29](https://github.com/jupyterlite/jupyterlite/pull/29)
  ([@jtpio](https://github.com/jtpio))
- Use localforage to store the settings
  [#28](https://github.com/jupyterlite/jupyterlite/pull/28)
  ([@jtpio](https://github.com/jtpio))
- Configure the Pyodide URL [#26](https://github.com/jupyterlite/jupyterlite/pull/26)
  ([@jtpio](https://github.com/jtpio))
- Store offline notebooks and files
  [#24](https://github.com/jupyterlite/jupyterlite/pull/24)
  ([@jtpio](https://github.com/jtpio))
- Basic session and contents management
  [#21](https://github.com/jupyterlite/jupyterlite/pull/21)
  ([@jtpio](https://github.com/jtpio))
- Add theme-darcula to the build
  [#12](https://github.com/jupyterlite/jupyterlite/pull/12)
  ([@jtpio](https://github.com/jtpio))
- Fix saving theme preference to the settings
  [#2](https://github.com/jupyterlite/jupyterlite/pull/2)
  ([@jtpio](https://github.com/jtpio))

## Bugs fixed

- Send iopub messages to all clients
  [#52](https://github.com/jupyterlite/jupyterlite/pull/52)
  ([@jtpio](https://github.com/jtpio))
- Add a simple sync primitive to process one kernel message at a time
  [#42](https://github.com/jupyterlite/jupyterlite/pull/42)
  ([@jtpio](https://github.com/jtpio))
- Do not show the "New Terminal" button in Classic
  [#37](https://github.com/jupyterlite/jupyterlite/pull/37)
  ([@jtpio](https://github.com/jtpio))
- Remove the IFrame on dispose [#32](https://github.com/jupyterlite/jupyterlite/pull/32)
  ([@jtpio](https://github.com/jtpio))
- Fix duplicate Theme entry in the settings
  [#8](https://github.com/jupyterlite/jupyterlite/pull/8)
  ([@jtpio](https://github.com/jtpio))

## Maintenance and upkeep improvements

- Add the logconsole extension
  [#123](https://github.com/jupyterlite/jupyterlite/pull/123)
  ([@jtpio](https://github.com/jtpio))
- Remove unused application package
  [#120](https://github.com/jupyterlite/jupyterlite/pull/120)
  ([@jtpio](https://github.com/jtpio))
- Add some jupyterlab renderers to the demo site
  [#115](https://github.com/jupyterlite/jupyterlite/pull/115)
  ([@jtpio](https://github.com/jtpio))
- Update yarn.lock with retrolab alpha 1 packages
  [#108](https://github.com/jupyterlite/jupyterlite/pull/108)
  ([@jtpio](https://github.com/jtpio))
- Drop Vercel deployment [#106](https://github.com/jupyterlite/jupyterlite/pull/106)
  ([@jtpio](https://github.com/jtpio))
- Update to `3.1.0-alpha.10` lab packages and retrolab
  [#89](https://github.com/jupyterlite/jupyterlite/pull/89)
  ([@jtpio](https://github.com/jtpio))
- Improve error handling in pyolite
  [#78](https://github.com/jupyterlite/jupyterlite/pull/78)
  ([@jtpio](https://github.com/jtpio))
- Fix node dev server for unslashed endpoints, vanity try URLs on docs, fix binder
  [#75](https://github.com/jupyterlite/jupyterlite/pull/75)
  ([@bollwyvl](https://github.com/bollwyvl))
- Add CI job to deploy to Vercel
  [#68](https://github.com/jupyterlite/jupyterlite/pull/68)
  ([@jtpio](https://github.com/jtpio))
- add stopgap http server with mime types from python
  [#62](https://github.com/jupyterlite/jupyterlite/pull/62)
  ([@bollwyvl](https://github.com/bollwyvl))
- Update to JupyterLab Classic 0.1.10
  [#56](https://github.com/jupyterlite/jupyterlite/pull/56)
  ([@jtpio](https://github.com/jtpio))
- Rename lab app to @jupyterlite/app-lab
  [#54](https://github.com/jupyterlite/jupyterlite/pull/54)
  ([@jtpio](https://github.com/jtpio))
- Handle extra slash with the classic opener
  [#53](https://github.com/jupyterlite/jupyterlite/pull/53)
  ([@jtpio](https://github.com/jtpio))
- Minor cleanup: align versions and remove unused file
  [#51](https://github.com/jupyterlite/jupyterlite/pull/51)
  ([@jtpio](https://github.com/jtpio))
- Update developer experience [#48](https://github.com/jupyterlite/jupyterlite/pull/48)
  ([@bollwyvl](https://github.com/bollwyvl))
- Move web worker to a separate file
  [#38](https://github.com/jupyterlite/jupyterlite/pull/38)
  ([@jtpio](https://github.com/jtpio))
- Add the cell tags extension [#25](https://github.com/jupyterlite/jupyterlite/pull/25)
  ([@jtpio](https://github.com/jtpio))
- Update to the latest pyodide alpha 0.17.0a2
  [#20](https://github.com/jupyterlite/jupyterlite/pull/20)
  ([@jtpio](https://github.com/jtpio))
- Split server components [#10](https://github.com/jupyterlite/jupyterlite/pull/10)
  ([@jtpio](https://github.com/jtpio))
- Add placeholder for tests [#5](https://github.com/jupyterlite/jupyterlite/pull/5)
  ([@jtpio](https://github.com/jtpio))
- Temporary mock of workspaces to handle page reloads
  [#4](https://github.com/jupyterlite/jupyterlite/pull/4)
  ([@jtpio](https://github.com/jtpio))

## Documentation improvements

- Mention the RTD preview in the contributing guide
  [#107](https://github.com/jupyterlite/jupyterlite/pull/107)
  ([@jtpio](https://github.com/jtpio))
- Update README.md [#87](https://github.com/jupyterlite/jupyterlite/pull/87)
  ([@RichardScottOZ](https://github.com/RichardScottOZ))
- Fix link to contributing guide in README.md
  [#82](https://github.com/jupyterlite/jupyterlite/pull/82)
  ([@jtpio](https://github.com/jtpio))
- Update README demo links to point to RTD
  [#72](https://github.com/jupyterlite/jupyterlite/pull/72)
  ([@jtpio](https://github.com/jtpio))
- Add TypeScript API documentation with typedoc
  [#69](https://github.com/jupyterlite/jupyterlite/pull/69)
  ([@bollwyvl](https://github.com/bollwyvl))
- Add docs build for ReadTheDocs
  [#64](https://github.com/jupyterlite/jupyterlite/pull/64)
  ([@bollwyvl](https://github.com/bollwyvl))
- update README correcting some typos and adding Basthon
  [#49](https://github.com/jupyterlite/jupyterlite/pull/49)
  ([@kikocorreoso](https://github.com/kikocorreoso))

## Other merged PRs

- Add list of federated extensions for the demo site
  [#84](https://github.com/jupyterlite/jupyterlite/pull/84)
  ([@jtpio](https://github.com/jtpio))
- Read settings url from the page config
  [#3](https://github.com/jupyterlite/jupyterlite/pull/3)
  ([@jtpio](https://github.com/jtpio))

## Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlite/jupyterlite/graphs/contributors?from=2021-03-27&to=2021-06-02&type=c))

[@bollwyvl](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Abollwyvl+updated%3A2021-03-27..2021-06-02&type=Issues)
|
[@github-actions](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Agithub-actions+updated%3A2021-03-27..2021-06-02&type=Issues)
|
[@jtpio](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Ajtpio+updated%3A2021-03-27..2021-06-02&type=Issues)
|
[@kikocorreoso](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Akikocorreoso+updated%3A2021-03-27..2021-06-02&type=Issues)
|
[@lrowe](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Alrowe+updated%3A2021-03-27..2021-06-02&type=Issues)
|
[@psychemedia](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Apsychemedia+updated%3A2021-03-27..2021-06-02&type=Issues)
|
[@RichardScottOZ](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3ARichardScottOZ+updated%3A2021-03-27..2021-06-02&type=Issues)
|
[@vercel](https://github.com/search?q=repo%3Ajtpio%2Fjupyterlite+involves%3Avercel+updated%3A2021-03-27..2021-06-02&type=Issues)
