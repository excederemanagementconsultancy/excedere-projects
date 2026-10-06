# Excedere Projects

A GitHub Pages project-management MVP using plain HTML, CSS, JavaScript and browser localStorage. No build step or backend is required.

## Working features

- Current Focus fields and manual overall progress.
- Project tasks and Quick Capture tasks in one main Tasks view, with project filtering.
- Edit, complete, reopen, and confirmed soft deletion. Completed tasks retain their notes and completion date. Deleted items can be restored from Settings.
- Persistent milestones, project notes and ideas.
- Calendar agenda by month, using task and milestone due dates.
- Dashboard counts, priorities, latest ideas and Excedere Projects progress based on saved data.
- Settings backup export and Recently deleted recovery.

## Data and migration

Data stays in this browser profile on this device. There is no account sync. Production data belongs to the GitHub Pages origin; localhost tests use separate storage.

The original focus keys are retained. Legacy `excedereProjectTasks` string arrays are migrated into objects with stable IDs. Exact original list values are copied to a `BackupV1` key before their first replacement. Existing `excedereCaptures` remain in their original key and are integrated with tasks and ideas. Malformed or unsupported stored lists are not overwritten.

The original static project tasks and milestone roadmap are retained once as editable records. Reopening removes the current completion date; this MVP is not a full audit log. Other project cards open filtered task lists rather than separate full workspaces.

Use Settings to export a JSON backup before clearing browser data or changing devices. Automatic backup import is not implemented. Keep the downloaded file for manual recovery. Deleted items are retained until browser storage is cleared.

## Local preview and checks

Serve this folder with a static server, for example `python3 -m http.server 8765`, and visit `http://localhost:8765`.

Run storage regression tests with `node --test tests/storage.test.cjs`. They cover duplicate legacy names, literal HTML strings, backup preservation, completion and restoration, malformed data, quota errors and reading current state before writes.

Browser validation covered create/edit/complete/reopen/restore, cancellation of deletion, notes and ideas persistence, dated calendar entries, Quick Capture, task filtering, progress validation and all navigation routes. Main views were checked at 320, 390, 800, 1024 and 1440 pixels; workspace views at 320, 800 and 1440 pixels. No horizontal overflow or JavaScript console errors were found in the final checks.

## Deployment

Publish the root of the repository through GitHub Pages. Keep `index.html`, `styles.css`, `app.js`, `storage.js` and `features.js` together. No user data is included in the repository.

## Temporary branded sign-in

The sign-in screen uses the existing Projects logo and palette. Enter any valid email with the public demo password `projects-demo`. This is only a temporary interface gate, not secure authentication, account creation, encryption, or access control. All emails open the same local workspace. Never enter a real password.

`auth-provider.js` exposes asynchronous `getSession`, `signIn`, `signOut`, and `requestPasswordReset` methods. `auth.js` handles presentation separately, and `auth.css` scopes the sign-in styles. A future backend must replace the adapter with server-verified sessions, enforce authorization on every data request, and introduce per-user storage before enabling multiple accounts. Existing browser data must be explicitly assigned or imported with the owner's consent at that time.

Remember me uses localStorage; otherwise the demo session uses sessionStorage. Only a versioned demo marker is saved under `ExcedereProjectsDemoSessionV1`. Neither email nor password is stored or transmitted. Sign-out removes only this marker from both stores. Password help explains the demo password without claiming to send email. Existing project keys, migrations, backup format, feature code and sidebar logo styling are unchanged. The uppercase session namespace is excluded from existing project exports.

Publish `auth.css`, `auth.js`, and `auth-provider.js` alongside the existing files. Run `node --test tests/*.test.cjs` for all 12 storage and authentication checks.

### Sign-in regression verification (2026-09-28)

- Passed all 12 automated storage/session tests, including byte-for-byte data preservation on sign-out, malformed sessions, storage errors, Remember me, session-only lifetime, and absence of saved passwords/email.
- Browser-tested password help, invalid password, sign-in, Remember me reload, sign-out/reload, and saved task persistence after signing in again.
- Browser-tested Today counts, all seven navigation views, Projects workspace/back navigation, Quick Capture task creation, dated Calendar task, Complete/Reopen, deletion cancellation, Recently deleted/Restore, Ideas creation, milestones, project notes, project task creation and progress editing.
- No horizontal overflow in seven main views at 320, 390, 800, 1024 and 1440 pixels; four workspace views at 320, 800 and 1440; sign-in at all five widths. No browser console warnings/errors in the checked local session.
- Export backup was invoked in local previews. The in-app browser did not expose a download event; downloaded-file verification remains environment-limited. Export implementation is unchanged and tests confirm the new auth marker is excluded by its existing prefix filter.
- All test records were created on localhost, separate from production browser storage.

<!-- trigger Pages deployment -->
