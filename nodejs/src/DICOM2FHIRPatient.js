const fs = require('fs');
const dicomParser = require('dicom-parser');
const _ = require('lodash');
const { HumanName } = require('./FHIRDataTypes');

function getFHIRPatientName(field, humanName, dicomPatientName) {
    const lookUpFuncs = {
        familyName: () => {
            humanName.family = dicomPatientName.familyName;
        },
        givenName: () => {
            if (humanName.given) {
                humanName.given.push(dicomPatientName.givenName);
            } else {
                humanName.given = [];
                humanName.given.push(dicomPatientName.givenName);
            }
        },
        middleName: () => {
            if (humanName.given) {
                humanName.given.push(dicomPatientName.middleName);
            } else {
                humanName.given = [];
                humanName.given.push(dicomPatientName.middleName);
            }
        },
        prefix: () => {
            if (humanName.prefix) {
                humanName.prefix.push(dicomPatientName.middleName);
            } else {
                humanName.prefix = [];
                humanName.prefix.push(dicomPatientName.middleName);
            }
        },
        suffix: (humanName) => {
            if (humanName.prefix) {
                humanName.prefix.push(dicomPatientName.middleName);
            } else {
                humanName.prefix = [];
                humanName.prefix.push(dicomPatientName.middleName);
            }
        }
    }
    return lookUpFuncs[field](humanName);
}
async function DCM2Patient(filename)
{
    try {
        let dicomFile = fs.readFileSync(filename);
        let dataset = dicomParser.parseDicom(dicomFile);
        let pName = dataset.string('x00100010');
        let pGender = dataset.string('x00100040') || "unknown";
        let FHIRGender = {
            "M": "male",
            "F": "female",
            "O": "other",
            "UNKNOWN": "unknown"
        }
        pGender = FHIRGender[pGender.toUpperCase()];
        let pBD = dataset.string('x00100030');
        let patientName = new HumanName();
        if (pName == undefined) {
            pName = "UNKNOWN"
        } else {
            patientName.use = "usual";
        }
        patientName.text = pName;
        let dicomPatientName = _.pickBy(dicomParser.parsePN(pName) ,  _.identity); //remove undefined or null key
        
    
        for (let key in dicomPatientName) {
            getFHIRPatientName(key, patientName, dicomPatientName);
        }
        let patient = 
        {
            resourceType: "Patient",
            id: dataset.string('x00100020') || "unknown",
            gender: pGender,
            active: true,
            name: [
                patientName.ToJson()
            ]
        }
        if (pBD) {
            patient.birthDate = moment.utc(pBD).format("YYYY-MM-DD");
        }
        return {
            status: true,
            data: patient
        };
    } catch(e) {
        console.error(e);
        return {
            status: false,
            data: e
        }
    }
    
}

module.exports = {
    DCM2Patient: DCM2Patient
}