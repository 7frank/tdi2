# Presentation Preparations - Leipzig.js Meetup

## TODO for Presentation

### Styling & Build
- Get the styling fixed
- Build command:
  ```bash
  cd slides
  uv run mkslides build Meetup-Leipzig.js/slides.md --config-file Meetup-Leipzig.js/config.yaml
  ```
- Serve command:
  ```bash
  uv run mkslides serve "Meetup-Leipzig.js/slides2.md" --config-file Meetup-Leipzig.js/config.yaml
  ```

### Resources
- [HoGent Markdown Slides Documentation](https://hogenttin.github.io/hogent-markdown-slides/)
- [HoGent Markdown Slides GitHub](https://github.com/HoGentTIN/hogent-markdown-slides)

## Technical Setup

### OBS Configuration
- Setup OBS to use browser instead of screen capture
- Enable speaker notes with "s" key in browser
- Test browser presentation view

### Streaming Setup
- Schedule a new stream for tomorrow
- **Important:** Make sure NOT to "stop automatically" 
- Stop manually at the end of the presentation
- Have buffer time for live coding session after formal presentation

### Audio Setup
- Switch to Bluetooth audio before starting
- Open presentation in browser and check base audio levels
- Have someone join the call in browser to test for audio problems
- Test audio with both presentation and live coding scenarios