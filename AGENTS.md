<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Game: Đêm Hội Rối Nước
- Game logic lives in `src/game/` (engine.ts = pure simulation, render.ts = canvas drawing, audio.ts = WebAudio, hand-control.ts = MediaPipe HandLandmarker). `src/components/game/WaterPuppetGame.tsx` orchestrates screens/inputs. The home route lazy-imports the game component so it stays out of the SSR graph (canvas/webcam/WebAudio are browser-only).
- The MediaPipe WASM binary is too large for the repo: it is served from Lovable Assets (`src/assets/mediapipe-wasm.asset.json`); the small loader JS stays in `public/mediapipe/wasm/` and the hand model in `public/models/`.
