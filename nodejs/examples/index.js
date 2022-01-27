const { DCM2FHIR } = require('../src/DICOM2FHIRImagingStudy');
const { DCM2Patient } = require('../src/DICOM2FHIRPatient');
const fs = require('fs');
const path = require('path');

let inputFilename = path.join(__dirname, "../../dicomFile/image-000001.dcm");


( async ()=> {
    let dicomToFHIRImagingStudyResult = await DCM2FHIR(inputFilename);
    if (dicomToFHIRImagingStudyResult.status === true) {
        let imagingStudyStr = JSON.stringify(dicomToFHIRImagingStudyResult.data , null , 4); 
        let imagingStudyStrOutputFilename = path.join(__dirname , "imagingStudy-output.json");
        fs.writeFileSync(imagingStudyStrOutputFilename, imagingStudyStr);
    }
    let dicomToFHIRPatientResult = await DCM2Patient(inputFilename);
    if (dicomToFHIRPatientResult.status === true) {
        let patientStr = JSON.stringify(dicomToFHIRPatientResult.data, null, 4);
        let patientStrOutputFilename = path.join(__dirname , "patient-output.json");
        fs.writeFileSync(patientStrOutputFilename, patientStr);
    }
})();

