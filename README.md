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
