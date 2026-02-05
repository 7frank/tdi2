# Presentation Preparations - Leipzig.js Meetup

## Update QR Code if necessary

- generate new QRCode for presentation link

https://www.qrcode-generator.de/

### Styling & Build

- Get the styling fixed
- Build command:
  ```bash
  cd slides
  uv run python -m mkslides build Meetup-React.js05022026 --config-file Meetup-React.js05022026/config.yaml
  ```
- Serve command:
  ```bash
  uv run python -m mkslides serve "Meetup-React.js05022026" --config-file Meetup-React.js05022026/config.yaml
  ```

chromium --app=file:///home/frank/Projects/7frank/tdi2/docs/SlideDecks/slides/site/index.html
chromium --app=file:///home/frank/Projects/7frank/tdi2/docs/SlideDecks/slides/site/index.html --window-size=1600,1200

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
