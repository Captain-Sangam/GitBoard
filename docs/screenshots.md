# Screenshots and branding

The README uses a centered product mark, a short introduction and an actual app screenshot. Keep public imagery accurate, and link to focused guides under `docs/` for setup and operation.

## Image provenance

These images were captured from the open-source GitBoard app on 2026-10-19. The app ran locally against a separate PostgreSQL 16 demo database. All contributors, repositories and pull requests are fictional; the images do not show company data or product adoption statistics.

| File | View | Capture details |
| --- | --- | --- |
| [`dashboard.png`](images/dashboard.png) | Monthly team activity | Dark mode; October 2026 totals and eight fictional contributors |
| [`yearly-leaderboard.png`](images/yearly-leaderboard.png) | Yearly totals and top-three podium | Light mode; top portion of the yearly page |
| [`contributor-highlights.png`](images/contributor-highlights.png) | All-time contribution detail | Light mode; cropped below the optional AI banner |

The dataset contains eight fictional contributors, eight demo repositories and 4,312 fictional merged PRs spanning January 2025 through October 2026. `DATABASE_URL` was overridden for the isolated demo and `AI_API_KEY` was empty. No GitHub ingestion jobs or external AI generation ran during capture.

Images are cropped captures of the real interface. Their numbers illustrate the available views, not the quality or productivity of any real person.

## Updating screenshots

1. Run the open-source app against an isolated database with fictional data and the required schema.
2. Override `DATABASE_URL` explicitly and leave `AI_API_KEY` empty. Do not run ingestion against a real organization for public imagery.
3. Capture the monthly dashboard, yearly podium and contributor Highlights in the actual UI. Ensure all data has loaded before capturing.
4. Save images under `docs/images/`. Crop surrounding empty space when useful, preserve relevant context and identify cropped details in the caption.
5. Update the README alt text, captions and this provenance record when the images change. Check the rendered README and relative image links before submitting.

## Logo

[`logo.svg`](../logo.svg) is the lightweight Branch Bars symbol selected by the maintainer from six generated concepts. Three ascending rounded bars are connected by a commit path in a rose palette. [`logo.png`](../logo.png) retains the original generated artwork with the GitBoard wordmark.

The concepts were generated with the built-in imagegen tool; the SVG is a native vector adaptation of the selected symbol. Use the SVG for the README's small centered mark and the PNG when the original wordmark presentation is appropriate.
