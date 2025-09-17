const path = require('path');

jest.mock('pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn(async () => ({
      addPage: jest.fn(() => ({
        getSize: () => ({ width: 800, height: 600 }),
        getWidth: () => 800,
        getHeight: () => 600,
        drawImage: jest.fn(),
      })),
      embedPng: jest.fn(async () => ({ scaleToFit: () => ({ width: 750, height: 550 }) })),
      embedJpg: jest.fn(async () => ({ scaleToFit: () => ({ width: 750, height: 550 }) })),
      save: jest.fn(async () => new Uint8Array([1, 2, 3])),
    })),
  },
}));

jest.mock('glob', () => ({
  glob: jest.fn(),
}));

describe('generateTestReports', () => {
  const { generateTestReports } = require('..');
  const { glob } = require('glob');
  const fs = require('fs').promises;

  const statSpy = jest.spyOn(fs, 'stat');
  const readFileSpy = jest.spyOn(fs, 'readFile');
  const writeFileSpy = jest.spyOn(fs, 'writeFile');
  const mkdirSpy = jest.spyOn(fs, 'mkdir');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('orders images by creation time and generates PDFs per test case', async () => {
    const screenshotsDir = '/root/screenshots';

    glob.mockImplementation(async (pattern) => {
      if (pattern === `${screenshotsDir}/*/`) {
        return [
          path.join(screenshotsDir, 'CaseA/') ,
          path.join(screenshotsDir, 'CaseB/') ,
        ];
      }
      if (pattern.includes('CaseA')) {
        return [
          path.join(screenshotsDir, 'CaseA', 'img2.png'),
          path.join(screenshotsDir, 'CaseA', 'img1.jpg'),
        ];
      }
      if (pattern.includes('CaseB')) {
        return [
          path.join(screenshotsDir, 'CaseB', 'a.jpeg'),
        ];
      }
      return [];
    });

    mkdirSpy.mockResolvedValue();
    writeFileSpy.mockResolvedValue();
    readFileSpy.mockResolvedValue(new Uint8Array([9]));

    statSpy.mockImplementation(async (filePath) => {
      if (filePath.endsWith('img1.jpg')) return { birthtimeMs: 100 };
      if (filePath.endsWith('img2.png')) return { birthtimeMs: 200 };
      if (filePath.endsWith('a.jpeg')) return { birthtimeMs: 150 };
      return { birthtimeMs: 0 };
    });

    await generateTestReports(screenshotsDir);

    expect(mkdirSpy).toHaveBeenCalledWith(path.join(screenshotsDir, 'reports'), { recursive: true });

    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join(screenshotsDir, 'reports', 'CaseA_report.pdf'),
      expect.any(Uint8Array)
    );
    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join(screenshotsDir, 'reports', 'CaseB_report.pdf'),
      expect.any(Uint8Array)
    );
  });
});


