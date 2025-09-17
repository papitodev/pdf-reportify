const { PDFDocument } = require('pdf-lib');
const { promises: fs } = require('fs');
const path = require('path');
const { glob } = require('glob');

/**
 * Creates a PDF from a series of images.
 * @param {string[]} imagePaths - An array of paths to the images.
 * @returns {Promise<Uint8Array>} The PDF content as bytes.
 */
async function createPdfFromImages(imagePaths) {
  const pdfDoc = await PDFDocument.create();

  for (const imagePath of imagePaths) {
    const imageBytes = await fs.readFile(imagePath);
    let image;

    if (imagePath.endsWith('.png')) {
      image = await pdfDoc.embedPng(imageBytes);
    } else if (imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')) {
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      console.warn(`Unsupported image format: ${imagePath}`);
      continue;
    }

    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const imageDims = image.scaleToFit(width - 50, height - 50);

    page.drawImage(image, {
      x: page.getWidth() / 2 - imageDims.width / 2,
      y: page.getHeight() / 2 - imageDims.height / 2,
      width: imageDims.width,
      height: imageDims.height,
    });
  }

  return pdfDoc.save();
}

/**
 * Generates PDF files for each test case in a screenshots directory.
 * @param {string} screenshotsDir - The path to the root screenshots directory.
 * @param {{ verbose?: boolean }} options - Optional settings.
 */
async function generateTestReports(screenshotsDir, options = {}) {
  const verbose = Boolean(options.verbose);
  const vLog = (...args) => { if (verbose) console.log(...args); };
  try {
    const outputDir = path.join(screenshotsDir, 'reports');
    await fs.mkdir(outputDir, { recursive: true });

    // List test case directories using fs to be robust across environments
    const dirEntries = await fs.readdir(screenshotsDir, { withFileTypes: true });
    const testCaseDirs = dirEntries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(screenshotsDir, entry.name));

    vLog(`Found ${testCaseDirs.length} test case folders in: ${screenshotsDir}`);

    for (const testCaseDir of testCaseDirs) {
      const testCaseName = path.basename(path.resolve(testCaseDir));
      // Normalize to POSIX path for glob on Windows
      const posixDir = testCaseDir.replace(/\\/g, '/');
      const imagePattern = `${posixDir}/*.{png,jpg,jpeg,PNG,JPG,JPEG}`;

      const imagePaths = await glob(imagePattern, { nocase: true, windowsPathsNoEscape: true });

      vLog(`Folder '${testCaseName}' pattern: ${imagePattern}`);
      vLog(`Found ${imagePaths.length} images in '${testCaseName}'`);

      if (imagePaths.length === 0) {
        console.warn(`No screenshots found for test case: ${testCaseName}`);
        continue;
      }

      // Order images by file creation time (birthtime)
      const filesWithStats = await Promise.all(
        imagePaths.map(async (imagePath) => ({
          imagePath,
          stat: await fs.stat(imagePath),
        }))
      );

      filesWithStats.sort((a, b) => a.stat.birthtimeMs - b.stat.birthtimeMs);
      const orderedImagePaths = filesWithStats.map((f) => f.imagePath);
      vLog(`Ordering by creation time (oldest first):`, orderedImagePaths.map(p => path.basename(p)).join(', '));

      console.log(`Generating report for test case: ${testCaseName}`);
      const pdfBytes = await createPdfFromImages(orderedImagePaths);
      const outputFilePath = path.join(outputDir, `${testCaseName}_report.pdf`);
      await fs.writeFile(outputFilePath, pdfBytes);
      console.log(`Report saved to: ${outputFilePath}`);
    }
    console.log('\nReport generation complete!');

  } catch (error) {
    console.error('An error occurred during report generation:', error);
  }
}

module.exports = {
  generateTestReports,
};