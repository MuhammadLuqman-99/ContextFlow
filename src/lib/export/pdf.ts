import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { Microservice, Repository } from '@/types/database'
import { format } from 'date-fns'

// Extend jsPDF types for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface ExportOptions {
  repository: Repository
  microservices: Microservice[]
  includeDetails?: boolean
}

/**
 * Generate a PDF report for the project dashboard
 */
export async function exportDashboardToPDF({
  repository,
  microservices,
  includeDetails = true,
}: ExportOptions): Promise<void> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = margin

  // Helper to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  // Title
  doc.setFontSize(24)
  doc.setTextColor(30, 41, 59) // slate-800
  doc.text('Project Status Report', margin, yPos)
  yPos += 15

  // Repository info
  doc.setFontSize(12)
  doc.setTextColor(100, 116, 139) // slate-500
  doc.text(repository.full_name, margin, yPos)
  yPos += 8
  doc.setFontSize(10)
  doc.text(`Generated on ${format(new Date(), 'PPP p')}`, margin, yPos)
  yPos += 15

  // Summary stats
  const stats = calculateStats(microservices)

  doc.setFontSize(16)
  doc.setTextColor(30, 41, 59)
  doc.text('Summary', margin, yPos)
  yPos += 10

  // Stats boxes
  const statBoxWidth = (pageWidth - margin * 2 - 30) / 4
  const statLabels = ['Backlog', 'In Progress', 'Testing', 'Done']
  const statValues = [stats.backlog, stats.inProgress, stats.testing, stats.done]
  const statColors: [number, number, number][] = [
    [148, 163, 184], // slate-400
    [59, 130, 246],  // blue-500
    [245, 158, 11],  // amber-500
    [34, 197, 94],   // green-500
  ]

  statLabels.forEach((label, i) => {
    const x = margin + i * (statBoxWidth + 10)

    // Box background
    doc.setFillColor(...statColors[i])
    doc.roundedRect(x, yPos, statBoxWidth, 35, 3, 3, 'F')

    // Value
    doc.setFontSize(20)
    doc.setTextColor(255, 255, 255)
    doc.text(String(statValues[i]), x + statBoxWidth / 2, yPos + 15, { align: 'center' })

    // Label
    doc.setFontSize(9)
    doc.text(label, x + statBoxWidth / 2, yPos + 27, { align: 'center' })
  })
  yPos += 50

  // Health summary
  doc.setFontSize(14)
  doc.setTextColor(30, 41, 59)
  doc.text('Health Overview', margin, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`Healthy: ${stats.healthy} | Stale: ${stats.stale} | Inactive: ${stats.inactive}`, margin, yPos)
  yPos += 8

  // Progress bar
  const progressWidth = pageWidth - margin * 2
  const completionPercent = stats.total > 0 ? (stats.done / stats.total) * 100 : 0

  doc.setFillColor(226, 232, 240) // slate-200
  doc.roundedRect(margin, yPos, progressWidth, 8, 2, 2, 'F')

  if (completionPercent > 0) {
    doc.setFillColor(34, 197, 94) // green-500
    doc.roundedRect(margin, yPos, progressWidth * (completionPercent / 100), 8, 2, 2, 'F')
  }
  yPos += 12

  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`${completionPercent.toFixed(0)}% Complete`, margin, yPos)
  yPos += 20

  // Services table
  checkPageBreak(50)
  doc.setFontSize(16)
  doc.setTextColor(30, 41, 59)
  doc.text('Services', margin, yPos)
  yPos += 10

  // Create table data
  const tableData = microservices.map((ms) => [
    ms.service_name,
    ms.status,
    `${ms.progress}%`,
    ms.health_status,
    ms.current_task.length > 40 ? ms.current_task.substring(0, 40) + '...' : ms.current_task,
  ])

  doc.autoTable({
    startY: yPos,
    head: [['Service', 'Status', 'Progress', 'Health', 'Current Task']],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [51, 65, 85], // slate-700
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 'auto' },
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Detailed service info (if enabled)
  if (includeDetails) {
    for (const ms of microservices) {
      checkPageBreak(60)

      // Service header
      doc.setFontSize(12)
      doc.setTextColor(30, 41, 59)
      doc.text(ms.service_name, margin, yPos)

      // Status badge
      const statusColor = getStatusColor(ms.status)
      doc.setFontSize(8)
      doc.setFillColor(...statusColor)
      const statusText = ms.status
      const statusWidth = doc.getTextWidth(statusText) + 6
      doc.roundedRect(margin + doc.getTextWidth(ms.service_name) + 5, yPos - 5, statusWidth, 8, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.text(statusText, margin + doc.getTextWidth(ms.service_name) + 8, yPos - 0.5)

      yPos += 8

      // Current task
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)
      doc.text(`Current: ${ms.current_task}`, margin, yPos)
      yPos += 6

      // Progress
      doc.text(`Progress: ${ms.progress}%`, margin, yPos)
      yPos += 6

      // Next steps
      if (ms.next_steps && ms.next_steps.length > 0) {
        doc.text('Next Steps:', margin, yPos)
        yPos += 5
        ms.next_steps.slice(0, 3).forEach((step, i) => {
          doc.text(`  ${i + 1}. ${step.length > 60 ? step.substring(0, 60) + '...' : step}`, margin, yPos)
          yPos += 5
        })
        if (ms.next_steps.length > 3) {
          doc.setTextColor(100, 116, 139)
          doc.text(`  +${ms.next_steps.length - 3} more`, margin, yPos)
          yPos += 5
        }
      }

      yPos += 10
    }
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Generated by ContextFlow | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Save the PDF
  const filename = `${repository.repo_name}-status-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(filename)
}

function calculateStats(microservices: Microservice[]) {
  return {
    total: microservices.length,
    backlog: microservices.filter((m) => m.status === 'Backlog').length,
    inProgress: microservices.filter((m) => m.status === 'In Progress').length,
    testing: microservices.filter((m) => m.status === 'Testing').length,
    done: microservices.filter((m) => m.status === 'Done').length,
    healthy: microservices.filter((m) => m.health_status === 'Healthy').length,
    stale: microservices.filter((m) => m.health_status === 'Stale').length,
    inactive: microservices.filter((m) => m.health_status === 'Inactive').length,
  }
}

function getStatusColor(status: string): [number, number, number] {
  switch (status) {
    case 'Backlog':
      return [148, 163, 184] // slate-400
    case 'In Progress':
      return [59, 130, 246] // blue-500
    case 'Testing':
      return [245, 158, 11] // amber-500
    case 'Done':
      return [34, 197, 94] // green-500
    default:
      return [148, 163, 184]
  }
}
