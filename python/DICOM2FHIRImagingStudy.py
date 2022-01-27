import pydicom
import json
import utils
from datetime import datetime


class Coding:
    def __init__(self):
        self.system = None
        self.version = None
        self.code = None
        self.display = None
        self.userSelected = None

    pass


pass


class CodeableConcept:
    def __init__(self):
        self.Coding = None
        self.text = None

    pass


pass


class Identifier:
    def __init__(self):
        self.use = None
        self.type = None
        self.system = None
        self.value = None
        self.period = None

    pass


pass


class Period:
    def __init__(self):
        self.start = None
        self.end = None

    pass


pass


class Reference:
    def __init__(self):
        self.reference = None
        self.type = None
        self.identifier = None
        self.display = None

    pass


pass


class ImagingStudy:
    def __init__(self):
        self.resourceType = "ImagingStudy"
        self.id = None
        self.identifier = None
        self.status = "unknown"
        self.modality = None
        self.subject = None
        self.started = None
        self.endpoint = None
        self.numberOfSeries = None
        self.numberOfInstances = None
        self.description = None
        self.series = None

    pass


pass


class ImagingStudySeries:
    def __init__(self):
        self.uid = None
        self.number = None
        self.modality = Coding()
        self.modality.system = "http://dicom.nema.org/resources/ontology/DCM"
        self.description = None
        self.numberOfInstances = None
        self.endpoint = None
        self.bodySite = None
        self.laterality = None
        self.started = None
        self.performer = None
        self.instance = None

    pass


pass


class ImagingStudySeriesInstance:
    def __init__(self):
        self.uid = None
        self.sopClass = Coding()
        self.number = None
        self.title = None

    pass


pass


def get_accession_number_and_issuer(i_data_set):
    accession_number = i_data_set.get(0x00080050)
    issuer = i_data_set.get(0x00080051)
    result = None
    if accession_number is not None and issuer is not None:
        result = accession_number.value + issuer.value
    elif accession_number is not None:
        result = accession_number.value
    elif issuer is not None:
        result = issuer.value
    pass
    return result


pass


def get_imaging_study_identifier_list(i_data_set):
    result = []
    study_instance_uid = i_data_set[0x0020000D].value
    accession_number_and_issuer = get_accession_number_and_issuer(i_data_set)
    study_id = i_data_set.get(0x00200010)
    identifier_study_instance_uid = Identifier()
    identifier_study_instance_uid.use = "official"
    identifier_study_instance_uid.system = "urn:dicom:oid"
    identifier_study_instance_uid.value = "urn:oid" + study_instance_uid
    result.append(identifier_study_instance_uid)
    if accession_number_and_issuer is not None:
        identifier_accession_number_and_issuer = Identifier()
        identifier_accession_number_and_issuer.use = "usual"
        identifier_accession_number_and_issuer.value = accession_number_and_issuer
        result.append(identifier_accession_number_and_issuer)
    pass
    if study_id is not None:
        identifier_study_id = Identifier()
        identifier_study_id.use = "secondary"
        identifier_study_id.value = study_id.value
        result.append(identifier_study_id)
    pass
    return result


pass


def get_imaging_started(date, time):
    imaging_started = None
    imaging_started_str = None
    if date is not None and time is not None:
        imaging_started = date.value + time.value
    elif date is not None:
        imaging_started = date.value
    elif date is not None:
        imaging_started = date.value
    pass
    format_data = "%Y%M%d%H%M%S"
    if imaging_started is not None:
        imaging_started_str = datetime.strptime(imaging_started, format_data)
    pass
    return imaging_started_str


pass


def do_dicom_to_fhir_imagingstudy(filename):
    data_set = pydicom.dcmread(filename, force=True, stop_before_pixels=True)
    imaging_study_obj = ImagingStudy()
    study_instance_uid = data_set[0x0020000D].value
    imaging_study_obj.id = study_instance_uid
    imaging_study_obj.identifier = get_imaging_study_identifier_list(data_set)
    patient_id = data_set.get(0x00100020)

    imaging_study_obj.subject = Reference()
    imaging_study_obj.subject.identifier = Identifier()

    if patient_id is not None:
        imaging_study_obj.subject.reference = "Patient/" + patient_id.value
        imaging_study_obj.subject.type = "Patient"
        imaging_study_obj.subject.identifier.use = "usual"
        imaging_study_obj.subject.identifier.value = patient_id.value
    else:
        imaging_study_obj.subject.reference = "Patient/unknown"
        imaging_study_obj.subject.type = "type"
        imaging_study_obj.subject.identifier.use = "anonymous"
        imaging_study_obj.subject.identifier.value = "unknown"
    pass
    imaging_study_obj.started = get_imaging_started(data_set.get(0x00800020), data_set.get(0x00800030))

    number_of_series = data_set.get(0x00201206)
    if number_of_series is not None:
        imaging_study_obj.numberOfSeries = number_of_series.value
    pass

    number_of_study_instances = data_set.get(0x00201208)
    if number_of_study_instances is not None:
        imaging_study_obj.numberOfInstances = number_of_study_instances.value
    pass

    study_description = data_set.get(0x00081030)
    if study_description is not None:
        imaging_study_obj.description = study_description.value
    pass

    series_obj = ImagingStudySeries()
    series_obj.uid = data_set[0x0020000e].value

    series_number = data_set.get(0x00200011)
    if series_number is not None:
        series_obj.number = int(series_number.value)
    pass

    modality_code = data_set.get(0x00080060)
    if modality_code is not None:
        series_obj.modality = Coding()
        series_obj.modality.code = modality_code.value
    pass

    series_description = data_set.get(0x0008103e)
    if series_description is not None:
        series_obj.description = series_description.value
    pass

    number_of_series_instances = data_set.get(0x00201209)
    if number_of_series_instances is not None:
        series_obj.numberOfInstances = number_of_series_instances.value
    pass

    series_body_site = data_set.get(0x00180015)
    if series_body_site is not None:
        series_obj.bodySite = Coding()
        series_obj.bodySite = series_body_site.value
    pass

    series_obj.started = get_imaging_started(data_set.get(0x00080021), data_set.get(0x00080031))

    performer = data_set.get(0x00081050) or data_set.get(0x00081052) or data_set.get(0x00081070) or \
                data_set.get(0x00081072)
    if performer is not None:
        series_obj.performer = performer.value
    pass

    instance_obj = ImagingStudySeriesInstance()
    instance_obj.uid = data_set[0x00080018].value
    instance_obj.sopClass = Coding()
    instance_obj.sopClass.system = "urn:ietf:rfc:3986"
    instance_obj.sopClass.code = "urn:oid" + data_set[0x00080016].value

    instance_number = data_set.get(0x00200013)
    if instance_number is not None:
        instance_obj.number = instance_number.value
    pass

    series_obj.instance = [instance_obj]
    imaging_study_obj.series = [series_obj]
    imaging_study_obj_json_str = json.dumps(imaging_study_obj, default=lambda o: o.__dict__)
    imaging_study_obj_json = json.loads(imaging_study_obj_json_str)
    imaging_study_obj_json_remove = utils.delete_none(imaging_study_obj_json)
    imaging_study_obj_json_str = json.dumps(imaging_study_obj_json_remove, default=lambda o: o.__dict__, indent=4)
    print(imaging_study_obj_json_str)
    return imaging_study_obj_json_str


pass


if __name__ == '__main__':
    do_dicom_to_fhir_imagingstudy("../image-000001.dcm")

pass
