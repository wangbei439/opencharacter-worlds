# Dependency and reference policy

- Do not copy or translate SillyTavern AGPL source into this repository. Its public documentation may be consulted for observable behavior and interchange formats. Implement independently; do not vendor its scripts or extension code.
- Before adding/upgrading a dependency, record its exact version, declared SPDX license, source, reason, alternatives, and relevant license/notice files. Review transitive changes as well. Prefer MIT, Apache-2.0, BSD, ISC and 0BSD.
- `dependency-licenses.json` is the existing lockfile inventory, not retrospective proof of approval or permission. Nonpreferred/unknown entries stay flagged. `npm run check:licenses` rejects unrecorded changes and AGPL package declarations. It does not replace source/notice review or prove absence of copied code.
- This feature change introduces no new packages and changes no locked dependency versions.

## Existing dependencies requiring attention

The current lock includes Sharp/libvips platform packages with LGPL-3.0-or-later, Lightning CSS packages with MPL-2.0, caniuse-lite data with CC-BY-4.0, and packages declaring BlueOak-1.0.0. Exact versions and dependency locations are in the JSON inventory. Direct packages declare MIT or Apache-2.0. These declarations alone do not establish redistribution compliance. Before distributing native runtimes or a packaged desktop/server product, inspect its actual included files, license texts and required notices; do not assume a browser-only build has the same dependency contents as node_modules.

## Behavior references for the writing controls

- https://docs.sillytavern.app/usage/core-concepts/authors-note/
- https://docs.sillytavern.app/usage/core-concepts/macros/

Only public behavior/format documentation was consulted for these controls; no source code, screenshots or documentation passages were copied into the implementation. Our presets and note-depth semantics are documented separately and do not claim full SillyTavern preset/script compatibility.
