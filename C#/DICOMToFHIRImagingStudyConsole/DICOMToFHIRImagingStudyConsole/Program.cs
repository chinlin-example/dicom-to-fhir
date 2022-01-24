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
            string json = dicomFHIR.GetDICOMFHIRImagingStudyJson();
            Console.WriteLine(json);
            Console.Read();
        }
    }
}
