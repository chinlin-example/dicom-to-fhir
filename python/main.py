import DICOM2FHIRImagingStudy
import DICOM2FHIRPatient

f = open("output.json", "w+")
imaging_study_json_str = DICOM2FHIRImagingStudy.do_dicom_to_fhir_imagingstudy("../dicomFile/image-000001.dcm")
f.write(imaging_study_json_str)
f.close()

pf = open("patient_output.json", "w+")
patient_json_str = DICOM2FHIRPatient.do_dicom_to_fhir_patient("../dicomFile/image-000001.dcm")
pf.write(patient_json_str)
pf.close()