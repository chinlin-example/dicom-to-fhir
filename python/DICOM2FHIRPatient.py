import json

import pydicom
import utils

Gender = {
    "M": "male",
    "F": "female",
    "O": "other",
    "UNKNOWN": "unknown"
}


def parse_pn(patient_name):
    if patient_name is None:
        return None
    pass
    temp_arr = [None, None, None, None, None]
    string_values = patient_name.split('^')
    for i in range(0, len(string_values)):
        temp_arr[i] = string_values
    return {
        "familyName": temp_arr[0],
        "givenName": temp_arr[1],
        "middleName": temp_arr[2],
        "prefix": temp_arr[3],
        "suffix": temp_arr[4]
    }


pass


class HumanName:
    HumanNameUse = {
        "usual": "usual",
        "official": "official",
        "temp": "temp",
        "nickname": "nickname",
        "anonymous": "anonymous",
        "old": "old",
        "maiden": "maiden"
    }

    def __init__(self):
        self.use = None
        self.text = None
        self.family = None
        self.given = None
        self.prefix = None
        self.suffix = None

    pass


pass


def do_dicom_patient_to_fhir_family_name(i_human_name: HumanName, i_dicom_patient_name):
    print(i_dicom_patient_name)
    i_human_name.family = i_dicom_patient_name["familyName"]


pass


def do_dicom_patient_to_fhir_given_name(i_human_name: HumanName, i_dicom_patient_name):
    if i_human_name.given is None:
        i_human_name.given = []
    pass
    i_human_name.given.append(i_dicom_patient_name["givenName"])


pass


def do_dicom_patient_to_fhir_middle_name(i_human_name: HumanName, i_dicom_patient_name):
    if i_human_name.given is None:
        i_human_name.given = []
    pass
    i_human_name.given.append(i_dicom_patient_name["middleName"])


pass


def do_dicom_patient_to_fhir_prefix_name(i_human_name: HumanName, i_dicom_patient_name):
    if i_human_name.prefix is None:
        i_human_name.prefix = []
    pass
    i_human_name.prefix.append(i_dicom_patient_name["prefix"])


pass


def do_dicom_patient_to_fhir_suffix_name(i_human_name: HumanName, i_dicom_patient_name):
    if i_human_name.suffix is None:
        i_human_name.suffix = []
    pass
    i_human_name.suffix.append(i_dicom_patient_name["suffix"])


pass

dict_patient_func = {
    "familyName": do_dicom_patient_to_fhir_family_name,
    "givenName": do_dicom_patient_to_fhir_given_name,
    "middleName": do_dicom_patient_to_fhir_middle_name,
    "prefix": do_dicom_patient_to_fhir_prefix_name,
    "suffix": do_dicom_patient_to_fhir_suffix_name
}

def do_dicom_to_fhir_patient(filename):
    data_set = pydicom.dcmread(filename, force=True, stop_before_pixels=True)
    patient_name = data_set.get(0x00100010)
    human_name = HumanName()
    if patient_name is None:
        patient_name = "UNKNOWN"
        human_name.use = HumanName.HumanNameUse["anonymous"]
    else:
        patient_name = str(patient_name.value)
        human_name.use = HumanName.HumanNameUse["usual"]
    pass

    human_name.text = patient_name

    dicom_patient_name = parse_pn(patient_name)
    dicom_patient_name = utils.delete_none(dicom_patient_name)
    for name in dicom_patient_name:
        dict_patient_func[name](human_name, dicom_patient_name)
    pass
    dicom_gender = data_set.get(0x00100040)
    patient_gender = "UNKNOWN"
    if dicom_gender is not None:
        patient_gender = dicom_gender.value
    pass
    patient_id = "unknown"
    dicom_pid = data_set.get(0x00100020)
    if dicom_pid is not None:
        patient_id = dicom_pid.value
    pass
    dicom_p_birth_date = data_set.get(0x00100030)
    patient_birth_date = None
    if dicom_p_birth_date is not None:
        patient_birth_date = dicom_p_birth_date.value
    pass
    patient_obj = {
        "resourceType": "Patient",
        "id":  patient_id,
        "gender": Gender[patient_gender],
        "birthDate": patient_birth_date,
        "active": True,
        name: human_name.__dict__
    }
    print(patient_obj)
    patient_obj_json_str = json.dumps(patient_obj, default=lambda o: o.__dict__)
    patient_obj_json = json.loads(patient_obj_json_str)
    patient_obj_json_remove = utils.delete_none(patient_obj_json)
    patient_obj_json_str = json.dumps(patient_obj_json_remove, default=lambda o: o.__dict__, indent=4)
    return patient_obj_json_str


pass
