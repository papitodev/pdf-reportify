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
 */
async function generateTestReports(screenshotsDir) {
  try {
    const outputDir = path.join(screenshotsDir, 'reports');
    await fs.mkdir(outputDir, { recursive: true });

    const testCaseDirs = await glob(`${screenshotsDir}/*/`);

    for (const testCaseDir of testCaseDirs) {
      const testCaseName = path.basename(path.resolve(testCaseDir));
      const imagePattern = path.join(testCaseDir, 'step*.png');

      const imagePaths = await glob(imagePattern);

      if (imagePaths.length === 0) {
        console.warn(`No screenshots found for test case: ${testCaseName}`);
        continue;
      }

      imagePaths.sort((a, b) => {
        const numA = parseInt(path.basename(a).match(/\d+/)[0], 10);
        const numB = parseInt(path.basename(b).match(/\d+/)[0], 10);
        return numA - numB;
      });

      console.log(`Generating report for test case: ${testCaseName}`);
      const pdfBytes = await createPdfFromImages(imagePaths);
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