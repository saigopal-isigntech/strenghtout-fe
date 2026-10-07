import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CandidateProfile } from '../types';

function cleanText(text?: string | null): string {
  if (!text) return '';
  return String(text).trim();
}

function parseBullets(text?: string | null): string {
  if (!text) return '';
  const lines = text.split('\n');
  const formattedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Replace markdown bold tags if any
    const cleanLine = trimmed.replace(/\*\*(.*?)\*\*/g, '$1');
    if (cleanLine.startsWith('* ') || cleanLine.startsWith('- ') || cleanLine.startsWith('• ')) {
      formattedLines.push(`•  ${cleanLine.substring(2).trim()}`);
    } else {
      formattedLines.push(cleanLine);
    }
  }

  return formattedLines.join('\n');
}

export async function exportCandidateProfilePDF(candidate: CandidateProfile): Promise<boolean> {
  if (!candidate) {
    throw new Error('Candidate profile data is missing.');
  }

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const candidateName = candidate.fullName || (candidate.firstName ? `${candidate.firstName} ${candidate.lastName || ''}`.trim() : 'Candidate Profile');
    const headline = cleanText(candidate.headline) || 'Professional Candidate Profile';
    const location = cleanText(candidate.currentLocation || candidate.location) || 'Not Specified';
    const expYears = candidate.totalExperienceYears ?? ((candidate as any).totalExperienceMonths ? Math.round((candidate as any).totalExperienceMonths / 12) : 0);
    const expStatus = cleanText(candidate.experienceStatus) || (expYears === 0 ? 'Fresher / Entry Level' : `${expYears} Years Experience`);
    const noticePeriod = cleanText(candidate.noticePeriod || candidate.availability) || 'Immediate Joiner';
    const exportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    // Collect skills
    const skillsList: string[] = [];
    if (Array.isArray(candidate.skills)) {
      candidate.skills.forEach((sk: any) => {
        const name = typeof sk === 'string' ? sk : (sk.skillName || sk.name || sk.skill?.name);
        if (name && !skillsList.includes(name.trim())) skillsList.push(name.trim());
      });
    } else if (Array.isArray((candidate as any).topSkills)) {
      (candidate as any).topSkills.forEach((sk: any) => {
        const name = typeof sk === 'string' ? sk : (sk.skillName || sk.name);
        if (name && !skillsList.includes(name.trim())) skillsList.push(name.trim());
      });
    }

    const summary = cleanText(candidate.summary || (candidate as any).bio);
    const experiences = candidate.experiences || [];
    const projects = candidate.projects || [];
    const educations = candidate.education || (candidate as any).educations || [];
    const roleInterests = candidate.roleInterests || [];

    // Colors
    const primaryGreen: [number, number, number] = [4, 120, 87];   // #047857
    const darkNavy: [number, number, number] = [15, 23, 42];       // #0f172a
    const textGray: [number, number, number] = [51, 65, 85];       // #334155
    const lightMuted: [number, number, number] = [100, 116, 139];  // #64748b
    const bgSurface: [number, number, number] = [248, 250, 252];   // #f8fafc
    const tableBorder: [number, number, number] = [226, 232, 240]; // #e2e8f0

    let currentY = margin;

    // 1. TOP DOCUMENT HEADER BAR
    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.rect(0, 0, pageWidth, 16, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('StrengthOut', margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('|   VERIFIED TALENT DOSSIER', margin + 30, 11);

    doc.setFontSize(8);
    doc.text(`Generated: ${exportDate}`, pageWidth - margin, 11, { align: 'right' });

    currentY = 24;

    // 2. CANDIDATE IDENTITY OVERVIEW CARD (Table)
    const links: string[] = [];
    if ((candidate as any).githubUrl) links.push(`GitHub: ${(candidate as any).githubUrl}`);
    if (candidate.linkedinUrl) links.push(`LinkedIn: ${candidate.linkedinUrl}`);
    if (candidate.portfolioUrl) links.push(`Portfolio: ${candidate.portfolioUrl}`);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'plain',
      styles: {
        font: 'helvetica',
        cellPadding: 0,
      },
      body: [
        [
          {
            content: candidateName,
            styles: { fontSize: 16, fontStyle: 'bold', textColor: darkNavy },
          },
          {
            content: '[ VERIFIED TALENT ]',
            styles: { fontSize: 8.5, fontStyle: 'bold', textColor: primaryGreen, halign: 'right' },
          },
        ],
        [
          {
            content: headline,
            styles: { fontSize: 10, fontStyle: 'bold', textColor: primaryGreen, cellPadding: { top: 1, bottom: 4 } },
            colSpan: 2,
          },
        ],
      ],
    });

    currentY = (doc as any).lastAutoTable.finalY + 2;

    // Structured Meta Table
    const metaRow1 = [
      { content: 'Location:', styles: { fontStyle: 'bold', textColor: lightMuted, cellWidth: 26 } },
      { content: location, styles: { textColor: darkNavy } },
      { content: 'Experience:', styles: { fontStyle: 'bold', textColor: lightMuted, cellWidth: 26 } },
      { content: expStatus, styles: { textColor: darkNavy } },
    ];
    const metaRow2 = [
      { content: 'Notice Period:', styles: { fontStyle: 'bold', textColor: lightMuted, cellWidth: 26 } },
      { content: noticePeriod, styles: { fontStyle: 'bold', textColor: primaryGreen } },
      { content: 'Profile ID:', styles: { fontStyle: 'bold', textColor: lightMuted, cellWidth: 26 } },
      { content: (candidate.id || 'N/A').substring(0, 16), styles: { textColor: darkNavy } },
    ];

    const metaBody: any[] = [metaRow1, metaRow2];
    if (links.length > 0) {
      metaBody.push([
        { content: 'Profiles:', styles: { fontStyle: 'bold', textColor: lightMuted, cellWidth: 26 } },
        { content: links.join('   |   '), styles: { textColor: [3, 105, 161] as [number, number, number], fontSize: 8 }, colSpan: 3 },
      ]);
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 2.8,
        lineColor: tableBorder,
        lineWidth: 0.3,
      },
      body: metaBody,
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // Helper to render Section Titles
    const addSectionHeader = (title: string) => {
      // Ensure section title does not get separated from its content near page bottom
      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = margin + 4;
      }

      doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
      doc.rect(margin, currentY, 3, 4.5, 'F');

      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(title.toUpperCase(), margin + 5, currentY + 3.8);

      doc.setDrawColor(tableBorder[0], tableBorder[1], tableBorder[2]);
      doc.setLineWidth(0.3);
      doc.line(margin + 5 + doc.getTextWidth(title.toUpperCase()) + 4, currentY + 2.2, margin + contentWidth, currentY + 2.2);

      currentY += 7;
    };

    // 3. PROFESSIONAL SUMMARY
    if (summary) {
      addSectionHeader('Professional Summary');
      const cleanSummary = parseBullets(summary);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          textColor: textGray,
          cellPadding: 0,
          lineColor: tableBorder,
        },
        body: [[cleanSummary]],
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // 4. VERIFIED TECHNICAL SKILLS
    if (skillsList.length > 0) {
      addSectionHeader('Verified Technical Skills');

      // Group skills into 3 columns for balanced structured display
      const skillRows: string[][] = [];
      const colCount = 3;
      for (let i = 0; i < skillsList.length; i += colCount) {
        const row = [
          skillsList[i] ? `•  ${skillsList[i]}` : '',
          skillsList[i + 1] ? `•  ${skillsList[i + 1]}` : '',
          skillsList[i + 2] ? `•  ${skillsList[i + 2]}` : '',
        ];
        skillRows.push(row);
      }

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          textColor: darkNavy,
          cellPadding: 2.2,
          lineColor: tableBorder,
          lineWidth: 0.25,
        },
        alternateRowStyles: {
          fillColor: bgSurface,
        },
        body: skillRows,
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // 5. WORK EXPERIENCE & EMPLOYMENT HISTORY
    if (experiences.length > 0) {
      addSectionHeader('Work Experience & Employment History');

      const expRows: any[] = [];
      experiences.forEach((exp: any) => {
        const role = exp.title || 'Role Title';
        const company = exp.companyName || 'Company';
        const period = `${exp.startDate || 'N/A'} — ${exp.isCurrent ? 'Present' : (exp.endDate || 'N/A')}`;
        const desc = exp.description ? parseBullets(exp.description) : '';

        expRows.push([
          {
            content: `${role}\n${company}`,
            styles: { fontStyle: 'bold', textColor: darkNavy, cellWidth: 55 },
          },
          {
            content: period,
            styles: { fontStyle: 'normal', textColor: lightMuted, cellWidth: 38, fontSize: 8 },
          },
          {
            content: desc || 'Responsibilities handled successfully in this role.',
            styles: { textColor: textGray, fontSize: 8 },
          },
        ]);
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Role & Company', 'Duration', 'Key Responsibilities & Deliverables']],
        headStyles: {
          fillColor: bgSurface,
          textColor: darkNavy,
          fontStyle: 'bold',
          fontSize: 8.5,
          lineColor: tableBorder,
          lineWidth: 0.3,
        },
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 3,
          lineColor: tableBorder,
          lineWidth: 0.3,
          valign: 'top',
        },
        body: expRows,
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // 6. KEY PROJECTS & PORTFOLIO
    if (projects.length > 0) {
      addSectionHeader('Key Projects & Portfolio');

      const projRows: any[] = [];
      projects.forEach((proj: any) => {
        const title = proj.name || 'Project Name';
        const client = proj.clientCompany || proj.workType || 'Standard Project';
        const summaryText = cleanText(proj.summary);
        const respText = cleanText(proj.responsibilities);

        let details = '';
        if (summaryText) details += parseBullets(summaryText);
        if (respText) {
          if (details) details += '\n\nKey Deliverables:\n';
          details += parseBullets(respText);
        }
        if (!details) details = 'Project deliverables and implementation details.';

        projRows.push([
          {
            content: `${title}\n(${client})`,
            styles: { fontStyle: 'bold', textColor: darkNavy, cellWidth: 55 },
          },
          {
            content: details,
            styles: { textColor: textGray, fontSize: 8 },
          },
        ]);
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Project & Context', 'Project Summary & Key Contributions']],
        headStyles: {
          fillColor: bgSurface,
          textColor: darkNavy,
          fontStyle: 'bold',
          fontSize: 8.5,
          lineColor: tableBorder,
          lineWidth: 0.3,
        },
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 3,
          lineColor: tableBorder,
          lineWidth: 0.3,
          valign: 'top',
        },
        body: projRows,
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // 7. EDUCATION & CREDENTIALS
    if (educations.length > 0) {
      addSectionHeader('Education & Credentials');

      const eduRows: any[] = [];
      educations.forEach((edu: any) => {
        const degree = `${edu.qualification || 'Degree'}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}`;
        const institution = edu.institution || 'Institution / University';
        const period = (edu.startYear || edu.endYear) ? `${edu.startYear || ''} — ${edu.endYear || 'Present'}` : 'Completed';

        eduRows.push([degree, institution, period]);
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Degree / Qualification', 'Institution / University', 'Year']],
        headStyles: {
          fillColor: bgSurface,
          textColor: darkNavy,
          fontStyle: 'bold',
          fontSize: 8.5,
          lineColor: tableBorder,
          lineWidth: 0.3,
        },
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          textColor: darkNavy,
          cellPadding: 2.5,
          lineColor: tableBorder,
          lineWidth: 0.3,
        },
        body: eduRows,
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // 8. TARGET ROLE INTERESTS
    if (roleInterests.length > 0) {
      addSectionHeader('Target Role Interests & Work Preferences');

      const riRows: any[] = [];
      roleInterests.forEach((ri: any) => {
        riRows.push([
          ri.roleName || 'Target Role',
          ri.workType || 'Remote / Hybrid / Onsite',
          ri.preferredLocation || 'Open / Any Location',
        ]);
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Target Role Title', 'Work Type Preference', 'Preferred Location']],
        headStyles: {
          fillColor: bgSurface,
          textColor: darkNavy,
          fontStyle: 'bold',
          fontSize: 8.5,
          lineColor: tableBorder,
          lineWidth: 0.3,
        },
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          textColor: darkNavy,
          cellPadding: 2.5,
          lineColor: tableBorder,
          lineWidth: 0.3,
        },
        body: riRows,
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    // 9. FOOTERS ON ALL PAGES
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(tableBorder[0], tableBorder[1], tableBorder[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 11, margin + contentWidth, pageHeight - 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(lightMuted[0], lightMuted[1], lightMuted[2]);
      doc.text('StrengthOut Verified Candidate Dossier • Official Employer Evaluation Document', margin, pageHeight - 6.5);
      doc.text(`Page ${i} of ${totalPages}`, margin + contentWidth, pageHeight - 6.5, { align: 'right' });
    }

    // Output PDF Blob and open in new window
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow) {
      // Fallback in case of strict popup blockers
      const link = document.createElement('a');
      link.href = blobUrl;
      link.target = '_blank';
      link.download = `${candidateName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Dossier.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return true;
  } catch (error) {
    console.error('Failed to generate candidate PDF:', error);
    throw error;
  }
}