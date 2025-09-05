import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import * as XLSX from "xlsx"

export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error("Element not found for PDF export")
    return
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    })

    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("p", "mm", "a4")

    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename)
  } catch (error) {
    console.error("Error generating PDF:", error)
  }
}

export const exportToExcel = (data: any[], filename: string, sheetName = "Sheet1") => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    XLSX.writeFile(workbook, filename)
  } catch (error) {
    console.error("Error generating Excel file:", error)
  }
}

export const exportInspectionReportToPDF = async (report: any) => {
  const filename = `inspection-report-${report.equipmentBarcode}-${report.date}.pdf`
  await exportToPDF("inspection-report-content", filename)
}

export const exportReportsToExcel = (inspections: any[]) => {
  const excelData = inspections.map((inspection) => ({
    "Equipment ID": inspection.equipment,
    Type: inspection.type,
    Location: inspection.location,
    Inspector: inspection.inspector,
    Date: inspection.date,
    Result: inspection.result,
    Score: `${inspection.score}%`,
  }))

  const filename = `fire-safety-inspections-${new Date().toISOString().split("T")[0]}.xlsx`
  exportToExcel(excelData, filename, "Inspections")
}
