using FellowOakDicom;
using Hl7.Fhir.Model;
using Hl7.Fhir.Serialization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DICOMToFHIRImagingStudyConsole
{
    class DICOMFHIR
    {
        public static DicomDataset DicomItem;
        class DICOM 
        {
            public static string GetStudyID()
            {
                bool isHaveStudyID = DicomItem.TryGetString(DicomTag.StudyID, out string studyID);
                if (!isHaveStudyID) return null;
                return studyID;
            }

            public static string GetAccessionNumberAndIdentifier() 
            {
                string result;
                bool isHaveAccessionNumber = DicomItem.TryGetString(DicomTag.AccessionNumber, out string accessionNumber);
                bool isHaveIssuerOfAccessionNumberSequence = DicomItem.TryGetString(DicomTag.IssuerOfAccessionNumberSequence, out string issuerOfAccessionNumberSequence);
                if (isHaveAccessionNumber && isHaveIssuerOfAccessionNumberSequence)
                {
                    result = accessionNumber + issuerOfAccessionNumberSequence;
                }
                else if (isHaveAccessionNumber)
                {
                    result = accessionNumber;
                }
                else if (isHaveIssuerOfAccessionNumberSequence)
                {
                    result = issuerOfAccessionNumberSequence;
                }
                else
                {
                    result = null;
                }
                return result;
            }

            public static string GetPatientID() 
            {
                bool isHaveStudyID = DicomItem.TryGetString(DicomTag.PatientID, out string patientID);
                if (!isHaveStudyID) return null;
                return patientID;
            }

            public static string GetStudyFullDate() 
            {
                return DicomItem.GetString(DicomTag.StudyDate) + DicomItem.GetString(DicomTag.StudyTime);
            }

            public static Nullable<int> GetNumberOfSeries() 
            {
                bool isHaveNumberOfStudyRelatedSeries = DicomItem.TryGetSingleValue<int>(DicomTag.NumberOfStudyRelatedSeries, out int numberOfSeries);
                if (!isHaveNumberOfStudyRelatedSeries) return null;
                return numberOfSeries;
            }
            public static Nullable<int> GetNumberOfInstance()
            {
                bool isHaveNumberOfStudyRelatedInstances = DicomItem.TryGetSingleValue<int>(DicomTag.NumberOfStudyRelatedInstances, out int numberOfInstances);
                if (!isHaveNumberOfStudyRelatedInstances) return null;
                return numberOfInstances;
            }

            public static string GetModalityCode() 
            {
                bool isHaveModality = DicomItem.TryGetString(DicomTag.Modality, out string modalityCode);
                if (!isHaveModality) return null;
                return modalityCode;
            }

            public static string GetDescription() 
            {
                bool isHaveDescription = DicomItem.TryGetString(DicomTag.SeriesDescription, out string description);
                if (!isHaveDescription) return null;
                return description;
            }

            public static string GetDisplay() 
            {
                bool isHaveDisplay = DicomItem.TryGetString(DicomTag.BodyPartExamined, out string display);
                if (!isHaveDisplay) return null;
                return display;
            }

            public static string GetSeriesFullDate()
            {
                bool isHaveSeriesDate = DicomItem.TryGetString(DicomTag.SeriesDate, out string seriesDateStr);
                bool isHaveSeriesTime = DicomItem.TryGetString(DicomTag.SeriesTime, out string seriesTimeStr);
                if (isHaveSeriesDate && isHaveSeriesTime)
                {
                    return seriesDateStr + seriesTimeStr.Substring(0, seriesTimeStr.LastIndexOf("."));
                }
                return null;
            }
            #region Patient
            public static string GetGender() 
            {
                bool isHaveGender = DicomItem.TryGetString(DicomTag.PatientSex, out string gender);
                if (isHaveGender)
                {
                    return gender;
                }
                else
                {
                    return "UNKNOWN";
                }
            }
            public static string GetBirthDate() 
            {
                bool isHaveBirthDate = DicomItem.TryGetString(DicomTag.PatientBirthDate, out string birthDate);
                if (isHaveBirthDate) 
                {
                    return birthDate;
                }
                return null;
            }
            public static string GetPatientName()
            {
                bool isHavePatientName = DicomItem.TryGetString(DicomTag.PatientName, out string patientName);
                if (isHavePatientName) 
                {
                    return patientName;
                }
                return null;
            }
            #endregion
        }
        class FHIR
        {
            public static Dictionary<string, int> GenderDic = new Dictionary<string, int>()
            {
                { "M" ,  0},
                { "F" ,  1},
                { "O" ,  2},
                { "UNKNOWN" , 3}
            };
            public class MyImagingStudy 
            {
                public static List<Identifier> GetIdentifier(string studyInstanceUID, string accessionNumberAndIssuer, string studyID)
                {
                    List<Identifier> identifierList = new List<Identifier>();
                    //Push first identifier
                    Identifier studyInstanceUIDIdentifier = new Identifier();
                    studyInstanceUIDIdentifier.Use = Identifier.IdentifierUse.Official;
                    studyInstanceUIDIdentifier.System = "urn:dicom:uid";
                    studyInstanceUIDIdentifier.Value = $"urn:oid:{studyInstanceUID}";
                    identifierList.Add(studyInstanceUIDIdentifier);

                    //Push second identifier
                    if (accessionNumberAndIssuer != null && accessionNumberAndIssuer != "")
                    {
                        Identifier accessionNumberAndIssuerIdentifier = new Identifier();
                        accessionNumberAndIssuerIdentifier.Use = Identifier.IdentifierUse.Secondary;
                        accessionNumberAndIssuerIdentifier.Value = accessionNumberAndIssuer;
                        identifierList.Add(accessionNumberAndIssuerIdentifier);
                    }
                    //Push third identifier
                    if (studyID != null && studyID != "")
                    {
                        Identifier studyIDIdentifier = new Identifier();
                        studyIDIdentifier.Use = Identifier.IdentifierUse.Usual;
                        studyIDIdentifier.Value = studyID;
                        identifierList.Add(studyIDIdentifier);
                    }
                    return identifierList;
                }

                public static ResourceReference GetImagingStudySubject()
                {
                    string patientID = DICOM.GetPatientID();
                    if (patientID != null && patientID != "")
                    {
                        ResourceReference subject = new ResourceReference();
                        subject.Reference = $"Patient/{patientID}";
                        subject.Type = "Patient";
                        subject.Identifier = new Identifier();
                        subject.Identifier.Use = Identifier.IdentifierUse.Usual;
                        subject.Identifier.Value = patientID;
                        return subject;
                    }
                    return null;
                }

                public static string GetImagingStudyStarted()
                {
                    string studyFullDate = DICOM.GetStudyFullDate();
                    int imagingStartedPos = studyFullDate.LastIndexOf(".");
                    if (imagingStartedPos < 0) imagingStartedPos = studyFullDate.Length;
                    studyFullDate = studyFullDate.Substring(0, imagingStartedPos);
                    DateTime imagingStudyStartedDate = DateTime.ParseExact(studyFullDate, "yyyyMMddHHmmss", null, System.Globalization.DateTimeStyles.AllowWhiteSpaces);
                    return String.Format("{0:yyyy-MM-ddTHH:mm:ssZ}", imagingStudyStartedDate);
                }

                public static string GetImagingSeriesStarted()
                {
                    string seriesFullDate = DICOM.GetSeriesFullDate();
                    if (seriesFullDate != null)
                    {
                        DateTime seriesStartedDate = DateTime.ParseExact(seriesFullDate, "yyyyMMddHHmmss", null, System.Globalization.DateTimeStyles.AllowWhiteSpaces);
                        return String.Format("{0:yyyy-MM-ddTHH:mm:ssZ}", seriesStartedDate);
                    }
                    return null;
                }

                public static ImagingStudy.SeriesComponent GetSeries()
                {
                    ImagingStudy.SeriesComponent series = new ImagingStudy.SeriesComponent();
                    series.Uid = DicomItem.GetString(DicomTag.SeriesInstanceUID);
                    series.Number = DicomItem.GetSingleValue<int>(DicomTag.SeriesNumber);
                    series.Modality = new Coding();
                    series.Modality.Code = DICOM.GetModalityCode();
                    series.Description = DICOM.GetDescription();

                    string display = DICOM.GetDescription();
                    if (display != null)
                    {
                        series.BodySite = new Coding
                        {
                            Display = display
                        };
                    }
                    series.Started = GetImagingSeriesStarted();

                    return series;
                }

                public static ImagingStudy.InstanceComponent GetInstance()
                {
                    ImagingStudy.InstanceComponent instance = new ImagingStudy.InstanceComponent
                    {
                        Uid = DicomItem.GetString(DicomTag.SOPInstanceUID),
                        SopClass = new Coding()
                    };
                    instance.SopClass.System = "urn:ietf:rfc:3986";
                    string sopClassUID = DicomItem.GetString(DicomTag.SOPClassUID);
                    instance.SopClass.Code = $"urn:oid:{sopClassUID}";
                    bool isHaveInstanceNumber = DicomItem.TryGetSingleValue<int>(DicomTag.InstanceNumber, out int instanceNumber);
                    if (isHaveInstanceNumber)
                    {
                        instance.Number = instanceNumber;
                    }
                    return instance;
                }
            }

            public class MyPatient 
            {
                public static AdministrativeGender GetGender() 
                {
                    string genderStr = DICOM.GetGender();
                    return (AdministrativeGender)GenderDic[genderStr];
                }
            }
        }

        public DICOMFHIR(string dicomFilePath)
        {
            try
            {
                DicomFile dicomFile = DicomFile.Open(dicomFilePath);
                DicomItem = dicomFile.Dataset;
            }
            catch (Exception e)
            {
                throw e;
            }
        }
        public string GetDICOMFHIRImagingStudyJson() 
        {
            ImagingStudy imagingStudy = new ImagingStudy();
            string studyInstanceUID = DicomItem.GetString(DicomTag.StudyInstanceUID);
            imagingStudy.Id = studyInstanceUID;

            string accessionNumberAndIssuer = DICOM.GetAccessionNumberAndIdentifier();
            string studyID = DICOM.GetStudyID();
            List<Identifier> identifierList = FHIR.MyImagingStudy.GetIdentifier(studyInstanceUID: studyInstanceUID, accessionNumberAndIssuer: accessionNumberAndIssuer, studyID: studyID);
            imagingStudy.Identifier = identifierList;

            FhirJsonSerializer jsonSerializer = new FhirJsonSerializer(new SerializerSettings()
            {
                Pretty = true
            });
            imagingStudy.Subject = FHIR.MyImagingStudy.GetImagingStudySubject();
            imagingStudy.Started = FHIR.MyImagingStudy.GetImagingStudyStarted();
            
            imagingStudy.NumberOfSeries = DICOM.GetNumberOfSeries();
            imagingStudy.NumberOfInstances = DICOM.GetNumberOfInstance();
            imagingStudy.Series = new List<ImagingStudy.SeriesComponent>() { FHIR.MyImagingStudy.GetSeries() };
            imagingStudy.Series[0].Instance = new List<ImagingStudy.InstanceComponent>() { FHIR.MyImagingStudy.GetInstance() };
            string imagingStudyJsonStr = jsonSerializer.SerializeToString(imagingStudy);
            return imagingStudyJsonStr;
        }

        public string GetDICOMFHIRPatientJson() 
        {
            Patient patient = new Patient();
            patient.Id = DICOM.GetPatientID();
            patient.Gender = FHIR.MyPatient.GetGender();
            patient.BirthDate = DICOM.GetBirthDate();
            string patientName = DICOM.GetPatientName();
            if (patientName != null) 
            {
                HumanName humanName = new HumanName();
                humanName.Use = HumanName.NameUse.Official;
                humanName.Text = patientName;
                patient.Name = new List<HumanName>();
                patient.Name.Add(humanName);
            }
            FhirJsonSerializer jsonSerializer = new FhirJsonSerializer(new SerializerSettings()
            {
                Pretty = true
            });
            string patientJsonStr = jsonSerializer.SerializeToString(patient);
            return patientJsonStr;
        }
    }
}
