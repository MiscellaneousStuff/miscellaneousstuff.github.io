# Stalemate viewer, pulled out of the artifact

This is the viewer from the 12 November artifact ("Stalemate segments", v2 with minions on every frame), unchanged
apart from a doctype / charset / viewport line added at the top so it works as a standalone page.

## Files
- `index.html` (130 KB): the viewer.
- `games/g01.js`, `games/g02.js` (2.4 MB and 2.7 MB): the two recorded games, loaded on demand by the viewer.
- `snippet.html`: the figure to paste into the post.

## Putting it in the blog
1. Copy `index.html` and the `games/` folder to `assets/part4/turn/` in the Jekyll repo (keep them together; the
   viewer loads `games/<id>.js` relative to itself).
2. Paste `snippet.html` where the embed goes in "The turn". Adjust the iframe height if needed.

## Not changed
- It still uses the artifact's own colours and has a dark theme that follows the reader's system setting; the blog is
  light only. Say if you want it forced to light.
- It shows two games (a game picker) and 20-minute segments from 2:00:00, not a whole game from the start.
- Total download is about 5 MB once both games are opened; each game loads only when selected.
