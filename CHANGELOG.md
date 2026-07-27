# APBS Data Finder — Version History

This document records application-facing releases. Use semantic versioning:

- **MAJOR** (`X.0.0`): incompatible changes to user workflows, data contracts, or access behavior.
- **MINOR** (`0.X.0`): backward-compatible features.
- **PATCH** (`0.1.X`): backward-compatible fixes, data-configuration corrections, and visual refinements.

## Release checklist

For every release:

1. Update `APP_CONFIG.appVersion` in `Config.js`.
2. Update the footer release label in `Code.js`.
3. Add a dated entry below describing user-visible changes.
4. Push the latest source to Apps Script HEAD.
5. Create a versioned Apps Script deployment only after acceptance testing.
6. Commit and tag the matching Git release when approved.

## [0.2.1] — 2026-07-27

### Changed

- Removed unit-filter controls for non-admin users; each search now covers their complete server-authorized data scope by default.
- Added a full-screen animated search-progress overlay that clearly identifies the APBS query in progress.

## [0.2.0] — 2026-07-27

### Added

- Server-enforced, email-based role-based access control for the supplied staff roster.
- Automatic access to APBS data for each staff member's assigned unit only; no manual unit selection can expand server-side access.
- Unit-aware interface that identifies the permitted APBS unit and removes irrelevant unit filters for single-unit users.
- Administrator access for `ian.ahmad@millennia21.id`, `faisal@millennia21.id`, and `mahrukh@millennia21.id` across the full APBS database.
- Shared school-level SHIELD access: Kindergarten staff can access TK sections, Elementary staff can access SD sections, and Junior High staff can access SMP sections.

### Changed

- Replaced the v0.1.0 temporary all-units tester permission with the staff access registry.
- Corrected SHIELD TK source ranges to include `197–211` (Project Baru – Unit TK) and `370–400` (Kebutuhan Kelas TK).

## [0.1.0] — 2026-07-27

Initial working version of the APBS search web app.

### Added

- Read-only APBS lookup across the ten configured unit tabs.
- Server-side search by APBS name and normalized APBS number.
- Unit filters and result ranking.
- Total budget (`CO`) and remaining budget (`CR`) display.
- Duplicate-name context using structured sheet metadata and heading inference.
- Row-whitelist configuration for 1,395 source rows, with non-APBS headings automatically excluded.
- Per-unit caching and a configuration validation utility.
- Authenticated-user scaffold for the planned role-based access rollout.
- Responsive MWS-aligned search interface with loading, empty, error, and no-results states.

### Data configuration

- Corrected the Junior High source range from `372-273` to `372-373`.
- The current reference dataset contains three configured non-searchable rows without valid APBS numbers; they are safely excluded by validation.

### Deployment

- Initial versioned Apps Script deployment was created.
- The development `/dev` URL is the current test target and runs latest Apps Script HEAD.
