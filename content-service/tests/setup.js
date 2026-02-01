const fs = require('fs');

let mockData;

beforeEach(() => {
  mockData = {
    pages: [
      {
        primaryType: "cq:Page",
        contentType: "article", 
        contentName: "getting-started",
        versions: [
          { version: "v1", content: { title: "Test Page" } },
          { version: "v2", content: { title: "Updated Test Page" } }
        ]
      }
    ]
  };
  
  jest.spyOn(fs, 'readFileSync').mockImplementation(() => JSON.stringify(mockData));
  jest.spyOn(fs, 'writeFileSync').mockImplementation((path, data) => {
    mockData = JSON.parse(data);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});
