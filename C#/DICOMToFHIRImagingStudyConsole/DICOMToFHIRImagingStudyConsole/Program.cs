using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DICOMToFHIRImagingStudyConsole
{
    class Program
    {
        static void Main(string[] args)
        {
            DICOMFHIR dicomFHIR = new DICOMFHIR("../../../../../dicomFile/image-000001.dcm");
            string imagingStudyJson = dicomFHIR.GetDICOMFHIRImagingStudyJson();
            string patientJson = dicomFHIR.GetDICOMFHIRPatientJson();
            Console.WriteLine($"ImagingStudy: {imagingStudyJson}");
            Console.WriteLine($"Patient: {patientJson}");
            Console.Read();
        }
    }
}
