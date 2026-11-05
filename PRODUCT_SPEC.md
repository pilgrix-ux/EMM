# EMM Ads Studio — Product Specification

**Product:** EMM Ads Studio  
**Platform:** Web first (responsive browser app; PWA installation planned)  
**Product category:** AI-assisted video advertising studio  
**Release target:** A guided, dependable workflow for turning existing footage into a finished short advertisement.

## 1. Product definition

EMM Ads Create helps small businesses, independent sellers, and creators turn footage they already have into a polished advertisement. The user supplies the footage and truthful business information. AI helps plan the message, hook, script, scenes, captions, and call to action. A separate video-rendering service assembles and exports the final video.

EMM is a video-first creative workspace, not a general-purpose chatbot and not an ad-buying platform.

## 2. The user problem

A person creating an advertisement often has to decide what to say, choose useful footage, write a hook, structure a short story, add captions or voiceover, fit the video to a social platform, and export it. Those steps can be difficult without editing or marketing experience.

EMM puts those steps into one guided process and makes the user's choices visible before a video is rendered.

## 3. Target users

- Small businesses promoting products or services.
- Independent sellers and solo business owners.
- Creators producing promotional content.
- Small marketing teams creating repeatable short-form ads.

The first release should optimize for one person making one advertisement from one uploaded video. Team collaboration, campaign management, and advanced analytics are later-stage possibilities.

## 4. Product principles

1. Video comes first. The user's footage is the starting point.
2. The workflow is guided and understandable for a first-time user.
3. Users can review and edit the ad plan before rendering.
4. AI suggestions must be distinguishable from completed work.
5. EMM must never invent product features, prices, testimonials, guarantees, or business claims.
6. A success message must only appear after the relevant service confirms success.
7. The web app should work well on small mobile screens and slower connections.

## 5. First-release scope

### Included

- Choose a video from device storage and preview it.
- Enter a product or service name and description.
- Add the main benefit and optional offer supplied by the user.
- Choose an advertising goal and describe the intended audience.
- Choose a destination platform, aspect ratio, target duration, and language.
- Choose optional visual style, captions, voiceover, and music settings.
- Generate an ad brief containing hooks, a script, scene guidance, on-screen text, and a call to action.
- Review and edit the proposed plan.
- Render the selected footage with approved edits and overlays.
- Preview, save, and share the completed video.
- Save and reopen unfinished projects.

### Not included in the first release

- Full text-to-video generation of entirely synthetic footage.
- Automatic publishing to social networks.
- Buying or managing advertising campaigns.
- Promises about views, sales, or campaign performance.
- Team workspaces and complex approval permissions.
- Detailed conversion analytics.
- Payments and subscriptions before usage costs and reliability are understood.

## 6. Navigation and screens

### A. Home / Projects

**Purpose:** Start a new ad and return to existing work.

Elements:
- EMM Ads Create identity.
- Primary Create an ad action.
- Recent projects with thumbnail, title, last-updated date, and status.
- A first-use empty state that explains the video-first workflow.

Actions:
- Create an ad opens a new draft.
- Open project resumes a draft or shows a completed result.
- Rename and delete are available from a project menu. Deletion requires confirmation.

### B. Create Ad workspace

**Purpose:** Gather the footage and creative brief.

**Step 1 — Source footage**
- Select one supported local video.
- Show preview, filename, and duration.
- Replace or remove the selected clip.
- Validate file type, size, and duration before upload.

**Step 2 — Business and product**
- Business or brand name.
- Product or service name.
- Short product description.
- Main benefit the user wants to communicate.
- Optional price or offer supplied by the user.
- Optional website, social handle, or contact detail for the end card.

**Step 3 — Advertising goal**
- Build awareness.
- Explain a product or service.
- Promote an offer.
- Encourage messages or enquiries.
- Encourage website visits or sales.

**Step 4 — Audience**
- Audience description in plain language.
- Optional market or location.
- Do not request sensitive personal information about viewers.

**Step 5 — Delivery**
- Platform: Instagram Reels, TikTok, YouTube Shorts, YouTube landscape, Facebook, or custom.
- Aspect ratio: 9:16, 1:1, or 16:9.
- Target duration: 15, 30, or 60 seconds, subject to the footage and renderer.
- Language for the script and captions.

**Step 6 — Creative settings**
- Visual direction: Premium, energetic, minimal, playful, or cinematic.
- Voiceover: Off or a supported voice and language.
- Music: Off or a properly licensed track.
- Captions: Off, clean subtitles, or animated captions.
- Each setting is optional and has a sensible default.

Primary action: **Build my ad plan**. This requests a proposed hook, script, scene order, on-screen text, and call to action from the AI planning service. It does not mean a video has been rendered.

### C. Ad Plan Review

**Purpose:** Approve the content before rendering.

Display:
- Suggested opening hooks.
- Selected hook, editable by the user.
- Script broken into scenes.
- Suggested source-footage moments for each scene.
- On-screen text and final call to action.
- Selected platform, ratio, duration, language, and creative settings.

Actions:
- Edit the script or text.
- Regenerate a hook or script section.
- Change creative settings.
- Render video starts a rendering job only after the user approves the plan.

### D. Rendering status

**Purpose:** Show real rendering progress and explain delays or failures.

Possible states:
- Draft.
- Plan requested.
- Plan ready.
- Awaiting approval.
- Queued.
- Preparing footage.
- Applying edits.
- Rendering.
- Finalizing.
- Complete.
- Failed.

Show a percentage only when the rendering service supplies a real progress value. Otherwise use an indeterminate progress indicator. A failure should include a readable explanation and a retry action.

### E. Video result

**Purpose:** Inspect and use the completed advertisement.

Display:
- Finished video player.
- Duration, resolution, and aspect ratio.
- Script and creative settings used.

Actions:
- Save to device.
- Share with the Web Share API when supported, or download the completed file.
- Make another version.
- Return to editing.

Do not show completion until the output file exists and can be opened.

### F. Project details

A project stores its source video reference, creative brief, selected settings, approved ad plan, render attempts, and final output reference. Users can reopen drafts and review completed versions.

### G. Settings

First-release settings:
- App version.
- Support/contact information.
- Privacy information and data-deletion guidance.
- Default language or export preferences when implemented.

Do not display a fake profile or sign-in flow before account authentication exists.

## 7. Main user journey

1. User opens Home and taps Create an ad.
2. User selects and previews a source video.
3. User enters product details, the main benefit, goal, and audience.
4. User chooses a platform, format, duration, and language.
5. User optionally selects voiceover, music, captions, and visual style.
6. User taps Build my ad plan.
7. AI returns hooks, script, scene guidance, captions, and a call to action.
8. User reviews and edits the plan.
9. User approves the plan and taps Render video.
10. The renderer processes the source footage and reports job status.
11. User previews the completed file and saves or shares it.

The app should preserve the draft when the user leaves the workspace.

## 8. Control behavior

| Control | Required behavior |
|---|---|
| Create an ad | Opens a new project draft |
| Upload a clip | Opens the browser/device media picker filtered to video |
| Replace clip | Lets the user select a replacement |
| Remove clip | Removes the selected source after confirmation |
| Build my ad plan | Enabled only when the source and required brief fields are valid |
| Creative direction | Selects a direction and updates the brief |
| Voiceover / Music / Captions / Format / Style | Opens options and displays the selected value |
| Send direction | Adds an instruction to the draft; must not pretend a live AI response exists when the AI service is disconnected |
| Render video | Enabled only after a plan is returned and approved |
| Try again | Retries a failed planning or rendering job |
| Save to device | Saves a real output file and reports success or failure |
| Share | Uses the Web Share API when supported, otherwise offers a file download |
| Back to edit | Restores the draft and approved plan |

## 9. AI planning contract

The AI planning service should return structured data rather than an unstructured chat paragraph.

Expected response fields:
- project_title
- selected_hook
- alternative_hooks
- script
- scenes
- on_screen_text
- call_to_action
- caption_text
- recommended_duration
- creative_notes

Each scene should include its order, approximate timing or source-footage guidance, voiceover line, overlay text, and transition suggestion.

AI rules:
- Use only facts supplied by the user or explicitly identified assumptions.
- Ask for missing information rather than inventing specifications, offers, prices, reviews, or guarantees.
- Keep hooks truthful and relevant to the audience.
- Fit the script to the selected duration.
- Keep important text within platform-safe areas.
- Return understandable errors when planning fails.

## 10. Rendering contract

The first renderer should edit the user's uploaded footage rather than promise fully AI-generated footage.

Expected operations:
- Trim and arrange source segments.
- Crop or fit footage to the selected aspect ratio.
- Add approved titles, benefit callouts, captions, and CTA end card.
- Mix source audio with optional voiceover and licensed music.
- Apply simple transitions and export settings.
- Produce a playable MP4 and thumbnail.

The renderer must confirm the output exists before the project becomes Complete. Music and other assets must have appropriate usage rights.

## 11. Suggested technical architecture

The web frontend owns the responsive experience, browser file selection, local preview, and project interactions. AI credentials and rendering work belong behind secure server-side endpoints.

Backend capabilities:
- Authentication when user accounts are introduced.
- Private object storage for source footage and rendered outputs.
- Database records for projects, plans, assets, and render jobs.
- Server-side AI planning endpoint.
- Background video-rendering worker or rendering provider.
- Job-status endpoint or realtime updates.
- Short-lived signed URLs for private media downloads.

A service such as Supabase may provide authentication, database, and storage. It does not automatically provide the AI model or video-rendering engine; those are separate integrations.

Security:
- Never put model, storage-admin, or rendering-provider secret keys in client-side browser bundles.
- Validate project ownership and media access on the server.
- Keep storage private by default.
- Validate file type, size, and duration.
- Support deletion of projects and associated media.
- Use job IDs and retry limits to avoid duplicate renders.

## 12. Core data model

**Project**
- id
- owner_id (when authentication exists)
- title
- status
- source_asset_id
- business_name
- product_name
- product_description
- main_benefit
- offer
- audience
- goal
- platform
- aspect_ratio
- target_duration
- language
- creative_settings
- created_at
- updated_at

**AdPlan**
- id
- project_id
- hooks
- selected_hook
- script
- scenes
- captions
- call_to_action
- approved_at

**RenderJob**
- id
- project_id
- status
- progress (nullable unless supplied by the renderer)
- output_asset_id
- error_code
- error_message
- created_at
- completed_at

**Asset**
- id
- project_id
- type (source, output, thumbnail, voiceover, or music)
- private_storage_path
- mime_type
- size_bytes
- duration_ms

## 13. Visual design system

| Token | Value | Usage |
|---|---|---|
| Canvas | #EEF0F4 | Main page background |
| Primary accent | #C8EF00 | Primary actions, active Home item, highlights |
| Dark accent | #121316 | High-contrast actions, hero surfaces, text |
| Surface | #FFFFFF / translucent white | Glossy cards and frosted panels |
| Recessed field | #EFF1F5 | Inputs and pressed surfaces |
| Main text | #121316 | Headings and important labels |
| Muted text | #78808E | Supporting text |
| Border | rgba(255,255,255,0.8) | Soft card edges and frosted surfaces |

Design rules:
- One obvious primary action per screen.
- Essential labels must remain readable.
- Use consistent spacing, generous rounded cards, and clear section titles.
- Use raised glassy cards sparingly and inset shadows on form controls.
- Use lime as a deliberate highlight rather than filling every surface.
- Include empty, loading, disabled, success, and error states.
- Support small mobile screens, desktop layouts, keyboard visibility, and accessibility text scaling.

## 14. Current implementation status

The repository now contains a web-first Next.js and Tailwind workspace in `web/`. The original Android prototype remains preserved in `app/` for reference; it is not the Vercel deployment target.

Already implemented:
- Browser video file selection and local video preview/removal in the web workspace.
- Local video playback and removal.
- Structured product/service, benefit, audience, and goal fields.
- 
- Local brief validation and review dialog.
- A local ad-brief review dialog.
- Clear prototype labeling for services that are not connected.

Removed from the main workspace:
- Horizontal starter-direction cards.
- The old creative-tools strip.
- The local demo chat panel.
- The bottom message composer.

Not implemented or connected:
- Live AI planning.
- Cloud upload and project persistence.
- Actual video rendering.
- User authentication.
- Remote output storage and completed-video sharing flow.

The ad-brief review is a local validation step, not an AI-generated script. The Build ad plan action does not render a video. The interface must continue to communicate these limitations until the services are implemented and tested.

## 15. Delivery milestones

### Milestone 1 — Deployable web workspace
- Deploy the Next.js app from the `web/` directory on Vercel.
- Verify mobile and desktop layouts.
- Validate browser video selection, local playback, and brief review.
- Add clear empty, loading, validation, and error states.
- Keep demo-only actions honestly labeled.

### Milestone 2 — AI ad planning
- Add a secure backend planning endpoint.
- Return structured hooks, scripts, scenes, captions, and CTAs.
- Allow users to edit and approve plans.
- Save and reopen drafts.

### Milestone 3 — Real video rendering
- Upload source video to private storage.
- Submit approved plans to a rendering worker.
- Track real rendering status.
- Preview and save/share finished MP4 files.

### Milestone 4 — Production readiness
- Add authentication and per-user access controls.
- Add deletion, privacy, usage limits, monitoring, and support.
- Test on modern mobile and desktop browsers, including slower network conditions.
- Consider billing after actual infrastructure costs and reliability are understood.

## 16. Definition of done

A user on a supported mobile or desktop browser can select a video, describe the product and audience, choose a goal and format, receive an AI-generated ad plan, edit and approve that plan, render a real MP4, preview it, and download or share it. Each step reports accurate status and understandable errors. No screen claims that AI planning or rendering succeeded unless the connected service confirms it.
