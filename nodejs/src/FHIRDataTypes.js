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

class HumanName extends ToJsonParent {
    constructor() {
        super();
        this.use = "anonymous";
        this.text = undefined;
        this.family = undefined; //姓氏
        this.given = undefined; //名字或中間名
        this.prefix = undefined;
        this.suffix = undefined;
    }
}

module.exports = {
    ImagingStudy: ImagingStudy,
    ImagingStudy_Series: ImagingStudy_Series,
    ImagingStudy_Series_Instance: ImagingStudy_Series_Instance,
    Coding: Coding,
    Identifier: Identifier,
    Reference: Reference,
    CodeableConcept: CodeableConcept,
    Period: Period,
    HumanName: HumanName
}