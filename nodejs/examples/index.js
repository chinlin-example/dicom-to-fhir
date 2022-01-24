const { DCM2FHIR } = require('../src/DICOM2FHIRImagingStudy');
const fs = require('fs');
const path = require('path');

let inputFilename = path.join(__dirname, "image-000001.dcm");
let outputFilename = path.join(__dirname , "output.json");

( async ()=> {
    let dicomToFHIRResult = await DCM2FHIR(inputFilename);
    if (dicomToFHIRResult.status === true) {
        let resultStr = JSON.stringify(dicomToFHIRResult.data , null , 4); 
        fs.writeFileSync(outputFilename, resultStr);
    }
})();

