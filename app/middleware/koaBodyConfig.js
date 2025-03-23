let { uploadDir } = require('../../config');

const koaBodyConfig = {
  multipart: true,
  // parsedMethods defaults to ['POST', 'PUT', 'PATCH']
  parsedMethods: ['POST', 'PUT', 'PATCH', 'GET', 'HEAD', 'DELETE'],
  formidable: {
    uploadDir: uploadDir, // Set the file upload directory
    keepExtensions: true, // Keep the file extensions
    maxFieldsSize: 2 * 1024 * 1024, // File upload size limit
    onFileBegin: (name, file) => { // Settings before file upload
      // console.log(`name: ${name}`);
      // console.log(file); // Log the file being uploaded
    }
  }
}

module.exports = koaBodyConfig;