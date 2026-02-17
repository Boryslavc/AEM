const fs = require('fs');
const path = require('path');

const mockFileSystem = {};

beforeEach(() => {
  // Reset mock file system
  Object.keys(mockFileSystem).forEach(key => delete mockFileSystem[key]);
  
  // Setup mock file structure: client/lang/version/page.html
  mockFileSystem['client1/en/v1/home.html'] = '<h1>Home Page</h1>';
  mockFileSystem['client1/en/v1/home.meta.json'] = JSON.stringify({
    client: 'client1',
    language: 'en',
    version: 'v1',
    pageName: 'home',
    contentType: 'text/html',
    cacheControl: 'max-age=300',
    createdAt: '2024-01-01T00:00:00.000Z',
    etag: '"v1-12345"',
    lastModified: '2024-01-01T00:00:00.000Z'
  });

  jest.spyOn(fs.promises, 'readFile').mockImplementation(async (filePath) => {
    const normalizedPath = filePath.replace(/\\/g, '/').split('/data/pages/')[1];
    if (mockFileSystem[normalizedPath]) {
      return mockFileSystem[normalizedPath];
    }
    const err = new Error('ENOENT: no such file or directory');
    err.code = 'ENOENT';
    throw err;
  });

  jest.spyOn(fs.promises, 'writeFile').mockImplementation(async (filePath, data, options) => {
    const normalizedPath = filePath.replace(/\\/g, '/').split('/data/pages/')[1];
    
    // Handle exclusive flag
    if (options && options.flag === 'wx' && mockFileSystem[normalizedPath]) {
      const err = new Error('EEXIST: file already exists');
      err.code = 'EEXIST';
      throw err;
    }
    
    mockFileSystem[normalizedPath] = data;
  });

  jest.spyOn(fs.promises, 'mkdir').mockImplementation(async () => {});

  jest.spyOn(fs.promises, 'unlink').mockImplementation(async (filePath) => {
    const normalizedPath = filePath.replace(/\\/g, '/').split('/data/pages/')[1];
    if (!mockFileSystem[normalizedPath]) {
      const err = new Error('ENOENT: no such file or directory');
      err.code = 'ENOENT';
      throw err;
    }
    delete mockFileSystem[normalizedPath];
  });

  jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
    const normalizedPath = filePath.replace(/\\/g, '/').split('/data/pages/')[1];
    return !!mockFileSystem[normalizedPath];
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});
