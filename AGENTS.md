# Implementation and dependency rules

- Implement independently. Never copy, translate, or vendor SillyTavern AGPL source or extensions. Public behavior and format documentation may be referenced.
- Before introducing or upgrading any third-party dependency, follow `docs/DEPENDENCY-POLICY.md`: record exact version, license, source, rationale, alternatives and license/notice files, including transitive changes. Prefer MIT / Apache-2.0 / BSD and similarly permissive licenses.
- Run `npm run check:licenses` for dependency changes. Existing inventory entries are not proof of redistribution compliance.
- Preserve users' original character files, saved worlds and credentials. Use isolated fixture providers for automated UI tests.
