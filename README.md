### pdf-reportify

Generate consolidated PDF reports from test run screenshots.

### Features
- **CLI command**: `generate-test-reports`
- **Input**: Folders containing `step*.png` images per test case
- **Output**: One PDF per test case saved under `reports/`

### Requirements
- Node.js 16+

### Install
- Local dev/use inside this repo:
```bash
npm install
```

### Usage
- With the provided CLI command (after install):
```bash
npx generate-test-reports --path ./path/to/screenshots
```

- Or directly via Node:
```bash
node cli.js --path ./path/to/screenshots
```

### Screenshots directory structure
Place screenshots under a parent folder where each test case has its own subfolder. Within each test folder, name steps as `step<number>.png`.

Example:
```
screenshots/
  Login test/
    step1.png
    step2.png
  Checkout flow/
    step1.png
    step2.png
```

Running the command:
```bash
npx generate-test-reports --path ./screenshots
```

Produces PDFs under:
```
screenshots/
  reports/
    Login test_report.pdf
    Checkout flow_report.pdf
```

### Options
- `--path, -p` (required): path to the root screenshots directory
- `--help, -h`: show help

### Notes
- Supported image formats: `.png`, `.jpg`, `.jpeg` (others are skipped with a warning)
- PDFs are generated per test-case subfolder; images are ordered by the number in `step*.png`

### Author
Created by [papitodev](https://github.com/papitodev).

### License
MIT


