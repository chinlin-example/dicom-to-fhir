import DICOM2FHIRImagingStudy

f = open("output.json", "w+")
imaging_study_json_str = DICOM2FHIRImagingStudy.do_dicom_to_fhir_imagingstudy("../dicomFile/image-000001.dcm")
f.write(imaging_study_json_str)
f.close()
