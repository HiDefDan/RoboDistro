# Disguise Content Management — Reference for RoboDistro

Source: https://help.disguise.one/designer/content-management/content-management-overview

---

## Content Version Control

Disguise understands version tags in video filenames and automatically manages replacements. This directly affects how RoboDistro should name and distribute files.

- Version tag format: `_vXXX` (where XXX is one or more numerals, optionally followed by a letter)
  - Example: `MyVideo_v1.mov`, `MyVideo_v2.mov`, `MyVideo_v3a.mov`
- New content versions can be copied to actors **while the software is running**, as long as the file being replaced is not currently playing.
- When a new version of a file arrives, Designer **automatically replaces older versions on the timeline** wherever they occur — no manual re-linking needed.
- Any asset can be dropped back to an older version instantly.
- Once content arrives on a machine it becomes **available instantly** — no refresh required.
- If content is unavailable on actors, Designer warns by colouring layers on the timeline:
  - **Yellow** = wrong version present
  - **Red** = no content found

> **RoboDistro implication:** Preserve `_vXXX` tags exactly as-is when mirroring. Do not strip or rename version suffixes during copy operations.

---

## Proxy Management

Low-resolution proxy files allow large show sequences to be edited on lower-spec machines (e.g. laptops).

- Proxy filename format: append `_proxyXYZ` to the video filename (e.g. `MyVideo_v1_proxy1.mov`)
- Higher XYZ numbers indicate **lower** resolution proxies.
- Designer selects which proxy level to display based on camera/view position and zoom level.

> **RoboDistro implication:** When distributing content, proxy files must accompany their full-res counterparts. The `_proxyXYZ` suffix must be preserved exactly.

---

## Frame Replacement

A new version of a video file can replace only a subset of frames, rather than the whole file.

- Format: append `_frameXYZ` **after** the version tag (e.g. `MyVideo_v2_frame130.mov`)
- XYZ is the frame number at which the replacement starts.
- Designer treats these as a "patch" to the original file — useful for fixing single corrupted or erroneous frames.
- The frame replacement file **must have a higher version number** than the file it is patching.
  - Example: to patch from frame 130 of `Video_v1.mov`, name the replacement `Video_v2_frame130.mov`.

> **RoboDistro implication:** Files with `_frameXYZ` tags are partial patches, not standalone clips. They must be distributed alongside the base version file. Do not treat them as duplicates or skip them.

---

## Media Ingestion History Tool

- Designer analyses new content and displays it in the **Media Ingestion History** tool.
- This tool is used to find and fix naming or spelling errors in filenames.

> **RoboDistro implication:** Filename accuracy is critical. Typos in `_v`, `_proxy`, or `_frame` tags will cause silent failures in Designer. Validate filenames before and after distribution where possible.

---

## Key Filename Conventions Summary

| Tag | Format | Example |
|-----|--------|---------|
| Version | `_vXXX` | `Clip_v3.mov` |
| Proxy | `_proxyXXX` | `Clip_v3_proxy1.mov` |
| Frame patch | `_frameXXX` (after version tag) | `Clip_v4_frame130.mov` |

---

## Related Disguise Docs

- [Project Location](https://help.disguise.one/designer/content-management/project-location)
- [Project Structure](https://help.disguise.one/designer/content-management/project-structure)
- [Placing Media Files](https://help.disguise.one/designer/content-management/placing-media-files)
- [Missing and Unused Media](https://help.disguise.one/designer/content-management/missing-and-unused-media)
- [Media Distribution](https://help.disguise.one/designer/content-management/media-distribution)
- [Content Versioning](https://help.disguise.one/designer/content-management/content-versioning)
- [Media Ingestion History](https://help.disguise.one/designer/content-management/media-ingestion-history)
- [Manage Old Media](https://help.disguise.one/designer/content-management/manage-old-media)
- [Image Sequences](https://help.disguise.one/designer/content-management/image-sequences)
