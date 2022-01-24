const fs = require('fs');
const dicomParser = require('dicom-parser');
const Moment = require('moment');
const _ = require('lodash');
const flatten = require('flat');

/**
 * 將Class轉成Json的父類別
 */
class ToJsonParent {
    constructor() {}
    ToJson() {
        return Object.getOwnPropertyNames(this).reduce((a, b) => {
            if (this[b]) a[b] = this[b];
            return a;
        }, {});
    }
}

/**
 * ImagingStudy類別
 */
class ImagingStudy extends ToJsonParent {
    constructor() {
        super();
        this.resourceType = "ImagingStudy";
        this.id = "";
        this.identifier = []; //0..* 
        this.status = "unknown"; //1..1 code registered | available | cancelled | entered-in-error | unknown
        this.modality = new Coding(); //0..* coding
        this.subject = new Reference(); //1..1 reference
        this.started = ""; //0..1 dateTime
        this.endpoint = new Reference(); //0..* Reference don't have this now  (This is mean where the DicomWEB server)
        this.numberOfSeries = ""; //0..1  int
        this.numberOfInstances = ""; //0..1 int
        this.description = ""; //0..1 string
        this.series = []; //0..* 放置ImagingStudy_Series
    }
}
class ImagingStudy_Series extends ToJsonParent {
    constructor() {
        super();
        this.uid = ""; //1..1 
        this.number = "";  //0..1 int 
        this.modality = new Coding(); //1..1 coding   //
        this.modality.system = "http://dicom.nema.org/resources/ontology/DCM";
        this.description = ""; //0..1 string
        this.numberOfInstances = ""; //0..1 int
        this.endpoint = new Reference(); //0..* Reference
        this.bodySite = new Coding(); //0..1 Coding
        this.laterality = new Coding();
        this.started = ""; //0..1 dateTime
        this.performer = []; //0..* {function (Codeable) :0..1, actor:1..1 (Reference)}
        this.instance = []; //0..* 
    }
}
class ImagingStudy_Series_Instance extends ToJsonParent {
    constructor() {
        super();
        this.uid = ""; //1..1 
        this.sopClass = new Coding(); //1..1 coding
        this.number = ""; //0..1
        this.title = ""; //0..1
    }
}

class Coding {
    constructor() {
        this.system = undefined;
        this.version = undefined;
        this.code = undefined;
        this.display = undefined;
        this.userSelected = undefined;
    }
}
class Identifier {
    constructor() {
        this.use = undefined;
        this.type = new CodeableConcept();
        this.system = undefined;
        this.value = undefined;
        this.period = new Period();
    }
}
class Reference {
    constructor() {
        this.reference = undefined; //(Literal reference, Relative, internal or absolute URL)(string)
        this.type = undefined; //string
        this.identifier = new Identifier();
        this.display = undefined;
    }

}

class CodeableConcept {
    constructor() {
        this.Coding = [];
        this.text = undefined;
    }
}
class Period {
    constructor() {
        this.start = undefined;
        this.end = undefined;
    }
}
async function doDICOMToFHIRImagingStudy(filename) {
    return new Promise(async (resolve) => {
        try {
            let dataset = dicomParser.parseDicom(filename , {
                untilTag: "x7fe00010"
            });
            let studyObj = new ImagingStudy();
            let studyInstanceUID = dataset.string('x0020000d');
            let ANandIssuer = await getTwoTag(dataset, 'x00080050', 'x00080051'); //Accession Number and Issuer
            studyObj.id = studyInstanceUID;
            let identifiers = [studyInstanceUID, ANandIssuer, dataset.string('x00200010')];
            studyObj.identifier = await getImagingStudyIdentifiers(identifiers);
            studyObj.modality = dataset.string('x00080061');
            let patientId = dataset.string('x00100020');
            if (patientId) {
                studyObj.subject.reference = "Patient/" + dataset.string('x00100020');
                studyObj.subject.type = "Patient";
                studyObj.subject.identifier.use = "usual"
                studyObj.subject.identifier.value = dataset.string('x00100020');
            } else {
                studyObj.subject.reference = "Patient/unknown"
                studyObj.subject.type = "Patient";
                studyObj.subject.identifier.use = "anonymous"
                studyObj.subject.identifier.value = "unknown";
            }

            let imaging_started = dataset.string('x00080020') + dataset.string('x00080030');
            const date = Moment(imaging_started, "YYYYMMDDhhmmss").toISOString();
            studyObj.started = date;
            studyObj.numberOfSeries = dataset.string('x00201206');
            studyObj.numberOfInstances = dataset.string('x00201208');
            studyObj.description = dataset.string('x00081030');
            let studySeriesObj = new ImagingStudy_Series();
            studySeriesObj.uid = dataset.string('x0020000e');
            studySeriesObj.number = dataset.intString('x00200011');
            studySeriesObj.modality.code = dataset.string('x00080060');
            studySeriesObj.description = dataset.string('x0008103e');
            studySeriesObj.numberOfInstances = dataset.intString('x00201209');
            studySeriesObj.bodySite.display = dataset.string('x00180015');
            let series_started = dataset.string('x00080021') + dataset.string('x00080031');
            const series_date = Moment(series_started, "YYYYMMDDhhmmss").toDate();
            studySeriesObj.started = series_date != null ? series_date : undefined;
            studySeriesObj.performer = dataset.string('x00081050') || dataset.string('x00081052') || dataset.string('x00081070') || dataset.string('x00081072');
            let studySeriesInstanceObj = new ImagingStudy_Series_Instance();
            studySeriesInstanceObj.uid = dataset.string('x00080018');
            studySeriesInstanceObj.sopClass.system = "urn:ietf:rfc:3986"
            studySeriesInstanceObj.sopClass.code = "urn:oid:" + dataset.string('x00080016');
            studySeriesInstanceObj.number = dataset.intString('x00200013');
            studySeriesInstanceObj.title = dataset.string('x00080008') || dataset.string('x00070080') || ((dataset.string('x0040a043') != undefined) ? dataset.string('x0040a043') + dataset.string('x00080104') : undefined) || dataset.string('x00420010');
            let imagingStudyJson = await CombineImagingStudyClass(studyObj, studySeriesObj, studySeriesInstanceObj);
            resolve(imagingStudyJson);
        }
        catch (ex) {
            console.log(ex);
            resolve(false);
        }
    });
}

async function getTwoTag(dataset, I_Tag1, I_Tag2) {
    return new Promise((resolve) => {
        let str1 = dataset.string(I_Tag1);
        let str2 = dataset.string(I_Tag2);
        let result = "";
        if (str1 != undefined && str2 != undefined) {
            result = str1 + str2;
        }
        else if (str1 != undefined) {
            result = str1;
        }
        else if (str2 != undefined) {
            result = str2;
        }
        else {
            result = undefined;
        }
        return resolve(result);
    });
}
//Common just use official
async function getImagingStudyIdentifiers(identifiers) {
    return new Promise((resolve) => {
        let result = [];
        // StudyInstanceUID
        if (identifiers[0] != undefined) {
            let identifier1 = new Identifier();
            identifier1.use = "official";
            identifier1.system = "urn:dicom:uid";
            identifier1.value = "urn:oid:" + identifiers[0];
            result.push(identifier1);
        }
        //need sample dicom with the organization
        //Accession Number and Issuer
        if (identifiers[1] != undefined) {
            let identifier2 = new Identifier();
            identifier2.type = new Coding();
            identifier2.use = "usual";
            identifier2.value = identifiers[1];
            result.push(identifier2);
        }
        //Study ID
        if (identifiers[2] != undefined) {
            let identifier3 = new Identifier();
            identifier3.use = "secondary";
            identifier3.value = "s" + identifiers[2];
            result.push(identifier3);
        }
        return resolve(result);
    });
}

//http://jsfiddle.net/ryeballar/n0afoxdu/
//用於清除Object裡面undefined、空Object以及空Array
function removeEmpty(obj) {
    if (_.isArray(obj)) {
        return _(obj)
            .filter(_.isObject)
            .map(removeEmpty)
            .reject(_.isEmpty)
            .concat(_.reject(obj, _.isObject))
            .value();
    }
    return _(obj)
        .pickBy(_.isObject)
        .mapValues(removeEmpty)
        .omitBy(_.isEmpty)
        .assign(_.pickBy(_.omitBy(obj, _.isObject) , _.identity))
        .value();
}
/**
 * 將Study, Series, Instance組合成一個ImagingStudy
 * @param {*} imagingStudy 
 * @param {*} imagingStudySeries 
 * @param {*} imagingStudySeriesInstance 
 */
async function CombineImagingStudyClass(imagingStudy, imagingStudySeries, imagingStudySeriesInstance) {
    try {
        let imagingStudyJson = imagingStudy.ToJson();
        let imagingStudySeriesJson = imagingStudySeries.ToJson();
        let imagingStudySeriesInstanceJson = imagingStudySeriesInstance.ToJson();
        imagingStudySeriesJson.instance.push(imagingStudySeriesInstanceJson);
        imagingStudyJson.series.push(imagingStudySeriesJson);
        let ImagingStudyJsonFlatten = flatten(imagingStudyJson);
        ImagingStudyJsonFlatten = removeEmpty(ImagingStudyJsonFlatten);
        imagingStudyJson = flatten.unflatten(ImagingStudyJsonFlatten);
        return imagingStudyJson;
    } catch (e) {
        console.error(e);
        return false;
    }
}
async function getFileDicomParser(filename) {
    let isExist = fs.existsSync(filename);
    if (isExist) {
        let file = fs.readFileSync(filename);
        return file;
    } else {
        if (_.isString(filename)) {
            return false;
        }
        return filename;
    }
}
module.exports.DCM2FHIR = async (filename) => {
    return new Promise(async (resolve) => {
        try {
            let dicomfile = "";
            //取得local file 或 api 上的blob file
            dicomfile = await getFileDicomParser(filename);
            let imagingStudyJson = await doDICOMToFHIRImagingStudy(dicomfile);
            return resolve({
                status: true,
                message: "processing successfully",
                data: imagingStudyJson
            });
        } catch (err) {
            console.error(err);
            return resolve({
                status: false ,
                message: "processing DICOM to FHIR ImagingStudy error",
                data: err
            });
        }
    });
}
